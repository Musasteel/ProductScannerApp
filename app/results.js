import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { searchProduct, analyzeIngredients } from '../services/productService';
import { getAllergies } from '../utils/storage';

const SEVERITY_COLORS = {
  green: '#4CAF50',
  yellow: '#FFC107',
  red: '#F44336',
};

export default function Results() {
  const { barcode } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProductData();
  }, [barcode]);

  const loadProductData = async () => {
    try {
      // Load product data first
      const productData = await searchProduct(barcode);
      setProduct(productData);

      // Then load allergies and analyze
      const userAllergies = await getAllergies();
      const analysisResult = await analyzeIngredients(
        productData.ingredients,
        userAllergies
      );
      setAnalysis(analysisResult);
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading product information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Product Details',
          headerShown: true,
        }} 
      />
      
      <View style={styles.content}>
        <Text style={styles.productName}>{product.name}</Text>
        
        {!analysis ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.analyzingText}>Analyzing ingredients...</Text>
          </View>
        ) : (
          <>
            <View style={[
              styles.severityBanner,
              { backgroundColor: SEVERITY_COLORS[analysis.score] }
            ]}>
              <Text style={styles.severityText}>
                {analysis.score === 'green' ? 'Safe to Consume' :
                 analysis.score === 'yellow' ? 'Consume with Caution' :
                 'Not Recommended'}
              </Text>
            </View>

            {analysis.warnings?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Warnings</Text>
                {analysis.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>• {warning}</Text>
                ))}
              </>
            )}

            <Text style={styles.sectionTitle}>Analysis</Text>
            <Text style={styles.explanation}>{analysis.safetyDetails}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.ingredients}>{product.ingredients}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginVertical: 10,
  },
  analyzingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  severityBanner: {
    padding: 15,
    alignItems: 'center',
  },
  severityText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 5,
  },
  explanation: {
    fontSize: 16,
    lineHeight: 24,
  },
  ingredients: {
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  retryButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
