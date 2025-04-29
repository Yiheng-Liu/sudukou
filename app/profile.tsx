import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useUser } from "@/context/UserContext";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { username, gameRecord, updateUsername, isLoading, error, isOnline } =
    useUser();
  const [newUsername, setNewUsername] = useState(username || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty.");
      return;
    }
    if (!isOnline) {
      Alert.alert("Offline", "Cannot update username while offline.");
      return;
    }
    setIsUpdating(true);
    const success = await updateUsername(newUsername.trim());
    setIsUpdating(false);
    if (success) {
      Alert.alert("Success", "Username updated successfully!");
      // Optionally navigate back or stay
      // router.back();
    } else {
      // Error is handled and displayed by the context, but we can show an alert too
      Alert.alert("Error", error || "Failed to update username.");
    }
  };

  // Calculate total score
  const calculateScore = () => {
    if (!gameRecord) return 0;
    return (
      (gameRecord.easy_passed || 0) * 1 +
      (gameRecord.medium_passed || 0) * 2 +
      (gameRecord.hard_passed || 0) * 6 +
      (gameRecord.extreme_passed || 0) * 10
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {isLoading && !isUpdating ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <View style={styles.content}>
          {/* Display User Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statLabel}>Current Username:</Text>
            <Text style={styles.statValue}>{username || "-"}</Text>

            <Text style={styles.statLabel}>Total Score:</Text>
            <Text style={styles.statValue}>{calculateScore()}</Text>

            <Text style={styles.statLabel}>Puzzles Solved:</Text>
            <Text style={styles.subStat}>
              Easy: {gameRecord?.easy_passed || 0}
            </Text>
            <Text style={styles.subStat}>
              Medium: {gameRecord?.medium_passed || 0}
            </Text>
            <Text style={styles.subStat}>
              Hard: {gameRecord?.hard_passed || 0}
            </Text>
            <Text style={styles.subStat}>
              Extreme: {gameRecord?.extreme_passed || 0}
            </Text>
          </View>

          {/* Edit Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Change Username:</Text>
            <TextInput
              style={styles.input}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              editable={isOnline} // Disable input if offline
            />
            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!isOnline || isUpdating) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleUpdateUsername}
              disabled={!isOnline || isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Username</Text>
              )}
            </Pressable>
          </View>
          {/* Display Update Error */}
          {error && error !== "Network offline. Progress may not be saved." && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      )}

      {/* Close Button (for modal presentation) */}
      {router.canGoBack() && (
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50, // Adjust for status bar/modal header
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#343a40",
  },
  content: {
    flex: 1, // Allow content to fill space
  },
  statsContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 15,
  },
  subStat: {
    fontSize: 15,
    color: "#6c757d",
    marginLeft: 10,
    marginBottom: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 45, // Ensure consistent height
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 20,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: "#6c757d",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
