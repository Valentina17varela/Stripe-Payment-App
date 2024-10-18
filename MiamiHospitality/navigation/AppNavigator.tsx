import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LoginScreen from '../screens/LoginScreen';
import PendingCheckIns from '../screens/PendingCheckIns';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3b82f6', // Color de fondo del header
          },
          headerTintColor: '#FFFFFF', // Color de los elementos del header
          headerTitleStyle: {
            fontWeight: 'bold', // Estilo de la fuente del título
          },
        }}
        initialRouteName='Login'
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="PendingCheckIns" 
          component={PendingCheckIns} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}