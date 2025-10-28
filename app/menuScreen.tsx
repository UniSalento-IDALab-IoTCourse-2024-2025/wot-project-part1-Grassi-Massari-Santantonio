import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: string;
  rating: number;
  image?: string;
  quantity?: number;
  totalPrice?: number;
};

const MenuScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vendorId = params.vendorId as string;
  const vendorName = params.vendorName as string;

  const [cart, setCart] = useState<MenuItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
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
        setError("Errore di configurazione. Verifica le impostazioni IP.");
      }
    };

    loadHost();
  }, []);

  // Funzione per caricare il menu
  const fetchMenu = useCallback(async () => {
    if (!host) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${host}:3000/menu/${vendorId}`);
      if (!response.ok) throw new Error(`Errore API: ${response.status}`);
      
      const data: MenuItem[] = await response.json();
      setMenuItems(data);
    } catch (err) {
      console.error("Errore nel recupero del menu:", err);
      setError('Errore nel caricamento del menu. Verifica la connessione.');
    } finally {
      setLoading(false);
    }
  }, [host, vendorId]);

  useEffect(() => {
    if (host) fetchMenu();
  }, [host, fetchMenu]);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      const priceValue = parseFloat(item.price.replace("€", ""));
      
      let newCart;
      if (existingItem) {
        newCart = prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { 
                ...cartItem, 
                quantity: (cartItem.quantity || 1) + 1, 
                totalPrice: ((cartItem.quantity || 1) + 1) * priceValue 
              }
            : cartItem
        );
      } else {
        newCart = [...prevCart, { 
          ...item, 
          quantity: 1, 
          totalPrice: priceValue 
        }];
      }

      AsyncStorage.setItem(`cart-${vendorId}`, JSON.stringify(newCart));
      setCartCount(newCart.reduce((sum, item) => sum + (item.quantity || 1), 0));
      return newCart;
    });
  };

  // Carica il carrello all'avvio e quando lo schermo diventa attivo
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(`cart-${vendorId}`);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCart(parsed);
          setCartCount(parsed.reduce((sum: number, item: MenuItem) => sum + (item.quantity || 0), 0));
        }
      } catch (error) {
        console.error("Errore nel caricamento del carrello:", error);
      }
    };
    
    loadCart();
  }, [vendorId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text style={styles.loadingText}>Caricamento menu in corso...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-triangle" size={50} color="#E74C3C" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchMenu} style={styles.retryButton}>
          <Text style={styles.retryText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      {item.image ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.itemImage}
          defaultSource={require('../assets/placeholder.png')}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Icon name="cutlery" size={40} color="#9CA3AF" />
        </View>
      )}
      
      <View style={styles.textContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemPrice}>{item.price}</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#FACC15" />
          <Text style={styles.ratingNumber}>
            {item.rating.toFixed(1)}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => addToCart(item)}
      >
        <Icon name="plus" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  const goToCart = () => {
    router.push({
      pathname: "/cart",
      
      params: {
        vendorId,
        vendorName
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{vendorName}</Text>
      
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Torna indietro</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cartButton} 
          onPress={goToCart}
          disabled={cartCount === 0}
        >
          <Icon name="shopping-cart" size={24} color="#FFF" style={styles.cartIcon} />
          <Text style={styles.cartButtonText}>Carrello ({cartCount})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    color: "#1F2937",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 100,
  },
  menuItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  itemDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingNumber: {
    marginLeft: 6,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#6366F1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: "#E11D48",
    borderRadius: 14,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cartButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: "#111827",
    borderRadius: 14,
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cartIcon: {
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
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
    backgroundColor: '#F4F6F8',
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
});

export default MenuScreen;