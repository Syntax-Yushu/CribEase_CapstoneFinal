import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Device({ navigation }) {
  const [deviceID, setDeviceID] = useState('');

  // Load existing deviceID if any
  useEffect(() => {
    AsyncStorage.getItem('deviceID').then(id => {
      if (id) setDeviceID(id);
    });
  }, []);

  const saveDevice = async () => {
    if (!deviceID) {
      Alert.alert('Please enter a device ID');
      return;
    }
    await AsyncStorage.setItem('deviceID', deviceID);
    Alert.alert('Device saved successfully!');
    navigation.navigate('Dashboard'); // go back to dashboard
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add ESP32 Device</Text>
      <TextInput
        placeholder="Enter Device ID (MAC Address)"
        value={deviceID}
        onChangeText={setDeviceID}
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={saveDevice}>
        <Text style={styles.buttonText}>Save Device</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#a34f9f' },
  input: { borderWidth: 1, borderColor: '#a34f9f', borderRadius: 10, width: '100%', padding: 10, marginBottom: 20 },
  button: { backgroundColor: '#a34f9f', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
