import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const ReviewScreen = ({ route, navigation }: any) => {
  const { dishId, dishName } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [confirmationVisible, setConfirmationVisible] = useState(false);


  const handleSubmit = async () => {
    const reviewData = {
        item_id: dishId,
        stars: rating,
        description: comment,
    };

    const response = await fetch("https://fastgo.loca.lt/reviews", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
    });
    
    if (response.ok) {
        setConfirmationVisible(true);
        setTimeout(() => {
            setConfirmationVisible(false);
            navigation.goBack();
        }, 2000);
    } else {
            console.error("Errore nel salvataggio della recensione");
        }
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recensisci: {dishName}</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <FontAwesome
              name="star"
              size={36}
              color={star <= rating ? "#FFD700" : "#ccc"}
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder="Scrivi una breve recensione..."
        value={comment}
        onChangeText={setComment}
        multiline
        style={styles.input}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Invia Recensione</Text>
      </TouchableOpacity>
      {confirmationVisible && (
        <Text style={styles.confirmation}>Recensione inviata con successo!</Text>
        )}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Torna indietro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDF1F7",
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "left",
    color: "#1E293B",
    marginBottom: 20,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 28,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    fontSize: 15,
    height: 120,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  backButtonText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmation: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
    color: "#22C55E",
  },
});

export default ReviewScreen;