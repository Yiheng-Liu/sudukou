import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter, Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useUser } from "@/context/UserContext";

const SAVED_GAME_KEY = "sudokuGameState";

export default function WelcomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const {
    username,
    isLoading: isUserLoading,
    error: userError,
    isOnline,
  } = useUser();

  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isCheckingSave, setIsCheckingSave] = useState(true);

  useEffect(() => {
    const checkSavedGame = async () => {
      setIsCheckingSave(true);
      try {
        const savedState = await AsyncStorage.getItem(SAVED_GAME_KEY);
        setHasSavedGame(savedState !== null);
        console.log(
          `Check Saved Game: ${savedState !== null ? "Found" : "Not Found"}`
        );
      } catch (error) {
        console.error("Failed to check for saved game state:", error);
        setHasSavedGame(false);
      } finally {
        setIsCheckingSave(false);
      }
    };

    if (isFocused) {
      checkSavedGame();
    }
  }, [isFocused]);

  const isLoading = isUserLoading || isCheckingSave;

  const startGame = (difficulty: number) => {
    router.push({
      pathname: "/sudoku",
      params: { difficulty: difficulty.toString() },
    });
  };

  const continueGame = () => {
    router.push("/sudoku");
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {isUserLoading ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : username ? (
          <Link href={"/profile" as any} style={styles.usernameLink}>
            <Text style={styles.usernameText}>{username}</Text>
          </Link>
        ) : (
          <Text style={styles.usernameText}>?</Text>
        )}
      </View>

      <Text style={styles.title}>Choose Difficulty</Text>

      {userError &&
        userError !== "Network offline. Progress may not be saved." && (
          <Text style={styles.errorText}>{userError}</Text>
        )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
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
              !hasSavedGame || !isOnline ? styles.buttonDisabled : {},
            ]}
            onPress={continueGame}
            disabled={!hasSavedGame || !isOnline}
          >
            <Text style={[styles.buttonText, styles.continueButtonText]}>
              Continue Game
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.leaderboardButton,
              !isOnline ? styles.buttonDisabled : {},
            ]}
            disabled={!isOnline}
            onPress={() => router.push("/leaderboard")}
          >
            <Text style={[styles.buttonText, styles.leaderboardButtonText]}>
              Leaderboard
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    paddingTop: 80,
    backgroundColor: "#f0f0f0",
  },
  headerContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  usernameLink: {
    // Add padding if the hit area is too small
    // padding: 5,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
  },
  buttonContainer: {
    width: "80%",
    alignItems: "stretch",
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#007bff",
  },
  continueButton: {
    marginTop: 15,
    backgroundColor: "#6c757d",
    borderColor: "#5a6268",
  },
  continueButtonText: {
    color: "#fff",
  },
  leaderboardButton: {
    backgroundColor: "#17a2b8",
    borderColor: "#117a8b",
  },
  leaderboardButtonText: {
    color: "#fff",
  },
  buttonDisabled: {
    backgroundColor: "#adb5bd",
    borderColor: "#9a9fa3",
    opacity: 0.7,
  },
});
