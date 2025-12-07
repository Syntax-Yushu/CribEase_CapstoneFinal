import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export default function AddDevice({ navigation }) {
  const [deviceId, setDeviceId] = useState('');

  const handleAddDevice = async () => {
    if (deviceId.trim() === '') {
      Alert.alert('Error', 'Please enter a valid device ID.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

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

      <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
        <Text style={styles.buttonText}>Add Device</Text>
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
  logoutButton: { backgroundColor: 'red', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
