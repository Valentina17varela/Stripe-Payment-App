import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { requestNeededAndroidPermissions, useStripeTerminal, StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import { Alert, PermissionsAndroid } from 'react-native';

export default function App() {
  const { initialize } = useStripeTerminal();

  const requestBluetoothAndLocationPermissions = async () => {
    if (true) {
      try {
        const granted = await requestNeededAndroidPermissions({
          accessFineLocation: {
            title: 'Location Permission',
            message: 'Stripe Terminal needs access to your location',
            buttonPositive: 'Accept',
          },
        });
        if (granted) {
          console.log('You can use the Location');
        } else {
          console.error(
            'Location services are required in order to connect to a reader.'
          );
        }

        const grantedBluetooth = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: 'Bluetooth Permission',
            message: 'Stripe Terminal needs access to your Bluetooth',
            buttonPositive: 'Accept',
          }
        )
        if (grantedBluetooth) {
          console.log('You can use the bluetooth');
        } else {
          console.error(
            'Location services are required in order to connect to a reader.'
          );
        }

        const grantedBluetoothScan = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: 'Bluetooth Permission',
            message: 'Stripe Terminal needs access to your Bluetooth',
            buttonPositive: 'Accept',
          }
        )
        if (grantedBluetooth) {
          console.log('You can use the bluetooth scan');
        } else {
          console.error(
            'Location services are required in order to connect to a reader.'
          );
        }
      }  catch (err) {
        console.error('Error requesting permissions:', err);
        return false;
      }
    }
  };

  useEffect(() => {
    requestBluetoothAndLocationPermissions();
  }, []);

  return (
    <AppNavigator />
  )
}
