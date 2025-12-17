import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Logo({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;      // opacity
  const scaleAnim = useRef(new Animated.Value(0.8)).current;   // size

  useEffect(() => {
    // Run animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 2,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]).start();

    // Listen to auth state changes properly
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const deviceID = await AsyncStorage.getItem('deviceID');

        if (user && deviceID) {
          // User is logged in and has a device
          navigation.replace('TabNavigation');
        } else if (user && !deviceID) {
          // User is logged in but no device
          navigation.replace('AddDevice');
        } else {
          // User not logged in
          navigation.replace('HomePage');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigation.replace('HomePage');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('./assets/babylogo.png')}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            tintColor: '#a34f9f',
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 350,
    height: 300,
  },
});
