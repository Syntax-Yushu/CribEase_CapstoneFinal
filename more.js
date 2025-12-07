import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function More() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setFullName(userSnap.data().fullName || '');
        }
      }
    };
    fetchUserData();
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
    { label: 'Account Settings', icon: 'settings-outline', onPress: () => {} },
    { label: 'Help & Support', icon: 'help-circle-outline', onPress: () => {} },
    { label: 'Settings & Privacy', icon: 'lock-closed-outline', onPress: () => {} },
    { label: 'About Us', icon: 'information-circle-outline', onPress: handleAboutUs },
  ];

  return (
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

          <TouchableOpacity style={[styles.boxButton, { backgroundColor: 'red' }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.boxIcon} />
            <Text style={[styles.boxButtonText, { color: '#fff' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  avatar: { width: 150, height: 150, borderRadius: 150, backgroundColor: '#a34f9f', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#fff', fontSize: 100, fontWeight: 'bold' },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#a34f9f' },
  menuContainer: { marginTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#a34f9f' },
  menuIcon: { marginRight: 15 },
  menuText: { fontSize: 20, color: '#333' },
  boxContainer: { marginTop: 30 },
  boxButton: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15, 
    width: '100%', 
    borderRadius: 20, 
    marginTop: 10
  },
  boxButtonText: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  boxIcon: {},
});
