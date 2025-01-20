import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput } from "react-native";
import { Stack, router } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Ionicons } from '@expo/vector-icons';

function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const isPermissionGranted = Boolean(permission?.granted);

  const handleScanPress = async () => {
    if (!isPermissionGranted) {
      const permission = await requestPermission();
      if (!permission.granted) return;
    }
    router.push("/scanner");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/results",
        params: { search: searchQuery.trim() }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Home", headerShown: true }} />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Product Scanner</Text>
        
        {/* Search Section */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a product..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearch}
          >
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>- OR -</Text>

        {/* Scan Button */}
        <TouchableOpacity 
          style={[styles.scanButton, !isPermissionGranted && styles.scanButtonDisabled]} 
          onPress={handleScanPress}
        >
          <Ionicons name="scan" size={24} color="white" style={styles.scanIcon} />
          <Text style={styles.scanButtonText}>Scan Item</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginRight: 10,
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: '#ccc',
  },
  scanIcon: {
    marginRight: 10,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default Index;