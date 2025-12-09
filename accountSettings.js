import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function AccountSettings({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showFullNameModal, setShowFullNameModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailPasswordVisible, setEmailPasswordVisible] = useState(false);

  const [newFullName, setNewFullName] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setFullName(user.displayName || '');
      setEmail(user.email || '');
      setNewFullName(user.displayName || '');
    }
  }, []);

  const reauthenticateUser = async (password) => {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, password);
    return reauthenticateWithCredential(user, credential);
  };

  const handleChangeFullName = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Update Firebase Auth displayName
      await updateProfile(user, { displayName: newFullName });

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { fullName: newFullName });

      setFullName(newFullName);
      setShowFullNameModal(false);
      Alert.alert('Success', 'Full name updated!');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to update full name.');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }
    try {
      await reauthenticateUser(currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated!');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', error.message);
    }
  };

  const handleChangeEmail = async () => {
    try {
      await reauthenticateUser(emailCurrentPassword);
      await updateEmail(auth.currentUser, newEmail);
      setEmail(newEmail);
      setShowEmailModal(false);
      setEmailCurrentPassword('');
      setNewEmail('');
      Alert.alert('Success', 'Email updated!');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>Account Settings</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.option} onPress={() => setShowFullNameModal(true)}>
          <Ionicons name="person-circle-outline" size={28} color="#a34f9f" style={styles.icon} />
          <Text style={styles.optionText}>Edit Full Name</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => setShowEmailModal(true)}>
          <Ionicons name="mail-outline" size={28} color="#a34f9f" style={styles.icon} />
          <Text style={styles.optionText}>Change Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => setShowPasswordModal(true)}>
          <Ionicons name="key-outline" size={28} color="#a34f9f" style={styles.icon} />
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Full Name Modal */}
      <Modal visible={showFullNameModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Full Name</Text>
            <TextInput
              style={styles.input}
              value={newFullName}
              onChangeText={setNewFullName}
              placeholder="Enter full name"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleChangeFullName}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowFullNameModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              placeholder="Current Password"
              secureTextEntry={!passwordVisible}
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              placeholder="New Password"
              secureTextEntry={!passwordVisible}
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              placeholder="Confirm New Password"
              secureTextEntry={!passwordVisible}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Text style={{ color: '#a34f9f', textAlign: 'right', marginBottom: 10 }}>
                {passwordVisible ? 'Hide Passwords' : 'Show Passwords'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Email Modal */}
      <Modal visible={showEmailModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Email</Text>
            <TextInput
              placeholder="New Email"
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <TextInput
              placeholder="Current Password"
              secureTextEntry={!emailPasswordVisible}
              style={styles.input}
              value={emailCurrentPassword}
              onChangeText={setEmailCurrentPassword}
            />
            <TouchableOpacity onPress={() => setEmailPasswordVisible(!emailPasswordVisible)}>
              <Text style={{ color: '#a34f9f', textAlign: 'right', marginBottom: 10 }}>
                {emailPasswordVisible ? 'Hide Password' : 'Show Password'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleChangeEmail}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEmailModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#a34f9f', textAlign: 'center', marginBottom: 30, marginTop: 30 },
  section: { marginTop: 20 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3e6f7', padding: 15, borderRadius: 15, marginBottom: 12 },
  optionText: { fontSize: 18, fontWeight: '600', color: '#4d148c' },
  icon: { marginRight: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 10 },
  saveButton: { backgroundColor: '#a34f9f', padding: 12, borderRadius: 10, alignItems: 'center', flex: 1 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#a34f9f', flex: 1, marginLeft: 10, alignItems: 'center' },
  cancelButtonText: { color: '#a34f9f', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#a34f9f', marginBottom: 15, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
});
