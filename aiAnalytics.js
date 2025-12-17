// AI Analytics Service for CribEase
// Provides intelligent insights about baby's health, sleep, and behavior

import AsyncStorage from '@react-native-async-storage/async-storage';

class AIAnalytics {
  constructor() {
    this.dataBuffer = [];
    this.patterns = {
      avgTemperature: 36.5,
      avgHeartRate: 120,
      sleepHours: 16,
      normalCryingFrequency: 0,
      activityLevel: 'moderate',
    };
  }

  // ==========================================
  // 1. ANOMALY DETECTION
  // ==========================================
  
  /**
   * Detects unusual patterns that deviate from normal
   * Returns risk level: 'low', 'medium', 'high'
   */
  async detectAnomalies(sensorData) {
    const { temperature, sound, heartRate, movement } = sensorData;
    const anomalies = [];

    // Temperature anomaly detection
    if (temperature > this.patterns.avgTemperature + 2) {
      anomalies.push({
        type: 'temperature',
        severity: 'high',
        message: `High temperature: ${temperature}°C (Normal: ${this.patterns.avgTemperature}°C)`,
        recommendation: 'Check if baby has fever. Contact doctor if > 38.5°C',
      });
    }

    if (temperature < this.patterns.avgTemperature - 1.5) {
      anomalies.push({
        type: 'temperature',
        severity: 'medium',
        message: `Low temperature: ${temperature}°C`,
        recommendation: 'Ensure baby is warm. Check if blankets are sufficient.',
      });
    }

    // Sound/Crying analysis
    if (sound === 'Crying') {
      // Check if crying is abnormal (duration or frequency)
      const cryingAnomalies = await this.analyzeCryingPattern();
      if (cryingAnomalies) {
        anomalies.push(cryingAnomalies);
      }
    }

    // Movement anomaly
    if (movement === 'Absent' && !this.isSleepTime()) {
      anomalies.push({
        type: 'movement',
        severity: 'medium',
        message: 'Baby is very still during active hours',
        recommendation: 'Check on baby. Ensure they are comfortable.',
      });
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
      riskLevel: this.calculateRiskLevel(anomalies),
      timestamp: new Date(),
    };
  }

  /**
   * Analyzes crying patterns to detect abnormal behavior
   */
  async analyzeCryingPattern() {
    try {
      const cryingData = await AsyncStorage.getItem('cryingLog');
      if (!cryingData) return null;

      const logs = JSON.parse(cryingData);
      const last24h = logs.filter(log => 
        new Date() - new Date(log.timestamp) < 24 * 60 * 60 * 1000
      );

      // If crying frequency is unusually high
      if (last24h.length > 15) {
        return {
          type: 'crying',
          severity: 'medium',
          message: `Excessive crying detected (${last24h.length} times in 24h)`,
          recommendation: 'Check for diaper, hunger, or discomfort. Soothe baby gently.',
        };
      }

      return null;
    } catch (error) {
      console.error('Error analyzing crying pattern:', error);
      return null;
    }
  }

  // ==========================================
  // 2. SLEEP PATTERN ANALYSIS
  // ==========================================

  /**
   * Predicts when baby will likely sleep
   */
  async predictSleepTime() {
    try {
      const sleepData = await AsyncStorage.getItem('sleepLog');
      if (!sleepData) return null;

      const logs = JSON.parse(sleepData);
      const sleepTimes = logs.map(log => new Date(log.startTime).getHours());
      
      // Find most common sleep hours (mode)
      const avgSleepHour = this.findMode(sleepTimes);
      const avgDuration = this.calculateAverageSleepDuration(logs);

      return {
        predictedSleepTime: avgSleepHour,
        averageDuration: avgDuration,
        nextExpectedSleep: this.getNextSleepTime(avgSleepHour),
        quality: this.calculateSleepQuality(logs),
        insights: this.generateSleepInsights(logs),
      };
    } catch (error) {
      console.error('Error predicting sleep time:', error);
      return null;
    }
  }

  /**
   * Analyzes sleep quality based on duration and interruptions
   */
  calculateSleepQuality(sleepLogs) {
    if (sleepLogs.length === 0) return 'unknown';

    const avgDuration = this.calculateAverageSleepDuration(sleepLogs);
    const avgInterruptions = sleepLogs.reduce((sum, log) => sum + (log.interruptions || 0), 0) / sleepLogs.length;

    // Babies need 14-17 hours of sleep
    if (avgDuration >= 14 && avgInterruptions < 2) return 'excellent';
    if (avgDuration >= 12 && avgInterruptions < 3) return 'good';
    if (avgDuration >= 10) return 'fair';
    return 'poor';
  }

  /**
   * Generates actionable sleep insights
   */
  generateSleepInsights(sleepLogs) {
    const insights = [];
    const avgDuration = this.calculateAverageSleepDuration(sleepLogs);

    if (avgDuration < 12) {
      insights.push({
        type: 'sleep_duration',
        message: 'Baby is sleeping less than recommended',
        action: 'Create consistent bedtime routine. Dim lights 30 minutes before sleep.',
      });
    }

    if (sleepLogs.some(log => log.interruptions > 3)) {
      insights.push({
        type: 'interruptions',
        message: 'Multiple sleep interruptions detected',
        action: 'Check room temperature (18-21°C is ideal). Reduce noise and light.',
      });
    }

    const morningNaps = sleepLogs.filter(log => 
      new Date(log.startTime).getHours() < 12
    ).length;

    if (morningNaps > sleepLogs.length * 0.7) {
      insights.push({
        type: 'nap_timing',
        message: 'Most sleep happens in morning',
        action: 'Consider adjusting daytime activities to match natural sleep patterns.',
      });
    }

    return insights;
  }

  // ==========================================
  // 3. HEALTH INSIGHTS
  // ==========================================

  /**
   * Analyzes health trends from collected data
   */
  async generateHealthReport() {
    try {
      const temperatureData = await AsyncStorage.getItem('temperatureLog');
      const sleepData = await AsyncStorage.getItem('sleepLog');
      const activityData = await AsyncStorage.getItem('activityLog');

      const report = {
        timestamp: new Date(),
        temperature: this.analyzeTempTrend(temperatureData),
        sleep: this.analyzeSleepTrend(sleepData),
        activity: this.analyzeActivityTrend(activityData),
        overallHealth: 'healthy',
        recommendations: [],
      };

      // Generate recommendations
      if (report.temperature.avgTemp > 37) {
        report.recommendations.push('Monitor temperature closely. Ensure baby is not overheating.');
      }

      if (report.sleep.avgDuration < 12) {
        report.recommendations.push('Improve sleep hygiene: consistent schedule, comfortable environment.');
      }

      report.overallHealth = this.assessOverallHealth(report);
      return report;
    } catch (error) {
      console.error('Error generating health report:', error);
      return null;
    }
  }

  /**
   * Analyzes temperature trends
   */
  analyzeTempTrend(tempData) {
    if (!tempData) return { avgTemp: null, trend: 'unknown' };

    const logs = JSON.parse(tempData);
    const last7Days = logs.filter(log => 
      new Date() - new Date(log.timestamp) < 7 * 24 * 60 * 60 * 1000
    );

    if (last7Days.length < 2) return { avgTemp: null, trend: 'insufficient_data' };

    const temps = last7Days.map(log => log.temperature);
    const avgTemp = temps.reduce((a, b) => a + b) / temps.length;
    
    // Determine trend (increasing, decreasing, stable)
    const firstHalf = temps.slice(0, Math.floor(temps.length / 2));
    const secondHalf = temps.slice(Math.floor(temps.length / 2));
    const trend = this.calculateTrend(firstHalf, secondHalf);

    return {
      avgTemp: parseFloat(avgTemp.toFixed(1)),
      trend,
      status: avgTemp > 37.2 ? 'elevated' : 'normal',
      dataPoints: temps.length,
    };
  }

  /**
   * Analyzes sleep trends
   */
  analyzeSleepTrend(sleepData) {
    if (!sleepData) return { avgDuration: null, trend: 'unknown' };

    const logs = JSON.parse(sleepData);
    const durations = logs.map(log => log.duration || 0);
    const avgDuration = durations.reduce((a, b) => a + b) / durations.length;

    return {
      avgDuration: parseFloat(avgDuration.toFixed(1)),
      totalSleep: durations.reduce((a, b) => a + b),
      nightSleepQuality: this.calculateSleepQuality(logs),
      napsPerDay: (logs.length / Math.max(1, this.daysSinceFirstLog(logs))).toFixed(1),
    };
  }

  /**
   * Analyzes activity trends
   */
  analyzeActivityTrend(activityData) {
    if (!activityData) return { avgActivity: null, trend: 'unknown' };

    const logs = JSON.parse(activityData);
    const activityLevels = { low: 0, medium: 0, high: 0 };

    logs.forEach(log => {
      activityLevels[log.level] = (activityLevels[log.level] || 0) + 1;
    });

    const mostCommon = Object.keys(activityLevels).reduce((a, b) => 
      activityLevels[a] > activityLevels[b] ? a : b
    );

    return {
      mostCommonLevel: mostCommon,
      distribution: activityLevels,
      averagePerDay: (logs.length / Math.max(1, this.daysSinceFirstLog(logs))).toFixed(1),
    };
  }

  // ==========================================
  // 4. UTILITIES
  // ==========================================

  calculateRiskLevel(anomalies) {
    if (anomalies.length === 0) return 'low';
    
    const highSeverity = anomalies.some(a => a.severity === 'high');
    if (highSeverity) return 'high';
    
    return anomalies.length > 2 ? 'high' : 'medium';
  }

  isSleepTime() {
    const hour = new Date().getHours();
    // Baby sleep times: typical nap times (1-3 PM, 8-10 PM, 5-7 AM)
    return (hour >= 13 && hour <= 15) || (hour >= 20 && hour <= 22) || (hour >= 5 && hour <= 7);
  }

  findMode(array) {
    const frequency = {};
    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }

  calculateAverageSleepDuration(sleepLogs) {
    if (sleepLogs.length === 0) return 0;
    const totalDuration = sleepLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return (totalDuration / sleepLogs.length).toFixed(1);
  }

  getNextSleepTime(avgSleepHour) {
    const now = new Date();
    const nextSleep = new Date(now);
    nextSleep.setHours(avgSleepHour, 0, 0, 0);
    
    if (nextSleep < now) {
      nextSleep.setDate(nextSleep.getDate() + 1);
    }
    
    return nextSleep;
  }

  calculateTrend(firstHalf, secondHalf) {
    const avg1 = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
    
    if (avg2 > avg1 + 0.3) return 'increasing';
    if (avg2 < avg1 - 0.3) return 'decreasing';
    return 'stable';
  }

  assessOverallHealth(report) {
    if (report.temperature.status === 'elevated' || report.sleep.nightSleepQuality === 'poor') {
      return 'monitor';
    }
    return 'healthy';
  }

  daysSinceFirstLog(logs) {
    if (logs.length === 0) return 1;
    const firstLog = new Date(logs[0].timestamp);
    const now = new Date();
    return Math.ceil((now - firstLog) / (24 * 60 * 60 * 1000));
  }
}

export default new AIAnalytics();
