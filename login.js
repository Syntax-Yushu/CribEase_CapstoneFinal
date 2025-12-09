import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 👁️ Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.deviceID) {
          await AsyncStorage.setItem('deviceID', userData.deviceID);
          navigation.replace('TabNavigation');
        } else {
          navigation.replace('AddDevice');
        }
      } else {
        alert('User data not found.');
      }
    } catch (error) {
      console.error(error);
      switch (error.code) {
        case 'auth/wrong-password':
          alert('Incorrect password. Please try again.');
          break;
        case 'auth/user-not-found':
          alert('No account found with this email.');
          break;
        case 'auth/invalid-email':
          alert('Invalid email format.');
          break;
        default:
          alert('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Please enter your email to reset password.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Reset Email Sent',
        `A password reset email has been sent to ${email}. Check your inbox.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error(error);
      switch (error.code) {
        case 'auth/user-not-found':
          alert('No account found with this email.');
          break;
        case 'auth/invalid-email':
          alert('Invalid email format.');
          break;
        default:
          alert('Failed to send reset email. Try again later.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>SIGN IN</Text>
      <Text style={styles.subtitle}>TO CONTINUE</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#a34f9f" style={styles.icon} />
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#a34f9f" style={styles.icon} />
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Password"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={23}
            color="#a34f9f"
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.signupText}>
          Don’t have an account? <Text style={styles.signupLink}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 80, backgroundColor: '#fff' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#a34f9f', marginBottom: 5 },
  subtitle: { fontSize: 18, color: '#a34f9f', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#a34f9f', borderRadius: 10, paddingHorizontal: 10, marginVertical: 8 },
  icon: { marginRight: 10 },
  inputWithIcon: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#000' },
  forgotButton: { alignSelf: 'flex-end', marginVertical: 5 },
  forgotText: { color: '#a34f9f', fontWeight: 'bold', fontSize: 14 },
  loginButton: { backgroundColor: '#a34f9f', paddingVertical: 15, width: '100%', borderRadius: 20, marginTop: 10, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signupText: { marginTop: 20, fontSize: 15, color: '#555', textAlign: 'center' },
  signupLink: { color: '#a34f9f', fontWeight: 'bold' },
});
