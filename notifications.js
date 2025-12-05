import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { FontAwesome, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const sensorRef = ref(database, '/sensor');

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const alerts = [];

        const currentTime = new Date().toLocaleString(); // local timestamp

        // Temperature alert
        if (data.temperature > 37.5) {
          alerts.push({
            type: 'Temperature',
            message: `High temperature detected: ${data.temperature.toFixed(1)}°C`,
            time: currentTime,
            icon: <FontAwesome name="thermometer-half" size={20} color="red" />,
          });
        }

        // Sound alert
        if (data.sound === 'Crying') {
          alerts.push({
            type: 'Sound',
            message: 'Baby is crying!',
            time: currentTime,
            icon: <Entypo name="sound" size={20} color="red" />,
          });
        }

        // Fall detection alert
        if (data.fallStatus === 'Detected') {
          alerts.push({
            type: 'Fall',
            message: 'Fall detected!',
            time: currentTime,
            icon: <MaterialCommunityIcons name="human-falling" size={20} color="red" />,
          });
        }

        setNotifications(alerts);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.empty}>No notifications</Text>
      ) : (
        notifications.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.row}>
              {item.icon}
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginBottom: 20,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#555',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#fce4ec',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4d148c',
  },
  time: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
});
