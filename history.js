import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

export default function History({ navigation }) {
  const [selectedTab, setSelectedTab] = useState("temperature");
  const [isDeviceActive, setIsDeviceActive] = useState(false);
  const [historyData, setHistoryData] = useState({
    temperatureHistory: [],
    sleepHistory: [],
    soundHistory: [],
    fallHistory: [],
    fallCount: 0,
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
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const firstDeviceSensor = devicesData[firstDeviceKey]?.sensor;

        if (firstDeviceSensor) {
          const addHistory = (historyArray, newValue) => {
            // Don't add if the latest entry has the same value
            if (historyArray.length > 0 && historyArray[0].value === newValue) {
              return historyArray;
            }

            const now = new Date();

            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');

            let hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;

            const formattedDate = `${month}/${day}/${year}`;
            const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

            const newHistory = [
              { value: newValue, time: formattedTime, date: formattedDate },
              ...historyArray,
            ];

            return newHistory.slice(0, 20);
          };

          setHistoryData(prev => ({
            temperatureHistory: addHistory(prev.temperatureHistory, firstDeviceSensor.temperature || 0),
            sleepHistory: addHistory(prev.sleepHistory, firstDeviceSensor.sleepPattern || 'Unknown'),
            soundHistory: addHistory(prev.soundHistory, firstDeviceSensor.sound || 'Quiet'),
            fallHistory: addHistory(prev.fallHistory, firstDeviceSensor.fallStatus === 'Present' ? 'Present' : 'Absent'),
            fallCount: firstDeviceSensor.fallCount || 0,
          }));

          // Check device status
          const firstDeviceInfo = devicesData[firstDeviceKey]?.info;
          if (firstDeviceInfo) {
            const active = checkDeviceActive(firstDeviceInfo.deviceLastActive);
            setIsDeviceActive(active);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const getTimelineColor = (value, isAlert) => {
    if (!isAlert) {
      // Temperature color coding
      if (typeof value === 'number') {
        if (value > 37.5) return '#e74c3c'; // High temp - red
        if (value < 35.5) return '#3498db'; // Low temp - blue
        return '#27ae60'; // Normal - green
      }
      // Sleep pattern colors
      if (value === 'Sleeping') return '#9b59b6'; // Purple
      if (value === 'Restless') return '#f39c12'; // Orange
      return '#95a5a6'; // Gray for unknown
    } else {
      // Alert colors
      if (value === 'Crying') return '#e74c3c'; // Red
      if (value === 'Absent') return '#e74c3c'; // Red
      if (value === 'Present') return '#27ae60'; // Green
      return '#95a5a6'; // Gray
    }
  };

  const renderHistoryList = (history, isAlert = false) => {
    if (!history || history.length === 0) {
      return <Text style={styles.noRecord}>No records yet.</Text>;
    }

    return (
      <View style={styles.timelineContainer}>
        {/* Timeline vertical line */}
        <View style={styles.timelineLine} />

        {/* Timeline entries */}
        {history.map((item, index) => {
          const dotColor = getTimelineColor(item.value, isAlert);
          const displayValue = typeof item.value === 'number' ? item.value.toFixed(1) : item.value;

          return (
            <View key={index} style={styles.timelineEntry}>
              {/* Timeline dot */}
              <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />

              {/* Content */}
              <View style={styles.timelineContent}>
                <View style={styles.valueRow}>
                  <Text style={[styles.timelineValue, { color: dotColor }]}>
                    {displayValue}
                  </Text>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                </View>
                <Text style={styles.timelineDate}>{item.date}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>

      {/* DEVICE STATUS */}
      <View style={[styles.statusContainer, { backgroundColor: isDeviceActive ? '#E8F5E9' : '#FFF3E0' }]}>
        <View style={[styles.statusDot, { backgroundColor: isDeviceActive ? '#4CAF50' : '#F44336' }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusText, { color: isDeviceActive ? '#2E7D32' : '#E65100' }]}>
            {isDeviceActive ? 'Device Online' : 'Device Offline'}
          </Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "temperature" && styles.activeTab]}
          onPress={() => setSelectedTab("temperature")}
        >
          <Text style={[styles.tabText, selectedTab === "temperature" && styles.activeTabText]}>Temperature</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "sleep" && styles.activeTab]}
          onPress={() => setSelectedTab("sleep")}
        >
          <Text style={[styles.tabText, selectedTab === "sleep" && styles.activeTabText]}>Sleep</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "sound" && styles.activeTab]}
          onPress={() => setSelectedTab("sound")}
        >
          <Text style={[styles.tabText, selectedTab === "sound" && styles.activeTabText]}>Sound</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "fall" && styles.activeTab]}
          onPress={() => setSelectedTab("fall")}
        >
          <Text style={[styles.tabText, selectedTab === "fall" && styles.activeTabText]}>Presence</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TEMPERATURE TAB */}
        {selectedTab === "temperature" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome name="thermometer-half" size={22} color="#4d148c" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>Baby Temperature</Text>
            </View>
            {renderHistoryList(historyData.temperatureHistory)}
          </View>
        )}

        {/* SLEEP TAB */}
        {selectedTab === "sleep" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome name="bed" size={22} color="#4d148c" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>Sleep Pattern</Text>
            </View>
            {renderHistoryList(historyData.sleepHistory)}
          </View>
        )}

        {/* SOUND TAB */}
        {selectedTab === "sound" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="baby-face-outline" size={22} color="#4d148c" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>Baby Sound</Text>
            </View>
            {renderHistoryList(historyData.soundHistory, true)}
          </View>
        )}

        {/* FALL TAB */}
        {selectedTab === "fall" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#4d148c" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>
                Fall Detection (Total: {historyData.fallCount})
              </Text>
            </View>
            {renderHistoryList(historyData.fallHistory, true)}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 70, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 30 },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginBottom: 15,
    textAlign: 'center',
  },

  /* FILTER TAB STYLES */
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#f6e9fa',
    padding: 8,
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#a34f9f',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#4d148c',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },

  card: {
    backgroundColor: '#f3e6f7',
    padding: 18,
    borderRadius: 15,
    marginBottom: 18,
    borderLeftWidth: 6,
    borderLeftColor: '#a34f9f',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#4d148c' },

  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  recordValue: { fontSize: 17, color: '#4d148c', fontWeight: '600' },
  recordDate: { fontSize: 13, color: '#777' },
  recordTime: { fontSize: 15, color: '#555' },

  divider: {
    height: 1,
    backgroundColor: '#d1b5db',
    marginVertical: 5,
    opacity: 0.5,
  },

  noRecord: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },

  red: {
    color: '#e74c3c',
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

  /* TIMELINE STYLES */
  timelineContainer: {
    position: 'relative',
    paddingLeft: 40,
    paddingVertical: 10,
  },
  timelineLine: {
    position: 'absolute',
    left: 16,
    top: 20,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0c5f0',
  },
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  timelineDot: {
    position: 'absolute',
    left: -32,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#f8f5fb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  timelineValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  timelineTime: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  timelineDate: {
    fontSize: 12,
    color: '#aaa',
  },

  red: { color: 'red', fontWeight: 'bold' },
  noRecord: { fontSize: 14, color: '#555', fontStyle: 'italic' },
});
