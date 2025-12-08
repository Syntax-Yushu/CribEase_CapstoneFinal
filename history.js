import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

export default function History({ navigation }) {
  const [selectedTab, setSelectedTab] = useState("temperature");
  const [historyData, setHistoryData] = useState({
    temperatureHistory: [],
    sleepHistory: [],
    soundHistory: [],
    fallHistory: [],
    fallCount: 0,
  });

  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const firstDeviceSensor = devicesData[firstDeviceKey]?.sensor;

        if (firstDeviceSensor) {
          const addHistory = (historyArray, newValue) => {
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
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const renderHistoryList = (history, isAlert = false) => {
    if (!history || history.length === 0) {
      return <Text style={styles.noRecord}>No records yet.</Text>;
    }

    return history.map((item, index) => (
      <View key={index}>
        <View style={styles.recordRow}>
          <View>
            <Text
              style={[
                styles.recordValue,
                isAlert && item.value === 'Crying' && styles.red
              ]}
            >
              {item.value}
            </Text>
            <Text style={styles.recordDate}>{item.date}</Text>
          </View>

          <Text style={styles.recordTime}>{item.time}</Text>
        </View>

        {index !== history.length - 1 && <View style={styles.divider} />}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>

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
          <Text style={[styles.tabText, selectedTab === "fall" && styles.activeTabText]}>Falls</Text>
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

  red: { color: 'red', fontWeight: 'bold' },
  noRecord: { fontSize: 14, color: '#555', fontStyle: 'italic' },
});
