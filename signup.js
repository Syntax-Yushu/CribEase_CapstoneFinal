import { StyleSheet, Text, View, TouchableOpacity, TextInput, Platform, ScrollView, Modal } from 'react-native';
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
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

    setLoading(true);

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
        profileCompleted: false,
      });

      alert('Account created! Now let\'s set up your baby profile.');
      navigation.navigate('BabyProfile', { userUID: user.uid });
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
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
            I agree to <Text style={styles.linkText} onPress={() => setShowTermsModal(true)}>CribEase Terms of Use</Text> and <Text style={styles.linkText} onPress={() => setShowPrivacyModal(true)}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* REGISTER BUTTON */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
          <Text style={styles.registerButtonText}>{loading ? 'Registering' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* TERMS OF USE MODAL */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
              <Ionicons name="close-outline" size={30} color="#a34f9f" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Terms of Use</Text>
            <View style={{ width: 30 }} />
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
            <Text style={styles.modalSubtitle}>CribEase Terms of Use</Text>
            <Text style={styles.modalText}>
              Last Updated: December 17, 2025{"\n\n"}
              <Text style={styles.modalBold}>1. Acceptance of Terms</Text>{"\n"}
              By creating an account and using CribEase, you agree to comply with these Terms of Use. If you do not agree with any part of these terms, you may not use our service.{"\n\n"}
              <Text style={styles.modalBold}>2. User Accounts</Text>{"\n"}
              You are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.{"\n\n"}
              <Text style={styles.modalBold}>3. Acceptable Use</Text>{"\n"}
              You agree not to use CribEase for any unlawful purpose or in violation of any laws. You will not harass, abuse, or harm others, or attempt to gain unauthorized access to any system.{"\n\n"}
              <Text style={styles.modalBold}>4. Baby Safety</Text>{"\n"}
              CribEase is designed to assist with baby care monitoring. However, it should not replace professional medical advice. Always consult with healthcare professionals for serious health concerns.{"\n\n"}
              <Text style={styles.modalBold}>5. Intellectual Property</Text>{"\n"}
              All content, features, and functionality of CribEase are owned by CribEase, its licensors, or other providers. You may not reproduce, distribute, or transmit any content without our written permission.{"\n\n"}
              <Text style={styles.modalBold}>6. Limitation of Liability</Text>{"\n"}
              CribEase is provided "as is" without any warranties. We are not liable for any indirect, incidental, special, or consequential damages arising from the use of our service.{"\n\n"}
              <Text style={styles.modalBold}>7. Changes to Terms</Text>{"\n"}
              We reserve the right to modify these terms at any time. Your continued use of CribEase after changes constitute your acceptance of the new terms.{"\n\n"}
              <Text style={styles.modalBold}>8. Contact Us</Text>{"\n"}
              If you have any questions about these terms, please contact us at techguardians@gmail.com
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <Ionicons name="close-outline" size={30} color="#a34f9f" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <View style={{ width: 30 }} />
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
            <Text style={styles.modalSubtitle}>CribEase Privacy Policy</Text>
            <Text style={styles.modalText}>
              Last Updated: December 17, 2025{"\n\n"}
              <Text style={styles.modalBold}>1. Information We Collect</Text>{"\n"}
              We collect information you provide directly to us, such as your name, email address, date of birth, and baby profile information. We also collect information about device usage patterns and sensor data.{"\n\n"}
              <Text style={styles.modalBold}>2. How We Use Your Information</Text>{"\n"}
              We use your information to provide, maintain, and improve CribEase services. This includes personalizing your experience, sending notifications about your baby's status, and analyzing service performance.{"\n\n"}
              <Text style={styles.modalBold}>3. Data Security</Text>{"\n"}
              We implement industry-standard security measures to protect your personal information. However, no method of transmission is 100% secure. We encourage you to use strong passwords and protect your account.{"\n\n"}
              <Text style={styles.modalBold}>4. Third-Party Services</Text>{"\n"}
              CribEase may integrate with third-party services such as Firebase. These services have their own privacy policies. We encourage you to review their privacy practices.{"\n\n"}
              <Text style={styles.modalBold}>5. Children's Privacy</Text>{"\n"}
              CribEase is designed for parents and caregivers. We do not intentionally collect personal information from children. Parents are responsible for protecting their children's information.{"\n\n"}
              <Text style={styles.modalBold}>6. Data Retention</Text>{"\n"}
              We retain your information for as long as your account is active. You may request deletion of your data at any time by contacting us.{"\n\n"}
              <Text style={styles.modalBold}>7. Your Rights</Text>{"\n"}
              You have the right to access, update, or delete your personal information. To exercise these rights, please contact us at support@cribease.com{"\n\n"}
              <Text style={styles.modalBold}>8. Changes to This Policy</Text>{"\n"}
              We may update this privacy policy periodically. We will notify you of any significant changes via email or through the app.{"\n\n"}
              <Text style={styles.modalBold}>9. Contact Us</Text>{"\n"}
              If you have questions about our privacy practices, please contact us at techguardians@gmail.com
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 25 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 5 },
  title: { marginTop: 90, fontSize: 32, fontWeight: '800', color: '#a34f9f', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#999', marginBottom: 35, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%',
    borderWidth: 0, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, marginVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, paddingVertical: 2 },
  icon: { marginRight: 12, opacity: 0.7 },
  inputWithIcon: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#000' },
  picker: { width: '100%', color: '#000' },
  label: { alignSelf: 'flex-start', marginBottom: 8, marginTop: 16, fontSize: 14, fontWeight: '700', color: '#a34f9f', letterSpacing: 0.5 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 20, width: '100%' },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#a34f9f', borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkedBox: { backgroundColor: '#a34f9f', borderColor: '#a34f9f' },
  checkboxText: { marginLeft: 12, color: '#666', flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  linkText: { color: '#a34f9f', fontWeight: '700', textDecorationLine: 'underline' },
  registerButton: { backgroundColor: '#a34f9f', paddingVertical: 16, width: '100%', borderRadius: 28, marginTop: 25, alignItems: 'center', shadowColor: '#a34f9f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  loginText: { marginTop: 22, fontSize: 14, color: '#666' },
  loginLink: { color: '#a34f9f', fontWeight: '700' },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', marginTop: Platform.OS === 'ios' ? 50 : 10 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#a34f9f' },
  modalContent: { padding: 20 },
  modalSubtitle: { fontSize: 18, fontWeight: '700', color: '#a34f9f', marginBottom: 16 },
  modalBold: { fontWeight: '700', color: '#333' },
  modalText: { fontSize: 14, lineHeight: 22, color: '#555', fontWeight: '400' },
});
