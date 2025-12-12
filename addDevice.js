import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, database } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, get } from 'firebase/database';

export default function AddDevice({ navigation }) {
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddDevice = async () => {
    if (deviceId.trim() === '') {
      Alert.alert('Error', 'Please enter a valid device ID.');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Validate device exists in Firebase Realtime Database
      const deviceRef = ref(database, `/devices/${deviceId}`);
      const snapshot = await get(deviceRef);
      
      if (!snapshot.exists()) {
        Alert.alert('Error', 'Device ID not found. Please check and try again.');
        setLoading(false);
        return;
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        deviceID: deviceId
      });

      // Save locally
      await AsyncStorage.setItem('deviceID', deviceId);

      Alert.alert('Success', 'Device added successfully!');
      navigation.replace('TabNavigation');
    } catch (error) {
      Alert.alert('Error', 'Failed to save device.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('deviceID');
      navigation.replace('HomePage');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout.');
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Device</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Device ID"
        value={deviceId}
        onChangeText={setDeviceId}
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddDevice} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Validating...' : 'Add Device'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, color: '#a34f9f', fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 15, marginBottom: 20, fontSize: 16 },
  addButton: { backgroundColor: '#a34f9f', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  logoutButton: { backgroundColor: '#4f9fa3', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
