import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { FontAwesome, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

export default function Dashboard({ navigation }) {
  const [data, setData] = useState({
    temperature: 0,
    temperatureHistory: [],
    sleepStatus: 'Unknown',
    sleepHistory: [],
    sound: 'Quiet',
    soundHistory: [],
    fallStatus: 'Absent',
    fallHistory: [],
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

  // Listen to Firebase device updates
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const firstDeviceSensor = devicesData[firstDeviceKey]?.sensor;

        if (firstDeviceSensor) {
          setDeviceId(firstDeviceKey); // Display device ID

          const addHistory = (historyArray, newValue) => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12; // convert 24h to 12h
            const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

            const newHistory = [{ value: newValue, time: formattedTime }, ...historyArray];
            return newHistory.slice(0, 20); // keep last 20 for filtering
          };

          setData(prev => ({
            temperature: firstDeviceSensor.temperature || 0,
            temperatureHistory: addHistory(prev.temperatureHistory, firstDeviceSensor.temperature || 0),
            sleepStatus: firstDeviceSensor.sleepPattern || 'Unknown',
            sleepHistory: addHistory(prev.sleepHistory, firstDeviceSensor.sleepPattern || 'Unknown'),
            sound: firstDeviceSensor.sound || 'Quiet',
            soundHistory: addHistory(prev.soundHistory, firstDeviceSensor.sound || 'Quiet'),
            fallStatus: firstDeviceSensor.fallStatus === 'Present' ? 'Present' : 'Absent',
            fallHistory: addHistory(prev.fallHistory, firstDeviceSensor.fallStatus === 'Present' ? 'Present' : 'Absent'),
            fallCount: firstDeviceSensor.fallCount || 0,
          }));

          // Trigger notifications
          if ((firstDeviceSensor.temperature || 0) > 37.5) {
            sendPushNotification(`High temperature detected: ${firstDeviceSensor.temperature.toFixed(1)}°C`);
          }
          if (firstDeviceSensor.sound === 'Crying') {
            sendPushNotification('Baby is crying!');
          }
          if (firstDeviceSensor.fallStatus === 'Absent') {
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
  const fallIsBad = data.fallStatus === 'Absent';

  // Helper to render filtered recent history
  const renderFilteredHistory = (history, filterValue = null) => {
    let filtered = history;
    if (filterValue !== null) {
      filtered = history.filter(item => item.value === filterValue);
    }
    const recent = filtered.slice(0, 3);
    return (
      <View style={styles.historyContainer}>
        {recent.map((item, index) => (
          <Text key={index} style={styles.historyText}>
            {item.value} ({item.time})
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CribEase Dashboard</Text>
      <Text style={styles.deviceId}>Device ID: {deviceId}</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Baby Temperature */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('BabyTemp', { temperatureHistory: data.temperatureHistory })}
        >
          <View style={styles.row}>
            <FontAwesome name="thermometer-half" size={22} color={tempIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <View style={styles.cardContent}>
              <Text style={styles.label}>Baby Temperature</Text>
              <Text style={[styles.value, tempIsBad && styles.red]}>
                {data.temperature.toFixed(1)}°C
              </Text>
            </View>
            {renderFilteredHistory(data.temperatureHistory)}
          </View>
        </TouchableOpacity>

        {/* Baby Status */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('BabyStatus', { soundHistory: data.soundHistory.filter(item => item.value === 'Crying') })}
        >
          <View style={styles.row}>
            <MaterialCommunityIcons name="baby-face-outline" size={22} color={soundIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <View style={styles.cardContent}>
              <Text style={styles.label}>Baby Status</Text>
              <Text style={[styles.value, soundIsBad && styles.red]}>
                {data.sound}
              </Text>
            </View>
            {renderFilteredHistory(data.soundHistory, 'Crying')}
          </View>
        </TouchableOpacity>

        {/* Sleep Pattern */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SleepPattern', { sleepHistory: data.sleepHistory.filter(item => item.value === 'Awake') })}
        >
          <View style={styles.row}>
            <FontAwesome name="bed" size={22} color={sleepIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <View style={styles.cardContent}>
              <Text style={styles.label}>Sleep Pattern</Text>
              <Text style={[styles.value, sleepIsBad && styles.red]}>
                {data.sleepStatus}
              </Text>
            </View>
            {renderFilteredHistory(data.sleepHistory, 'Awake')}
          </View>
        </TouchableOpacity>

        {/* Fall Detection */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('FallDetection', { fallHistory: data.fallHistory.filter(item => item.value === 'Absent') })}
        >
          <View style={styles.row}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={fallIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <View style={styles.cardContent}>
              <Text style={styles.label}>Fall Detection</Text>
              <Text style={[styles.value, fallIsBad && styles.red]}>
                {data.fallStatus}
              </Text>
            </View>
            {renderFilteredHistory(data.fallHistory, 'Absent')}
          </View>
        </TouchableOpacity>

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
  cardContent: {
    flex: 1,
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
  historyContainer: {
    marginLeft: 20,
    alignItems: 'flex-end',
  },
  historyText: {
    fontSize: 14,
    color: '#555',
  },
});
