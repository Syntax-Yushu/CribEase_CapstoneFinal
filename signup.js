import { StyleSheet, Text, View, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Linking } from 'react-native';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Signup({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [role, setRole] = useState('Parent');
  const [agree, setAgree] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setBirthdate(selectedDate);
  };

  const handleRegister = async () => {
    if (!agree) { alert('You must agree to the Terms of Use and Privacy Policy'); return; }
    if (!fullName || !email || !password || !confirmPassword || !birthdate) { alert('Please fill all fields'); return; }
    if (password !== confirmPassword) { alert('Passwords do not match'); return; }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        birthdate: birthdate.toISOString().split('T')[0],
        role,
        createdAt: new Date(),
      });

      alert('Registered successfully!');
      navigation.navigate('Login');
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>New on CribEase?</Text>
      <Text style={styles.subtitle}>Create account to start.</Text>

      {/* Full Name with icon */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#a34f9f" style={styles.icon} />
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Full Name"
          placeholderTextColor="#555"
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      {/* Email with icon */}
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

      {/* Password with icon */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#a34f9f" style={styles.icon} />
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Password"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Confirm Password with icon */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#a34f9f" style={styles.icon} />
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Confirm Password"
          placeholderTextColor="#555"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      {/* Birthdate with icon */}
      <Text style={styles.label}>Birthdate</Text>
      <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar-outline" size={20} color="#a34f9f" style={styles.icon} />
        <Text style={{ flex: 1, color: birthdate ? '#000' : '#555', paddingVertical: 12 }}>
          {birthdate ? birthdate.toDateString() : 'Select Birthdate'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={birthdate || new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onChangeDate}
        />
      )}

      {/* Role Picker with icon */}
      <Text style={styles.label}>Choose a Role</Text>
      <View style={[styles.inputContainer, { paddingHorizontal: 5 }]}>
        <Ionicons name="person-circle-outline" size={20} color="#a34f9f" style={styles.icon} />
        <Picker
          selectedValue={role}
          onValueChange={(itemValue) => setRole(itemValue)}
          style={[styles.picker, { flex: 1 }]}
          itemStyle={{ color: '#555' }}
        >
          <Picker.Item label="Parent" value="Parent" />
          <Picker.Item label="Caregiver" value="Caregiver" />
        </Picker>
      </View>

      {/* Terms Checkbox */}
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgree(!agree)}>
        <View style={[styles.checkbox, agree && styles.checkedBox]}>
          {agree && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxText}>
          I agree to{' '}
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.cribease.com/terms')}>
            CribEase Terms of Use
          </Text>{' '}
          and{' '}
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.cribease.com/privacy')}>
            Privacy Policy
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Register Button */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 80, backgroundColor: '#fff' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#a34f9f', marginBottom: 5 },
  subtitle: { fontSize: 18, color: '#a34f9f', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#a34f9f', borderRadius: 10, paddingHorizontal: 10, marginVertical: 8 },
  icon: { marginRight: 10 },
  inputWithIcon: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#000' },
  input: { width: '100%', borderWidth: 1, borderColor: '#a34f9f', borderRadius: 10, padding: 12, marginVertical: 8 },
  label: { alignSelf: 'flex-start', marginBottom: 5, fontSize: 16, fontWeight: 'bold', color: '#a34f9f' },
  picker: { width: '100%' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15, width: '100%' },
  checkbox: { width: 25, height: 25, borderWidth: 1, borderColor: '#a34f9f', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checkedBox: { backgroundColor: '#a34f9f' },
  checkboxText: { marginLeft: 10, color: '#a34f9f', flex: 1, flexWrap: 'wrap' },
  linkText: { color: '#a34f9f', fontWeight: 'bold', textDecorationLine: 'underline' },
  registerButton: { backgroundColor: '#a34f9f', paddingVertical: 15, width: '100%', borderRadius: 20, marginTop: 10, alignItems: 'center' },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginText: { marginTop: 20, fontSize: 15, color: '#555', textAlign: 'center' },
  loginLink: { color: '#a34f9f', fontWeight: 'bold' },
});
