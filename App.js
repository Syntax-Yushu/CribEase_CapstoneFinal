import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Logo from './logo';
import HomePage from './homePage';
import Login from './login';
import Signup from './signup';
import Dashboard from './dashboard';
import TabNavigation from './tabs';
import History from './history';
import Notifications from './notifications';
import More from './more';

const Stack = createNativeStackNavigator();

export default function App() {
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
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="More" component={More} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
