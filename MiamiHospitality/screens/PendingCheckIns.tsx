import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import axios from 'axios';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';

const PendingCheckIns = () => {
    const { initialize } = useStripeTerminal();
    const [pendingCheckIns, setPendingCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isReaderConnected, setIsReaderConnected] = useState(false);
    const [selectedReader, setSelectedReader] = useState<any>(null);
    const [isDiscovering, setIsDiscovering] = useState(false); // Controla si está buscando lectores
    const [isModalVisible, setModalVisible] = useState(false); // Controla la visibilidad del modal
    const [discoveredReadersState, setDiscoveredReadersState] = useState([]);

    // Stripe Terminal hooks
    const { discoverReaders, connectBluetoothReader, discoveredReaders, createPaymentIntent, collectPaymentMethod } = useStripeTerminal();

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        fetchPendingCheckIns();
        const interval = setInterval(() => {
            fetchPendingCheckIns();
        }, 180000);
        return () => clearInterval(interval);
    }, []);

    const fetchPendingCheckIns = async () => {
        try {
            const response = await axios.get('https://email.mvr-management.com/arya_pending_checkins');
            setPendingCheckIns(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Error fetching data');
            setLoading(false);
            console.log('Error fetching data:', error);
        }
    };

    const handleDiscoverReaders = async () => {
        if (isDiscovering) {
            console.log('Reader discovery already in progress');
            return;
        }

        setIsDiscovering(true);

        const { error } = await discoverReaders({
            discoveryMethod: 'bluetoothScan',
            simulated: true,
        });

        setIsDiscovering(false);

        if (error) {
            Alert.alert('Discover readers error', `${error.code}: ${error.message}`);
        } else if (discoveredReaders.length > 0) {
            handleConnectBluetoothReader(discoveredReaders[0]);
        } else {
            Alert.alert('No readers found', 'Please try again.');
        }
    };

    const handleConnectBluetoothReader = async (reader: any) => {
        const { reader: connectedReader, error } = await connectBluetoothReader({
            reader,
            locationId: reader.locationId, // Asegúrate de que el lector tenga una ubicación asignada
        });

        if (error) {
            Alert.alert('Connection Error', `${error.code}: ${error.message}`);
        } else {
            setSelectedReader(connectedReader);
            setIsReaderConnected(true);
            Alert.alert('Reader Connected', `Connected to: ${connectedReader.label}`);
        }
    };

    const handlePayment = async (checkIn: { customer?: string; property?: string; checkin?: string; checkout?: string; charge: any; external_id?: string; }) => {
        if (!isReaderConnected) {
            Alert.alert('No Reader', 'Please connect a reader first.');
            return;
        }

        try {
            // Crea un PaymentIntent
            const { paymentIntent, error: createError } = await createPaymentIntent({
                amount: checkIn.charge * 100, // Multiplica por 100 porque Stripe trabaja con centavos
                currency: 'usd',
            });

            if (createError) {
                Alert.alert('Payment Error', `Failed to create payment intent: ${createError.message}`);
                return;
            }

            // Recoge el método de pago utilizando el lector
            // const { error: collectError } = await collectPaymentMethod(paymentIntent.id);
            // if (collectError) {
            //     Alert.alert('Payment Error', `Failed to collect payment: ${collectError.message}`);
            //     return;
            // }
        } catch (err) {
            Alert.alert('Payment Error', `Error processing payment`);
        }
    };

    const renderItem = ({ item }: { item: { customer: string; property: string; checkin: string; checkout: string; charge: number; external_id: string; } }) => (
        <View style={styles.item}>
            <Text style={styles.title}>{item.customer}</Text>
            <Text style={styles.subtitle}>{item.property}</Text>
            <Text style={styles.text}>{item.checkin} - {item.checkout}</Text>
            
            <View style={styles.footerContainer}>
                <Text style={styles.charge}>${item.charge}</Text>
                <TouchableOpacity 
                    onPress={() => handlePayment(item)}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Process Payment</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Hotel Arya</Text>
                <TouchableOpacity onPress={handleDiscoverReaders}>
                    <Text style={styles.headerIcon}>Connect Reader</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.subHeader}>Pending Check-Ins</Text>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={pendingCheckIns}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.external_id}
                    contentContainerStyle={styles.listContent}
                />
            )}

<Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Reader</Text>
            {discoveredReaders.length > 0 ? (
              <FlatList
                data={discoveredReaders}
                keyExtractor={(reader) => reader.serialNumber}
                renderItem={({ item: reader }) => (
                  <TouchableOpacity onPress={() => handleConnectBluetoothReader(reader)}>
                    <Text style={styles.readerItem}>{reader.deviceType} - {reader.serialNumber}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text>No readers found</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
  },
  headerIcon: {
    color: 'white',
    fontSize: 16,
    marginRight: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  subHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
    color: 'black'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  item: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  footerContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  charge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 8,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#3bc55e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  readerItem: {
    paddingVertical: 10,
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PendingCheckIns;