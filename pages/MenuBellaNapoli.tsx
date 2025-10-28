import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { FontAwesome } from "@expo/vector-icons";

type MenuItem = {
  quantity?: number;
  totalPrice?: number;
  id: number;
  name: string;
  description: string;
  price: string;
  rating: number;
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

const MenuBellaNapoli = ({ navigation }: any) => {
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const restaurantId = "Bella Napoli";

  useEffect(() => {
    const fetchVendorId = async () => {
      try {
        const response = await fetch("https://fastgo.loca.lt/vendors");
        const vendors = await response.json();
        const selected = vendors.find((v: Vendor) => v.name === "Bella Napoli");

        if (selected) {
          setVendorId(selected.id);
        } else {
          console.warn("Nessun ristorante trovato con quel nome");
        }
      } catch (error) {
        console.error("Errore nel recupero del ristorante:", error);
      }
    };

    fetchVendorId();
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        if (!vendorId) {
          return;
        }
        const response = await fetch(`https://fastgo.loca.lt/menu/${vendorId}`);
        if (!response.ok) {
          throw new Error(`Errore: ${response.status}`);
        }
        const data: MenuItem[] = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error("Errore nella richiesta:", error);
      }
    };

    fetchMenu();
  }, [vendorId]);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      let newCart;
      if (existingItem) {
        newCart = prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1, totalPrice: ((cartItem.quantity || 1) + 1) * parseFloat(cartItem.price.replace("€", "")) }
            : cartItem
        );
      } else {
        newCart = [...prevCart, { ...item, quantity: 1, totalPrice: parseFloat(item.price.replace("€", "")) }];
      }

      AsyncStorage.setItem(`cart-${restaurantId}`, JSON.stringify(newCart));
      setCartCount(newCart.reduce((sum, item) => sum + (item.quantity || 1), 0));
      return newCart;
    });
  };

  useFocusEffect(
    useCallback(() => {
      const loadCart = async () => {
        const savedCart = await AsyncStorage.getItem(`cart-${restaurantId}`);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCart(parsed);
          setCartCount(parsed.reduce((sum: any, item: any) => sum + (item.quantity || 0), 0));
        } else {
          setCart([]);
          setCartCount(0);
        }
      };
      loadCart();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bella Napoli</Text>
      <FlatList
        data={menuItems}
        keyExtractor={(item, index) => item?.id?.toString() ?? index.toString()}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <View style={styles.textContainer}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.ratingNumber}>
                  {item.rating}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
              <FontAwesome name="shopping-cart" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reviewButton} onPress={() =>navigation.navigate("ReviewScreen", { dishId: item.id, dishName: item.name, })}>
              <Text style={styles.reviewButtonText}>Lascia una recensione al piatto</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Torna indietro</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate("CartScreen", { cart, restaurantId })}>
        <Text style={styles.cartButtonText}>Vai al Carrello ({cartCount})</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 20,
    paddingTop: StatusBar.currentHeight,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    color: "#111827",
    marginBottom: 24,
    fontFamily: "System",
    letterSpacing: 0.5,
  },
  menuItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  itemName: {
    fontSize: 20,
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
    fontSize: 17,
    fontWeight: "600",
    color: "#16A34A",
    marginTop: 6,
  },
  addButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  textContainer: {
    marginBottom: 10,
  },
  cartButton: {
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: "#111827",
    borderRadius: 14,
    alignItems: "center",
  },
  cartButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#E11D48",
    borderRadius: 14,
    alignItems: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingStar: {
    fontSize: 16,
    color: "#FACC15",
  },
  ratingNumber: {
    marginLeft: 6,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  reviewButton: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: "#E0F2FE",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  reviewButtonText: {
    color: "#0284C7",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default MenuBellaNapoli;