import axios from 'axios';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import OpenAI from 'openai';
import Constants from 'expo-constants';

const openai = new OpenAI({
  apiKey: Constants.expoConfig.extra.openaiApiKey
});

export const searchProduct = async (barcode) => {
  // First check local database
  const q = query(collection(db, "products"), where("barcode", "==", barcode));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }

  // If not found, check Open Food Facts API
  try {
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if (response.data.status === 1) {
      const productData = {
        barcode,
        name: response.data.product.product_name,
        ingredients: response.data.product.ingredients_text,
      };
      
      // Save to database for future searches
      await addDoc(collection(db, "products"), productData);
      
      return productData;
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const analyzeIngredients = async (ingredients, userAllergies) => {
  try {
    const prompt = `
      Analyze these ingredients: "${ingredients}"
      For a person with these allergies/conditions: "${userAllergies.join(', ')}"
      
      Determine if the product is:
      - GREEN (safe to consume)
      - YELLOW (possible cross-contamination risk)
      - RED (contains allergens or unsafe ingredients)
      
      Provide:
      1. Safety score (RED/YELLOW/GREEN)
      2. List of warnings
      3. Detailed safety explanation
      
      Format response as JSON.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    return {
      score: analysis.safety_score.toLowerCase(),
      warnings: analysis.warnings,
      safetyDetails: analysis.safety_explanation
    };
  } catch (error) {
    console.error('Error analyzing ingredients:', error);
    throw error;
  }
};

export const getProductInfo = async (barcode) => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};
