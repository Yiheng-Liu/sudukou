import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_GAME_KEY = "sudokuGameState";

export default function WelcomeScreen() {
  const router = useRouter();
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSavedGame = async () => {
      try {
        const savedState = await AsyncStorage.getItem(SAVED_GAME_KEY);
        setHasSavedGame(savedState !== null);
      } catch (error) {
        console.error("Failed to load game state:", error);
        setHasSavedGame(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSavedGame();
  }, []);

  // Navigate to Sudoku screen with specified difficulty
  const startGame = (difficulty: number) => {
    router.push({
      pathname: "/sudoku",
      params: { difficulty: difficulty.toString() },
    });
  };

  // Placeholder for continue game functionality
  const continueGame = () => {
    // For now, just navigate. Later, SudokuScreen should check for saved state.
    console.log("Continue Game pressed - loading last game (not implemented)");
    router.push("/sudoku"); // Navigate without difficulty param
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Difficulty</Text>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={() => startGame(40)}>
          <Text style={styles.buttonText}>Easy</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => startGame(50)}>
          <Text style={styles.buttonText}>Medium</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => startGame(60)}>
          <Text style={styles.buttonText}>Hard</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => startGame(70)}>
          <Text style={styles.buttonText}>Extreme</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.continueButton,
            isLoading || !hasSavedGame ? styles.buttonDisabled : {},
          ]}
          onPress={continueGame}
          disabled={isLoading || !hasSavedGame}
        >
          <Text style={[styles.buttonText, styles.continueButtonText]}>
            {isLoading ? "Checking..." : "Continue Game"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f0f0", // Light background
  },
  title: {
    fontSize: 32, // Larger title
    fontWeight: "bold",
    marginBottom: 40, // More space below title
    color: "#333",
  },
  buttonContainer: {
    width: "80%", // Container for buttons
    alignItems: "stretch", // Make buttons fill width
  },
  button: {
    backgroundColor: "#fff", // White buttons
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15, // Space between buttons
    alignItems: "center",
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#007bff", // Blue text
  },
  continueButton: {
    marginTop: 15, // Add extra space above continue
    backgroundColor: "#6c757d", // Grey background
    borderColor: "#5a6268",
  },
  continueButtonText: {
    color: "#fff", // White text for continue
  },
  buttonDisabled: {
    backgroundColor: "#adb5bd", // Lighter grey when disabled
    borderColor: "#9a9fa3",
    opacity: 0.7, // Slightly faded
  },
});
