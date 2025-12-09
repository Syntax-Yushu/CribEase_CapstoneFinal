import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Dashboard from './dashboard';
import History from './history';
import Notifications from './notifications';
import More from './more';

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 100,
          backgroundColor: '#fff',
        },
        tabBarActiveTintColor: '#a34f9f',
        tabBarInactiveTintColor: '#888',
      }}
    >
      {/* HOME / DASHBOARD */}
      <Tab.Screen 
        name="Home" 
        component={Dashboard} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
      />

      {/* HISTORY */}
      <Tab.Screen 
        name="History" 
        component={History} 
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="time" size={28} color={color} />
          ),
        }}
      />

      {/* PLUS BUTTON (CUSTOM BUTTON) */}
      {/* <Tab.Screen
        name="Add"
        component={Dashboard} 
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <TouchableOpacity style={styles.plusButton}>
              <Ionicons name="add" size={35} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      /> */}

      {/* NOTIFICATIONS */}
      <Tab.Screen 
        name="Notifications" 
        component={Notifications} 
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications" size={28} color={color} />
          ),
        }}
      />

      {/* MORE */}
      <Tab.Screen 
        name="More" 
        component={More} 
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="menu" size={30} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#a34f9f',
    justifyContent: 'center',
    alignItems: 'center',
    top: -10,
    elevation: 5,
  },
});
