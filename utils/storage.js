import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ALLERGIES: '@allergies',
  CONDITIONS: '@conditions',
};

export async function saveAllergies(allergies) {
  try {
    const jsonValue = JSON.stringify(allergies);
    await AsyncStorage.setItem(STORAGE_KEYS.ALLERGIES, jsonValue);
    return true;
  } catch (error) {
    console.warn('Error saving allergies:', error);
    return false;
  }
}

export async function getAllergies() {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.ALLERGIES);
    // Return empty array if no data found
    if (jsonValue === null) return [];
    return JSON.parse(jsonValue);
  } catch (error) {
    console.warn('Error getting allergies:', error);
    // Return empty array on error
    return [];
  }
}

export async function getUserProfile() {
  try {
    const allergiesJson = await AsyncStorage.getItem(STORAGE_KEYS.ALLERGIES);
    const conditionsJson = await AsyncStorage.getItem(STORAGE_KEYS.CONDITIONS);
    
    return {
      allergies: allergiesJson ? JSON.parse(allergiesJson) : [],
      conditions: conditionsJson ? JSON.parse(conditionsJson) : [],
    };
  } catch (error) {
    console.warn('Error getting user profile:', error);
    // Return default empty profile on error
    return {
      allergies: [],
      conditions: [],
    };
  }
}

// Add a function to clear storage (useful for testing)
export async function clearStorage() {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.warn('Error clearing storage:', error);
    return false;
  }
}

