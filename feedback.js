import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from './firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Feedback({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadUserInfo = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setFullName(snap.data().fullName);
        setEmail(snap.data().email);
      }
    };

    loadUserInfo();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      alert("Please enter your message.");
      return;
    }

    try {
      await addDoc(collection(db, "feedback"), {
        fullName,
        email,
        message,
        createdAt: serverTimestamp(),
      });

      alert("Feedback sent successfully!");
      setMessage("");
    } catch (error) {
      alert("Error sending feedback: " + error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Back Arrow */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
            </TouchableOpacity>

      <Text style={styles.title}>Send Feedback</Text>

      {/* NAME (READ ONLY) */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-circle-outline" size={22} color="#a34f9f" />
        <TextInput
          style={styles.input}
          value={fullName}
          editable={false}
        />
      </View>

      {/* EMAIL (READ ONLY) */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={22} color="#a34f9f" />
        <TextInput
          style={styles.input}
          value={email}
          editable={false}
        />
      </View>

      {/* MESSAGE */}
      <View style={styles.textAreaContainer}>
        <Ionicons name="chatbox-ellipses-outline" size={22} color="#a34f9f" />
        <TextInput
          style={styles.textArea}
          placeholder="Write your feedback here..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
      </View>

      {/* SEND BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleSend}>
        <Ionicons name="send-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
        <Text style={styles.buttonText}>Send Feedback</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#a34f9f',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a34f9f',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#000' },
  textAreaContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#a34f9f',
    borderRadius: 10,
    padding: 10,
    height: 150,
    marginBottom: 20
  },
  textArea: { flex: 1, marginLeft: 10, fontSize: 16, textAlignVertical: 'top' },
  button: {
    flexDirection: "row",
    backgroundColor: '#a34f9f',
    paddingVertical: 15,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
