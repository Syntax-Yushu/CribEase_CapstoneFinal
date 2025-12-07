import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BabyTemp({ route, navigation }) {
  const { temperatureHistory } = route.params;

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Baby Temperature</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {temperatureHistory && temperatureHistory.length > 0 ? (
          temperatureHistory.map((record, index) => (
            <View key={index} style={styles.recordCard}>
              <Text style={styles.recordValue}>{record.value.toFixed(1)}°C</Text>
              <Text style={styles.recordTime}>{record.time}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noRecord}>No temperature records yet.</Text>
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
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3e6f7',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  recordValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4d148c',
  },
  recordTime: {
    fontSize: 16,
    color: '#555',
  },
  noRecord: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
  },
});
