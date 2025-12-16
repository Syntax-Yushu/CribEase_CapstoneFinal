import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [isDeviceActive, setIsDeviceActive] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  const lastAlerts = useRef({
    temperature: null,
    sound: null,
    fallStatus: null,
  });

  // Check if device is active (last active within 15 seconds)
  const checkDeviceActive = (lastActiveTime) => {
    if (!lastActiveTime || lastActiveTime === 'Unknown') {
      return false;
    }
    
    try {
      const parts = lastActiveTime.split(' - ');
      if (parts.length !== 2) {
        return false;
      }
      
      const dateParts = parts[0].split('/');
      const timeAndAmpm = parts[1].split(' ');
      
      if (timeAndAmpm.length < 2) {
        return false;
      }
      
      const timeParts = timeAndAmpm[0].split(':');
      const ampm = timeAndAmpm[1];
      
      if (dateParts.length !== 3 || timeParts.length !== 3) {
        return false;
      }
      
      const month = parseInt(dateParts[0]) - 1;
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      let hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1]);
      const second = parseInt(timeParts[2]);
      
      if (ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'AM' && hour === 12) {
        hour = 0;
      }
      
      const lastActiveDate = new Date(year, month, day, hour, minute, second);
      const currentDate = new Date();
      const timeDiffSeconds = (currentDate - lastActiveDate) / 1000;
      
      return timeDiffSeconds <= 15;
    } catch (error) {
      console.error('Error parsing timestamp:', error);
      return false;
    }
  };

  useEffect(() => {
    // Request notification permissions and get push token
    registerForPushNotifications();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Request permissions and register for push notifications
  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '1d486e8c-cc5e-440e-822f-fbcb3aa67225', // CribEase project ID
      });
      
      setExpoPushToken(token.data);
      console.log('Expo Push Token:', token.data);
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  };

  // Listen to Firebase data
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const interval = setInterval(() => {
      onValue(devicesRef, snapshot => {
        if (!snapshot.exists()) return;
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const sensor = devicesData[firstDeviceKey]?.sensor;
        const deviceInfo = devicesData[firstDeviceKey]?.info;
        if (!sensor) return;

        // Update device status
        if (deviceInfo) {
          const active = checkDeviceActive(deviceInfo.deviceLastActive);
          setIsDeviceActive(active);
        }

        // Handle alerts
        handleAlert('temperature', sensor.temperature, 
          (temp) => temp > 37.5, 
          (temp) => `⚠️ High Temperature Alert: ${temp.toFixed(1)}°C`,
          (temp) => temp < 35.5, 
          (temp) => `❄️ Low Temperature Alert: ${temp.toFixed(1)}°C`
        );

        handleAlert('sound', sensor.sound,
          (sound) => sound === 'Crying',
          () => '👶 Baby is Crying!'
        );

        handleAlert('fallStatus', sensor.fallStatus,
          (status) => status === 'Absent',
          () => '⚠️ Baby is Absent from Crib!'
        );
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expoPushToken]);

  // Function to handle alert and prevent duplicates
  const handleAlert = (type, value, checkHigh, highMessage, checkLow = null, lowMessage = null) => {
    if (checkHigh(value) && lastAlerts.current[type] !== 'high') {
      const message = highMessage(value);
      addAlert(message, 'high');
      sendPushNotification('CribEase Alert', message, 'high');
      lastAlerts.current[type] = 'high';
    } else if (checkLow && checkLow(value) && lastAlerts.current[type] !== 'low') {
      const message = lowMessage(value);
      addAlert(message, 'low');
      sendPushNotification('CribEase Alert', message, 'low');
      lastAlerts.current[type] = 'low';
    } else if (!checkHigh(value) && (!checkLow || !checkLow(value))) {
      lastAlerts.current[type] = null;
    }
  };

  // Add alert to in-app list
  const addAlert = (msg, level) => {
    const timestamp = new Date().toLocaleString();
    const newAlert = {
      id: Date.now().toString() + Math.random(),
      message: msg,
      level,
      time: timestamp,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep only last 50 alerts
  };

  // Send local push notification (outside app)
  const sendPushNotification = async (title, message, severity = 'info') => {
    try {
      // Send local notification (device itself)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: message,
          sound: true,
          badge: 1,
          vibrate: [0, 250, 250, 250],
          priority: severity === 'high' ? 'max' : 'default',
        },
        trigger: {
          seconds: 1,
        },
      });

      // Also send to Expo push service if token exists
      if (expoPushToken) {
        await sendExpoPushNotification(title, message, expoPushToken, severity);
      }
    } catch (error) {
      console.log('Error sending local notification:', error);
    }
  };

  // Send to Expo push service (server-based notifications)
  const sendExpoPushNotification = async (title, message, token, severity) => {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          sound: 'default',
          title: title,
          body: message,
          data: { message, severity },
          badge: 1,
          priority: severity === 'high' ? 'high' : 'default',
        }),
      });

      if (!response.ok) {
        console.log('Failed to send push notification:', response.status);
      }
    } catch (error) {
      console.log('Error sending Expo push notification:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>🔔 Notifications</Text>
        {alerts.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setAlerts([])}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DEVICE STATUS */}
      <View style={[styles.statusContainer, { backgroundColor: isDeviceActive ? '#E8F5E9' : '#FFF3E0' }]}>
        <View style={[styles.statusDot, { backgroundColor: isDeviceActive ? '#4CAF50' : '#F44336' }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusText, { color: isDeviceActive ? '#2E7D32' : '#E65100' }]}>
            {isDeviceActive ? 'Device Online' : 'Device Offline'}
          </Text>
        </View>
      </View>
      
      {expoPushToken ? (
        <Text style={styles.tokenInfo}>Push notifications enabled ✓</Text>
      ) : (
        <Text style={styles.tokenWarning}>⚠️ Push notifications not configured</Text>
      )}

      <ScrollView style={styles.scrollArea}>
        {alerts.length === 0 && <Text style={styles.noAlert}>No alerts yet.</Text>}
        {alerts.map(alert => (
          <View key={alert.id} style={[styles.alertItem, alert.level === 'high' ? styles.alertHigh : styles.alertLow]}>
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
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15, 
    marginTop: 30 
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#a34f9f', textAlign: 'center', flex: 1 },
  clearButton: {
    backgroundColor: '#a34f9f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tokenInfo: { fontSize: 12, color: '#27ae60', textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  tokenWarning: { fontSize: 12, color: '#e74c3c', textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  scrollArea: { marginTop: 10 },
  noAlert: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 16 },
  alertItem: { padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 6 },
  alertHigh: { backgroundColor: '#f8d7da', borderLeftColor: '#dc3545' },
  alertLow: { backgroundColor: '#d1ecf1', borderLeftColor: '#17a2b8' },
  alertMessage: { fontSize: 16, fontWeight: '600', color: '#333' },
  alertTime: { fontSize: 13, color: '#555', marginTop: 5 },
});
