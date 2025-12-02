import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Login({ navigation }) {
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Login function
  const handleLogin = async () => {
    if (!identifier || !password) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      let emailToUse = identifier;

      // Check if identifier is username
      if (!identifier.includes('@')) {
        const q = query(collection(db, 'users'), where('username', '==', identifier));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          alert('Username not found');
          setLoading(false);
          return;
        }
        emailToUse = querySnapshot.docs[0].data().email;
      }

      // Sign in
      await signInWithEmailAndPassword(auth, emailToUse, password);
      alert('Login successful!');
      navigation.navigate('Dashboard');
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password function
  const handleForgotPassword = async () => {
    if (!identifier) {
      alert('Please enter your username or email first');
      return;
    }

    try {
      let emailToUse = identifier;

      // If user entered username, find the email
      if (!identifier.includes('@')) {
        const q = query(collection(db, 'users'), where('username', '==', identifier));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          alert('Username not found');
          return;
        }
        emailToUse = querySnapshot.docs[0].data().email;
      }

      await sendPasswordResetEmail(auth, emailToUse);
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>SIGN IN</Text>
      <Text style={styles.subtitle}>TO CONTINUE</Text>

      {/* Username or Email */}
      <TextInput
        style={styles.input}
        placeholder="Username or Email"
        value={identifier}
        onChangeText={setIdentifier}
      />

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Forgot Password */}
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 80,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',  
    top: 50,                
    left: 20,          
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#a34f9f',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#a34f9f',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  forgotText: {
    alignSelf: 'flex-end',
    color: '#a34f9f',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#a34f9f',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
