import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function HomePage({navigation}) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { marginBottom: 5 }]}>Welcome To</Text>
      <Text style={[styles.title, { fontSize: 70 }]}>CribEase</Text>


      <TouchableOpacity style={styles.button}  onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#a34f9f',
  },
  button: {
    backgroundColor: '#a34f9f',
    paddingVertical: 15,
    width: 170,
    alignItems: "center",
    borderRadius: 20,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
