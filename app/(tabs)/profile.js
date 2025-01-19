import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import { saveAllergies, getAllergies } from '../../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const Profile = () => {
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    loadAllergies();
  }, []);

  const loadAllergies = async () => {
    const savedAllergies = await getAllergies();
    setAllergies(savedAllergies);
  };

  const addAllergy = async () => {
    if (newAllergy.trim()) {
      const updatedAllergies = [...allergies, newAllergy.trim()];
      setAllergies(updatedAllergies);
      await saveAllergies(updatedAllergies);
      setNewAllergy('');
    }
  };

  const removeAllergy = async (index) => {
    const updatedAllergies = allergies.filter((_, i) => i !== index);
    setAllergies(updatedAllergies);
    await saveAllergies(updatedAllergies);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Health Profile</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newAllergy}
            onChangeText={setNewAllergy}
            placeholder="Enter allergy or condition..."
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={allergies}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.allergyItem}>
              <Text style={styles.allergyText}>{item}</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeAllergy(index)}>
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No allergies or conditions added yet</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  allergyItem: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allergyText: {
    flex: 1,
    fontSize: 16,
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default Profile;
