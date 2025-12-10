import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { database } from './firebase';
import { ref, get, onValue } from 'firebase/database';
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

  const tempIntervalRef = useRef(null);
  const presenceIntervalRef = useRef(null);

  // Fetch sensor data every 5 minutes (temperature, sleep, sound)
  const fetchSensorData = async () => {
    try {
      const devicesRef = ref(database, '/devices');
      const snapshot = await get(devicesRef);

      if (!snapshot.exists()) return;

      const devicesData = snapshot.val();
      const firstDeviceKey = Object.keys(devicesData)[0];
      const firstDeviceSensor = devicesData[firstDeviceKey]?.sensor;
      const firstDeviceInfo = devicesData[firstDeviceKey]?.info;

      if (!firstDeviceSensor || !firstDeviceInfo) return;

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

      setData(prev => ({
        ...prev,
        temperature: firstDeviceSensor.temperature || 0,
        temperatureHistory: addHistory(prev.temperatureHistory, firstDeviceSensor.temperature || 0),
        sleepStatus: firstDeviceSensor.sleepPattern || 'Unknown',
        sleepHistory: addHistory(prev.sleepHistory, firstDeviceSensor.sleepPattern || 'Unknown'),
        sound: firstDeviceSensor.sound || 'Quiet',
        soundHistory: addHistory(prev.soundHistory, firstDeviceSensor.sound || 'Quiet'),
        deviceStartTime: firstDeviceInfo.deviceStartTime || 'Unknown',
        deviceLastActive: firstDeviceInfo.deviceLastActive || 'Unknown',
      }));
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  // Fetch presence/fallStatus every second
  const fetchPresenceData = async () => {
  try {
    const devicesRef = ref(database, '/devices');
    const snapshot = await get(devicesRef);

    if (!snapshot.exists()) return;

    const devicesData = snapshot.val();
    const firstDeviceKey = Object.keys(devicesData)[0];
    const firstDeviceSensor = devicesData[firstDeviceKey]?.sensor;
    const firstDeviceInfo = devicesData[firstDeviceKey]?.info;

    if (!firstDeviceSensor || !firstDeviceInfo) return;

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

    setData(prev => ({
      ...prev,
      fallStatus: firstDeviceSensor.fallStatus === 'Present' ? 'Present' : 'Absent',
      fallHistory: addHistory(prev.fallHistory, firstDeviceSensor.fallStatus === 'Present' ? 'Present' : 'Absent'),
      fallCount: firstDeviceSensor.fallCount || 0,
      deviceLastActive: firstDeviceInfo.deviceLastActive || prev.deviceLastActive, // update lastActive every second
    }));
  } catch (error) {
    console.error('Error fetching presence data:', error);
  }
};


  // Start intervals
  useEffect(() => {
    fetchSensorData(); // initial fetch
    fetchPresenceData(); // initial fetch

    // Temperature, sleep, sound every 5 mins
    tempIntervalRef.current = setInterval(fetchSensorData, 5 * 60 * 1000);

    // Presence every second
    presenceIntervalRef.current = setInterval(fetchPresenceData, 1000);

    return () => {
      clearInterval(tempIntervalRef.current);
      clearInterval(presenceIntervalRef.current);
    };
  }, []);

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
      <Text style={styles.title}>CribEase Dashboard</Text>
      <Text style={styles.deviceId}>Device ID: {deviceId}</Text>

      <View style={styles.deviceInfoContainer}>
        <View style={styles.deviceBox}>
          <Text style={styles.deviceLabel}>Device Start</Text>
          <Text style={styles.deviceValue}>{data.deviceStartTime}</Text>
        </View>
        <View style={styles.deviceBox}>
          <Text style={styles.deviceLabel}>Last Active</Text>
          <Text style={styles.deviceValue}>{data.deviceLastActive}</Text>
        </View>
      </View>
      
      

      <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.label, { fontWeight: 'bold' }]}>
 Sensor Readings
</Text>

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
            {/* {renderFilteredHistory(data.temperatureHistory)} */}
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
              <Text style={[styles.value, soundIsBad && styles.red]}>{data.sound}</Text>
            </View>
            {/* {renderFilteredHistory(data.soundHistory, 'Crying')} */}
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
              <Text style={[styles.value, sleepIsBad && styles.red]}>{data.sleepStatus}</Text>
            </View>
            {/* {renderFilteredHistory(data.sleepHistory, 'Awake')} */}
          </View>
        </TouchableOpacity>

        {/* Presence Detection */}
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
              <Text style={[styles.value, fallIsBad && styles.red]}>{data.fallStatus}</Text>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
              <Text style={styles.fallCountRight}>Total Absent</Text>
              <Text style={styles.fallCountNumber}>{data.fallCount !== 'Unknown' ? data.fallCount : 'Unknown'}</Text>
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
  deviceId: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 10 },
  deviceInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  deviceBox: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#02f7ffff', marginHorizontal: 5, alignItems: 'center' },
  deviceLabel: { fontSize: 14, color: '#333', marginBottom: 5, fontWeight: '500' },
  deviceValue: { fontSize: 16, color: '#4d148c', fontWeight: 'bold' },
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
