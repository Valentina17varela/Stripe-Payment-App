import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView, Modal, Button } from 'react-native';
import axios from 'axios';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';

const PendingCheckIns = () => {
    const { initialize } = useStripeTerminal();
    const [pendingCheckIns, setPendingCheckIns] = useState<{ email: string, customer: string; property: string; checkin: string; checkout: string; charge: number; external_reference: string; total: string; paid: string; debt: string; }[]>([]);
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
    const [selectedCheckIn, setSelectedCheckIn] = useState<{ email: string, customer: string; property: string; checkin: string; checkout: string; charge: number; external_reference: string; total: string; paid: string; debt: string; } | null>(null);
    const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Stripe Terminal hooks
    const { discoverReaders, disconnectReader, connectBluetoothReader, discoveredReaders, createPaymentIntent, collectPaymentMethod, confirmPaymentIntent } = useStripeTerminal(
        {
            onUpdateDiscoveredReaders: (readers) => {
                setDiscoveredReadersState(readers);
                setIsDiscovering(false);
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
        setIsDiscovering(true);
        setModalVisible(true);

        await disconnectReader();
        if (isDiscovering) {
            console.log('Reader discovery already in progress');
            return;
        }

        const { error } = await discoverReaders({
            discoveryMethod: 'bluetoothScan',
            simulated: false,
        });

        setIsDiscovering(false);

        if (error) {
            Alert.alert('Discover readers error', `${error.code}: ${error.message}`);
        } 
    };

    const handleConnectBluetoothReader = async (reader: any) => {
        setIsConnecting(true);
        const { reader: connectedReader, error } = await connectBluetoothReader({
            reader,
            locationId: 'tml_FxXDAfDF0J4Ibh',
        });

        if (error) {
            Alert.alert('Connection Error', `${error.code}: ${error.message}`);
        } else {
            setSelectedReader(connectedReader);
            setIsReaderConnected(true);
            setIsConnecting(false);
            setModalVisible(false);
            Alert.alert('Reader Connected');
        }
    };

    const handleConfirmPayment = (checkIn: any) => {
        setSelectedCheckIn(checkIn);
        setConfirmModalVisible(true);
      };

    const handlePayment = async (checkIn: { external_reference: string; customer?: string; email?: string; property?: string; checkin?: string; checkout?: string; charge: any; external_id?: string; total?:string; debt?:string; paid?:string}) => {
        setConfirmModalVisible(false);

        if (!selectedReader) {
            Alert.alert('No Reader', 'Please connect a reader first.');
            return;
        }

        if (isProcessingPayment) {
            console.log('Payment already in progress');
            return;
          }
    
        try {
            setIsProcessingPayment(true);
            setModalMessage('Processing payment...');

            let customerId = null;
    
            const customerSearchResponse = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${checkIn.email}'`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer sk_test_4eC39HqLyjWDarjtT1zdp7dc`,  // Reemplaza con tu clave secreta de Stripe
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
                        name: `${checkIn.external_reference || ''} ${checkIn.customer || ''}`.trim()
                    }),
                });
    
                const customerCreationData = await customerCreationResponse.json();
    
                if (customerCreationData.error) {
                    console.log('Error al crear cliente:', customerCreationData.error);
                    setModalMessage('Error creating customer');
                    setIsProcessingPayment(false);
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
                receiptEmail: checkIn.email,
            });
    
            if (createError || !paymentIntent) {
                console.log("Error al crear PaymentIntent:", createError);
                Alert.alert('Payment Error', `Failed to create payment intent: ${createError?.message || 'Unknown error'}`);
                setIsProcessingPayment(false);
                return;
            }
    
            console.log("PaymentIntent creado:", paymentIntent);

            setModalMessage('Please insert or tap the card on the reader');
    
            // Paso 4: Recoge el método de pago
            const { error: collectError } = await collectPaymentMethod({ paymentIntent });
            if (collectError) {
                console.log("Error al recoger el método de pago:", collectError);
                Alert.alert('Payment Error', `Failed to collect payment: ${collectError.message}`);
                setIsProcessingPayment(false);
                return;
            }
    
            console.log("Método de pago recogido exitosamente");
            setModalMessage('Processing payment...');
    
            // Paso 5: Confirma el PaymentIntent
            const { paymentIntent: paymentConfirmation, error: confirmError } = await confirmPaymentIntent({ paymentIntent });
            if (confirmError || !paymentConfirmation) {
                console.log("Error al confirmar PaymentIntent:", confirmError);
                Alert.alert('Payment Error', `Failed to confirm payment: ${confirmError?.message || 'Unknown error'}`);
                setIsProcessingPayment(false);
                return;
            }
    
            console.log("PaymentIntent confirmado:", paymentConfirmation);

            // enviar pagado a bksn
            fetch('https://email.mvr-management.com/process_payment_bookens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    checkIn: checkIn
                }),
            });
    
            // Muestra la información del pago
            setPendingCheckIns((prevCheckIns) => prevCheckIns.filter(item => item.external_reference !== checkIn.external_reference));
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
                    onPress={() => handleConfirmPayment(item)}
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
                        
                        {(isConnecting || isDiscovering) ? (
                            <View style={styles.modalContent}>
                                <ActivityIndicator size="large" color="#3b82f6" style={styles.modalLoading} />
                                <Text style={styles.textDefault}>{isDiscovering ? "Discovering readers..." : "Connecting to reader..."}</Text>
                            </View>
                        ) : (
                            discoveredReaders.length > 0 ? (
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
                            )
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
                    <Text style={styles.modalTitleSucced}>Payment Successful</Text>
                    {paymentInfo && (
                    <View>
                        <Text style={styles.textDefault}>Customer: {paymentInfo.customer}</Text>
                        <Text style={styles.textDefault}>Property: {paymentInfo.property}</Text>
                        <Text style={styles.textDefault}>Amount: ${paymentInfo.amount}</Text>
                        <Text style={styles.textDefault}>Payment Method: {paymentInfo.paymentMethod}</Text>
                        <Text style={styles.textDefault}>Status: {paymentInfo.status}</Text>
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
                        <Text style={styles.textDefault}>{modalMessage}</Text>
                        <ActivityIndicator size="large" color="#3b82f6" style={styles.modalLoading} />
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isConfirmModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Confirm Payment</Text>
                        {selectedCheckIn && (
                        <>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Customer:</Text>
                                <Text style={styles.value}>{selectedCheckIn.customer}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Property:</Text>
                                <Text style={styles.value}>{selectedCheckIn.property}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Check-in:</Text>
                                <Text style={styles.value}>{selectedCheckIn.checkin}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Check-out:</Text>
                                <Text style={styles.value}>{selectedCheckIn.checkout}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Total:</Text>
                                <Text style={styles.value}>${selectedCheckIn.total}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Paid:</Text>
                                <Text style={styles.value}>${selectedCheckIn.paid}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.debtLabel}>Debt:</Text>
                                <Text style={styles.debtValue}>${selectedCheckIn.debt}</Text>
                            </View>
                        </>
                        )}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.confirmButton} onPress={() => selectedCheckIn && handlePayment(selectedCheckIn)}>
                                <Text style={styles.buttonText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  textDefault: {
    color: '#333',
  },
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
    color: '#333',
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
    color: 'black',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  modalTitleSucced: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3bc55e',
  },
  readerItem: {
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
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
infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
},
label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
},
value: {
    fontSize: 16,
    color: '#333',
},
debtLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ed6b75',
},
debtValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ed6b75', 
},
buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
},
confirmButton: {
    backgroundColor: '#3bc55e',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
},
cancelButton: {
    backgroundColor: '#f53b57',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
},
});

export default PendingCheckIns;