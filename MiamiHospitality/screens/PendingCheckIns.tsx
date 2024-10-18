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
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [discoveredReadersState, setDiscoveredReadersState] = useState<any[]>([]);
    const [isModalVisiblePayment, setModalVisiblePayment] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState<any>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [modalMessage, setModalMessage] = useState('');  

    // Stripe Terminal hooks
    const { discoverReaders, disconnectReader, connectBluetoothReader, discoveredReaders, createPaymentIntent, collectPaymentMethod, confirmPaymentIntent } = useStripeTerminal(
        {
            onUpdateDiscoveredReaders: (readers) => {
                setDiscoveredReadersState(readers);
                setModalVisible(true);
            }
        }
    );

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

        if (!selectedReader) {
            console.log('Already connected to a reader, disconnecting first...');
    
            await disconnectReader(); // Desconectar el lector actual

            setSelectedReader(null);
            setIsReaderConnected(false);
        }

        const { error } = await discoverReaders({
            discoveryMethod: 'bluetoothScan',
            simulated: true,
        });

        setIsDiscovering(false);

        if (error) {
            Alert.alert('Discover readers error', `${error.code}: ${error.message}`);
        } 
    };

    const handleConnectBluetoothReader = async (reader: any) => {
        const { reader: connectedReader, error } = await connectBluetoothReader({
            reader,
            locationId: reader.locationId,
        });

        if (error) {
            Alert.alert('Connection Error', `${error.code}: ${error.message}`);
        } else {
            setSelectedReader(connectedReader);
            setIsReaderConnected(true);
            setModalVisible(false);
            Alert.alert('Reader Connected');
        }
    };

    const handlePayment = async (checkIn: { external_reference?: string; customer?: string; email?: string; property?: string; checkin?: string; checkout?: string; charge: any; external_id?: string; }) => {
        if (!selectedReader) {
            Alert.alert('No Reader', 'Please connect a reader first.');
            return;
        }

        if (isProcessingPayment) {
            console.log('Payment already in progress');
            return;
          }

        console.log('Processing payment for check-in:', checkIn);
    
        try {
            setIsProcessingPayment(true);
            setModalMessage('Processing payment...');

            let customerId = null;
    
            const customerSearchResponse = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${checkIn.email}'`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer sk_test_V5IsafkyZHRsTxYDF49Nk8mq00snTjIw2x`,  // Reemplaza con tu clave secreta de Stripe
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
    
            const customerSearchData = await customerSearchResponse.json();
    
            if (customerSearchData.data && customerSearchData.data.length > 0) {
                customerId = customerSearchData.data[0].id;
            } else {
                const customerCreationResponse = await fetch('https://email.mvr-management.com/create_customer_stripe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: checkIn.email || 'unknown@gmail.com',
                        name: checkIn.customer || '',
                    }),
                });
    
                const customerCreationData = await customerCreationResponse.json();
    
                if (customerCreationData.error) {
                    console.log('Error al crear cliente:', customerCreationData.error);
                    return;
                }

                customerId = customerCreationData.id;
            }
    
            // Paso 3: Crea un PaymentIntent con el ID del cliente
            const { paymentIntent, error: createError } = await createPaymentIntent({
                amount: checkIn.charge * 100,
                currency: 'usd',
                paymentMethodTypes: ['card_present'],
                captureMethod: 'automatic',
                customer: customerId,
            });
    
            if (createError || !paymentIntent) {
                console.log("Error al crear PaymentIntent:", createError);
                Alert.alert('Payment Error', `Failed to create payment intent: ${createError?.message || 'Unknown error'}`);
                return;
            }
    
            console.log("PaymentIntent creado:", paymentIntent);

            setModalMessage('Please insert or tap the card on the reader');
    
            // Paso 4: Recoge el método de pago
            const { error: collectError } = await collectPaymentMethod({ paymentIntent });
            if (collectError) {
                console.log("Error al recoger el método de pago:", collectError);
                Alert.alert('Payment Error', `Failed to collect payment: ${collectError.message}`);
                return;
            }
    
            console.log("Método de pago recogido exitosamente");
            setModalMessage('Processing payment...');
    
            // Paso 5: Confirma el PaymentIntent
            const { paymentIntent: paymentConfirmation, error: confirmError } = await confirmPaymentIntent({ paymentIntent });
            if (confirmError || !paymentConfirmation) {
                console.log("Error al confirmar PaymentIntent:", confirmError);
                Alert.alert('Payment Error', `Failed to confirm payment: ${confirmError?.message || 'Unknown error'}`);
                return;
            }
    
            console.log("PaymentIntent confirmado:", paymentConfirmation);
    
            // Muestra la información del pago
            setPaymentInfo({
                customer: checkIn.customer,
                property: checkIn.property,
                amount: paymentConfirmation.amount / 100,  // Divide por 100 para obtener dólares
                paymentMethod: paymentConfirmation.charges[0].paymentMethodDetails?.cardPresentDetails?.last4,
                status: paymentConfirmation.status,
            });
    
            setIsProcessingPayment(false);
            setModalVisiblePayment(true);
    
        } catch (err) {
            setPaymentInfo({
                customer: checkIn.customer,
                property: checkIn.property,
                amount: checkIn.charge,
                status: 'failed',
            });
            setModalVisiblePayment(true);
        }
    };

    const renderItem = ({ item }: { item: { email: string, customer: string; property: string; checkin: string; checkout: string; charge: number; external_reference: string; } }) => (
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
                    <Text style={styles.headerIcon}>Connect Terminal</Text>
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
                    keyExtractor={(item) => item.external_reference}
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

            <Modal
                visible={isModalVisiblePayment}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Payment Successful</Text>
                    {paymentInfo && (
                    <View>
                        <Text>Customer: {paymentInfo.customer}</Text>
                        <Text>Property: {paymentInfo.property}</Text>
                        <Text>Amount: ${paymentInfo.amount}</Text>
                        <Text>Payment Method: {paymentInfo.paymentMethod}</Text>
                        <Text>Status: {paymentInfo.status}</Text>
                    </View>
                    )}
                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisiblePayment(false)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </Modal>

            <Modal
            transparent={true}
            animationType="slide"
            visible={isProcessingPayment}
            onRequestClose={() => setIsProcessingPayment(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text>{modalMessage}</Text>
                    <ActivityIndicator size="large" color="#3b82f6" style={styles.modalLoading} />
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
  modalLoading: {
    marginTop: 10,
},
});

export default PendingCheckIns;