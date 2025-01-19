import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { searchProduct, analyzeIngredients } from '../services/productService';
import { getAllergies } from '../utils/storage';

// Timeout duration in milliseconds
const API_TIMEOUT = 10000;

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
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const loadProductData = async () => {
      try {
        // Set timeout
        timeoutId = setTimeout(() => {
          if (isMounted && !product) {
            setTimeoutOccurred(true);
            setError('Request took too long. Please try again.');
          }
        }, API_TIMEOUT);

        // Load product data
        const productData = await searchProduct(barcode);
        if (!isMounted) return;
        
        setProduct(productData);
        
        // Load allergies and analyze
        const userAllergies = await getAllergies();
        const analysisResult = await analyzeIngredients(
          productData.ingredients,
          userAllergies
        );
        
        if (!isMounted) return;
        setAnalysis(analysisResult);

      } catch (err) {
        if (!isMounted) return;
        setError(err.message);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    loadProductData();

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [barcode]);

  const handleRetry = () => {
    setError(null);
    setTimeoutOccurred(false);
    setProduct(null);
    setAnalysis(null);
    router.replace({
      pathname: "/results",
      params: { barcode }
    });
  };

  if (error || timeoutOccurred) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, styles.cancelButton]} 
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading product information...</Text>
        <Text style={styles.loadingSubText}>This may take a few seconds</Text>
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  retryButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
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
});
