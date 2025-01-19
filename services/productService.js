import axios from 'axios';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import OpenAI from 'openai';
import Constants from 'expo-constants';

const openai = new OpenAI({
  apiKey: Constants.expoConfig.extra.openaiApiKey
});

export const searchProduct = async (barcode) => {
  try {
    // First check Open Food Facts API directly
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (response.data.status === 1) {
      const productData = {
        barcode,
        name: response.data.product.product_name || 'Unknown Product',
        ingredients: response.data.product.ingredients_text || 'No ingredients information available',
        image: response.data.product.image_url,
        allergens: response.data.product.allergens_tags || [],
      };

      // Try to save to Firebase but don't wait for it
      try {
        const q = query(collection(db, "products"), where("barcode", "==", barcode));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          addDoc(collection(db, "products"), productData).catch(console.warn);
        }
      } catch (dbError) {
        console.warn('Firebase operation failed:', dbError);
      }

      return productData;
    }
    throw new Error('Product not found in database');
  } catch (error) {
    console.warn('Error fetching product:', error);
    throw new Error('Unable to find product information');
  }
};

export const analyzeIngredients = async (ingredients, userAllergies) => {
  // If no ingredients, return basic response
  if (!ingredients || ingredients === 'No ingredients information available') {
    return {
      score: 'yellow',
      warnings: ['No ingredients information available'],
      safetyDetails: 'Unable to analyze safety without ingredients information'
    };
  }

  try {
    // First try basic analysis without AI
    const basicAnalysis = performBasicAnalysis(ingredients, userAllergies);

    // If OpenAI is available, try to get more detailed analysis
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
      return {
        score: aiAnalysis.safety_score.toLowerCase(),
        warnings: aiAnalysis.warnings,
        safetyDetails: aiAnalysis.safety_explanation
      };
    } catch (aiError) {
      console.warn('AI analysis failed, using basic analysis:', aiError);
      return basicAnalysis;
    }
  } catch (error) {
    console.warn('Analysis error:', error);
    return {
      score: 'yellow',
      warnings: ['Error analyzing ingredients'],
      safetyDetails: 'Please check ingredients manually'
    };
  }
};

function performBasicAnalysis(ingredients, userAllergies) {
  const ingredientsList = ingredients.toLowerCase().split(/[,;()]/);
  const warnings = [];
  let score = 'green';

  // Common allergen keywords
  const commonAllergens = [
    'milk', 'dairy', 'egg', 'nuts', 'peanut', 'soy', 'wheat', 
    'gluten', 'fish', 'shellfish', 'sesame'
  ];

  // Check user allergies
  userAllergies.forEach(allergy => {
    const allergyLower = allergy.toLowerCase().trim();
    if (ingredientsList.some(ing => ing.trim().includes(allergyLower))) {
      warnings.push(`Contains ${allergy}`);
      score = 'red';
    }
  });

  // Check common allergens if no specific allergies found
  if (warnings.length === 0) {
    commonAllergens.forEach(allergen => {
      if (ingredientsList.some(ing => ing.trim().includes(allergen))) {
        warnings.push(`Contains common allergen: ${allergen}`);
        score = 'yellow';
      }
    });
  }

  // Check for "may contain" statements
  if (ingredients.toLowerCase().includes('may contain')) {
    warnings.push('Product has cross-contamination warnings');
    score = score === 'red' ? 'red' : 'yellow';
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
