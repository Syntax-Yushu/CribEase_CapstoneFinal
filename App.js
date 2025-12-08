import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

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
import AddDevice from './addDevice';
import AccountSettings from './accountSettings';
import HelpSupport from './helpSupport';
import SettingsPrivacy from './settingsPrivacy';

const Stack = createNativeStackNavigator();

export default function App() {
  const [expoPushToken, setExpoPushToken] = React.useState('');

  React.useEffect(() => {
    // Register device for push notifications
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Listen to Firebase changes globally
    const devicesRef = ref(database, '/devices');
    const unsubscribe = onValue(devicesRef, snapshot => {
      if (snapshot.exists() && expoPushToken) {
        const devicesData = snapshot.val();
        const firstDeviceKey = Object.keys(devicesData)[0];
        const firstDeviceSensor = devicesData[firstDeviceKey]?.sensor;

        if (firstDeviceSensor) {
          // High temperature
          if ((firstDeviceSensor.temperature || 0) > 37.5) {
            sendPushNotification(`High temperature detected: ${firstDeviceSensor.temperature.toFixed(1)}°C`);
          }
          // Baby crying
          if (firstDeviceSensor.sound === 'Crying') {
            sendPushNotification('Baby is crying!');
          }
          // Fall absent
          if (firstDeviceSensor.fallStatus === 'Absent') {
            sendPushNotification('Fall absent!');
          }
        }
      }
    });

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // You can navigate to a specific screen here if needed
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [expoPushToken]);

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
        <Stack.Screen name="AddDevice" component={AddDevice} />
        <Stack.Screen name="AccountSettings" component={AccountSettings} />
        <Stack.Screen name="HelpSupport" component={HelpSupport} />
        <Stack.Screen name="SettingsPrivacy" component={SettingsPrivacy} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  // Send push notification
  async function sendPushNotification(message) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: expoPushToken,
          sound: 'default',
          title: 'CribEase Alert',
          body: message,
          data: { message },
        }),
      });
    } catch (error) {
      console.log('Error sending push notification:', error);
    }
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
}
