import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function BabyProfile({ navigation, route }) {
  const { userUID } = route.params;
  const isEditing = route.params?.isEditing || false;
  
  const [babyName, setBabyName] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing baby profile if editing
  useEffect(() => {
    const loadBabyProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userUID));
        if (userDoc.exists() && userDoc.data().babyName) {
          setBabyName(userDoc.data().babyName);
          setGender(userDoc.data().babyGender || '');
          if (userDoc.data().babyBirthdate) {
            const [year, month, day] = userDoc.data().babyBirthdate.split('-');
            setBirthdate(new Date(year, parseInt(month) - 1, day));
          }
        }
      } catch (error) {
        console.error('Error loading baby profile:', error);
      }
    };

    if (isEditing) {
      loadBabyProfile();
    }
  }, [isEditing, userUID]);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setBirthdate(selectedDate);
  };

  const handleSave = async () => {
    // ✅ Validate fields
    if (!babyName || !gender || !birthdate) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Update user profile in Firestore with baby info
      await updateDoc(doc(db, 'users', userUID), {
        babyName,
        babyGender: gender,
        babyBirthdate: birthdate.toISOString().split('T')[0],
        profileCompleted: true,
      });

      if (isEditing) {
        alert('Baby profile updated successfully!');
        navigation.goBack();
      } else {
        alert('Baby profile created successfully!');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.headerContainer}>
          <MaterialCommunityIcons name="baby-face-outline" size={60} color="#a34f9f" />
          <Text style={styles.title}>Baby Profile</Text>
          <Text style={styles.subtitle}>Add your little one's information</Text>
        </View>

        {/* BABY NAME */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="baby-carriage" size={20} color="#a34f9f" style={styles.icon} />
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Baby's Name"
            placeholderTextColor="#555"
            value={babyName}
            onChangeText={setBabyName}
          />
        </View>

        {/* GENDER */}
        <View style={[styles.inputContainer, { paddingHorizontal: 5 }]}>
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
          </Picker>
        </View>

        {/* BIRTHDATE */}
        <Text style={styles.label}>Birth Date</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#a34f9f" style={styles.icon} />
          <Text style={{ flex: 1, color: '#000', paddingVertical: 12, fontSize: 16 }}>
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

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#a34f9f" />
          <Text style={styles.infoText}>
            Complete your baby's profile to enable temperature monitoring and personalized insights.
          </Text>
        </View>

        {/* CONTINUE BUTTON */}
        <TouchableOpacity 
          style={[styles.continueButton, loading && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Setting up...' : (isEditing ? 'Save Changes' : 'Continue to Login')}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: { 
    marginTop: 20,
    fontSize: 32, 
    fontWeight: '800', 
    color: '#a34f9f', 
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 16, 
    color: '#999', 
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%',
    borderWidth: 0, 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    marginVertical: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2,
    paddingVertical: 2,
  },
  icon: { 
    marginRight: 12, 
    opacity: 0.7,
  },
  inputWithIcon: { 
    flex: 1, 
    paddingVertical: 14, 
    fontSize: 16, 
    color: '#000',
  },
  picker: { 
    width: '100%', 
    color: '#000',
  },
  label: { 
    alignSelf: 'flex-start', 
    marginBottom: 8, 
    marginTop: 16, 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#a34f9f', 
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0e6f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#a34f9f',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  continueButton: { 
    backgroundColor: '#a34f9f', 
    paddingVertical: 16, 
    width: '100%', 
    borderRadius: 28, 
    marginTop: 25, 
    alignItems: 'center', 
    shadowColor: '#a34f9f', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 6,
  },
  continueButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700', 
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
