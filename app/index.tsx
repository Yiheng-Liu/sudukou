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
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
        <View style={styles.usernameContainer}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={18}
            color={styles.usernameText.color}
            style={{ marginRight: 6 }}
          />
          {isUserLoading ? (
            <ActivityIndicator size="small" color={styles.usernameText.color} />
          ) : username ? (
            <Link href={"/profile" as any} style={styles.usernameLink}>
              <Text style={styles.usernameText}>{username}</Text>
            </Link>
          ) : (
            <Text style={styles.usernameText}>?</Text>
          )}
        </View>
      </View>

      <Text style={styles.title}>Sudoku</Text>
      <Text style={styles.subtitle}>Choose Difficulty</Text>

      {userError &&
        userError !== "Network offline. Progress may not be saved." && (
          <Text style={styles.errorText}>{userError}</Text>
        )}

      {isLoading ? (
        <ActivityIndicator
          style={styles.loadingIndicator}
          size="large"
          color="#4A90E2"
        />
      ) : (
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.difficultyButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => startGame(40)}
          >
            <Text style={[styles.buttonText, styles.difficultyButtonText]}>
              Easy
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.difficultyButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => startGame(50)}
          >
            <Text style={[styles.buttonText, styles.difficultyButtonText]}>
              Medium
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.difficultyButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => startGame(60)}
          >
            <Text style={[styles.buttonText, styles.difficultyButtonText]}>
              Hard
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.difficultyButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => startGame(70)}
          >
            <Text style={[styles.buttonText, styles.difficultyButtonText]}>
              Extreme
            </Text>
          </Pressable>
          <View style={styles.spacer} />
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.continueButton,
              (!hasSavedGame || !isOnline) && styles.buttonDisabled,
              styles.buttonWithIcon,
              pressed && styles.buttonPressed,
            ]}
            onPress={continueGame}
            disabled={!hasSavedGame || !isOnline}
          >
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={22}
              color={styles.continueButtonText.color}
              style={styles.icon}
            />
            <Text style={[styles.buttonText, styles.continueButtonText]}>
              Continue Game
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.leaderboardButton,
              !isOnline ? styles.buttonDisabled : {},
              styles.buttonWithIcon,
              pressed && styles.buttonPressed,
            ]}
            disabled={!isOnline}
            onPress={() => router.push("/leaderboard")}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={22}
              color={styles.leaderboardButtonText.color}
              style={styles.icon}
            />
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
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40,
    backgroundColor: "#F8F9FA",
  },
  headerContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DEE2E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 40,
  },
  usernameLink: {},
  usernameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A90E2",
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#343A40",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    color: "#6C757D",
    marginBottom: 40,
    textAlign: "center",
  },
  errorText: {
    color: "#DC3545",
    marginBottom: 20,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingIndicator: {
    marginTop: 50,
  },
  buttonContainer: {
    width: "90%",
    maxWidth: 400,
    alignItems: "stretch",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    elevation: 3,
    flexDirection: "row",
  },
  difficultyButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DEE2E6",
  },
  continueButton: {
    backgroundColor: "#6C757D",
    borderColor: "#5A6268",
  },
  leaderboardButton: {
    backgroundColor: "#4A90E2",
    borderColor: "#357ABD",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  difficultyButtonText: {
    color: "#4A90E2",
  },
  continueButtonText: {
    color: "#FFFFFF",
  },
  leaderboardButtonText: {
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: "#CED4DA",
    borderColor: "#ADB5BD",
    opacity: 0.7,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  spacer: {
    height: 20,
  },
  buttonWithIcon: {
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
});
