import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FallDetection({ route, navigation }) {
  const { fallHistory, fallCount } = route.params;

  return (
    <View style={styles.container}>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Presence Detection</Text>

      <Text style={styles.countLabel}>Total Absent: {fallCount}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {fallHistory && fallHistory.length > 0 ? (
          fallHistory.map((record, index) => (
            <View key={index} style={styles.recordRow}>

              {/* Value with red color when Absent */}
              <Text
                style={[
                  styles.value,
                  record.value === "Absent" && styles.red
                ]}
              >
                {record.value}
              </Text>

              <Text style={styles.time}>{record.time}</Text>
            </View>
          ))
        ) : (
          <Text>No fall records yet.</Text>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginBottom: 10,
    textAlign: 'center',
  },
  countLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4d148c',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3e6f7',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4d148c',
  },
  red: {
    color: 'red',
  },
  time: {
    fontSize: 16,
    color: '#555',
  },
});
