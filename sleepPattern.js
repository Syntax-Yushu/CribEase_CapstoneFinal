import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { database } from './firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';

export default function SleepPattern() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const sensorRef = ref(database, '/sensor/sleep'); // adjust path to your sleep data
    const last20Query = query(sensorRef, limitToLast(20));

    const unsubscribe = onValue(last20Query, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        })).reverse(); // reverse to show latest first
        setEntries(formatted);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
    {/* Back Arrow */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>
      <Text style={styles.title}>Sleep Pattern</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.label}>Status: {entry.status}</Text>
            <Text style={styles.time}>Time: {entry.time}</Text>
          </View>
        ))}
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
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#f3e6f7',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#4d148c',
    marginBottom: 5,
  },
  time: {
    fontSize: 14,
    color: '#555',
  },
});
