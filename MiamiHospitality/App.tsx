import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { requestNeededAndroidPermissions, useStripeTerminal, StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';

export default function App() {
  const { initialize } = useStripeTerminal();

  const initializeStripeTerminal = async () => {
    try {
      const granted = await requestNeededAndroidPermissions({
        accessFineLocation: {
          title: 'Location Permission',
          message: 'Stripe Terminal needs access to your location',
          buttonPositive: 'Accept',
        },
      });

      if (granted) {     
        initialize();
      } else {
        console.error(
          'Location and Bluetooth services are required in order to connect to a reader.'
        );
      }
    } catch (e) {
      console.error('Error requesting permissions:', e);
    }
  };

  const fetchTokenProvider = async () => {
    const response = await fetch(`https://email.mvr-management.com/connection_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { secret } = await response.json();
    return secret;
  };

  useEffect(() => {
    initializeStripeTerminal();
  }, [initialize]);

  return (
    <StripeTerminalProvider logLevel='verbose' tokenProvider={fetchTokenProvider}>
      <AppNavigator />
    </StripeTerminalProvider>
  )
}
