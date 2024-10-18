import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import PendingCheckIns from '../screens/PendingCheckIns';
import { NavigationContainer } from '@react-navigation/native';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PendingCheckIns" component={PendingCheckIns} options={{ title: 'Pending Check-Ins' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}