import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FallDetection({ route, navigation }) {
  const { fallHistory } = route.params;

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Fall Detection</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {fallHistory && fallHistory.length > 0 ? (
          fallHistory.map((record, index) => (
            <View key={index} style={styles.recordRow}>
              <Text style={styles.value}>{record.value}</Text>
              <Text style={styles.time}>{record.time}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noRecord}>No fall detection records yet.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 70, paddingHorizontal: 20 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#a34f9f', marginTop: 30, marginBottom: 20, textAlign: 'center' },
  scrollContent: { paddingBottom: 20 },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f3e6f7', padding: 15, borderRadius: 10, marginBottom: 10 },
  value: { fontSize: 20, fontWeight: 'bold', color: '#4d148c' },
  time: { fontSize: 16, color: '#555' },
  noRecord: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
  },
});
