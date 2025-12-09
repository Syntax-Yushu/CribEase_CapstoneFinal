import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

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
    deviceStartTime: 'Unknown',
    deviceLastActive: 'Unknown',
  });

  const [deviceId, setDeviceId] = useState('Unknown Device');
  const [expoPushToken, setExpoPushToken] = useState('');
  const [isOffline, setIsOffline] = useState(false); // offline state

  // Notification handler
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

  // Listen for Firebase connection status (offline detection)
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    const unsubscribeConnection = onValue(connectedRef, (snapshot) => {
      if (snapshot.exists()) {
        const offline = !snapshot.val();
        setIsOffline(offline);

        if (offline) {
          Alert.alert('You are offline', 'Displaying cached data from Firebase.');
          // Replace all values with Unknown while offline
          setData(prev => ({
            ...prev,
            temperature: 'Unknown',
            sleepStatus: 'Unknown',
            sound: 'Unknown',
            fallStatus: 'Unknown',
            fallCount: 'Unknown',
            deviceStartTime: 'Unknown',
            deviceLastActive: 'Unknown',
          }));
        }
      }
    });

    return () => unsubscribeConnection();
  }, []);

  // Listen to Firebase updates
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const firstDeviceSensor = devicesData[firstDeviceKey]?.sensor;
        const firstDeviceInfo = devicesData[firstDeviceKey]?.info;

        if (firstDeviceSensor && firstDeviceInfo) {
          setDeviceId(firstDeviceKey);

          const addHistory = (historyArray, newValue) => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            const newHistory = [{ value: newValue, time: formattedTime }, ...historyArray];
            return newHistory.slice(0, 20);
          };

          // Only update data if device is active
          if (firstDeviceInfo.deviceLastActive) {
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
              deviceStartTime: firstDeviceInfo.deviceStartTime || 'Unknown',
              deviceLastActive: firstDeviceInfo.deviceLastActive || 'Unknown',
            }));

            // Notifications
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
      }
    });

    return () => unsubscribe();
  }, [expoPushToken]);

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

  const tempIsBad = data.temperature !== 'Unknown' && data.temperature > 37.5;
  const sleepIsBad = data.sleepStatus === 'Awake';
  const soundIsBad = data.sound === 'Crying';
  const fallIsBad = data.fallStatus === 'Absent';

  const renderFilteredHistory = (history, filterValue = null) => {
    if (history === 'Unknown') return null;
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
      {/* Offline Banner */}
      {isOffline && (
        <View style={{ backgroundColor: '#ffcc00', padding: 8 }}>
          <Text style={{ textAlign: 'center', color: '#333' }}>Offline Mode: displaying Unknown values</Text>
        </View>
      )}

      <Text style={styles.title}>CribEase Dashboard</Text>
      <Text style={styles.deviceId}>Device ID: {deviceId}</Text>

      <View style={styles.box}>
        <Text style={styles.timestamp}>Device Start: {data.deviceStartTime}</Text>
        <Text style={styles.timestamp}>Last Active: {data.deviceLastActive}</Text>
      </View>

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
                {data.temperature !== 'Unknown' ? data.temperature.toFixed(1) + '°C' : 'Unknown'}
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
          onPress={() =>
            navigation.navigate('FallDetection', {
              fallHistory: data.fallHistory,
              fallCount: data.fallCount,
            })
          }
        >
          <View style={styles.row}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={fallIsBad ? 'red' : '#4d148c'} style={styles.icon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Presence Detection</Text>
              <Text style={[styles.value, fallIsBad && styles.red]}>
                {data.fallStatus}
              </Text>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
              <Text style={styles.fallCountRight}>Total Absent</Text>
              <Text style={styles.fallCountNumber}>
                {data.fallCount !== 'Unknown' ? data.fallCount : 'Unknown'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#a34f9f', marginTop: 70, marginBottom: 5, textAlign: 'center' },
  deviceId: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 5 },
  box: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    marginVertical: 10,
  },
  timestamp: { fontSize: 14, color: '#333', textAlign: 'center', marginBottom: 5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: '#f3e6f7', padding: 20, borderRadius: 15, marginBottom: 15 },
  cardContent: { flex: 1 },
  label: { fontSize: 16, color: '#a34f9f', marginBottom: 5 },
  value: { fontSize: 22, fontWeight: 'bold', color: '#4d148c' },
  red: { color: 'red' },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 10 },
  historyContainer: { marginLeft: 20, alignItems: 'flex-end' },
  historyText: { fontSize: 14, color: '#555' },
  fallCountRight: { fontSize: 14, color: '#555', fontWeight: '500' },
  fallCountNumber: { fontSize: 20, fontWeight: 'bold', color: '#4d148c', marginTop: 2 },
});
