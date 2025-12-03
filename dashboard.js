import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

export default function Dashboard() {
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    sound: 'Quiet',
    distance: 0,
    fallStatus: 'Absent',
    fallCount: 0, 
  });

  useEffect(() => {
    const sensorRef = ref(database, '/sensor');

    // Listen for real-time updates
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);
const tempIsBad = data.temperature > 37.5;
    const soundIsBad = data.sound === 'Crying';
    const fallIsBad = data.fallStatus === 'Absent';
  return (
    <View style={styles.container}>
      {/* FIXED TITLE */}
      <Text style={styles.title}>CribEase Dashboard</Text>

      {/* SCROLLABLE CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.label}>Baby Temperature</Text>
          <Text style={[styles.value, tempIsBad && styles.red]}>
            {data.temperature.toFixed(1)}°C
          </Text>
        </View>

        {/* <View style={styles.card}>
          <Text style={styles.label}>Humidity</Text>
          <Text style={styles.value}>{data.humidity.toFixed(1)}%</Text>
        </View> */}

        <View style={styles.card}>
          <Text style={styles.label}>Environmental Log</Text>
          <Text style={[styles.value, soundIsBad && styles.red]}>
            {data.sound}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Fall Detection</Text>
          <Text style={[styles.value, fallIsBad && styles.red]}>
            {data.fallStatus}
          </Text>
        </View>

        {/* <View style={styles.card}>
          <Text style={styles.label}>Distance</Text>
          <Text style={styles.value}>{data.distance.toFixed(1)} cm</Text>
        </View> */}

        <View style={styles.card}>
          <Text style={styles.label}>Fall Count</Text>
          <Text style={styles.value}>{data.fallCount}</Text>
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
  red: {
  color: 'red',
},

});
