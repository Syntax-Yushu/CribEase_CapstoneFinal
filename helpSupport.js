import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpSupport({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Help & Support</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Common Issues</Text>
          <Text style={styles.cardText}>• Device not connecting</Text>
          <Text style={styles.cardText}>• Data not updating</Text>
          <Text style={styles.cardText}>• Notifications not appearing</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Troubleshooting</Text>
          <Text style={styles.cardText}>1. Restart the device</Text>
          <Text style={styles.cardText}>2. Check WiFi connectivity</Text>
          <Text style={styles.cardText}>3. Ensure the ESP32 is powered</Text>
          <Text style={styles.cardText}>4. Re-add the device if needed</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Support</Text>
          <Text style={styles.cardText}>
            For technical concerns, message us at:
          </Text>
          <Text style={[styles.cardText, styles.email]}>
            support@cribease.com
          </Text>
        </View>
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
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#f3e6f7',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4d148c',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  email: {
    marginTop: 5,
    fontWeight: 'bold',
    color: '#a34f9f',
  },
});
