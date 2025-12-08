import { StyleSheet, Text, View, TouchableOpacity, TextInput, Platform, ScrollView } from 'react-native';
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
  //const [gender, setGender] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [agree, setAgree] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setBirthdate(selectedDate);
  };

  const handleRegister = async () => {
    // ✅ Check if agreed
    if (!agree) { alert('You must agree to the Terms of Use and Privacy Policy'); return; }
    
    // ✅ Check if all required fields are filled
    if (!fullName || !email || !password || !confirmPassword || !birthdate) {
      alert('Please fill all fields'); return;
    }

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert('Please enter a valid email'); return;
    }

    // ✅ Check password match
    if (password !== confirmPassword) { alert('Passwords do not match'); return; }

    // ✅ Check gender and role selection
    // if (!gender) { alert('Please select your gender'); return; }
    if (!role) { alert('Please select your role'); return; }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        //gender,
        role,
        birthdate: birthdate.toISOString().split('T')[0],
        deviceID: null,
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

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>New on CribEase?</Text>
        <Text style={styles.subtitle}>Create account to start.</Text>

        {/* FULL NAME */}
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

        {/* EMAIL */}
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

        {/* PASSWORD */}
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

        {/* CONFIRM PASSWORD */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#a34f9f" style={styles.icon} />

          <TextInput
            style={styles.inputWithIcon}
            placeholder="Confirm Password"
            placeholderTextColor="#555"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />

          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={23}
              color="#a34f9f"
            />
          </TouchableOpacity>
        </View>

        {/* BIRTHDATE */}
        <Text style={styles.label}>Birthdate</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#a34f9f" style={styles.icon} />
          <Text style={{ flex: 1, color: '#000', paddingVertical: 12 }}>
            {birthdate.toDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={birthdate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onChangeDate}
          />
        )}

        {/* GENDER */}
        {/* <View style={[styles.inputContainer, { paddingHorizontal: 5 }]}>
          <Ionicons name="male-female-outline" size={20} color="#a34f9f" style={styles.icon} />
          <Picker
            selectedValue={gender}
            onValueChange={(value) => setGender(value)}
            style={[styles.picker, { flex: 1 }]}
            dropdownIconColor="#a34f9f"
          >
            <Picker.Item label="Select Gender" value="" color="#555" />
            <Picker.Item label="Male" value="Male" color="#000" />
            <Picker.Item label="Female" value="Female" color="#000" />
            <Picker.Item label="Other" value="Other" color="#000" />
          </Picker>
        </View> */}

        {/* ROLE */}
        <View style={[styles.inputContainer, { paddingHorizontal: 5 }]}>
          <Ionicons name="person-circle-outline" size={20} color="#a34f9f" style={styles.icon} />
          <Picker
            selectedValue={role}
            onValueChange={(value) => setRole(value)}
            style={[styles.picker, { flex: 1 }]}
            dropdownIconColor="#a34f9f"
          >
            <Picker.Item label="Select Role" value="" color="#555" />
            <Picker.Item label="Parent" value="Parent" color="#000" />
            <Picker.Item label="Caregiver" value="Caregiver" color="#000" />
          </Picker>
        </View>

        {/* AGREEMENT */}
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgree(!agree)}>
          <View style={[styles.checkbox, agree && styles.checkedBox]}>
            {agree && <Ionicons name="checkmark" size={18} color="#fff" />}
          </View>
          <Text style={styles.checkboxText}>
            I agree to <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.cribease.com/terms')}>CribEase Terms of Use</Text> and <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.cribease.com/privacy')}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* REGISTER BUTTON */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 30 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 5 },
  title: { marginTop: 90, fontSize: 28, fontWeight: 'bold', color: '#a34f9f' },
  subtitle: { fontSize: 18, color: '#a34f9f', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: '#a34f9f', borderRadius: 10, paddingHorizontal: 10, marginVertical: 8 },
  icon: { marginRight: 10 },
  inputWithIcon: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#000' },
  picker: { width: '100%' },
  label: { alignSelf: 'flex-start', marginBottom: 5, marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#a34f9f' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15, width: '100%' },
  checkbox: { width: 25, height: 25, borderWidth: 1, borderColor: '#a34f9f', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checkedBox: { backgroundColor: '#a34f9f' },
  checkboxText: { marginLeft: 10, color: '#a34f9f', flex: 1 },
  linkText: { color: '#a34f9f', fontWeight: 'bold', textDecorationLine: 'underline' },
  registerButton: { backgroundColor: '#a34f9f', paddingVertical: 15, width: '100%', borderRadius: 20, marginTop: 10, alignItems: 'center' },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginText: { marginTop: 20, fontSize: 15, color: '#555' },
  loginLink: { color: '#a34f9f', fontWeight: 'bold' },
});
