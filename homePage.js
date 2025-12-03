import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { Image } from 'react-native';

export default function HomePage({ navigation }) {
  const dropAnim = useRef(new Animated.Value(-300)).current; // start above the screen
  const bounceCount = useRef(0);

  useEffect(() => {
    const dropAndBounce = () => {
      Animated.timing(dropAnim, {
        toValue: 0, // drop to "Welcome To" position
        duration: 1000,
        easing: Easing.bounce,
        useNativeDriver: true,
      }).start(() => {
        bounceCount.current += 1;
        if (bounceCount.current < 3) {
        }
      });
    };

    dropAndBounce();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('./assets/baby.png')}
        style={{
          width: 250,
          height: 250,
          marginBottom: -10,
          transform: [{ translateY: dropAnim }],
        }}
        resizeMode="contain"
      />

      <Text style={[styles.title, { marginBottom: 5 }]}>Welcome To</Text>
      <Text style={[styles.title, { fontSize: 70 }]}>CribEase</Text>

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
    marginBottom: 40,
    color: '#a34f9f',
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
