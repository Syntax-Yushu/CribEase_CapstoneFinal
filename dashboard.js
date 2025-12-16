import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { database, db, auth } from './firebase';
import { ref, get, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import BabyProfileBoard from './babyProfileBoard';

export default function Dashboard({ navigation }) {
  const [babyName, setBabyName] = useState('Baby');
  const [uptime, setUptime] = useState('--');
  const [lastUpdated, setLastUpdated] = useState('--');
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
  const [isDeviceActive, setIsDeviceActive] = useState(false);

  // Fetch baby name from Firestore on mount
  useEffect(() => {
    const fetchBabyName = async () => {
      try {
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists() && userDoc.data().babyName) {
            setBabyName(userDoc.data().babyName);
          }
        }
      } catch (error) {
        console.error('Error fetching baby name:', error);
      }
    };

    fetchBabyName();
  }, []);

  // Calculate uptime from device start time
  const calculateUptime = (startTime) => {
    if (!startTime || startTime === 'Unknown') return '--';
    
    try {
      const parts = startTime.split(' - ');
      if (parts.length !== 2) return '--';
      
      const dateParts = parts[0].split('/');
      const timeAndAmpm = parts[1].split(' ');
      
      if (timeAndAmpm.length < 2) return '--';
      
      const timeParts = timeAndAmpm[0].split(':');
      const ampm = timeAndAmpm[1];
      
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
      
      const startDate = new Date(year, month, day, hour, minute, second);
      const now = new Date();
      const diffMs = now - startDate;
      
      if (diffMs < 0) return '--';
      
      const diffSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSeconds / 3600);
      const mins = Math.floor((diffSeconds % 3600) / 60);
      
      if (hours === 0) {
        return `${mins}m`;
      }
      return `${hours}h ${mins}m`;
    } catch (error) {
      console.error('Error calculating uptime:', error);
      return '--';
    }
  };

  // Calculate relative time for last active
  const calculateRelativeTime = (lastActiveTime) => {
    if (!lastActiveTime || lastActiveTime === 'Unknown') return '--';
    
    try {
      const parts = lastActiveTime.split(' - ');
      if (parts.length !== 2) return '--';
      
      const dateParts = parts[0].split('/');
      const timeAndAmpm = parts[1].split(' ');
      
      if (timeAndAmpm.length < 2) return '--';
      
      const timeParts = timeAndAmpm[0].split(':');
      const ampm = timeAndAmpm[1];
      
      const month = parseInt(dateParts[0]) - 1;
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      let hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1]);
      const second = parseInt(timeParts[2]);
      
      // Return time in 12-hour format without seconds (e.g., 2:30 PM)
      return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return '--';
    }
  };

  // Update uptime and last updated every second
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(calculateUptime(data.deviceStartTime));
      setLastUpdated(calculateRelativeTime(data.deviceLastActive));
    }, 1000);

    return () => clearInterval(interval);
  }, [data.deviceStartTime, data.deviceLastActive]);

  // Check if device is active (last active within 15 seconds)
  const checkDeviceActive = (lastActiveTime) => {
    if (!lastActiveTime || lastActiveTime === 'Unknown') {
      console.log('No last active time:', lastActiveTime);
      return false;
    }
    
    try {
      // Parse the timestamp - handle format "MM/DD/YYYY - HH:MM:SS AM/PM"
      const parts = lastActiveTime.split(' - ');
      if (parts.length !== 2) {
        console.log('Invalid timestamp format:', lastActiveTime);
        return false;
      }
      
      const dateParts = parts[0].split('/');
      const timeAndAmpm = parts[1].split(' ');
      
      if (timeAndAmpm.length < 2) {
        console.log('Invalid time format:', parts[1]);
        return false;
      }
      
      const timeParts = timeAndAmpm[0].split(':');
      const ampm = timeAndAmpm[1];
      
      if (dateParts.length !== 3 || timeParts.length !== 3) {
        console.log('Invalid date/time parts:', dateParts, timeParts);
        return false;
      }
      
      const month = parseInt(dateParts[0]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      let hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1]);
      const second = parseInt(timeParts[2]);
      
      // Convert to 24-hour format
      if (ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'AM' && hour === 12) {
        hour = 0;
      }
      
      const lastActiveDate = new Date(year, month, day, hour, minute, second);
      const currentDate = new Date();
      const timeDiffSeconds = (currentDate - lastActiveDate) / 1000;
      
      console.log('Last active:', lastActiveTime, 'Time diff (seconds):', timeDiffSeconds.toFixed(2));
      
      // Consider device active if last active within 15 seconds
      return timeDiffSeconds <= 15;
    } catch (error) {
      console.error('Error parsing timestamp:', error, 'Value:', lastActiveTime);
      return false;
    }
  };

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
        // Don't add if the latest entry has the same value
        if (historyArray.length > 0 && historyArray[0].value === newValue) {
          return historyArray;
        }

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

      // Check if device is active
      const active = checkDeviceActive(firstDeviceInfo.deviceLastActive);
      setIsDeviceActive(active);
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
      // Don't add if the latest entry has the same value
      if (historyArray.length > 0 && historyArray[0].value === newValue) {
        return historyArray;
      }

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

    // Check if device is active
    const active = checkDeviceActive(firstDeviceInfo.deviceLastActive);
    setIsDeviceActive(active);
  } catch (error) {
    console.error('Error fetching presence data:', error);
  }
};


  // Start intervals
  useEffect(() => {
    fetchSensorData(); // initial fetch
    fetchPresenceData(); // initial fetch

    // Temperature, sleep, sound every 1 second
    tempIntervalRef.current = setInterval(fetchSensorData, 1000);

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
            {typeof item.value === 'number' ? item.value.toFixed(1) : item.value} ({item.time})
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Device Status Indicator */}
      <View style={[styles.statusContainer, { backgroundColor: isDeviceActive ? '#E8F5E9' : '#FFF3E0' }]}>
        <View style={[styles.statusDot, { backgroundColor: isDeviceActive ? '#4CAF50' : '#F44336' }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusText, { color: isDeviceActive ? '#2E7D32' : '#E65100' }]}>
            {isDeviceActive ? 'Device Online' : 'Device Offline'}
          </Text>
        </View>
      </View>

      {/* Baby Profile Board - Moved above Device Info */}
      {isDeviceActive && <BabyProfileBoard navigation={navigation} />}

      <ScrollView contentContainerStyle={styles.scrollContent} style={{ backgroundColor: '#f8f9fa' }}>
      {isDeviceActive ? (
        <>
          {/* Device Info - Now scrollable */}
          <View style={styles.deviceInfoContainer}>
            <View style={styles.deviceBox}>
              <Text style={styles.deviceLabel}>⏱️ Running For</Text>
              <Text style={styles.deviceValue}>{uptime}</Text>
            </View>
            <View style={styles.deviceBox}>
              <Text style={styles.deviceLabel}>📡 Updated</Text>
              <Text style={styles.deviceValue}>{lastUpdated}</Text>
            </View>
          </View>

          <Text style={styles.sensorReadingsTitle}>
            🔍 Sensor Readings
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
            navigation.navigate('PresenceDetection', {
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
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#ccc" />
          <Text style={styles.noDataText}>No data available</Text>
          <Text style={styles.noDataSubText}>Waiting for device to come online...</Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 40 },
  babyNameContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0e6f7',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 2, 
    elevation: 1 
  },
  babyNameText: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#a34f9f', 
    marginLeft: 12, 
    letterSpacing: 0.5 
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
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
  statusIndicatorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 2, borderBottomColor: '#e0e0e0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  offlineMessageContainer: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF3E0', borderRadius: 12, marginHorizontal: 20, marginTop: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#F57C00', shadowColor: '#F57C00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  offlineMessage: { fontSize: 15, color: '#F57C00', fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  offlineMessageSub: { fontSize: 12, color: '#E65100', textAlign: 'center', opacity: 0.8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#a34f9f', marginTop: 70, marginBottom: 50, textAlign: 'center' },
  deviceId: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 10 },
  deviceInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 20, gap: 12 },
  deviceBox: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#fff', marginHorizontal: 0, alignItems: 'center', shadowColor: '#a34f9f', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3, borderTopWidth: 3, borderTopColor: '#a34f9f' },
  deviceLabel: { fontSize: 13, color: '#999', marginBottom: 8, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  deviceValue: { fontSize: 15, color: '#4d148c', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  sensorReadingsTitle: { fontSize: 18, fontWeight: '700', color: '#4d148c', marginTop: 8, marginBottom: 18, letterSpacing: 0.3 },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#a34f9f' },
  cardContent: { flex: 1 },
  label: { fontSize: 14, color: '#a34f9f', marginBottom: 6, fontWeight: '600', opacity: 0.9 },
  value: { fontSize: 26, fontWeight: '800', color: '#4d148c' },
  valueUnit: { fontSize: 14, color: '#999', fontWeight: '500', marginLeft: 4 },
  red: { color: '#E53935' },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 14, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  historyContainer: { marginLeft: 20, alignItems: 'flex-end' },
  historyText: { fontSize: 13, color: '#999', marginTop: 4 },
  fallCountRight: { fontSize: 12, color: '#999', fontWeight: '500' },
  fallCountNumber: { fontSize: 24, fontWeight: '800', color: '#4d148c', marginTop: 2 },
  noDataContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  noDataText: { fontSize: 18, fontWeight: '700', color: '#ccc', marginTop: 18 },
  noDataSubText: { fontSize: 13, color: '#bbb', marginTop: 10, fontStyle: 'italic' },
});
