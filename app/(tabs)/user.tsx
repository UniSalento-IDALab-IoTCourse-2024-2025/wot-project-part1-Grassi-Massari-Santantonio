import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function UserScreen() {
  const router = useRouter();
    const { signOut, isLoading } = useAuth();
 
    const handleLogout = async () => {
       
    
        try {
          await signOut();
        } catch (e: any) {
          Alert.alert('Logout fallito', e.message);
        }
      };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 User</Text>

     

      <TouchableOpacity
        style={[styles.button, styles.logout]}
          onPress={handleLogout} 
      
      >
        <Text style={styles.buttonText}>🚪 Esci</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
  },
  logout: {
    marginTop: 40,
    backgroundColor: '#fcc',
  },
});
