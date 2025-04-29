import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { supabase, GameRecord } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext"; // To check online status
import { useRouter } from "expo-router";

interface LeaderboardEntry extends GameRecord {
  score: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { isOnline } = useUser();
  const router = useRouter();

  const calculateScore = (record: GameRecord): number => {
    return (
      (record.easy_passed || 0) * 1 +
      (record.medium_passed || 0) * 2 +
      (record.hard_passed || 0) * 6 +
      (record.extreme_passed || 0) * 10
    );
  };

  const fetchLeaderboard = useCallback(async () => {
    if (!isOnline) {
      setError("Network offline. Cannot fetch leaderboard.");
      setIsLoading(false);
      setRefreshing(false);
      // Keep stale data if available?
      // setLeaderboardData([]); // Option: clear data when offline
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all records first
      const { data: allRecords, error: fetchError } = await supabase
        .from("SodukoGameRecord")
        .select("*");

      if (fetchError) {
        throw fetchError;
      }

      if (allRecords) {
        // Calculate score for each record and sort
        const scoredData = allRecords
          .map((record) => ({
            ...record,
            score: calculateScore(record),
          }))
          .sort((a, b) => b.score - a.score) // Sort descending by score
          .slice(0, 10) // Get top 10
          .map((record, index) => ({
            // Add rank
            ...record,
            rank: index + 1,
          }));

        setLeaderboardData(scoredData);
      } else {
        setLeaderboardData([]);
      }
    } catch (err: any) {
      console.error("Error fetching leaderboard:", err);
      setError(`Failed to fetch leaderboard: ${err.message}`);
      setLeaderboardData([]); // Clear data on error
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.rank}>{item.rank}</Text>
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.score}>{item.score}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top 10 Players</Text>

      {isLoading && !refreshing && (
        <ActivityIndicator style={styles.loader} size="large" color="#007bff" />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!isLoading && !error && leaderboardData.length === 0 && (
        <Text style={styles.emptyText}>No leaderboard data available yet.</Text>
      )}

      {!error && leaderboardData.length > 0 && (
        <FlatList
          data={leaderboardData}
          renderItem={renderItem}
          keyExtractor={(item) => item.user_id}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007bff"]}
            />
          }
        />
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
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  rank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6c757d",
    minWidth: 30, // Ensure alignment
    textAlign: "center",
  },
  username: {
    flex: 1, // Take up remaining space
    fontSize: 16,
    fontWeight: "500",
    color: "#495057",
    marginHorizontal: 10,
  },
  score: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
    minWidth: 50, // Ensure alignment
    textAlign: "right",
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  emptyText: {
    color: "#6c757d",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    marginBottom: 5, // Space from bottom
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
