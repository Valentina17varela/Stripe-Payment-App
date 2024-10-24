import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const Breakfasts = () => {
  const [breakfasts, setBreakfasts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleUseBreakfast = (id: any) => {
    console.log('Use breakfast for id:', id);
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
                  onPress={() => handleUseBreakfast(item.id)}
                >
                  <Text style={styles.addButtonText}>Use Breakfast</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    flex: 1.5,
    alignItems: 'flex-end',
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
});

export default Breakfasts;