import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function More() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);

    // Real-time listener for fullName
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setFullName(snapshot.data().fullName || '');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRemoveDevice = async () => {
    Alert.alert(
      'Remove Device?',
      'Your current device will be unlinked.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { deviceID: null });
              }
              await AsyncStorage.removeItem('deviceID');
              Alert.alert('Success', 'Device removed. Other tabs will now be disabled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove device.');
              console.log(error);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('deviceID');
      navigation.replace('HomePage');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout.');
      console.log(error);
    }
  };

  const handleAboutUs = () => {
    Alert.alert(
      'About Us',
      'CribEase is an IoT-enabled baby monitoring app designed to make parenting easier and safer.'
    );
  };

  const menuItems = [
    { label: 'Account Settings', icon: 'settings-outline', onPress: () => navigation.navigate('AccountSettings') },
    { label: 'Subscription', icon: 'card-outline', onPress: () => navigation.navigate('Subscription') },
    { label: 'Help & Feedback', icon: 'help-circle-outline', onPress: () => navigation.navigate('HelpFeedback') },
    { label: 'Settings & Privacy', icon: 'lock-closed-outline', onPress: () => navigation.navigate('SettingsPrivacy') },
    { label: 'About Us', icon: 'information-circle-outline', onPress: handleAboutUs },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {fullName !== '' && (
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.greeting}>Hi, {fullName}!</Text>
          </View>
        )}

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <Ionicons name={item.icon} size={24} color="#a34f9f" style={styles.menuIcon} />
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Box Buttons */}
          <View style={styles.boxContainer}>
            <TouchableOpacity style={[styles.boxButton, { backgroundColor: '#a34f9f' }]} onPress={handleRemoveDevice}>
              <Ionicons name="trash-outline" size={24} color="#fff" style={styles.boxIcon} />
              <Text style={[styles.boxButtonText, { color: '#fff' }]}>Remove Device</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.boxButton, { backgroundColor: '#4f9fa3' }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.boxIcon} />
              <Text style={[styles.boxButtonText, { color: '#fff' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginTop: 50, marginBottom: 45, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  avatar: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#a34f9f', justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: '#a34f9f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarText: { color: '#fff', fontSize: 80, fontWeight: '800' },
  greeting: { fontSize: 28, fontWeight: '800', color: '#a34f9f', letterSpacing: 0.5 },
  menuContainer: { marginTop: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  menuIcon: { marginRight: 16, width: 30, alignItems: 'center', opacity: 0.8 },
  menuText: { fontSize: 16, color: '#333', fontWeight: '600', letterSpacing: 0.3 },
  boxContainer: { marginTop: 35, marginBottom: 30 },
  boxButton: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, 
    width: '100%', 
    borderRadius: 24, 
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  boxButtonText: { fontSize: 16, fontWeight: '700', marginLeft: 12, letterSpacing: 0.3 },
  boxIcon: { opacity: 0.9 },
});
