import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Stack, router } from "expo-router";
import { useCameraPermissions } from "expo-camera";

function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const isPermissionGranted = Boolean(permission?.granted);

  const handleScanPress = async () => {
    if (!isPermissionGranted) {
      const permission = await requestPermission();
      if (!permission.granted) return;
    }
    router.push("/scanner");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Home", headerShown: true }} />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Product Scanner</Text>
        <TouchableOpacity 
          style={[styles.scanButton, !isPermissionGranted && styles.scanButtonDisabled]} 
          onPress={handleScanPress}
        >
          <Text style={styles.scanButtonText}>Scan Item</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#000',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Index;