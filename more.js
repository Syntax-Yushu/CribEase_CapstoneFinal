import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

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
          setFullName(userSnap.data().fullName);
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <View style={styles.container}>
      {fullName !== '' && (
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.greeting}>Hi, {fullName}!</Text>
        </View>
      )}

      {/* NEW OPTIONS */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Help & Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Settings & Privacy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => {
            await signOut(auth);
            navigation.replace('HomePage'); // ← your homepage.js screen name
          }}
        >
          <Text style={[styles.menuText, { color: 'red' }]}>Logout</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 150,
    backgroundColor: '#a34f9f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 100,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#a34f9f',
  },

  // NEW MENU STYLES
  menuContainer: {
    marginTop: 20,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#a34f9f',
  },
  menuText: {
    fontSize: 20,
    color: '#333',
  },
});
