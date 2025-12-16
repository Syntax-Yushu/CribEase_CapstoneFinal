import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function BabyProfileBoard({ navigation }) {
  const [babyData, setBabyData] = useState({
    babyName: 'Unknown',
    babyGender: 'Unknown',
    babyBirthdate: null,
    age: '--',
  });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editBirthdate, setEditBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch baby profile data from Firestore
  useEffect(() => {
    const fetchBabyData = async () => {
      try {
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setBabyData({
              babyName: data.babyName || 'Unknown',
              babyGender: data.babyGender || 'Unknown',
              babyBirthdate: data.babyBirthdate || null,
              age: calculateAge(data.babyBirthdate),
            });
            // Set edit fields
            setEditName(data.babyName || '');
            setEditGender(data.babyGender || '');
            if (data.babyBirthdate) {
              const [year, month, day] = data.babyBirthdate.split('-');
              setEditBirthdate(new Date(year, parseInt(month) - 1, day));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching baby data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBabyData();
  }, []);

  // Calculate baby's age
  const calculateAge = (birthdate) => {
    if (!birthdate) return '--';
    
    try {
      const [year, month, day] = birthdate.split('-');
      const birthDate = new Date(year, parseInt(month) - 1, day);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      const months = (today.getMonth() - birthDate.getMonth() + 12) % 12;
      
      if (age === 0) {
        return `${months}m old`;
      }
      return `${age}y ${months}m old`;
    } catch (error) {
      console.error('Error calculating age:', error);
      return '--';
    }
  };

  // Get gender icon and color
  const getGenderIcon = () => {
    if (babyData.babyGender.toLowerCase() === 'male') {
      return { icon: 'gender-male', color: '#4A90E2' };
    } else if (babyData.babyGender.toLowerCase() === 'female') {
      return { icon: 'gender-female', color: '#E91E63' };
    }
    return { icon: 'baby-face-outline', color: '#a34f9f' };
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setEditBirthdate(selectedDate);
  };

  const handleSave = async () => {
    if (!editName || !editGender || !editBirthdate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        babyName: editName,
        babyGender: editGender,
        babyBirthdate: editBirthdate.toISOString().split('T')[0],
        profileCompleted: true,
      });

      // Update state
      setBabyData({
        babyName: editName,
        babyGender: editGender,
        babyBirthdate: editBirthdate.toISOString().split('T')[0],
        age: calculateAge(editBirthdate.toISOString().split('T')[0]),
      });

      Alert.alert('Success', 'Baby profile updated!');
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const { icon, color } = getGenderIcon();

  return (
    <>
      <TouchableOpacity 
        style={styles.container}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.headerSection}>
          <MaterialCommunityIcons name={icon} size={40} color={color} />
          <View style={styles.nameSection}>
            <View style={styles.nameContainer}>
              <Text style={styles.babyLabel}>Baby </Text>
              <Text style={styles.babyNameColored}>{babyData.babyName}</Text>
            </View>
            <Text style={styles.age}>{babyData.age}</Text>
          </View>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#999" />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{babyData.babyGender}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Text style={styles.label}>Birthdate</Text>
            <Text style={styles.value}>{babyData.babyBirthdate || '--'}</Text>
          </View>
        </View>

        <Text style={styles.editHint}>Tap to edit profile</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Baby Profile</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Baby Name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Baby's Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter baby's name"
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor="#999"
              />
            </View>

            {/* Gender */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editGender}
                  onValueChange={setEditGender}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>

            {/* Birthdate */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Birthdate</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#a34f9f" />
                <Text style={styles.dateButtonText}>
                  {editBirthdate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={editBirthdate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            )}
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
    marginHorizontal: 0,
    marginLeft: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 4,
    borderTopColor: '#a34f9f',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameSection: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  babyLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  babyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  babyNameColored: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a34f9f',
  },
  age: {
    fontSize: 13,
    color: '#999',
    marginTop: 3,
  },
  infoSection: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  editHint: {
    fontSize: 11,
    color: '#a34f9f',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#a34f9f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
