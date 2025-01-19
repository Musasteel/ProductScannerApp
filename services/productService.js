import axios from 'axios';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import OpenAI from 'openai';
import Constants from 'expo-constants';

const openai = new OpenAI({
  apiKey: Constants.expoConfig.extra.openaiApiKey
});

// Create axios instance with timeout
const api = axios.create({
  timeout: 5000 // 5 second timeout
});

export const searchProduct = async (barcode) => {
  try {
    // Directly fetch from Open Food Facts with shorter timeout
    const response = await api.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (response.data.status === 1) {
      const productData = {
        barcode,
        name: response.data.product.product_name || 'Unknown Product',
        ingredients: response.data.product.ingredients_text || 'No ingredients information available',
        image: response.data.product.image_url,
        allergens: response.data.product.allergens_tags || [],
      };

      // Save to Firebase in background without awaiting
      saveToFirebase(productData);

      return productData;
    }
    throw new Error('Product not found');
  } catch (error) {
    // Try Firebase as fallback
    try {
      const q = query(collection(db, "products"), where("barcode", "==", barcode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
    } catch (dbError) {
      console.warn('Firebase fallback failed:', dbError);
    }

    throw new Error('Unable to find product information');
  }
};

// Background save to Firebase
const saveToFirebase = async (productData) => {
  try {
    const q = query(collection(db, "products"), where("barcode", "==", productData.barcode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      await addDoc(collection(db, "products"), productData);
    }
  } catch (error) {
    console.warn('Failed to save to Firebase:', error);
  }
};

export const analyzeIngredients = async (ingredients, userAllergies) => {
  // Start with basic analysis immediately
  const basicAnalysis = performBasicAnalysis(ingredients, userAllergies);

  // Return basic analysis if no ingredients or allergies
  if (!ingredients || 
      ingredients === 'No ingredients information available' || 
      !userAllergies?.length) {
    return basicAnalysis;
  }

  try {
    // Try AI analysis with timeout
    const aiAnalysisPromise = new Promise(async (resolve, reject) => {
      try {
        const prompt = `
          Analyze these ingredients: "${ingredients}"
          For a person with these allergies/conditions: "${userAllergies.join(', ')}"
          Provide safety assessment (GREEN/YELLOW/RED) and explanation.
          Format as JSON with: safety_score, warnings (array), safety_explanation
        `;

        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          response_format: { type: "json_object" },
        });

        const aiAnalysis = JSON.parse(completion.choices[0].message.content);
        resolve({
          score: aiAnalysis.safety_score.toLowerCase(),
          warnings: aiAnalysis.warnings,
          safetyDetails: aiAnalysis.safety_explanation
        });
      } catch (error) {
        reject(error);
      }
    });

    // Race between AI analysis and timeout
    const analysis = await Promise.race([
      aiAnalysisPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI analysis timeout')), 3000)
      )
    ]);

    return analysis;
  } catch (error) {
    console.warn('AI analysis failed or timed out, using basic analysis:', error);
    return basicAnalysis;
  }
};

function performBasicAnalysis(ingredients, userAllergies) {
  if (!ingredients || ingredients === 'No ingredients information available') {
    return {
      score: 'yellow',
      warnings: ['No ingredients information available'],
      safetyDetails: 'Unable to analyze safety without ingredients information'
    };
  }

  const ingredientsList = ingredients.toLowerCase().split(/[,;()]/);
  const warnings = [];
  let score = 'green';

  const commonAllergens = [
    'milk', 'dairy', 'egg', 'nuts', 'peanut', 'soy', 'wheat', 
    'gluten', 'fish', 'shellfish', 'sesame'
  ];

  // Check user allergies first
  if (userAllergies?.length) {
    userAllergies.forEach(allergy => {
      const allergyLower = allergy.toLowerCase().trim();
      if (ingredientsList.some(ing => ing.trim().includes(allergyLower))) {
        warnings.push(`Contains ${allergy}`);
        score = 'red';
      }
    });
  }

  // Check common allergens
  commonAllergens.forEach(allergen => {
    if (ingredientsList.some(ing => ing.trim().includes(allergen))) {
      if (!warnings.some(w => w.toLowerCase().includes(allergen))) {
        warnings.push(`Contains common allergen: ${allergen}`);
        if (score !== 'red') score = 'yellow';
      }
    }
  });

  // Check for "may contain" statements
  if (ingredients.toLowerCase().includes('may contain')) {
    warnings.push('Product has cross-contamination warnings');
    if (score !== 'red') score = 'yellow';
  }

  return {
    score,
    warnings: warnings.length ? warnings : ['No immediate allergen concerns detected'],
    safetyDetails: `Basic analysis complete. ${warnings.length ? 'Please review warnings.' : 'No major allergens detected.'}`
  };
}

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
