import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import PendingCheckIns from '../screens/PendingCheckIns';
import Breakfasts from '../screens/Breakfasts';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="CheckIns" 
        component={PendingCheckIns} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Breakfasts" 
        component={Breakfasts} 
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}


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
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}