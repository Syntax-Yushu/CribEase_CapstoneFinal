import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

// Import screens
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
import PresenceDetection from './presenceDetection';
import AddDevice from './addDevice';
import AccountSettings from './accountSettings';
import HelpFeedback from './helpFeedback';
import SettingsPrivacy from './settingsPrivacy';
import Feedback from './feedback';
import ViewFeedback from './viewFeedback';
import Subscription from './subscription';
import SubscriptionView from './subscriptionview';
import BabyProfile from './babyProfile';
import AIInsights from './aiInsights';

const Stack = createNativeStackNavigator();

export default function App() {
  const [expoPushToken, setExpoPushToken] = React.useState('');
  const lastAlerts = React.useRef({
    temperature: null,
    sound: null,
    fallStatus: null,
  });

  // Register device for push notifications
  React.useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });
  }, []);

  // Listen to Firebase changes and send notifications
  React.useEffect(() => {
    if (!expoPushToken) return; // Wait until token is available

    const devicesRef = ref(database, '/devices');
    const unsubscribe = onValue(devicesRef, snapshot => {
      if (!snapshot.exists()) return;
      const devicesData = snapshot.val();
      const firstDeviceKey = Object.keys(devicesData)[0];
      const sensor = devicesData[firstDeviceKey]?.sensor;
      if (!sensor) return;

      // High Temperature
      if (sensor.temperature > 37.5 && lastAlerts.current.temperature !== 'high') {
        sendPushNotification(`High temperature detected: ${sensor.temperature.toFixed(1)}°C`);
        lastAlerts.current.temperature = 'high';
      } else if (sensor.temperature <= 37.5) {
        lastAlerts.current.temperature = null;
      }

      // Low Temperature
      if (sensor.temperature < 35.5 && lastAlerts.current.temperature !== 'low') {
        sendPushNotification(`Low temperature detected: ${sensor.temperature.toFixed(1)}°C`);
        lastAlerts.current.temperature = 'low';
      } else if (sensor.temperature >= 35.5) {
        lastAlerts.current.temperature = null;
      }

      // Baby Crying
      if (sensor.sound === 'Crying' && lastAlerts.current.sound !== 'crying') {
        sendPushNotification('Baby is crying!');
        lastAlerts.current.sound = 'crying';
      } else if (sensor.sound !== 'Crying') {
        lastAlerts.current.sound = null;
      }

      // Baby Absent
      if (sensor.fallStatus === 'Absent' && lastAlerts.current.fallStatus !== 'absent') {
        sendPushNotification('Baby is absent from crib!');
        lastAlerts.current.fallStatus = 'absent';
      } else if (sensor.fallStatus !== 'Absent') {
        lastAlerts.current.fallStatus = null;
      }
    });

    return () => unsubscribe();
  }, [expoPushToken]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Logo" component={Logo} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="BabyProfile" component={BabyProfile} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="TabNavigation" component={TabNavigation} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="More" component={More} />
        <Stack.Screen name="Device" component={Device} />
        <Stack.Screen name="BabyTemp" component={BabyTemp} />
        <Stack.Screen name="BabyStatus" component={BabyStatus} />
        <Stack.Screen name="SleepPattern" component={SleepPattern} />
        <Stack.Screen name="PresenceDetection" component={PresenceDetection} />
        <Stack.Screen name="AddDevice" component={AddDevice} />
        <Stack.Screen name="AccountSettings" component={AccountSettings} />
        <Stack.Screen name="HelpFeedback" component={HelpFeedback} />
        <Stack.Screen name="SettingsPrivacy" component={SettingsPrivacy} />
        <Stack.Screen name="Feedback" component={Feedback} />
        <Stack.Screen name="ViewFeedback" component={ViewFeedback} />
        <Stack.Screen name="Subscription" component={Subscription} />
        <Stack.Screen name="SubscriptionView" component={SubscriptionView} />
        <Stack.Screen name="AIInsights" component={AIInsights} />
        {/* <Stack.Screen name="BabyProfile" component={BabyProfile} /> */}
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
        console.warn('Notification permission denied');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token:', token);
    } else {
      console.warn('Push Notifications require a physical device.');
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
