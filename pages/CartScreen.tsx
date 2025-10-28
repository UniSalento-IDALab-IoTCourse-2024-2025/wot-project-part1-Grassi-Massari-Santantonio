import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from "react-native";

type MenuItem = {
  quantity?: number;
  totalPrice?: number;
  id: string;
  name: string;
  description: string;
  price: string;
};

const CartScreen = ({ route, navigation }: any) => {
  const cartItems = route.params?.cart || [];
  const { restaurantId } = route.params;
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const isCheckoutEnabled = cart.length > 0;

  useEffect(() => {
    const getCart = async () => {
      const savedCart = await AsyncStorage.getItem(`cart-${restaurantId}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    };
    getCart();
  }, []);

  useEffect(() => {
    setTotalPrice(cart.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0));
  }, [cart]);

  const removeFromCart = async (item: MenuItem) => {
    const updatedCart = cart.map(cartItem =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: (cartItem.quantity ?? 1) - 1, totalPrice: ((cartItem.quantity ?? 1) - 1) * parseFloat(cartItem.price.replace("€", "")) }
        : cartItem
    ).filter(cartItem => (cartItem.quantity ?? 1) > 0);

    setCart(updatedCart);
    await AsyncStorage.setItem(`cart-${restaurantId}`, JSON.stringify(updatedCart));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Il tuo carrello</Text>

      {cartItems.length === 0 ? (
        <Text style={styles.emptyCart}>Il carrello è vuoto!</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.itemName}>{item.name} x{item.quantity}</Text>
              <Text style={styles.itemPrice}>€{(item.totalPrice || 0).toFixed(2)}</Text>
              <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item)}>
                <Text style={styles.removeButtonText}>➖</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      
      {isCheckoutEnabled && (
      <TouchableOpacity style={styles.paymentButton} onPress={() => navigation.navigate("PaymentScreen", { restaurantId, cart })}>
        <Text style={styles.paymentButtonText}>Vai al pagamento</Text>
      </TouchableOpacity>
      )}
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Totale: €{totalPrice.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Torna indietro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: "#F2F4F7",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    color: "#1F2937",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  emptyCart: {
    fontSize: 18,
    textAlign: "center",
    color: "#9CA3AF",
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
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  itemPrice: {
    fontSize: 16,
    color: "#16A34A",
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B91C1C",
  },
  totalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  totalText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  paymentButton: {
    backgroundColor: "#6366F1",
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CartScreen;