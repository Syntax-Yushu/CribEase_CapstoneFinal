import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

export default function PresenceDetection({ route, navigation }) {
  const { fallHistory: initialFallHistory, fallCount } = route.params || {};
  const [fallHistory, setFallHistory] = useState(initialFallHistory || []);
  const [currentPresenceStatus, setCurrentPresenceStatus] = useState('Present');

  // Listen to Firebase for real-time presence data
  useEffect(() => {
    const devicesRef = ref(database, '/devices');

    const unsubscribe = onValue(devicesRef, snapshot => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const sensor = devicesData[firstDeviceKey]?.sensor;

        if (sensor && sensor.fallStatus) {
          setCurrentPresenceStatus(sensor.fallStatus === 'Present' ? 'Present' : 'Absent');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate presence statistics
  const getPresenceStats = () => {
    if (!fallHistory || fallHistory.length === 0) {
      return {
        absenceCount: 0,
        presentCount: 0,
        lastAbsence: 'Never',
        riskLevel: 'Low',
        totalAbsenceTime: 0,
        currentStatus: 'Present'
      };
    }

    const absenceEvents = fallHistory.filter(f => f.value === 'Absent').length;
    const presentEvents = fallHistory.filter(f => f.value === 'Present').length;
    const lastAbsence = fallHistory.find(f => f.value === 'Absent')?.time || 'Never';
    
    // Calculate risk level based on frequency
    let riskLevel = 'Low';
    if (absenceEvents > 5) riskLevel = 'High';
    else if (absenceEvents > 2) riskLevel = 'Moderate';

    const currentStatus = fallHistory[0]?.value || 'Present';

    return {
      absenceCount: absenceEvents,
      presentCount: presentEvents,
      lastAbsence,
      riskLevel,
      totalAbsenceTime: absenceEvents * 5, // Estimate: 5 min per absence
      currentStatus,
    };
  };

  const getStatusColor = (value) => {
    return value === 'Absent' ? '#E53935' : '#4CAF50';
  };

  const getRiskColor = (level) => {
    if (level === 'High') return '#E53935';
    if (level === 'Moderate') return '#FF9800';
    return '#4CAF50';
  };

  const stats = getPresenceStats();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Presence Detection</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: getStatusColor(currentPresenceStatus) }]}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons 
              name={currentPresenceStatus === 'Present' ? 'baby-carriage' : 'alert-circle'} 
              size={32} 
              color={getStatusColor(currentPresenceStatus)} 
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(currentPresenceStatus) }]}>
                {currentPresenceStatus}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentPresenceStatus) }]}>
              <Text style={styles.badgeText}>Now</Text>
            </View>
          </View>
        </View>

        {/* Risk Assessment Card */}
        <View style={[styles.riskCard, { borderLeftColor: getRiskColor(stats.riskLevel) }]}>
          <View style={styles.riskHeader}>
            <MaterialCommunityIcons 
              name={stats.riskLevel === 'High' ? 'alert-octagon' : stats.riskLevel === 'Moderate' ? 'alert' : 'shield-check'} 
              size={28} 
              color={getRiskColor(stats.riskLevel)} 
            />
            <View style={styles.riskInfo}>
              <Text style={styles.riskLabel}>Risk Level</Text>
              <Text style={[styles.riskValue, { color: getRiskColor(stats.riskLevel) }]}>
                {stats.riskLevel}
              </Text>
            </View>
          </View>
          <Text style={styles.riskDescription}>
            {stats.riskLevel === 'High' ? '⚠️ Multiple absence events detected' 
            : stats.riskLevel === 'Moderate' ? '⚠️ Monitor closely' 
            : '✅ Baby is present and safe'}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Presence Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="#E53935" />
              <Text style={styles.statLabel}>Absence Events</Text>
              <Text style={styles.statValue}>{stats.absenceCount}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.statLabel}>Present</Text>
              <Text style={styles.statValue}>{stats.presentCount}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="history" size={24} color="#1976D2" />
              <Text style={styles.statLabel}>Est. Absence</Text>
              <Text style={styles.statValue}>{stats.totalAbsenceTime}m</Text>
            </View>
          </View>
        </View>

        {/* Absence Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Absence Timeline</Text>
          <View style={styles.timelineBar}>
            <View style={{ flex: stats.presentCount, backgroundColor: '#4CAF50' }} />
            <View style={{ flex: stats.absenceCount, backgroundColor: '#E53935' }} />
          </View>
          <View style={styles.timelineLabels}>
            <Text style={styles.timelineLabel}>
              {Math.round((stats.presentCount / (stats.presentCount + stats.absenceCount || 1)) * 100)}% Present
            </Text>
            <Text style={styles.timelineLabel}>
              {Math.round((stats.absenceCount / (stats.presentCount + stats.absenceCount || 1)) * 100)}% Absent
            </Text>
          </View>
        </View>

        {/* Last Absence */}
        {stats.lastAbsence !== 'Never' && (
          <View style={styles.lastEventCard}>
            <MaterialCommunityIcons name="clock-alert" size={24} color="#FF9800" />
            <View style={styles.lastEventInfo}>
              <Text style={styles.lastEventLabel}>Last Absence Detected</Text>
              <Text style={styles.lastEventValue}>{stats.lastAbsence}</Text>
            </View>
          </View>
        )}

        {/* Safety Tips */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>🛡️ Safety Recommendations</Text>
          <Text style={styles.safetyText}>• Regularly check on baby presence</Text>
          <Text style={styles.safetyText}>• Ensure crib monitor is functioning properly</Text>
          <Text style={styles.safetyText}>• Set up alerts for unexpected absences</Text>
          <Text style={styles.safetyText}>• Keep device clean and properly positioned</Text>
          <Text style={styles.safetyText}>• Test detection system weekly</Text>
        </View>

        {/* Absence Events */}
        <Text style={styles.eventTitle}>Presence Events</Text>
        {fallHistory && fallHistory.length > 0 ? (
          fallHistory.map((record, index) => (
            <View key={index} style={[styles.eventCard, { borderLeftColor: getStatusColor(record.value) }]}>
              <View style={styles.eventLeft}>
                <MaterialCommunityIcons 
                  name={record.value === 'Present' ? 'baby-carriage' : 'alert-circle'} 
                  size={20} 
                  color={getStatusColor(record.value)}
                  style={styles.eventIcon}
                />
                <View>
                  <Text style={styles.eventLabel}>Status: {record.value}</Text>
                  <Text style={styles.eventTime}>{record.time}</Text>
                </View>
              </View>
              {record.value === 'Absent' && (
                <MaterialCommunityIcons name="exclamation" size={18} color="#E53935" />
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No presence events recorded</Text>
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
  riskCard: {
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
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskInfo: {
    marginLeft: 12,
  },
  riskLabel: {
    fontSize: 12,
    color: '#999',
  },
  riskValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  riskDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
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
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timelineBar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  lastEventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  lastEventInfo: {
    marginLeft: 12,
    flex: 1,
  },
  lastEventLabel: {
    fontSize: 12,
    color: '#999',
  },
  lastEventValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 2,
  },
  safetyCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginBottom: 15,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  safetyText: {
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
