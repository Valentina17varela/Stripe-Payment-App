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
  Alert
} from 'react-native';

interface Guest {
  id: number;
  guest: string;
  room: string;
  breakfasts_left: number;
  source: string;
}

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

const Breakfasts = () => {
  const [breakfasts, setBreakfasts] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [modalInfo, setModalInfo] = useState(false);

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
        setModalInfo(true);
        setTimeout(() => {
          setModalInfo(false);
        }, 1500);
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

  const handleAddNewGuest = () => {
    console.log('Add new guest');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
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
              <Text style={styles.modalTitleSucced}>Breakfast(s) used successfully</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    // Removed flex: 1 to allow container to shrink to content
  },
  scrollContent: {
    flexGrow: 0, // Prevents scroll view from expanding beyond content
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
});

export default Breakfasts;