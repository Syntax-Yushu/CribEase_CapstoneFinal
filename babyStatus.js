import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

export default function BabyStatus({ route, navigation }) {
  const { soundHistory: initialSoundHistory } = route.params || {};
  const [soundHistory, setSoundHistory] = useState(initialSoundHistory || []);
  const [currentSound, setCurrentSound] = useState('Quiet');

  // Listen to Firebase for real-time sound data
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, snapshot => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const sensor = devicesData[firstDeviceKey]?.sensor;

        if (sensor && sensor.sound) {
          setCurrentSound(sensor.sound);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate statistics
  const getStats = () => {
    if (!soundHistory || soundHistory.length === 0) {
      return { cryCount: 0, lastCry: 'Never', percentage: 0 };
    }

    const cryCount = soundHistory.length;
    const lastCry = soundHistory.length > 0 ? soundHistory[0].time : 'Never';
    const percentage = Math.min((cryCount / 10) * 100, 100); // percentage based on 10 events

    return { cryCount, lastCry, percentage };
  };

  const getStatusColor = (value) => {
    if (value === 'Crying') return '#E53935';
    return '#4CAF50';
  };

  const stats = getStats();

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
        {/* Current Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: getStatusColor(currentSound) }]}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons 
              name={currentSound === 'Crying' ? 'baby-crying' : 'check-circle'} 
              size={32} 
              color={getStatusColor(currentSound)} 
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(currentSound) }]}>
                {currentSound}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentSound) }]}>
              <Text style={styles.badgeText}>Now</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Quick Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="baby-crying" size={24} color="#E53935" />
              <Text style={styles.statLabel}>Cry Events</Text>
              <Text style={styles.statValue}>{stats.cryCount}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#1976D2" />
              <Text style={styles.statLabel}>Last Cry</Text>
              <Text style={styles.statValue}>{stats.lastCry === 'Never' ? 'Never' : 'Recent'}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="chart-pie" size={24} color="#a34f9f" />
              <Text style={styles.statLabel}>Frequency</Text>
              <Text style={styles.statValue}>{Math.round(stats.percentage)}%</Text>
            </View>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Crying Activity</Text>
          <View style={styles.activityBar}>
            <View 
              style={[
                styles.activityFill, 
                { 
                  width: `${stats.percentage}%`,
                  backgroundColor: stats.percentage > 50 ? '#E53935' : '#FF9800'
                }
              ]} 
            />
          </View>
          <Text style={styles.activityLabel}>
            {stats.percentage > 50 ? '🔴 High Activity' : stats.percentage > 20 ? '🟡 Moderate' : '🟢 Low Activity'}
          </Text>
        </View>

        {/* Crying Events */}
        <Text style={styles.eventTitle}>Crying Events</Text>
        {soundHistory && soundHistory.length > 0 ? (
          soundHistory.map((item, index) => (
            <View key={index} style={styles.eventCard}>
              <View style={styles.eventLeft}>
                <MaterialCommunityIcons 
                  name="baby-crying" 
                  size={20} 
                  color="#E53935" 
                  style={styles.eventIcon}
                />
                <View>
                  <Text style={styles.eventLabel}>Status: {item.value}</Text>
                  <Text style={styles.eventTime}>{item.time}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No crying events recorded</Text>
        )}

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Baby Care Tips</Text>
          <Text style={styles.tipsText}>• Babies cry to communicate - check for hunger, discomfort, or sleep needs</Text>
          <Text style={styles.tipsText}>• Average newborns cry 2-3 hours per day</Text>
          <Text style={styles.tipsText}>• Track patterns to identify triggers</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    marginBottom: 15,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  activityBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  activityFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventIcon: {
    marginRight: 12,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  eventTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 14,
  },
  tipsCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
    marginTop: 10,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
