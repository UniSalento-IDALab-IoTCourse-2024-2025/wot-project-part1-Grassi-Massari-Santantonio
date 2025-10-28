import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";
import React from "react";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: string;
  quantity?: number;
  totalPrice?: number;
};

const CartScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vendorId = params.vendorId as string;
  const vendorName = params.vendorName as string;
  
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const isCheckoutEnabled = cart.length > 0;

  useEffect(() => {
    const getCart = async () => {
      try {
        setLoading(true);
        const savedCart = await AsyncStorage.getItem(`cart-${vendorId}`);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        }
      } catch (error) {
        console.error("Errore nel caricamento del carrello:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getCart();
  }, [vendorId]);

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
    setTotalPrice(total);
  }, [cart]);

  const removeFromCart = async (item: MenuItem) => {
    const priceValue = parseFloat(item.price.replace("€", ""));
    const updatedCart = cart
      .map(cartItem => 
        cartItem.id === item.id
          ? { 
              ...cartItem, 
              quantity: (cartItem.quantity ?? 1) - 1, 
              totalPrice: ((cartItem.quantity ?? 1) - 1) * priceValue 
            }
          : cartItem
      )
      .filter(cartItem => (cartItem.quantity ?? 1) > 0);

    setCart(updatedCart);
    await AsyncStorage.setItem(`cart-${vendorId}`, JSON.stringify(updatedCart));
  };

  const goToPayment = () => {
    router.push({
      pathname: "/payment",
      
      params: {
        vendorId,
        vendorName,
        totalPrice: totalPrice.toFixed(2)
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text style={styles.loadingText}>Caricamento carrello...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carrello di {vendorName}</Text>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="shopping-basket" size={60} color="#9CA3AF" />
          <Text style={styles.emptyCart}>Il carrello è vuoto!</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Torna al menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
                
                <View style={styles.itemActions}>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>€{(item.totalPrice || 0).toFixed(2)}</Text>
                  <TouchableOpacity 
                    style={styles.removeButton} 
                    onPress={() => removeFromCart(item)}
                  >
                    <Icon name="trash" size={20} color="#B91C1C" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Totale:</Text>
            <Text style={styles.totalPrice}>€{totalPrice.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.paymentButton, 
              !isCheckoutEnabled && styles.disabledButton
            ]} 
            onPress={goToPayment}
            disabled={!isCheckoutEnabled}
          >
            <Text style={styles.paymentButtonText}>Vai al pagamento</Text>
            <Icon name="arrow-right" size={20} color="#FFF" style={styles.paymentIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Torna al menu</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight || 40,
    backgroundColor: "#F2F4F7",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    color: "#1F2937",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4B5563',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    fontSize: 20,
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 20,
    marginBottom: 30,
  },
  listContent: {
    paddingBottom: 20,
  },
  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  itemInfo: {
    flex: 2,
  },
  itemActions: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16A34A",
    marginBottom: 10,
  },
  removeButton: {
    padding: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16A34A",
  },
  paymentButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  paymentIcon: {
    marginTop: 2,
  },
  backButton: {
    paddingVertical: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    alignItems: "center",
  },
  backButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CartScreen;