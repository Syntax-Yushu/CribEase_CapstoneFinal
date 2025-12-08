import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsPrivacy({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Settings & Privacy</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy Controls</Text>
          <Text style={styles.cardText}>• Manage your personal data</Text>
          <Text style={styles.cardText}>• Control device access</Text>
          <Text style={styles.cardText}>• App permissions overview</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security Options</Text>
          <Text style={styles.cardText}>• Change your password</Text>
          <Text style={styles.cardText}>• Enable 2-step verification</Text>
          <Text style={styles.cardText}>• Manage login sessions</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Settings</Text>
          <Text style={styles.cardText}>• Notification preferences</Text>
          <Text style={styles.cardText}>• Theme/appearance settings</Text>
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
});
