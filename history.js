import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { FontAwesome, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const historyRef = ref(database, '/sensorHistory');
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historyArray = Object.keys(data).map(key => ({
          timestamp: key,
          ...data[key],
        })).reverse();
        setHistory(historyArray);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensors History</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {history.length === 0 ? (
          <Text style={styles.empty}>No history available</Text>
        ) : (
          history.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
              <View style={styles.row}>
                <FontAwesome name="thermometer-half" size={18} color="#4d148c" style={styles.icon} />
                <Text style={styles.value}>Temperature: {item.temperature}°C</Text>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="baby-face-outline" size={18} color="#4d148c" style={styles.icon} />
                <Text style={styles.value}>Sleep Status: {item.sleepStatus}</Text>
              </View>
              <View style={styles.row}>
                <Entypo name="sound" size={18} color="#4d148c" style={styles.icon} />
                <Text style={styles.value}>Sound: {item.sound}</Text>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="human-handsdown" size={18} color="#4d148c" style={styles.icon} />
                <Text style={styles.value}>Fall Status: {item.fallStatus}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    color: '#a34f9f',
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#555',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#f3e6f7',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  timestamp: {
    fontSize: 12,
    color: '#777',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  icon: {
    marginRight: 8,
  },
  value: {
    fontSize: 14,
    color: '#4d148c',
  },
});
