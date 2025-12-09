import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Subscription({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('Basic'); // Default selected plan

  const handleSubscribe = async (plan) => {
    setSelectedPlan(plan);

    // Determine price based on plan
    let price = 'Free';
    if (plan === 'Premium') price = '₱99 / month';
    if (plan === 'Family') price = '₱499 / month';

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      // Save subscription to Firestore
      await addDoc(collection(db, 'subscriptions'), {
        userID: user.uid,
        deviceID: null, // Can update later if you track device
        customerName: user.displayName || 'Unknown',
        email: user.email,
        plan: plan,
        price: price,
        saleDate: serverTimestamp(),
        orderID: 'ORD-' + Math.floor(Math.random() * 1000000),
        paymentMethod: plan === 'Basic' ? 'Free' : 'Online',
        shippingAddress: 'N/A', // optional if you have an address
      });

      Alert.alert(
        'Subscribe',
        `You selected the ${plan} plan.\nThank you for subscribing to CribEase.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to save subscription. Please try again.');
    }
  };

  return (
    <View style={styles.container}>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Subscription Plans</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Basic Plan */}
        <View style={[styles.card, selectedPlan === 'Basic' && styles.selectedCard]}>
          <Text style={styles.planTitle}>Basic Plan</Text>
          <Text style={styles.planPrice}>Free</Text>
          <Text style={styles.planFeatures}>• Limited device monitoring{'\n'}• Basic notifications</Text>
          <TouchableOpacity
            style={[styles.subscribeButton, selectedPlan === 'Basic' && styles.selectedButton]}
            onPress={() => handleSubscribe('Basic')}
            disabled={selectedPlan === 'Basic'}
          >
            <Text style={styles.subscribeText}>
              {selectedPlan === 'Basic' ? 'Selected' : 'Select Plan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Premium Plan */}
        <View style={[styles.card, selectedPlan === 'Premium' && styles.selectedCard]}>
          <Text style={styles.planTitle}>Premium Plan</Text>
          <Text style={styles.planPrice}>₱99 / month</Text>
          <Text style={styles.planFeatures}>• Unlimited devices{'\n'}• Real-time alerts{'\n'}• Detailed sleep & health reports</Text>
          <TouchableOpacity
            style={[styles.subscribeButton, selectedPlan === 'Premium' && styles.selectedButton]}
            onPress={() => handleSubscribe('Premium')}
          >
            <Text style={styles.subscribeText}>
              {selectedPlan === 'Premium' ? 'Selected' : 'Select Plan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Family Plan */}
        <View style={[styles.card, selectedPlan === 'Family' && styles.selectedCard]}>
          <Text style={styles.planTitle}>Family Plan</Text>
          <Text style={styles.planPrice}>₱499 / month</Text>
          <Text style={styles.planFeatures}>• Multiple children/devices{'\n'}• All Premium features{'\n'}• Priority support</Text>
          <TouchableOpacity
            style={[styles.subscribeButton, selectedPlan === 'Family' && styles.selectedButton]}
            onPress={() => handleSubscribe('Family')}
          >
            <Text style={styles.subscribeText}>
              {selectedPlan === 'Family' ? 'Selected' : 'Select Plan'}
            </Text>
          </TouchableOpacity>
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
  selectedCard: {
    borderWidth: 2,
    borderColor: '#4d148c',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4d148c',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginBottom: 10,
  },
  planFeatures: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 15,
  },
  subscribeButton: {
    backgroundColor: '#a34f9f',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#4d148c',
  },
  subscribeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
