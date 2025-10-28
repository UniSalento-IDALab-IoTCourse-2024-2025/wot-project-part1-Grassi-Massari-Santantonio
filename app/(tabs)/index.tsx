import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Ottieni le dimensioni dello schermo per un layout responsive
const { width } = Dimensions.get('window');

type Dish = {
  id: string;
  name: string;
  rating: string;
  price: string;
  image: string;
  vendor_id: string;
};

type Vendor = {
  id: string;
  name: string;
  screen: string;
  city: string;
  province: string;
  address: string;
  image: string;
};

const Home = () => {
  const router = useRouter();
  
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState<Vendor[]>([]);
  const [popularItems, setPopularItems] = useState<Dish[]>([]);
  const [host, setHost] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica host/IP da AsyncStorage
  useEffect(() => {
    const loadHost = async () => {
      try {
        const ip = await AsyncStorage.getItem('ip');
        if (ip) setHost(ip.trim());
      } catch (error) {
        console.error("Errore nel caricamento IP:", error);
      }
    };

    loadHost();
  }, []);

  // Funzione per caricare i dati
  const fetchData = useCallback(async () => {
    if (!host) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Carica venditori
      const vendorsResponse = await fetch(`http://${host}:3000/vendors`);
      if (!vendorsResponse.ok) throw new Error(`Errore API: ${vendorsResponse.status}`);
      const vendorsData: Vendor[] = await vendorsResponse.json();
      setCategories(vendorsData);

      // Carica piatti popolari
      const dishesResponse = await fetch(`http://${host}:3000/best-dishes`);
      if (!dishesResponse.ok) throw new Error(`Errore API: ${dishesResponse.status}`);
      const dishesData: Dish[] = await dishesResponse.json();
      setPopularItems(dishesData);
      
    } catch (err) {
      console.error("Errore nella richiesta:", err);
      setError('Errore nel caricamento dei dati. Verifica la connessione o l\'indirizzo IP.');
    } finally {
      setLoading(false);
    }
  }, [host]);

  useEffect(() => {
    if (host) fetchData();
  }, [host, fetchData]);

  const filteredCategories = categories.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity 
      style={styles.categoryBox} 
      onPress={() => router.push({
        pathname: '/menuScreen',
        params: { 
          vendorId: item.id, 
          vendorName: item.name 
        }
      })}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.categoryImage} 
        defaultSource={require('../../assets/placeholder.png')}
      />
      <Text style={styles.categoryText} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
      <Text style={styles.categorySubText} numberOfLines={1} ellipsizeMode="tail">Città: {item.city}</Text>
      <Text style={styles.categorySubText} numberOfLines={1} ellipsizeMode="tail">Indirizzo: {item.address}</Text>
      <Text style={styles.categorySubText} numberOfLines={1} ellipsizeMode="tail">Provincia: {item.province}</Text>
    </TouchableOpacity>
  );

  const renderDishItem = ({ item }: { item: Dish }) => (
    <View style={styles.popularItem}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.popularImage}
        defaultSource={require('../../assets/placeholder.png')}
      />
      <Text style={styles.popularName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
      <Text style={styles.popularPrice}>{item.price}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text style={styles.loadingText}>Caricamento dati in corso...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-triangle" size={50} color="#E74C3C" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
          <Text style={styles.retryText}>Riprova</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          //onPress={() => router.push('/settings')} 
          onPress={() => router.push('/user')} 
          style={styles.settingsButton}
        >
          <Text style={styles.settingsText}>Verifica impostazioni IP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header fisso */}
      <View style={styles.header}>
        <Text style={styles.heading}>FASTGO</Text>
        <TouchableOpacity 
          //onPress={() => router.push('/orders')}
          onPress={() => router.push('/user')}
          style={styles.riderButton}
        >
          <Icon name="motorcycle" size={31} color="#27AE60" />
        </TouchableOpacity>
      </View>

      {/* Contenuto scrollabile */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TextInput 
          style={styles.searchBar} 
          placeholder="Cerca un ristorante..." 
          placeholderTextColor="#9CA3AF"
          value={searchText} 
          onChangeText={setSearchText}
        />

        {searchText.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>RISULTATI RICERCA</Text>
            {filteredCategories.length > 0 ? (
              <View style={styles.listContainer}>
                <FlatList
                  data={filteredCategories}
                  horizontal
                  keyExtractor={(item) => item.id}
                  renderItem={renderVendorItem}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  snapToInterval={width * 0.75}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.noResultsText}>Nessun risultato trovato</Text>
              </View>
            )}
          </>
        )}

        <Text style={styles.sectionHeading}>RISTORANTI PRONTI ALLA CONSEGNA</Text>
        <View style={styles.listContainer}>
          <FlatList
            data={categories}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={renderVendorItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={width * 0.75}
          />
        </View>

        <Text style={styles.sectionHeading}>I PIATTI PIÙ POPOLARI</Text>
        <View style={styles.popularListContainer}>
          <FlatList
            data={popularItems}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={renderDishItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularListContent}
            snapToInterval={width * 0.55}
          />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 10,
    backgroundColor: "#F5F6F8",
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  heading: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1F2937",
    letterSpacing: 1.2,
  },
  riderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 20,
  },
  searchBar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 20,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  listContainer: {
    minHeight: 240,
    marginBottom: 20,
  },
  popularListContainer: {
    minHeight: 260,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 10,
    paddingRight: 16,
  },
  popularListContent: {
    paddingBottom: 20,
    paddingRight: 16,
  },
  categoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginRight: 16,
    width: width * 0.7,
    minWidth: 220,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  categoryImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  categorySubText: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 2,
  },
  popularItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginRight: 16,
    alignItems: "center",
    width: width * 0.5,
    minWidth: 180,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    justifyContent: 'space-between',
  },
  popularImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  popularName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 40,
  },
  popularPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    padding: 30,
  },
  errorText: {
    fontSize: 18,
    color: '#1F2937',
    marginVertical: 20,
    textAlign: 'center',
    lineHeight: 26,
  },
  retryButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 10,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  settingsButton: {
    marginTop: 20,
    padding: 10,
  },
  settingsText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default Home;