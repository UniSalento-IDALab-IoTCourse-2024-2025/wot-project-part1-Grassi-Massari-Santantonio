import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator,
  Alert,
  Modal
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

type CartItem = {
  id: number;
  name: string;
  price: string;
  quantity: number;
  totalPrice: number;
};

type VendorInfo = {
  id: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
};

const PaymentScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const vendorId = params.vendorId as string;
  const vendorName = params.vendorName as string;
  const totalPrice = params.totalPrice as string || "0.00";
  
  const [selectedMethod, setSelectedMethod] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isProcessing, setProcessing] = useState(false);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.9028,
    longitude: 12.4964,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [mapModalVisible, setMapModalVisible] = useState(true); // Aperta di default
  const [manualLocation, setManualLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [address, setAddress] = useState("");
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied">("loading");

  // Carica i dati iniziali
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carica host/IP da AsyncStorage
        const host = await AsyncStorage.getItem('ip');
        if (!host) throw new Error("Host non configurato");

        // Carica il carrello
        const savedCart = await AsyncStorage.getItem(`cart-${vendorId}`);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }

        // Ottieni informazioni sul venditore
        const vendorRes = await fetch(`http://${host}:3000/vendor-by-name/${encodeURIComponent(vendorName)}`);
        if (!vendorRes.ok) throw new Error("Errore nel caricamento del ristorante");
        const vendorData: VendorInfo = await vendorRes.json();
        setVendorInfo(vendorData);

        // Imposta la regione della mappa sul ristorante
        setMapRegion({
          latitude: vendorData.latitude,
          longitude: vendorData.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        // Prova a ottenere la posizione corrente
        await requestLocationPermission();

      } catch (error) {
        console.error("Errore nel caricamento iniziale:", error);
        const errorMessage = typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
        Alert.alert("Errore", errorMessage || "Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [vendorId, vendorName]);

  // Richiedi permessi di localizzazione
  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationStatus("granted");
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        setManualLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        // Ottieni l'indirizzo dalla posizione
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (addressResponse.length > 0) {
          const addr = addressResponse[0];
          setAddress(`${addr.street || ''} ${addr.streetNumber || ''}, ${addr.postalCode || ''} ${addr.city || ''}`);
        }
      } else {
        setLocationStatus("denied");
        Alert.alert(
          'Posizione richiesta',
          'Per completare la consegna, seleziona la tua posizione sulla mappa',
          [{ text: 'OK', onPress: () => setMapModalVisible(true) }]
        );
      }
    } catch (error) {
      console.error("Errore nel recupero della posizione:", error);
      setLocationStatus("denied");
      setMapModalVisible(true);
    }
  };

  const handleMapPress = async (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setManualLocation(coords);
    
    // Ottieni l'indirizzo dalla posizione selezionata
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      
      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        setAddress(`${addr.street || ''} ${addr.streetNumber || ''}, ${addr.postalCode || ''} ${addr.city || ''}`);
      }
    } catch (error) {
      console.error("Errore nel reverse geocoding:", error);
      setAddress("Indirizzo non disponibile");
    }
  };

  const handlePayment = async () => {
    if (!isPaymentEnabled || !vendorInfo) return;
    
    setProcessing(true);
    
    try {
      // Verifica che abbiamo una posizione
      if (!userLocation && !manualLocation) {
        throw new Error("Devi selezionare una posizione per la consegna");
      }

      const deliveryLocation = userLocation?.coords || manualLocation;
      if (!deliveryLocation) return;

      const host = await AsyncStorage.getItem('ip');
      if (!host) throw new Error("Host non configurato");

      // Prepara dati ordine per il backend
      const orderData = {
        originCoords: {
          latitude: deliveryLocation.latitude,
          longitude: deliveryLocation.longitude
        },
        destinationCoords: {
          latitude: vendorInfo.latitude,
          longitude: vendorInfo.longitude
        },
        destinationAddress: `${vendorInfo.address}, ${vendorInfo.city}`,
        deliveryAddress: address
      };

      // Invia ordine al backend
      const completeRes = await fetch(`http://${host}:3000/complete-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedData: orderData })
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || "Errore nell'invio dell'ordine");
      }

      // Salva localmente i dati dell'ordine
      const currentDate = new Date();
      const orderLocalData = {
        vendorId,
        vendorName,
        date: currentDate.toLocaleDateString(),
        time: currentDate.toLocaleTimeString(),
        items: cart,
        total: parseFloat(totalPrice),
        paymentMethod: selectedMethod,
        deliveryAddress: address
      };
      
      await AsyncStorage.setItem(
        `order-${vendorId}-${currentDate.getTime()}`, 
        JSON.stringify(orderLocalData)
      );
      
      // Rimuovi carrello
      await AsyncStorage.removeItem(`cart-${vendorId}`);
      
      setPaymentConfirmed(true);
      
      // Reindirizzamento dopo 2 secondi
      setTimeout(() => {
        router.replace({
          pathname: "/orders",
          params: { 
            success: "true",
            vendorName,
            total: totalPrice
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error("Errore nel pagamento:", error);
      const errorMessage = typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : undefined;
      Alert.alert("Errore", errorMessage || "Si è verificato un errore durante il pagamento");
    } finally {
      setProcessing(false);
    }
  };

  const isPaymentEnabled =
    selectedMethod === "Contanti" ||
    (selectedMethod === "PayPal" && paypalEmail.includes("@") && paypalEmail.includes(".")) ||
    (selectedMethod === "Carta di credito" && 
     cardNumber.length === 16 && 
     cardExpiry.length === 5 && 
     cardCVV.length === 3);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Caricamento dati pagamento...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#E5E7EB" />
        </TouchableOpacity>
        <Text style={styles.title}>Pagamento</Text>
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Ristorante: {vendorName}</Text>
        <Text style={styles.summaryText}>Totale: €{totalPrice}</Text>
      </View>

      {/* Sezione posizione */}
      <Text style={styles.sectionTitle}>Posizione di consegna</Text>
      <TouchableOpacity 
        style={styles.locationCard}
        onPress={() => setMapModalVisible(true)}
      >
        {address ? (
          <View>
            <Text style={styles.addressText}>{address}</Text>
            <Text style={styles.changeLocationText}>Modifica posizione</Text>
          </View>
        ) : (
          <View style={styles.locationPrompt}>
            <Icon name="map-marker" size={24} color="#6366F1" />
            <Text style={styles.locationPromptText}>Seleziona posizione di consegna</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal per selezione posizione - APERTO DI DEFAULT */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (address) setMapModalVisible(false);
          else Alert.alert("Posizione richiesta", "Devi selezionare una posizione per procedere");
        }}
      >
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Seleziona posizione di consegna</Text>
            <TouchableOpacity onPress={() => {
              if (address) setMapModalVisible(false);
              else Alert.alert("Posizione richiesta", "Devi selezionare una posizione per procedere");
            }}>
              <Icon name="times" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          {vendorInfo && (
            <MapView
              style={styles.map}
              region={mapRegion}
              onPress={handleMapPress}
            >
              <Marker
                coordinate={{
                  latitude: vendorInfo.latitude,
                  longitude: vendorInfo.longitude
                }}
                title={vendorName}
                description={`${vendorInfo.address}, ${vendorInfo.city}`}
              >
                <Icon name="cutlery" size={24} color="#E11D48" />
              </Marker>
              
              {manualLocation && (
                <Marker
                  coordinate={manualLocation}
                  title="Consegna qui"
                  pinColor="#6366F1"
                />
              )}
              
              {userLocation?.coords && (
                <Marker
                  coordinate={{
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude
                  }}
                  title="La tua posizione"
                  pinColor="#10B981"
                />
              )}
            </MapView>
          )}
          
          <View style={styles.mapFooter}>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={requestLocationPermission}
            >
              <Icon name="location-arrow" size={20} color="#FFF" />
              <Text style={styles.locationButtonText}>Usa la mia posizione</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmLocationButton}
              onPress={() => {
                if (address) setMapModalVisible(false);
                else Alert.alert("Posizione richiesta", "Devi selezionare una posizione per procedere");
              }}
            >
              <Text style={styles.confirmLocationText}>Conferma Posizione</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sezione metodo di pagamento */}
      <Text style={styles.sectionTitle}>Metodo di pagamento</Text>
      <View style={styles.dropdownContainer}>
        <Picker
          selectedValue={selectedMethod}
          onValueChange={setSelectedMethod}
          style={styles.picker}
          dropdownIconColor="#E5E7EB"
        >
          <Picker.Item label="Seleziona metodo" value="" enabled={false} />
          <Picker.Item label="Carta di credito" value="Carta di credito" />
          <Picker.Item label="Contanti alla consegna" value="Contanti" />
          <Picker.Item label="PayPal" value="PayPal" />
        </Picker>
      </View>

      {selectedMethod === "PayPal" && (
        <View style={styles.paymentDetails}>
          <Text style={styles.inputLabel}>Email PayPal</Text>
          <TextInput
            style={styles.input}
            placeholder="tua@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            value={paypalEmail}
            onChangeText={setPaypalEmail}
          />
        </View>
      )}

      {selectedMethod === "Carta di credito" && (
        <View style={styles.paymentDetails}>
          <Text style={styles.inputLabel}>Numero Carta</Text>
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={16}
            value={cardNumber}
            onChangeText={setCardNumber}
          />
          
          <View style={styles.row}>
            <View style={styles.halfInputContainer}>
              <Text style={styles.inputLabel}>Scadenza</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="MM/AA"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={5}
                value={cardExpiry}
                onChangeText={text => {
                  if (text.length === 2 && !text.includes('/')) {
                    setCardExpiry(text + '/');
                  } else {
                    setCardExpiry(text);
                  }
                }}
              />
            </View>
            
            <View style={styles.halfInputContainer}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="123"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry={true}
                value={cardCVV}
                onChangeText={setCardCVV}
              />
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={[
          styles.paymentButton, 
          (!isPaymentEnabled || isProcessing || !address) && styles.disabledButton
        ]}
        onPress={handlePayment}
        disabled={!isPaymentEnabled || isProcessing || !address}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.paymentButtonText}>Conferma pagamento</Text>
        )}
      </TouchableOpacity>

      {paymentConfirmed && (
        <View style={styles.confirmationContainer}>
          <Icon name="check-circle" size={60} color="#22C55E" />
          <Text style={styles.confirmationText}>Pagamento confermato!</Text>
          <Text style={styles.redirectText}>Reindirizzamento agli ordini...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#111827",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  summaryContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },
  summaryText: {
    fontSize: 18,
    color: "#E5E7EB",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: "#E5E7EB",
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#374151",
  },
  locationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPromptText: {
    marginLeft: 10,
    color: "#9CA3AF",
    fontSize: 16,
  },
  addressText: {
    fontSize: 16,
    color: "#E5E7EB",
    marginBottom: 5,
  },
  changeLocationText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  picker: {
    color: "#F3F4F6",
    height: 50,
  },
  paymentDetails: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    color: "#E5E7EB",
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    padding: 14,
    color: "#F9FAFB",
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInputContainer: {
    width: '48%',
  },
  halfInput: {
    marginBottom: 0,
  },
  paymentButton: {
    backgroundColor: "#6366F1",
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: "#4B5563",
    opacity: 0.7,
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  confirmationContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  confirmationText: {
    marginTop: 15,
    fontSize: 22,
    fontWeight: "700",
    color: "#22C55E",
    textAlign: 'center',
  },
  redirectText: {
    marginTop: 10,
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1F2937',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    padding: 20,
    backgroundColor: '#1F2937',
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  locationButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  confirmLocationButton: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  confirmLocationText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PaymentScreen;