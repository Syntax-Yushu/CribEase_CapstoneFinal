import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

import Dashboard from './dashboard';
import History from './history';
import Notifications from './notifications';
import More from './more';

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [currentTab, setCurrentTab] = useState('Dashboard');

  // Listen to alerts from Firebase
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const interval = setInterval(() => {
      onValue(devicesRef, snapshot => {
        if (!snapshot.exists()) return;
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const sensor = devicesData[firstDeviceKey]?.sensor;
        if (!sensor) return;

        // Count active alerts
        let count = 0;
        if (sensor.temperature > 37.5 || sensor.temperature < 35.5) count++;
        if (sensor.sound === 'Crying') count++;
        if (sensor.fallStatus === 'Absent') count++;

        // Only show count if not on Notifications tab
        if (currentTab !== 'Notifications') {
          setNotificationCount(count);
          setHasUnreadNotifications(count > 0);
        } else {
          // Clear badge when user visits notifications
          setNotificationCount(0);
          setHasUnreadNotifications(false);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTab]);

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
      screenListeners={{
        state: (e) => {
          setCurrentTab(e.data.state.routes[e.data.state.index].name);
        },
      }}
    >
      {/* HOME / DASHBOARD */}
      <Tab.Screen 
        name="Dashboard" 
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
            <View>
              <Ionicons name="notifications" size={28} color={color} />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </View>
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
  badge: {
    position: 'absolute',
    right: -8,
    top: -3,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
