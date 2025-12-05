import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { useEffect, useRef, useState } from 'react';

export default function HomePage({ navigation }) {
  const riseAnim = useRef(new Animated.Value(50)).current; // start slightly below
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [welcomeText, setWelcomeText] = useState('');
  const fullText = "Welcome To";

  // Typing effect for "Welcome To"
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      setWelcomeText(fullText.slice(0, currentIndex + 1));
      currentIndex++;
      if (currentIndex === fullText.length) clearInterval(typingInterval);
    }, 150); // typing speed in ms

    return () => clearInterval(typingInterval);
  }, []);

  // Logo rising animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(riseAnim, {
        toValue: 0,
        duration: 2000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { marginBottom: -60 }]}>{welcomeText}</Text>

      <Animated.Image
        source={require('./assets/cribease.png')}
        style={{
          width: 350,
          height: 300,
          tintColor: '#a34f9f',
          marginBottom: -40,
          transform: [{ translateY: riseAnim }],
          opacity: opacityAnim,
        }}
        resizeMode="contain"
      />

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginBottom: 0,
  },
  button: {
    backgroundColor: '#a34f9f',
    paddingVertical: 15,
    width: 170,
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
