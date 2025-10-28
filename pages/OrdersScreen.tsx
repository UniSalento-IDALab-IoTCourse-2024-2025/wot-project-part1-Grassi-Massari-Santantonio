import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<{ restaurantId: string; date: string; time: string; items: any[] }[]>([]);

  useEffect(() => {
    const getOrders = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const orderKeys = keys.filter(key => key.startsWith("order-"));
      const ordersData = await Promise.all(
        orderKeys.map(async (key) => {
          const order = await AsyncStorage.getItem(key);
          return order ? JSON.parse(order) : null;
        })
      );
      setOrders(ordersData.filter(order => order));
    };
    getOrders();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>I tuoi ordini</Text>

      {orders.length === 0 ? (
        <Text style={styles.emptyText}>Nessun ordine registrato!</Text>
      ) : (
        <FlatList
          style={{ width: "100%" }}
          data={orders}
          keyExtractor={(item, index) => `${item.restaurantId}-${item.date}-${item.time}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.orderItem} onPress={() => navigation.navigate("OrderDetailsScreen", { order: item })}>
              <Text style={styles.orderText}>{item.restaurantId} - {item.date} - {item.time}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Torna alla home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "left",
    marginBottom: 24,
    color: "#1F2937",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 40,
  },
  orderItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
    elevation: 3,
  },
  orderText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  orderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default OrdersScreen;