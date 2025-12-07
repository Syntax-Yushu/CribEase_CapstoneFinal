import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BabyStatus({ route, navigation }) {
  // Receive filtered history from Dashboard
  const { soundHistory } = route.params;

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Baby Status</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {soundHistory.length === 0 ? (
          <Text style={styles.noData}>No crying events recorded</Text>
        ) : (
          soundHistory.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.label}>Status: {item.value}</Text>
              <Text style={styles.time}>Time: {item.time}</Text>
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
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginTop: 100,
    marginBottom: 40,
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
  noData: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
  },
});
