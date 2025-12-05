// FaceRegistration.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { auth, db, storage } from './firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export default function FaceRegistration() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View><Text>No access to camera</Text></View>;
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });

      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Convert base64 to blob
      const response = await fetch(photo.uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, `faces/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), { faceRegistered: true });

      Alert.alert('Success', 'Face registered successfully!');
      navigation.replace('FaceRegistration');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to register face. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.front}
        ref={cameraRef}
        onCameraReady={() => setCameraReady(true)}
      />
      <Text style={styles.instruction}>Align your face inside the frame and press capture</Text>
      <TouchableOpacity
        style={styles.captureButton}
        onPress={takePicture}
        disabled={!cameraReady || isCapturing}
      >
        <Text style={styles.captureButtonText}>{isCapturing ? 'Capturing...' : 'Capture'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  camera: { width: '90%', height: '70%', borderRadius: 20, overflow: 'hidden' },
  instruction: { marginTop: 20, fontSize: 16, color: '#a34f9f', textAlign: 'center' },
  captureButton: {
    marginTop: 30,
    backgroundColor: '#a34f9f',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
  },
  captureButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
