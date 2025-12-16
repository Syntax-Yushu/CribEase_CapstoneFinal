import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

export default function SleepPattern({ route, navigation }) {
  const { sleepHistory: initialSleepHistory } = route.params || {};
  const [sleepHistory, setSleepHistory] = useState(initialSleepHistory || []);
  const [currentSleepStatus, setCurrentSleepStatus] = useState('Awake');

  // Listen to Firebase for real-time sleep data
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, snapshot => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const sensor = devicesData[firstDeviceKey]?.sensor;

        if (sensor && sensor.sleepPattern) {
          setCurrentSleepStatus(sensor.sleepPattern);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate sleep statistics
  const getSleepStats = () => {
    if (!sleepHistory || sleepHistory.length === 0) {
      return {
        totalEvents: 0,
        avgDuration: 0,
        lastSleep: 'Never',
        currentStatus: 'Awake',
        deepSleepCount: 0,
        lightSleepCount: 0
      };
    }

    const deepSleep = sleepHistory.filter(s => s.value === 'Deep Sleep').length;
    const lightSleep = sleepHistory.filter(s => s.value === 'Light Sleep').length;
    const awake = sleepHistory.filter(s => s.value === 'Awake').length;

    // Estimate duration (simplified - assuming each event is ~2 hours)
    const avgDuration = deepSleep > 0 ? Math.round((deepSleep * 2.5)) : 0;
    const lastSleep = sleepHistory.length > 0 
      ? sleepHistory.find(s => s.value !== 'Awake')?.time || 'N/A'
      : 'Never';

    const currentStatus = sleepHistory[0]?.value || 'Awake';

    return {
      totalEvents: sleepHistory.length,
      avgDuration,
      lastSleep,
      currentStatus,
      deepSleepCount: deepSleep,
      lightSleepCount: lightSleep,
      awakeCount: awake,
    };
  };

  const getSleepQuality = (stats) => {
    const sleepEvents = stats.deepSleepCount + stats.lightSleepCount;
    if (sleepEvents === 0) return 'No Data';
    
    const qualityScore = (stats.deepSleepCount / (stats.deepSleepCount + stats.lightSleepCount)) * 100;
    
    if (qualityScore >= 60) return 'Excellent';
    if (qualityScore >= 40) return 'Good';
    if (qualityScore >= 20) return 'Fair';
    return 'Poor';
  };

  const getStatusColor = (value) => {
    if (value === 'Deep Sleep') return '#1976D2';
    if (value === 'Light Sleep') return '#64B5F6';
    return '#FF9800';
  };

  const stats = getSleepStats();
  const quality = getSleepQuality(stats);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Sleep Pattern</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Sleep Status */}
        <View style={[styles.statusCard, { borderLeftColor: getStatusColor(currentSleepStatus) }]}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons 
              name={currentSleepStatus === 'Deep Sleep' ? 'sleep' : currentSleepStatus === 'Light Sleep' ? 'moon-waning-gibbous' : 'eye-open'} 
              size={32} 
              color={getStatusColor(currentSleepStatus)} 
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(currentSleepStatus) }]}>
                {currentSleepStatus}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentSleepStatus) }]}>
              <Text style={styles.badgeText}>Now</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Sleep Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="sleep" size={24} color="#1976D2" />
              <Text style={styles.statLabel}>Deep Sleep</Text>
              <Text style={styles.statValue}>{stats.deepSleepCount}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="moon-waning-gibbous" size={24} color="#64B5F6" />
              <Text style={styles.statLabel}>Light Sleep</Text>
              <Text style={styles.statValue}>{stats.lightSleepCount}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="eye-open" size={24} color="#FF9800" />
              <Text style={styles.statLabel}>Awake</Text>
              <Text style={styles.statValue}>{stats.awakeCount || 0}</Text>
            </View>
          </View>
        </View>

        {/* Sleep Quality */}
        <View style={styles.qualityCard}>
          <View style={styles.qualityHeader}>
            <Text style={styles.qualityTitle}>Sleep Quality</Text>
            <Text style={[styles.qualityValue, { 
              color: quality === 'Excellent' ? '#4CAF50' : quality === 'Good' ? '#8BC34A' : quality === 'Fair' ? '#FF9800' : '#E53935'
            }]}>
              {quality}
            </Text>
          </View>
          <View style={styles.qualityBar}>
            <View 
              style={[
                styles.qualityFill,
                {
                  width: `${(stats.deepSleepCount / (stats.deepSleepCount + stats.lightSleepCount || 1)) * 100}%`,
                  backgroundColor: quality === 'Excellent' ? '#4CAF50' : quality === 'Good' ? '#8BC34A' : quality === 'Fair' ? '#FF9800' : '#E53935'
                }
              ]}
            />
          </View>
          <Text style={styles.qualityLabel}>
            {quality === 'No Data' ? 'Collect more sleep data' : `${stats.deepSleepCount} deep sleep sessions detected`}
          </Text>
        </View>

        {/* Avg Duration */}
        <View style={styles.durationCard}>
          <MaterialCommunityIcons name="history" size={24} color="#a34f9f" />
          <View style={styles.durationInfo}>
            <Text style={styles.durationLabel}>Average Sleep Duration</Text>
            <Text style={styles.durationValue}>{stats.avgDuration}+ hrs</Text>
          </View>
        </View>

        {/* 24-Hour Timeline */}
        <Text style={styles.timelineTitle}>Sleep Timeline</Text>
        <View style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineLabel}>Last 24 Hours</Text>
            <Text style={styles.timelineHours}>0h - 24h</Text>
          </View>
          <View style={styles.timeline}>
            {[...Array(12)].map((_, i) => (
              <View key={i} style={styles.timelineBlock}>
                <View style={[
                  styles.block,
                  {
                    backgroundColor: i % 3 === 0 ? '#1976D2' : i % 2 === 0 ? '#64B5F6' : '#E8F4FD'
                  }
                ]} />
              </View>
            ))}
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#1976D2' }]} />
              <Text style={styles.legendText}>Deep Sleep</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#64B5F6' }]} />
              <Text style={styles.legendText}>Light Sleep</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#E8F4FD' }]} />
              <Text style={styles.legendText}>Awake</Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>📋 Age-Based Recommendations</Text>
          <Text style={styles.recommendationText}>• Newborns (0-3 months): 16-17 hours per day</Text>
          <Text style={styles.recommendationText}>• Infants (3-6 months): 14-15 hours per day</Text>
          <Text style={styles.recommendationText}>• Babies (6-12 months): 12-14 hours per day</Text>
          <Text style={styles.recommendationText}>• Promote consistent sleep schedule</Text>
          <Text style={styles.recommendationText}>• Create dark, quiet sleep environment</Text>
        </View>

        {/* Sleep Events */}
        <Text style={styles.eventTitle}>Sleep Events</Text>
        {sleepHistory && sleepHistory.length > 0 ? (
          sleepHistory.map((record, index) => (
            <View key={index} style={[styles.eventCard, { borderLeftColor: getStatusColor(record.value) }]}>
              <View style={styles.eventLeft}>
                <MaterialCommunityIcons 
                  name={record.value === 'Deep Sleep' ? 'sleep' : record.value === 'Light Sleep' ? 'moon-waning-gibbous' : 'eye-open'} 
                  size={20} 
                  color={getStatusColor(record.value)}
                  style={styles.eventIcon}
                />
                <View>
                  <Text style={styles.eventLabel}>{record.value}</Text>
                  <Text style={styles.eventTime}>{record.time}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No sleep pattern records yet</Text>
        )}
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
  qualityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  qualityValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  qualityBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  qualityFill: {
    height: '100%',
    borderRadius: 5,
  },
  qualityLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  durationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    color: '#999',
  },
  durationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginTop: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  timelineHours: {
    fontSize: 10,
    color: '#999',
  },
  timeline: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 2,
  },
  timelineBlock: {
    flex: 1,
  },
  block: {
    height: 40,
    borderRadius: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  recommendationCard: {
    backgroundColor: '#F3E5AB',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
    marginBottom: 15,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F57F17',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
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
    borderLeftWidth: 4,
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
});
