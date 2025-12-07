import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { FontAwesome, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export default function Dashboard({ navigation }) {
  const [data, setData] = useState({
    temperature: 0,
    sleepStatus: 'Unknown',
    sound: 'Quiet',
    fallStatus: 'Absent',
    fallCount: 0,
  });

  const [deviceId, setDeviceId] = useState('Unknown Device');
  const [expoPushToken, setExpoPushToken] = useState('');

  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  // Listen to Firebase devices updates
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        // Pick first device for simplicity
        const firstDeviceKey = Object.keys(devicesData)[0];
        const firstDeviceSensor = devicesData[firstDeviceKey]?.sensor;

        if (firstDeviceSensor) {
          setDeviceId(firstDeviceKey); // Display device ID

          const mappedData = {
            temperature: firstDeviceSensor.temperature || 0,
            sleepStatus: firstDeviceSensor.sleepPattern || 'Unknown',
            sound: firstDeviceSensor.sound || 'Quiet',
            fallStatus: firstDeviceSensor.fallStatus === 'Present' ? 'Present' : 'Absent',
            fallCount: firstDeviceSensor.fallCount || 0,
          };

          setData(mappedData);

          // Trigger notifications
          if (mappedData.temperature > 37.5) {
            sendPushNotification(`High temperature detected: ${mappedData.temperature.toFixed(1)}°C`);
          }
          if (mappedData.sound === 'Crying') {
            sendPushNotification('Baby is crying!');
          }
          if (mappedData.fallStatus === 'Absent') {
            sendPushNotification('Fall absent!');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [expoPushToken]);

  // Push notification helper
  const sendPushNotification = async (message) => {
    if (!expoPushToken) return;

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: expoPushToken,
          sound: 'default',
          title: 'CribEase Alert',
          body: message,
          data: { message },
        }),
      });
    } catch (error) {
      console.log('Error sending push notification:', error);
    }
  };

  // Register device for push notifications
  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token:', token);
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  };

  // Threshold checks for UI colors
  const tempIsBad = data.temperature > 37.5;
  const sleepIsBad = data.sleepStatus === 'Awake';
  const soundIsBad = data.sound === 'Crying';
  const fallIsBad = data.fallStatus === 'Absent'; // red if Absent

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CribEase Dashboard</Text>
      <Text style={styles.deviceId}>Device ID: {deviceId}</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Baby Temperature */}
        <View style={styles.card}>
          <Text style={styles.label}>Baby Temperature</Text>
          <View style={styles.row}>
            <FontAwesome name="thermometer-half" size={22} color={tempIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <Text style={[styles.value, tempIsBad && styles.red]}>
              {data.temperature.toFixed(1)}°C
            </Text>
          </View>
        </View>

        {/* Baby Status */}
        <View style={styles.card}>
          <Text style={styles.label}>Baby Status</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="baby-face-outline" size={22} color={soundIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <Text style={[styles.value, soundIsBad && styles.red]}>
              {data.sound}
            </Text>
          </View>
        </View>

        {/* Sleep Pattern */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SleepPattern')}
        >
          <Text style={styles.label}>Sleep Pattern</Text>
          <View style={styles.row}>
            <FontAwesome name="bed" size={22} color={sleepIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <Text style={[styles.value, sleepIsBad && styles.red]}>{data.sleepStatus}</Text>
          </View>
        </TouchableOpacity>

        {/* Fall Detection */}
        <View style={styles.card}>
          <Text style={styles.label}>Fall Detection</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={fallIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <Text style={[styles.value, fallIsBad && styles.red]}>
              {data.fallStatus}
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginTop: 70,
    marginBottom: 5,
    textAlign: 'center',
  },
  deviceId: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#f3e6f7',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#a34f9f',
    marginBottom: 5,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4d148c',
  },
  red: {
    color: 'red',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
});
