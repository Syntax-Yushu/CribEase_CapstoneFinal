import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AIAnalytics from './aiAnalytics';

export default function AIInsights({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState(null);
  const [sleepData, setSleepData] = useState(null);
  const [healthReport, setHealthReport] = useState(null);
  const [activeTab, setActiveTab] = useState('anomalies');

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      setLoading(true);
      
      // Load all AI insights
      const anomalyData = await AIAnalytics.detectAnomalies({
        temperature: 36.8,
        sound: 'quiet',
        heartRate: 120,
        movement: 'active',
      });
      
      const sleepInsights = await AIAnalytics.predictSleepTime();
      const health = await AIAnalytics.generateHealthReport();

      setAnomalies(anomalyData);
      setSleepData(sleepInsights);
      setHealthReport(health);
    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#999';
    }
  };

  const renderAnomalies = () => {
    if (!anomalies) return <Text style={styles.emptyText}>No data available</Text>;

    return (
      <View>
        <View style={[styles.riskCard, { borderLeftColor: anomalies.riskLevel === 'high' ? '#ff4444' : anomalies.riskLevel === 'medium' ? '#ff9800' : '#4caf50' }]}>
          <View style={styles.riskHeader}>
            <Ionicons 
              name={anomalies.riskLevel === 'high' ? 'alert-circle' : anomalies.riskLevel === 'medium' ? 'warning' : 'checkmark-circle'} 
              size={28} 
              color={anomalies.riskLevel === 'high' ? '#ff4444' : anomalies.riskLevel === 'medium' ? '#ff9800' : '#4caf50'}
            />
            <Text style={styles.riskLevel}>
              Risk Level: <Text style={{ fontWeight: '800', textTransform: 'uppercase' }}>{anomalies.riskLevel}</Text>
            </Text>
          </View>
        </View>

        {anomalies.anomalies.length === 0 ? (
          <View style={styles.card}>
            <Ionicons name="checkmark-circle" size={40} color="#4caf50" />
            <Text style={styles.successText}>Everything looks great!</Text>
            <Text style={styles.descText}>Baby's vitals are within normal range</Text>
          </View>
        ) : (
          anomalies.anomalies.map((anomaly, index) => (
            <View key={index} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: getSeverityColor(anomaly.severity) }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="alert" size={24} color={getSeverityColor(anomaly.severity)} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}</Text>
                  <Text style={styles.cardMessage}>{anomaly.message}</Text>
                </View>
              </View>
              <View style={styles.recommendationBox}>
                <Ionicons name="bulb" size={18} color="#a34f9f" />
                <Text style={styles.recommendationText}>{anomaly.recommendation}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderSleepInsights = () => {
    if (!sleepData) return <Text style={styles.emptyText}>No sleep data available</Text>;

    return (
      <View>
        <View style={styles.card}>
          <View style={styles.sleepHeader}>
            <Ionicons name="moon" size={32} color="#a34f9f" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Sleep Quality</Text>
              <Text style={[styles.qualityBadge, { 
                color: sleepData.quality === 'excellent' ? '#4caf50' : 
                       sleepData.quality === 'good' ? '#8bc34a' : 
                       sleepData.quality === 'fair' ? '#ff9800' : '#ff4444'
              }]}>
                {sleepData.quality?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sleep Schedule</Text>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#a34f9f" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Average Sleep Time</Text>
              <Text style={styles.infoValue}>{sleepData.predictedSleepTime || '--'}:00</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="hourglass" size={20} color="#a34f9f" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Average Duration</Text>
              <Text style={styles.infoValue}>{sleepData.averageDuration || '--'} hours</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="bed" size={20} color="#a34f9f" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Next Expected Sleep</Text>
              <Text style={styles.infoValue}>
                {sleepData.nextExpectedSleep ? new Date(sleepData.nextExpectedSleep).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'}
              </Text>
            </View>
          </View>
        </View>

        {sleepData.insights && sleepData.insights.map((insight, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb" size={24} color="#a34f9f" />
              <Text style={[styles.cardTitle, { marginLeft: 12 }]}>{insight.type.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
            <Text style={styles.cardMessage}>{insight.message}</Text>
            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationText}>{insight.action}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderHealthReport = () => {
    if (!healthReport) return <Text style={styles.emptyText}>No health data available</Text>;

    return (
      <View>
        <View style={[styles.card, { backgroundColor: healthReport.overallHealth === 'healthy' ? '#f0f7f0' : '#fff3f0' }]}>
          <View style={styles.healthHeader}>
            <Ionicons 
              name={healthReport.overallHealth === 'healthy' ? 'heart' : 'alert-circle'} 
              size={32} 
              color={healthReport.overallHealth === 'healthy' ? '#4caf50' : '#ff9800'}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Overall Health</Text>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '700',
                color: healthReport.overallHealth === 'healthy' ? '#4caf50' : '#ff9800'
              }}>
                {healthReport.overallHealth.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Temperature Analysis</Text>
          <View style={styles.infoRow}>
            <Ionicons name="thermometer" size={20} color="#a34f9f" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Average Temperature</Text>
              <Text style={styles.infoValue}>{healthReport.temperature.avgTemp || '--'}°C</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="trending-up" size={20} color="#a34f9f" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Trend</Text>
              <Text style={styles.infoValue}>{healthReport.temperature.trend}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sleep Analysis</Text>
          <View style={styles.infoRow}>
            <Ionicons name="moon" size={20} color="#a34f9f" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Average Duration</Text>
              <Text style={styles.infoValue}>{healthReport.sleep.avgDuration || '--'} hours</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="repeat" size={20} color="#a34f9f" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Naps per Day</Text>
              <Text style={styles.infoValue}>{healthReport.sleep.napsPerDay || '--'}</Text>
            </View>
          </View>
        </View>

        {healthReport.recommendations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {healthReport.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationBox}>
                <Ionicons name="checkmark-circle" size={18} color="#a34f9f" />
                <Text style={[styles.recommendationText, { marginLeft: 10 }]}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#a34f9f" />
        <Text style={{ marginTop: 16, color: '#999' }}>Loading AI insights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>AI Insights</Text>
      <Text style={styles.subtitle}>Smart Analysis of Baby's Health</Text>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'anomalies' && styles.activeTab]}
          onPress={() => setActiveTab('anomalies')}
        >
          <Ionicons name="alert-circle" size={18} color={activeTab === 'anomalies' ? '#a34f9f' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'anomalies' && styles.activeTabText]}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sleep' && styles.activeTab]}
          onPress={() => setActiveTab('sleep')}
        >
          <Ionicons name="moon" size={18} color={activeTab === 'sleep' ? '#a34f9f' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'sleep' && styles.activeTabText]}>Sleep</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'health' && styles.activeTab]}
          onPress={() => setActiveTab('health')}
        >
          <Ionicons name="heart" size={18} color={activeTab === 'health' ? '#a34f9f' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'health' && styles.activeTabText]}>Health</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {activeTab === 'anomalies' && renderAnomalies()}
        {activeTab === 'sleep' && renderSleepInsights()}
        {activeTab === 'health' && renderHealthReport()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
     fontSize: 26,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f0e6f5',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#a34f9f',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  recommendationBox: {
    backgroundColor: '#f5f0f8',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  sleepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
    marginTop: 12,
    textAlign: 'center',
  },
  descText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});
