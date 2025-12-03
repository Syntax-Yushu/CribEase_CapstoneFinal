import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Linking } from 'react-native';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Signup({ navigation }) {
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Parent');
  const [agree, setAgree] = useState(false);

  // Register function
  const handleRegister = async () => {
    // Validation
    if (!agree) {
      alert('You must agree to the Terms of Use and Privacy Policy');
      return;
    }
    if (!fullName || !email || !password || !confirmPassword) {
      alert('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      // 1️⃣ Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Save extra info to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        role,
        createdAt: new Date(),
      });

      alert('Registered successfully!');
      navigation.navigate('HomePage'); // Navigate to HomePage
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

      <Text style={styles.title}>New on CribEase?</Text>
      <Text style={styles.subtitle}>Create account to start.</Text>

      {/* Form Fields */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#555"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#555"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#555"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#555"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* Role Picker */}
      <Text style={styles.label}>Choose a Role</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={role}
          onValueChange={(itemValue) => setRole(itemValue)}
          style={[styles.picker, { color: '#555' }]}   // picker text color
          itemStyle={{ color: '#555' }}                // dropdown item color
        >
          <Picker.Item label="Parent" value="Parent" />
          <Picker.Item label="Caregiver" value="Caregiver" />
        </Picker>

      </View>

      {/* Custom Checkbox with clickable Terms */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAgree(!agree)}
      >
        <View style={[styles.checkbox, agree && styles.checkedBox]}>
          {agree && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxText}>
          I agree to{' '}
          <Text
            style={styles.linkText}
            onPress={() => Linking.openURL('https://www.cribease.com/terms')}
          >
            CribEase Terms of Use
          </Text>{' '}
          and{' '}
          <Text
            style={styles.linkText}
            onPress={() => Linking.openURL('https://www.cribease.com/privacy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Register Button */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Login</Text>
        </Text>
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
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a34f9f',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#a34f9f',
    borderRadius: 10,
    marginVertical: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    width: '100%',
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: '#a34f9f',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#a34f9f',
  },
  checkboxText: {
    marginLeft: 10,
    color: '#a34f9f',
    flex: 1,
    flexWrap: 'wrap',
  },
  linkText: {
    color: '#a34f9f',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: '#a34f9f',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
  marginTop: 20,
  fontSize: 15,
  color: '#555',
  textAlign: 'center',
},

loginLink: {
  color: '#a34f9f',
  fontWeight: 'bold',
},

});
