import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

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
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [address, setAddress] = useState("");
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied">("loading");
  const [locationRequired, setLocationRequired] = useState(true);

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

        // Prova a ottenere la posizione corrente automaticamente
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

  // Funzione per formattare l'indirizzo
  const formatAddress = (addressComponents: Location.LocationGeocodedAddress) => {
    const parts = [];
    
    if (addressComponents.street) {
      parts.push(addressComponents.street);
    }
    if (addressComponents.streetNumber) {
      parts.push(addressComponents.streetNumber);
    }
    if (addressComponents.postalCode) {
      parts.push(addressComponents.postalCode);
    }
    if (addressComponents.city) {
      parts.push(addressComponents.city);
    }
    if (addressComponents.region) {
      parts.push(addressComponents.region);
    }
    
    // Se non ci sono parti valide, usa le coordinate
    if (parts.length === 0) {
      return null;
    }
    
    return parts.join(', ');
  };

  // Richiede i permessi di localizzazione
  const requestLocationPermission = async () => {
    try {
      setLocationStatus("loading");
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationStatus("granted");
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        setSelectedLocation(coords);
        
        
        console.log(" COORDINATE POSIZIONE AUTOMATICA:", coords);
        
        // Ottieni l'indirizzo dalla posizione
        try {
          const addressResponse = await Location.reverseGeocodeAsync(coords);
          
          if (addressResponse.length > 0) {
            const formattedAddress = formatAddress(addressResponse[0]);
            if (formattedAddress) {
              setAddress(formattedAddress);
              console.log(" INDIRIZZO AUTOMATICO:", formattedAddress);
              setLocationRequired(false);
            } else {
              // Usa le coordinate se non si riesce a ottenere l'indirizzo
              const fallbackAddress = `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`;
              setAddress(fallbackAddress);
              console.log(" INDIRIZZO FALLBACK:", fallbackAddress);
              setLocationRequired(false);
            }
          } else {
            // Usa le coordinate se non si ottiene risposta
            const fallbackAddress = `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`;
            setAddress(fallbackAddress);
            console.log("INDIRIZZO FALLBACK (no response):", fallbackAddress);
            setLocationRequired(false);
          }
        } catch (geocodeError) {
          console.error("Errore nel reverse geocoding automatico:", geocodeError);
          // Usa le coordinate come fallback
          const fallbackAddress = `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`;
          setAddress(fallbackAddress);
          console.log(" INDIRIZZO FALLBACK (errore):", fallbackAddress);
          setLocationRequired(false);
        }
      } else {
        setLocationStatus("denied");
        // Mostra automaticamente la mappa per la selezione manuale
        setMapModalVisible(true);
      }
    } catch (error) {
      console.error("Errore nel recupero della posizione:", error);
      setLocationStatus("denied");
      setMapModalVisible(true);
    }
  };

  const handleMapPress = async (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
    
    console.log("COORDINATE SELEZIONATE SULLA MAPPA:", coords);
    
    // Ottiene l'indirizzo dalla posizione selezionata
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      
      console.log("🔍 RISPOSTA REVERSE GEOCODING:", addressResponse);
      
      if (addressResponse.length > 0) {
        const formattedAddress = formatAddress(addressResponse[0]);
        if (formattedAddress) {
          setAddress(formattedAddress);
          console.log(" INDIRIZZO FORMATTATO:", formattedAddress);
        } else {
          // Usa le coordinate se non si riesce a formattare l'indirizzo
          const fallbackAddress = `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`;
          setAddress(fallbackAddress);
          console.log(" INDIRIZZO FALLBACK (formato failed):", fallbackAddress);
        }
      } else {
        // Usa le coordinate se non si ottiene risposta
        const fallbackAddress = `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`;
        setAddress(fallbackAddress);
        console.log("INDIRIZZO FALLBACK (no geocoding):", fallbackAddress);
      }
    } catch (error) {
      console.error("Errore nel reverse geocoding:", error);
      // Usa sempre le coordinate come fallback
      const fallbackAddress = `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`;
      setAddress(fallbackAddress);
      console.log("INDIRIZZO FALLBACK (errore geocoding):", fallbackAddress);
    }
  };

  const confirmLocation = () => {
    if (selectedLocation && address) {
      console.log("POSIZIONE CONFERMATA:");
      console.log("   Coordinate:", selectedLocation);
      console.log("   Indirizzo:", address);
      setLocationRequired(false);
      setMapModalVisible(false);
    } else {
      Alert.alert("Posizione richiesta", "Tocca sulla mappa per selezionare una posizione");
    }
  };

  const handlePayment = async () => {
    if (!isPaymentEnabled || !vendorInfo || !selectedLocation) return;
    
    setProcessing(true);
    
    try {
      const host = await AsyncStorage.getItem('ip');
      if (!host) throw new Error("Host non configurato");

      // LOG finale delle coordinate per il pagamento
      console.log("  INVIO ORDINE CON COORDINATE:");
      console.log("   Vendor ID:", vendorInfo.id);
      console.log("   Origin (consegna):", selectedLocation);
      console.log("   Destination (ristorante):", {
        latitude: vendorInfo.latitude,
        longitude: vendorInfo.longitude
      });
      console.log("   Indirizzo di consegna:", address);

      // Prepara dati ordine per il backend
    const orderData = {
      vendor_id: parseInt(vendorInfo.id),
      delivery_address: address,
      delivery_coords: selectedLocation
    };

     console.log(" PAYLOAD COMPLETO:", JSON.stringify({
      completedData: orderData
    }, null, 2));

      // Invia ordine al backend
      const completeRes = await fetch(`http://${host}:3000/send-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedData: orderData })
      });

        console.log("RESPONSE STATUS:", completeRes.status);
    console.log("RESPONSE STATUS TEXT:", completeRes.statusText);

          if (!completeRes.ok) {
      let errorMsg = "Errore nell'invio dell'ordine";
      try {
        const errorData = await completeRes.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        const text = await completeRes.text();
        errorMsg = text || errorMsg;
      }
      throw new Error(errorMsg);
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
        deliveryAddress: address,
        deliveryCoords: selectedLocation // Salva anche le coordinate
      };
      
      await AsyncStorage.setItem(
        `order-${vendorId}-${currentDate.getTime()}`, 
        JSON.stringify(orderLocalData)
      );
      
      // Rimuove i dati dal carrello
      await AsyncStorage.removeItem(`cart-${vendorId}`);
      
      setPaymentConfirmed(true);
      
      // Reindirizzamento dopo 2 secondi
      setTimeout(() => {
        router.replace({
          pathname: "./(tabs)/index",
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
    !locationRequired &&
    selectedLocation &&
    address &&
    (selectedMethod === "Contanti" ||
    (selectedMethod === "PayPal" && paypalEmail.includes("@") && paypalEmail.includes(".")) ||
    (selectedMethod === "Carta di credito" && 
     cardNumber.length === 16 && 
     cardExpiry.length === 5 && 
     cardCVV.length === 3));

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

     
      <Text style={styles.sectionTitle}>Posizione di consegna</Text>
      
      {locationRequired ? (
        <View style={styles.locationRequiredContainer}>
          <Icon name="map-marker" size={32} color="#EF4444" />
          <Text style={styles.locationRequiredText}>
            È necessario selezionare una posizione per la consegna
          </Text>
          <TouchableOpacity 
            style={styles.selectLocationButton}
            onPress={() => setMapModalVisible(true)}
          >
            <Text style={styles.selectLocationButtonText}>Seleziona posizione</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.locationCard}
          onPress={() => setMapModalVisible(true)}
        >
          <View style={styles.locationContent}>
            <Icon name="map-marker" size={20} color="#10B981" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.addressText}>{address}</Text>
              <Text style={styles.changeLocationText}>Tocca per modificare</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Modal per selezione posizione */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (!locationRequired) {
            setMapModalVisible(false);
          }
        }}
      >
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Seleziona posizione di consegna</Text>
            {!locationRequired && (
              <TouchableOpacity onPress={() => setMapModalVisible(false)}>
                <Icon name="times" size={24} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.mapInstructions}>
            Tocca sulla mappa per selezionare il punto di consegna
          </Text>
          
          {vendorInfo && (
            <MapView
              style={styles.map}
              initialRegion={mapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {/* Marker del ristorante */}
              <Marker
                coordinate={{
                  latitude: vendorInfo.latitude,
                  longitude: vendorInfo.longitude
                }}
                title={vendorName}
                description={`${vendorInfo.address}, ${vendorInfo.city}`}
              >
                <View style={styles.restaurantMarker}>
                  <Icon name="cutlery" size={20} color="#FFFFFF" />
                </View>
              </Marker>
              
              {/* Marker della posizione selezionata */}
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  title="Punto di consegna"
                  description={address}
                >
                  <View style={styles.deliveryMarker}>
                    <Icon name="home" size={20} color="#FFFFFF" />
                  </View>
                </Marker>
              )}
            </MapView>
          )}
          
          <View style={styles.mapFooter}>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={requestLocationPermission}
            >
              <Icon name="location-arrow" size={16} color="#FFF" />
              <Text style={styles.locationButtonText}>Usa la mia posizione</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmLocationButton,
                (!selectedLocation || !address) && styles.disabledButton
              ]}
              onPress={confirmLocation}
              disabled={!selectedLocation || !address}
            >
              <Text style={styles.confirmLocationText}>
                {selectedLocation && address ? 'Conferma Posizione' : 'Seleziona una posizione'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sezione metodo di pagamento - VISIBILE SOLO SE POSIZIONE SELEZIONATA */}
      {!locationRequired && (
        <>
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
                placeholder="1234567890123456"
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
              (!isPaymentEnabled || isProcessing) && styles.disabledButton
            ]}
            onPress={handlePayment}
            disabled={!isPaymentEnabled || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.paymentButtonText}>Conferma pagamento</Text>
            )}
          </TouchableOpacity>
        </>
      )}

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
  locationRequiredContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 24,
    marginBottom: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  locationRequiredText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '500',
  },
  selectLocationButton: {
    backgroundColor: "#6366F1",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  selectLocationButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 16,
    color: "#E5E7EB",
    marginBottom: 4,
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
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  mapInstructions: {
    padding: 16,
    backgroundColor: '#1F2937',
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  restaurantMarker: {
    backgroundColor: '#E11D48',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  deliveryMarker: {
    backgroundColor: '#6366F1',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapFooter: {
    padding: 20,
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
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
    marginLeft: 8,
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