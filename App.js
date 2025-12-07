import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
//import * as Permissions from 'expo-permissions'


import Logo from './logo';
import HomePage from './homePage';
import Login from './login';
import Signup from './signup';
import Dashboard from './dashboard';
import TabNavigation from './tabs';
import History from './history';
import NotificationsScreen from './notifications';
import More from './more';
import Device from './device';
import BabyTemp from './babyTemp';
import BabyStatus from './babyStatus';
import SleepPattern from './sleepPattern';
import FallDetection from './fallDetection';

const Stack = createNativeStackNavigator();

export default function App() {
  const [expoPushToken, setExpoPushToken] = React.useState('');

  React.useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Optional: navigate to a specific screen
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Logo" component={Logo} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="TabNavigation" component={TabNavigation} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="More" component={More} />
        <Stack.Screen name="Device" component={Device} />
        <Stack.Screen name="BabyTemp" component={BabyTemp} />
        <Stack.Screen name="BabyStatus" component={BabyStatus} />
        <Stack.Screen name="SleepPattern" component={SleepPattern} />
        <Stack.Screen name="FallDetection" component={FallDetection} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register device for push notifications
async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    Alert.alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
