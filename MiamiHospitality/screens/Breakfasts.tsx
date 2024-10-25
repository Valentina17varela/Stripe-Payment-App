import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useStripeTerminal, StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';

interface Guest {
  id: number;
  guest: string;
  room: string;
  breakfasts_left: number;
  source: string;
}

interface AddGuestModalProps {
  visible: boolean;
  onClose: () => void;
  onAddGuest: (guest: { 
    guest: string; 
    room: string; 
    breakfasts_left: number; 
    source: string; 
  }) => void;
}

const pricePerBreakfast = 15;

const BreakfastModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  guestName, 
  maxBreakfasts 
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  guestName: string;
  maxBreakfasts: number;
}) => {
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = () => {
    if (quantity < maxBreakfasts) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Use Breakfast</Text>
          
          <Text style={styles.modalText}>
            How many breakfasts would you like to use for {guestName}?
          </Text>

          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={[styles.quantityButton, quantity <= 1 && styles.disabledQuantityButton]}
              onPress={handleDecrement}
              disabled={quantity <= 1}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.quantityText}>{quantity}</Text>

            <TouchableOpacity 
              style={[styles.quantityButton, quantity >= maxBreakfasts && styles.disabledQuantityButton]}
              onPress={handleIncrement}
              disabled={quantity >= maxBreakfasts}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => {
              onConfirm(quantity);
              setQuantity(1); // Reset quantity after confirming
            }}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const AddGuestModal = ({ visible, onClose, onAddGuest }: AddGuestModalProps) => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [breakfasts, setBreakfasts] = useState(1);
  const [source, setSource] = useState('Hotel');

  const handleIncrement = () => {
    setBreakfasts(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (breakfasts > 1) {
      setBreakfasts(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !room.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    onAddGuest({
      guest: name,
      room,
      breakfasts_left: breakfasts,
      source
    });

    setName('');
    setRoom('');
    setBreakfasts(1);
    setSource('Hotel');
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Guest</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter guest name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Room</Text>
            <TextInput
              style={styles.input}
              value={room}
              onChangeText={setRoom}
              placeholder="Enter room number"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Breakfasts</Text>
          </View>
          <View style={styles.formGroupQuantity}>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                style={[styles.quantityButton, breakfasts <= 1 && styles.disabledQuantityButton]}
                onPress={handleDecrement}
                disabled={breakfasts <= 1}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>

              <Text style={styles.quantityText}>{breakfasts}</Text>

              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={handleIncrement}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Source</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={source}
                onValueChange={(itemValue) => setSource(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Hotel" value="Hotel" />
                <Picker.Item label="MVR" value="MVR" />
                <Picker.Item label="Property Manager" value="Property Manager" />
              </Picker>
            </View>
          </View>

          <View style={styles.priceInfo}>
            <Text style={styles.priceText}>Price per breakfast: ${pricePerBreakfast}</Text>
            <Text style={styles.totalText}>Total: ${pricePerBreakfast * breakfasts}</Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              Charge ${pricePerBreakfast * breakfasts}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Breakfasts = () => {
  const [breakfasts, setBreakfasts] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [modalInfo, setModalInfo] = useState(false);
  const [message, setMessage] = useState('');
  const [addGuestModalVisible, setAddGuestModalVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { createPaymentIntent, collectPaymentMethod, confirmPaymentIntent } = useStripeTerminal();

  useEffect(() => {
    fetchBreakfasts();
  }, []);

  const fetchBreakfasts = async () => {
    try {
      const response = await fetch('https://email.mvr-management.com/breakfasts');
      const json = await response.json();
      setBreakfasts(json.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching breakfasts:', error);
      setLoading(false);
    }
  };

  const handleUseBreakfast = async (quantity: number) => {
    if (!selectedGuest) return;

    try {
      setUpdating(true);
      const response = await fetch('https://email.mvr-management.com/update_breakfast', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedGuest.id,
          breakfasts_used: quantity
        }),
      });

      const data = await response.json();
      
      if (response.status === 200) {
        await fetchBreakfasts();
        setModalVisible(false);
        setMessage('Breakfast(s) used successfully');
        setModalInfo(true);
        setTimeout(() => {
          setModalInfo(false);
        }, 2000);
      } else if (response.status === 400) {
        Alert.alert('Error', 'Not enough breakfast available');
      } else {
        Alert.alert('Error', 'An error occurred while processing the request');
      }
    } catch (error) {
      console.error('Error updating breakfast:', error);
      Alert.alert('Error', 'Error updating breakfast');
    } finally {
      setUpdating(false);
      setSelectedGuest(null);
    }
  };

  const handleAddGuest = async (guest: {
    guest: string;
    room: string;
    breakfasts_left: number;
    source: string;
  }) => {

    if (isProcessingPayment) {
      console.log('Payment already in progress');
      return;
    }

  try {
      setIsProcessingPayment(true);
      setModalMessage('Processing payment...');

      let customerId = null;

      const customerSearchResponse = await fetch(`https://api.stripe.com/v1/customers/search?query=name:'${guest.guest}'`, {
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
                  name: guest.guest,
              }),
          });

          const customerCreationData = await customerCreationResponse.json();

          if (customerCreationData.error) {
              console.log('Error al crear cliente:', customerCreationData.error);
              setModalMessage('Error creating customer');
              setIsProcessingPayment(false);
              setAddGuestModalVisible(false)
              return;
          }

          customerId = customerCreationData.id;
      }

      // Paso 3: Crea un PaymentIntent con el ID del cliente
      const { paymentIntent, error: createError } = await createPaymentIntent({
          amount: pricePerBreakfast * guest.breakfasts_left * 100,
          currency: 'usd',
          paymentMethodTypes: ['card_present'],
          captureMethod: 'automatic',
          customer: customerId,
      });

      if (createError || !paymentIntent) {
          console.log("Error al crear PaymentIntent:", createError);
          Alert.alert('Payment Error', `Failed to create payment intent: ${createError?.message || 'Unknown error'}`);
          setIsProcessingPayment(false);
          setAddGuestModalVisible(false)
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
          setAddGuestModalVisible(false)
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
          setAddGuestModalVisible(false)
          return;
      }

      console.log("PaymentIntent confirmado:", paymentConfirmation);

      setIsProcessingPayment(false);

      try {
        setUpdating(true);
        const response = await fetch('https://email.mvr-management.com/add_breakfast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(guest),
        });
    
        if (response.status === 200) {
          await fetchBreakfasts();
          setAddGuestModalVisible(false);
          setMessage('Guest added successfully');
          setModalInfo(true);
          setTimeout(() => {
            setModalInfo(false);
          }, 2000);
        } else {
          Alert.alert('Error', 'Failed to add guest');
          setAddGuestModalVisible(false)
        }
      } catch (error) {
        console.error('Error adding guest:', error);
        Alert.alert('Error', 'An error occurred while adding the guest');
        setAddGuestModalVisible(false)
      } finally {
        setUpdating(false);
      }
    } catch (err) {
        console.error('Error processing payment:', err);
        Alert.alert('Payment Error', 'An error occurred while processing the payment');
        setIsProcessingPayment(false);
        setAddGuestModalVisible(false)
    }
  };
  
  const handleAddNewGuest = () => {
    setAddGuestModalVisible(true);
  };

  const fetchTokenProvider = async () => {
    const response = await fetch(`https://email.mvr-management.com/connection_token_arya`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { secret } = await response.json();
    return secret;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <StripeTerminalProvider logLevel='verbose' tokenProvider={fetchTokenProvider}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Arya Breakfast Admin</Text>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerText, styles.nameColumn]}>NAME</Text>
            <Text style={[styles.headerText, styles.roomColumn]}>ROOM</Text>
            <Text style={[styles.headerText, styles.breakfastsColumn]}>BREAKFASTS LEFT</Text>
            <Text style={[styles.headerText, styles.sourceColumn]}>SOURCE</Text>
            <Text style={[styles.headerText, styles.actionColumn]}>ACTION</Text>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {breakfasts.map((item: any) => (
              <View key={item.id} style={styles.row}>
                <Text style={[styles.text, styles.nameColumn]}>{item.guest}</Text>
                <Text style={[styles.text, styles.roomColumn]}>{item.room}</Text>
                <Text style={[styles.text, styles.breakfastsColumn]}>{item.breakfasts_left}</Text>
                <Text style={[styles.text, styles.sourceColumn]}>{item.source}</Text>
                <View style={styles.actionColumn}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      setSelectedGuest(item);
                      setModalVisible(true);
                    }}
                    disabled={updating || item.breakfasts_left <= 0}
                  >
                    <Text style={styles.addButtonText}>
                      {updating ? 'Updating...' : 'Use Breakfast'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNewGuest}
        >
          <Text style={styles.addButtonText}>Add New Guest</Text>
        </TouchableOpacity>

        <BreakfastModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedGuest(null);
          }}
          onConfirm={handleUseBreakfast}
          guestName={selectedGuest?.guest || ''}
          maxBreakfasts={selectedGuest?.breakfasts_left || 0}
        />

        <Modal
          visible={modalInfo}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalInfo(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitleSucced}>{message}</Text>
            </View>
          </View>
        </Modal>

        <AddGuestModal
          visible={addGuestModalVisible}
          onClose={() => setAddGuestModalVisible(false)}
          onAddGuest={handleAddGuest}
        />

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

      </SafeAreaView>
    </StripeTerminalProvider>
  );
};

const styles = StyleSheet.create({
  textDefault: {
    color: '#333',
  },
  modalLoading: {
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalTitleSucced: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3bc55e',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
    color: 'black'
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
  },
  scrollContent: {
    flexGrow: 0,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  text: {
    fontSize: 14,
    color: '#111827',
  },
  nameColumn: {
    flex: 2,
    paddingRight: 8,
    fontWeight: 'bold',
  },
  roomColumn: {
    flex: 1,
    paddingRight: 8,
  },
  breakfastsColumn: {
    flex: 1.5,
    paddingRight: 8,
  },
  sourceColumn: {
    flex: 1,
    paddingRight: 8,
  },
  actionColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 120,
  },
  addButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  quantityButton: {
    backgroundColor: '#F3F4F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    color: '#111827',
  },
  disabledQuantityButton: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 24,
    color: '#111827',
  },
  confirmButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    width: '100%',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
    width: '100%'
  },
  formGroupQuantity: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: 'black'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: 'black',
  },
  priceInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 6,
    paddingHorizontal: 24,
    width: '100%',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Breakfasts;