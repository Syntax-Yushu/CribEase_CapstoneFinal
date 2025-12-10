import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import * as Notifications from 'expo-notifications';

export default function NotificationsScreen() {
  const [alerts, setAlerts] = useState([]);
  const lastAlerts = useRef({
    temperature: null,
    sound: null,
    fallStatus: null,
  });

  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    // Listen to Firebase changes every second
    const interval = setInterval(() => {
      onValue(devicesRef, snapshot => {
        if (!snapshot.exists()) return;
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const sensor = devicesData[firstDeviceKey]?.sensor;
        if (!sensor) return;

        // Handle alerts
        handleAlert('temperature', sensor.temperature, 
          (temp) => temp > 37.5, 
          (temp) => `High Temperature: ${temp.toFixed(1)}°C`,
          (temp) => temp < 35.5, 
          (temp) => `Low Temperature: ${temp.toFixed(1)}°C`
        );

        handleAlert('sound', sensor.sound,
          (sound) => sound === 'Crying',
          () => 'Baby is crying!'
        );

        handleAlert('fallStatus', sensor.fallStatus,
          (status) => status === 'Absent',
          () => 'Baby is absent from crib!'
        );
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Function to handle alert and prevent duplicates
  const handleAlert = (type, value, checkHigh, highMessage, checkLow = null, lowMessage = null) => {
    if (checkHigh(value) && lastAlerts.current[type] !== 'high') {
      addAlert(highMessage(value), 'high');
      sendPushNotification(highMessage(value));
      lastAlerts.current[type] = 'high';
    } else if (checkLow && checkLow(value) && lastAlerts.current[type] !== 'low') {
      addAlert(lowMessage(value), 'low');
      sendPushNotification(lowMessage(value));
      lastAlerts.current[type] = 'low';
    } else if (!checkHigh(value) && (!checkLow || !checkLow(value))) {
      lastAlerts.current[type] = null;
    }
  };

  // Add alert to in-app list
  const addAlert = (msg, level) => {
    const timestamp = new Date().toLocaleString();
    const newAlert = {
      id: Date.now().toString() + msg,
      message: msg,
      level,
      time: timestamp,
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  // Send push notification
  const sendPushNotification = async (message) => {
    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      const expoPushToken = tokenResponse.data;

      if (!expoPushToken) return;

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <ScrollView style={styles.scrollArea}>
        {alerts.length === 0 && <Text style={styles.noAlert}>No alerts yet.</Text>}
        {alerts.map(alert => (
          <View key={alert.id} style={styles.alertItem}>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <Text style={styles.alertTime}>{alert.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#a34f9f', marginBottom: 15, marginTop: 30, textAlign: 'center' },
  scrollArea: { marginTop: 10 },
  noAlert: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 16 },
  alertItem: { backgroundColor: '#f2e4f5', padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 6, borderLeftColor: '#a34f9f' },
  alertMessage: { fontSize: 16, fontWeight: '600' },
  alertTime: { fontSize: 13, color: '#555', marginTop: 5 },
});
