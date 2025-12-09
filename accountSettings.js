import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AccountSettings({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Back Arrow */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Account Settings</Text>

      {/* OPTION BUTTONS */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="person-circle-outline" size={28} color="#a34f9f" style={styles.icon} />
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons name="mail-outline" size={28} color="#a34f9f" style={styles.icon} />
          <Text style={styles.optionText}>Change Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Ionicons name="key-outline" size={28} color="#a34f9f" style={styles.icon} />
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>

        {/* DO NOT REMOVE — RESERVED for your gender logic later */}
        {/* <TouchableOpacity style={styles.option}>
          <Ionicons name="female-outline" size={28} color="#a34f9f" style={styles.icon} />
          <Text style={styles.optionText}>Gender (Coming Soon)</Text>
        </TouchableOpacity> */}
      </View>

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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a34f9f',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 30,
  },

  section: {
    marginTop: 20,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e6f7',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
  },

  icon: {
    marginRight: 15,
  },

  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4d148c',
  },
});
