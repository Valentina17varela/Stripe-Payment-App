import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import axios from 'axios';

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

  const renderItem = ({ item }: { item: { customer: string; property: string; checkin: string; checkout: string; charge: number; external_id: string } }) => (
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
        <TouchableOpacity onPress={() => setModalVisible(true)}>
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
});

export default PendingCheckIns;