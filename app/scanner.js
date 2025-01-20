import { CameraView } from "expo-camera";
import { Stack, router } from "expo-router";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRef, useState, useEffect } from "react";
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;
const SCAN_AREA_HEIGHT = SCAN_AREA_SIZE * 0.7;

function Scanner() {
  const scanLock = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Cleanup function when component unmounts
    return () => {
      scanLock.current = false;
      setScanning(false);
      setIsActive(false);
    };
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (data && !scanLock.current && isActive) {
      scanLock.current = true;
      setScanning(true);
      setIsActive(false);
      
      // Navigate and unmount scanner
      router.replace({
        pathname: "/results",
        params: { barcode: data }
      });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      {isActive && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8"],
          }}
        >
          <View style={styles.overlay}>
            {/* Top overlay */}
            <View style={[styles.overlaySection, { height: (SCREEN_HEIGHT - SCAN_AREA_HEIGHT) / 2 }]} />
            
            {/* Middle section with scan area */}
            <View style={styles.middleSection}>
              <View style={styles.overlaySection} />
              <View style={styles.scanArea}>
                <View style={styles.scanAreaBorder} />
                <Text style={styles.scanText}>
                  {scanning ? 'Product found!' : 'Position bar code in this frame'}
                </Text>
                {scanning && (
                  <ActivityIndicator 
                    size="large" 
                    color="#fff" 
                    style={styles.spinner}
                  />
                )}
              </View>
              <View style={styles.overlaySection} />
            </View>

            {/* Bottom overlay */}
            <View style={[styles.overlaySection, { height: (SCREEN_HEIGHT - SCAN_AREA_HEIGHT) / 2 }]} />
          </View>
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
              setIsActive(false);
              router.back();
            }}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  middleSection: {
    flexDirection: 'row',
    height: SCAN_AREA_HEIGHT,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_HEIGHT,
  },
  scanAreaBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
  },
  scanText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginTop: 20,
  },
});

export default Scanner;
