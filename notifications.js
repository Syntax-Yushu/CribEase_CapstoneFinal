import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';

export default function Notifications() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const statusRef = ref(database, 'Crib/status');
    const tempRef = ref(database, 'Crib/environment/temperature');
    const fallRef = ref(database, 'Crib/fallCount');

    let lastFallCount = 0;

    // LISTEN FOR FALL & ABSENT STATUS
    onValue(statusRef, (snapshot) => {
      const status = snapshot.val();

      if (status === "Absent") {
        addAlert("Baby is absent from crib!", "high");
      }

      if (status === "Fall Detected") {
        addAlert("Fall detected! Immediate attention required!", "critical");
      }
    });

    // LISTEN FOR TEMPERATURE CHANGES
    onValue(tempRef, (snapshot) => {
      const temp = snapshot.val();

      if (temp === null) return;

      if (temp > 37.5) {
        addAlert(`High Temperature: ${temp}°C`, "high");
      } else if (temp < 35.5) {
        addAlert(`Low Temperature: ${temp}°C`, "low");
      }
    });

    // LISTEN FOR FALL COUNT INCREASE
    onValue(fallRef, (snapshot) => {
      const fallCount = snapshot.val() || 0;

      if (fallCount > lastFallCount) {
        addAlert("Possible fall movement detected!", "medium");
      }
      lastFallCount = fallCount;
    });

  }, []);

  // ADD ALERT FUNCTION
  const addAlert = (msg, level) => {
    const timestamp = new Date().toLocaleString();

    const newAlert = {
      id: Date.now().toString(),
      message: msg,
      level: level,
      time: timestamp,
    };

    setAlerts((prev) => [newAlert, ...prev]); // newest on top
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      <ScrollView style={styles.scrollArea}>
        {alerts.length === 0 && (
          <Text style={styles.noAlert}>No alerts yet.</Text>
        )}

        {alerts.map((alert) => (
          <View key={alert.id} style={styles.alertItem}>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <Text style={styles.alertTime}>{alert.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginBottom: 15,
    marginTop: 30,
    textAlign: 'center',
  },
  scrollArea: {
    marginTop: 10,
  },
  noAlert: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  alertItem: {
    backgroundColor: '#f2e4f5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 6,
    borderLeftColor: '#a34f9f',
  },
  alertMessage: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 13,
    color: '#555',
    marginTop: 5,
  },
});

