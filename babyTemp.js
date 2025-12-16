import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

export default function BabyTemp({ route, navigation }) {
  const { temperatureHistory: initialTemperatureHistory } = route.params || {};
  const [temperatureHistory, setTemperatureHistory] = useState(initialTemperatureHistory || []);
  const [currentTemp, setCurrentTemp] = useState(0);
  const [timeFilter, setTimeFilter] = useState('all'); // all, day, week

  // Listen to Firebase for real-time temperature data
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, snapshot => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const sensor = devicesData[firstDeviceKey]?.sensor;

        if (sensor && sensor.temperature) {
          setCurrentTemp(sensor.temperature);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate statistics
  const getStats = () => {
    if (!temperatureHistory || temperatureHistory.length === 0) {
      return { current: currentTemp.toFixed(1), avg: 0, min: 0, max: 0, status: 'Unknown' };
    }

    const temps = temperatureHistory.map(t => typeof t.value === 'number' ? t.value : parseFloat(t.value));
    const current = currentTemp || (temps[0] || 0);
    const avg = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const min = Math.min(...temps).toFixed(1);
    const max = Math.max(...temps).toFixed(1);

    let status = 'Normal';
    if (current > 37.5) status = 'High';
    else if (current < 36) status = 'Low';

    return { current: current.toFixed(1), avg, min, max, status };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'High':
        return '#E53935';
      case 'Low':
        return '#1976D2';
      default:
        return '#4CAF50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'High':
        return 'temperature-celsius';
      case 'Low':
        return 'snowflake';
      default:
        return 'check-circle';
    }
  };

  const stats = getStats();

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
        {/* Current Temperature Card */}
        {temperatureHistory && temperatureHistory.length > 0 && (
          <View style={[styles.currentCard, { borderLeftColor: getStatusColor(stats.status) }]}>
            <View style={styles.currentHeader}>
              <MaterialCommunityIcons 
                name={getStatusIcon(stats.status)} 
                size={32} 
                color={getStatusColor(stats.status)} 
              />
              <View style={styles.currentInfo}>
                <Text style={styles.currentLabel}>Current Temperature</Text>
                <Text style={[styles.currentValue, { color: getStatusColor(stats.status) }]}>
                  {stats.current}°C
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stats.status) }]}>
                <Text style={styles.statusText}>{stats.status}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Safe Range Info */}
        <View style={styles.safeRangeCard}>
          <Text style={styles.safeRangeTitle}>Safe Temperature Range</Text>
          <View style={styles.rangeContainer}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Low</Text>
              <Text style={styles.rangeValue}>36°C</Text>
            </View>
            <View style={[styles.rangeItem, styles.normal]}>
              <Text style={styles.rangeLabel}>Normal</Text>
              <Text style={styles.rangeValue}>36-37.5°C</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>High</Text>
              <Text style={styles.rangeValue}>37.5°C+</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{stats.avg}°C</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Minimum</Text>
              <Text style={styles.statValue}>{stats.min}°C</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Maximum</Text>
              <Text style={styles.statValue}>{stats.max}°C</Text>
            </View>
          </View>
        </View>

        {/* Alert Thresholds */}
        <View style={styles.thresholdCard}>
          <Text style={styles.thresholdTitle}>Alert Thresholds</Text>
          <View style={styles.thresholdItem}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#E53935" />
            <Text style={styles.thresholdText}>High Alert: Above 37.5°C</Text>
          </View>
          <View style={styles.thresholdItem}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#1976D2" />
            <Text style={styles.thresholdText}>Low Alert: Below 36°C</Text>
          </View>
        </View>

        {/* History */}
        <Text style={styles.historyTitle}>Temperature History</Text>
        {temperatureHistory && temperatureHistory.length > 0 ? (
          temperatureHistory.map((record, index) => (
            <View key={index} style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordValue}>{record.value.toFixed(1)}°C</Text>
                <Text style={styles.recordTime}>{record.time}</Text>
              </View>
              <View style={[styles.recordIndicator, { backgroundColor: getStatusColor(
                typeof record.value === 'number' 
                  ? record.value > 37.5 ? 'High' : record.value < 36 ? 'Low' : 'Normal'
                  : 'Normal'
              )}]} />
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
  currentCard: {
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
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currentLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  safeRangeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
  },
  safeRangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rangeItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#E53935',
  },
  normal: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  rangeLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
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
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a34f9f',
  },
  thresholdCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  thresholdTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  thresholdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 8,
  },
  thresholdText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  recordCard: {
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
  recordLeft: {
    flex: 1,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recordTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  recordIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginLeft: 12,
  },
  noRecord: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 14,
  },
});
