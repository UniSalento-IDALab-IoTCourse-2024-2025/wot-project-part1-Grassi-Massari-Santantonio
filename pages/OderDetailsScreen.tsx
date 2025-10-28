import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar } from "react-native";

const OrderDetailsScreen = ({ route, navigation }: any) => {
  const { order } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ordine - {order.restaurantId}</Text>
      <Text style={styles.subtitle}>Data: {order.date} - Orario: {order.time}</Text>

      <FlatList
        data={order.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name} x{item.quantity} - €{item.totalPrice.toFixed(2)}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Torna agli ordini</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2C3E50",
    textAlign: "left",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: "#7B8794",
    marginBottom: 24,
    textAlign: "left",
  },
  item: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "600",
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default OrderDetailsScreen;