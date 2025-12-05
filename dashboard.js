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
    sleepStatus: 'Asleep',
    sleepTime: '',
    sound: 'Quiet',
    fallStatus: 'Absent',
    fallCount: 0,
  });

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

  // Listen to Firebase sensor updates
  useEffect(() => {
    const sensorRef = ref(database, '/sensor');

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.val();
        setData(newData);

        // Trigger notifications for alerts
        if (newData.temperature > 37.5) {
          sendPushNotification('High temperature detected: ' + newData.temperature.toFixed(1) + '°C');
        }
        if (newData.sound === 'Crying') {
          sendPushNotification('Baby is crying!');
        }
        if (newData.fallStatus === 'Detected') {
          sendPushNotification('Fall detected!');
        }
      }
    });

    return () => unsubscribe();
  }, [expoPushToken]);

  // Helper function to send push notification
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
  const fallIsBad = data.fallStatus === 'Detected';
  const soundIsBad = data.sound === 'Crying';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CribEase Dashboard</Text>
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

        {/* Environmental Log */}
        <View style={styles.card}>
          <Text style={styles.label}>Environmental Log</Text>
          <View style={styles.row}>
            <Entypo name="sound" size={22} color="#4d148c" style={styles.icon} />
            <Text style={styles.value}>
              Noisy
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
            <Text style={styles.value}>{data.sleepStatus}</Text>
          </View>
          {data.sleepTime ? <Text style={styles.time}>{data.sleepTime}</Text> : null}
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
    marginBottom: 40,
    textAlign: 'center',
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
  time: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
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
