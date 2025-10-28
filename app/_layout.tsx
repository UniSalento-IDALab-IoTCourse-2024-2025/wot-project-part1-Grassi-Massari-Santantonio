import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

function InnerLayout() {
  const { ip, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // aspetta che AsyncStorage venga letto
    
    if (!ip) {
      router.replace('/ip'); // reinderizza alla pagina di login
    } else {
      router.replace('/(tabs)');
    }
  }, [ip, isLoading, router]);

  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <AuthProvider>
      <ThemeProvider value={theme}>
        <SafeAreaView style={styles.container}>
          <InnerLayout />
          <Slot /> 
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 38 }
});