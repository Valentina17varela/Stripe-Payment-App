import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PendingCheckIns = () => {
  const [pendingCheckIns, setPendingCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readersList, setReadersList] = useState<{ id: string; label: string; device_type: string }[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedReader, setSelectedReader] = useState(null);

  useEffect(() => {
    fetchPendingCheckIns();
    fetchStripeReader();

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

  const fetchStripeReader = async () => {
    try {
      const response = await axios.get('https://email.mvr-management.com/stripe_readers');
      setReadersList(response.data.readers);
    } catch (err) {
      console.log('Error fetching data stripe:', error);
    }
  };

  const handlePayment = async (checkIn: { customer: any; property: any; charge: any }) => {
    Alert.alert('Payment successful');
  };

  const renderItem = ({ item }: { item: {
      external_id: string; customer: string; property: string; checkin: string; checkout: string; charge: number 
} }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.customer}</Text>
      <Text style={styles.subtitle}>{item.property}</Text>
      <Text>{item.checkin} - {item.checkout}</Text>
      <View style={styles.footerContainer}>
        <Text style={styles.charge}>${item.charge}</Text>
        <TouchableOpacity style={styles.button} onPress={() => handlePayment(item)}>
          <MaterialIcons name="add-card" size={16} color="#fff" />
          <Text style={styles.buttonText}>Process Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return loading ? (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
    </View>
  ) : error ? (
    <View style={styles.centered}>
      <Text>{error}</Text>
    </View>
  ) : (
    <FlatList data={pendingCheckIns} renderItem={renderItem} keyExtractor={(item) => item.external_id} />
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  charge: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#3bc55e',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PendingCheckIns;