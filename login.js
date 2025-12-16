import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, verifyPasswordResetCode } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  // ==========================
  // FORGOT PASSWORD HANDLER
  // ==========================
  const handleForgotPasswordClick = () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }
    setModalVisible(true);
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      // First try Firebase's built-in email
      await sendPasswordResetEmail(auth, email);
      
      // Also send via Cloud Function for better reliability
      try {
        const sendPasswordResetEmailFunction = httpsCallable(functions, 'sendPasswordResetEmail');
        await sendPasswordResetEmailFunction({
          email: email,
          continueUrl: 'https://your-app.com',
        });
      } catch (cloudError) {
        console.log('Cloud function error (optional):', cloudError);
      }

      alert("Password reset email sent! Check your inbox and spam folder for instructions.");
      setModalVisible(false);
      setEmail('');
    } catch (error) {
      console.log(error);
      if (error.code === 'auth/user-not-found') {
        alert("No account found with this email.");
      } else if (error.code === 'auth/invalid-email') {
        alert("Invalid email format.");
      } else if (error.code === 'auth/too-many-requests') {
        alert("Too many reset requests. Please try again later.");
      } else {
        alert("Error sending reset email. Please try again.");
      }
    } finally {
      setLoading(false);
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
      <TouchableOpacity onPress={handleForgotPasswordClick} style={styles.forgotButton}>
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

      {/* ========================= */}
      {/* PASSWORD RESET MODAL     */}
      {/* ========================= */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>We'll send you an email with instructions to reset your password.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
            />

            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>{loading ? 'Sending...' : 'Send Reset Email'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} disabled={loading}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 25, paddingTop: 80, backgroundColor: '#f8f9fa' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  title: { fontSize: 32, fontWeight: '800', color: '#a34f9f', marginBottom: 8, letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#999', marginBottom: 35, fontWeight: '500', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 0, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, marginVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, paddingVertical: 2 },
  icon: { marginRight: 12, opacity: 0.7 },
  inputWithIcon: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#000' },
  forgotButton: { alignSelf: 'flex-end', marginVertical: 8, marginTop: 15 },
  forgotText: { color: '#a34f9f', fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
  loginButton: { backgroundColor: '#a34f9f', paddingVertical: 16, width: '100%', borderRadius: 28, marginTop: 20, alignItems: 'center', shadowColor: '#a34f9f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  signupText: { marginTop: 22, fontSize: 14, color: '#666', textAlign: 'center' },
  signupLink: { color: '#a34f9f', fontWeight: '700' },

  // Modal
  modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalBox: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: '#a34f9f', letterSpacing: 0.5 },
  modalSubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  modalInput: { width: '100%', borderWidth: 0, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16, color: '#000' },
  modalButton: { backgroundColor: '#a34f9f', paddingVertical: 14, width: '100%', borderRadius: 20, alignItems: 'center', marginTop: 8, shadowColor: '#a34f9f', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  modalCancel: { marginTop: 15, color: '#a34f9f', fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' }
});
