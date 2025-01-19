import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import Constants from 'expo-constants';
import axios from 'axios';
import { Groq } from 'groq-sdk';

// Add debug logs to see what's available
console.log('Constants available:', !!Constants);
console.log('expoConfig available:', !!Constants.expoConfig);
console.log('extra available:', !!Constants.expoConfig?.extra);
console.log('API Key available:', !!Constants.expoConfig?.extra?.groqApiKey);
console.log('Full extra object:', Constants.expoConfig?.extra);

// Create a function to get a new Groq instance each time
const getGroqInstance = () => {
  // Use the API key directly
  const GROQ_API_KEY = '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';
  
  console.log('Using direct API key:', !!GROQ_API_KEY);
  
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not found');
  }

  return new Groq({ GROQ_API_KEY });
};

export const searchProduct = async (barcode) => {
  try {
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (response.data.status === 1) {
      const productData = {
        barcode,
        name: response.data.product.product_name || 'Unknown Product',
        ingredients: response.data.product.ingredients_text || 'No ingredients information available',
        image: response.data.product.image_url,
        allergens: response.data.product.allergens_tags || [],
      };

      // Save to Firebase in background
      saveToFirebase(productData);
      return productData;
    }
    throw new Error('Product not found');
  } catch (error) {
    console.warn('Error fetching product:', error);
    throw new Error('Unable to find product information');
  }
};

export const analyzeIngredients = async (ingredients, userAllergies) => {
  if (!ingredients || ingredients === 'No ingredients information available') {
    return {
      score: 'yellow',
      warnings: ['No ingredients information available'],
      safetyDetails: 'Unable to analyze safety without ingredients information'
    };
  }

  if (!userAllergies?.length) {
    return {
      score: 'green',
      warnings: ['No allergies or conditions specified'],
      safetyDetails: 'No specific allergies or conditions to check against'
    };
  }

  try {
    const prompt = `
      You are a precise ingredient analyzer focused on food safety.
      
      Ingredients list: "${ingredients}"
      User's allergies/conditions: "${userAllergies.join(', ')}"

      Analyze if this product is safe for consumption given the user's specific allergies/conditions.
      Consider all forms and derivatives of allergens, hidden ingredients, and cross-contamination risks.

      Provide a safety rating:
      - RED if any listed allergen or its derivatives are present
      - YELLOW if there's any uncertainty or cross-contamination risk
      - GREEN only if completely safe given the user's conditions

      Respond in JSON format with:
      {
        "safety_score": "RED/YELLOW/GREEN",
        "warnings": [list of specific concerns],
        "safety_explanation": "detailed explanation"
      }

      Be conservative - if there's any doubt, err on the side of caution.
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Constants.expoConfig.extra.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to analyze ingredients');
    }

    const data = await response.json();
    console.log('Raw response:', data);

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const analysis = typeof content === 'string' ? JSON.parse(content) : content;
    
    return {
      score: analysis.safety_score.toLowerCase(),
      warnings: analysis.warnings,
      safetyDetails: analysis.safety_explanation
    };
  } catch (error) {
    console.warn('Analysis failed:', error);
    return {
      score: 'yellow',
      warnings: [`Analysis system unavailable: ${error.message}`, 'Please check ingredients manually'],
      safetyDetails: 'Unable to perform detailed analysis. Please carefully review the ingredients list against your allergies.'
    };
  }
};

// Helper function to save to Firebase
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
