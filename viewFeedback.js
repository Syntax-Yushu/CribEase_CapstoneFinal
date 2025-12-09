import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from './firebase'; // Firestore import
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function ViewFeedback({ navigation }) {
  const [feedbackList, setFeedbackList] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedbackList(loaded);
    });

    return unsubscribe;
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "No date";
    try {
      return timestamp.toDate().toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={35} color="#a34f9f" />
      </TouchableOpacity>

      <Text style={styles.title}>User Feedback</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {feedbackList.length === 0 ? (
          <Text style={styles.noData}>No feedback available.</Text>
        ) : (
          feedbackList.map(item => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.name}>{item.fullName}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
            </View>
          ))
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 70,
    paddingHorizontal: 20
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#a34f9f",
    textAlign: "center",
    marginBottom: 20
  },
  scrollContent: {
    paddingBottom: 30
  },
  noData: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 50
  },
  card: {
    backgroundColor: "#f3e6f7",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4d148c"
  },
  email: {
    fontSize: 15,
    color: "#a34f9f",
    marginBottom: 10
  },
  message: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10
  },
  time: {
    textAlign: "right",
    fontSize: 12,
    color: "#777"
  }
});
