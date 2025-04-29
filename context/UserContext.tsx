import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import DeviceInfo from "react-native-device-info";
import NetInfo from "@react-native-community/netinfo";
import { supabase, GameRecord } from "../lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const USER_ID_KEY = "sudokuUserId";

interface UserContextType {
  userId: string | null;
  username: string | null;
  gameRecord: Omit<GameRecord, "user_id" | "username"> | null;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  fetchRecord: () => Promise<void>; // Function to manually refresh data
  updateUsername: (newUsername: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [gameRecord, setGameRecord] = useState<Omit<
    GameRecord,
    "user_id" | "username"
  > | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Network Status Listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false;
      setIsOnline(online);
      if (!online) {
        setError("Network offline. Progress may not be saved.");
      } else if (error === "Network offline. Progress may not be saved.") {
        // Clear network error message when back online, unless another error exists
        setError(null);
      }
      console.log("Network status changed, Is connected?", online);
    });

    return () => {
      unsubscribe();
    };
  }, [error]); // Re-run if error state changes to potentially clear network error

  // Fetch User ID and Record
  const fetchRecord = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let deviceId = userId;

    try {
      // 1. Get or Generate User ID
      if (!deviceId) {
        console.log(
          "[fetchRecord] Current userId state is null. Checking Storage..."
        );
        let storedId = null;
        try {
          // Use localStorage for web, AsyncStorage for native
          if (Platform.OS === "web") {
            storedId = localStorage.getItem(USER_ID_KEY);
          } else {
            storedId = await AsyncStorage.getItem(USER_ID_KEY);
          }
          console.log(
            `[fetchRecord] Value from Storage for ${USER_ID_KEY}:`,
            storedId
          );
        } catch (storageError) {
          console.error(
            "[fetchRecord] Error reading from Storage:",
            storageError
          );
          setError("Failed to read user identity from storage.");
        }

        // Check if stored ID is invalid ('unknown') - should be less likely now
        if (storedId === "unknown") {
          console.warn(
            "Found invalid 'unknown' user ID in storage. Will generate a new one."
          );
          storedId = null; // Treat as no ID found
          // Remove the bad value
          if (Platform.OS === "web") {
            localStorage.removeItem(USER_ID_KEY);
          } else {
            await AsyncStorage.removeItem(USER_ID_KEY);
          }
        }

        if (storedId) {
          deviceId = storedId;
          console.log("[fetchRecord] Using stored User ID:", deviceId);
        } else {
          console.log(
            "[fetchRecord] No valid stored ID found. Generating new one..."
          );
          // Platform specific ID generation
          if (Platform.OS === "web") {
            if (typeof crypto !== "undefined" && crypto.randomUUID) {
              deviceId = crypto.randomUUID();
              console.log(
                "[fetchRecord] Generated new UUID for web:",
                deviceId
              );
            } else {
              deviceId = `web-user-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 15)}`;
              console.warn(
                "[fetchRecord] crypto.randomUUID not available, using fallback ID:",
                deviceId
              );
            }
            // Store using localStorage
            try {
              localStorage.setItem(USER_ID_KEY, deviceId);
              console.log("[fetchRecord] Stored new web ID in localStorage.");
            } catch (storageError) {
              console.error(
                "[fetchRecord] Error writing to localStorage:",
                storageError
              );
              setError("Failed to save user identity.");
              // Avoid proceeding without a savable ID?
            }
          } else {
            // Native ID generation and storage
            try {
              deviceId = await DeviceInfo.getUniqueId();
              console.log(
                "[fetchRecord] Retrieved new native Device ID:",
                deviceId
              );
              if (deviceId && deviceId !== "unknown") {
                await AsyncStorage.setItem(USER_ID_KEY, deviceId);
                console.log(
                  "[fetchRecord] Stored new native ID in AsyncStorage."
                );
              } else {
                // Handle cases where native ID is still unknown (should be rare)
                throw new Error(
                  "Native DeviceInfo.getUniqueId() returned invalid ID."
                );
              }
            } catch (nativeIdError) {
              console.error(
                "[fetchRecord] Error getting/storing native ID:",
                nativeIdError
              );
              setError("Failed to get or save native device identity.");
              // Decide on fallback - maybe generate a UUID like web?
              deviceId = null; // Prevent using potentially bad ID
            }
          }
        }
        // Ensure we actually got an ID before setting state
        if (deviceId) {
          setUserId(deviceId);
          console.log("[fetchRecord] Set userId state to:", deviceId);
        } else {
          console.error(
            "[fetchRecord] Failed to obtain or generate a valid deviceId."
          );
          // Maybe set an error state here? Already set in catch blocks.
        }
      }

      // Ensure deviceId is valid before proceeding
      if (!deviceId || deviceId === "unknown") {
        console.error("Failed to obtain a valid user ID.", { deviceId });
        setError("Could not identify user. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!isOnline) {
        // Don't try to fetch from Supabase if offline, rely on potentially cached data if implemented later
        console.log("Offline, skipping Supabase fetch.");
        // Keep existing data but set loading false
        setIsLoading(false);
        // Ensure network error is shown
        if (!error) setError("Network offline. Progress may not be saved.");
        return;
      }

      // 2. Fetch or Create Record in Supabase
      const { data, error: dbError } = await supabase
        .from("SodukoGameRecord")
        .select("*")
        .eq("user_id", deviceId)
        .single(); // Expects 0 or 1 row

      if (dbError && dbError.code === "PGRST116") {
        // PGRST116: Row not found
        console.log("No record found for user, creating new one.");
        const newUsername = `user-${Math.floor(
          100000 + Math.random() * 900000
        )}`;
        const newRecord: GameRecord = {
          user_id: deviceId!,
          username: newUsername,
          easy_passed: 0,
          medium_passed: 0,
          hard_passed: 0,
          extreme_passed: 0,
        };
        const { data: insertData, error: insertError } = await supabase
          .from("SodukoGameRecord")
          .insert(newRecord)
          .select()
          .single();

        if (insertError) {
          // *** Enhanced Error Handling for Duplicate Key ***
          if (insertError.code === "23505") {
            console.warn(
              "[fetchRecord] Insert failed due to duplicate key. Record likely exists. Re-fetching..."
            );
            setError(null); // Clear the insert error
            // Try fetching the record again since we know it exists
            const { data: existingData, error: fetchAgainError } =
              await supabase
                .from("SodukoGameRecord")
                .select("*")
                .eq("user_id", deviceId!)
                .single();

            if (fetchAgainError) {
              console.error(
                "[fetchRecord] Failed to fetch existing record after duplicate key error:",
                fetchAgainError
              );
              setError(
                `Failed to load user data even after confirming existence: ${fetchAgainError.message}`
              );
              // Clear local state as we can't get the data
              setUserId(null);
              setUsername(null);
              setGameRecord(null);
              // Clear storage only if fetch fails definitively?
              // await AsyncStorage.removeItem(USER_ID_KEY); // Or localStorage for web
            } else if (existingData) {
              console.log(
                "[fetchRecord] Successfully fetched existing record after duplicate key error:",
                existingData
              );
              setUsername(existingData.username);
              const { user_id, username: uname, ...stats } = existingData;
              setGameRecord(stats);
              // We successfully recovered, return normally from fetchRecord after finally block
            } else {
              // This case is unlikely (fetch returns no data after duplicate key error)
              console.error(
                "[fetchRecord] Record not found on re-fetch despite duplicate key error. Inconsistent state?"
              );
              setError("Inconsistent user data state. Please try again.");
              setUserId(null); // Clear state
              setUsername(null);
              setGameRecord(null);
            }
          } else {
            // Handle other insert errors normally
            console.error("Error creating user record:", insertError);
            setError(`Failed to create user record: ${insertError.message}`);
            setUserId(null);
            setUsername(null);
            setGameRecord(null);
            // Remove stored ID if creation failed for reasons other than duplicate
            if (Platform.OS === "web") {
              localStorage.removeItem(USER_ID_KEY);
            } else {
              await AsyncStorage.removeItem(USER_ID_KEY);
            }
          }
        } else if (insertData) {
          console.log("New user record created:", insertData);
          setUsername(insertData.username);
          const { user_id, username: uname, ...stats } = insertData;
          setGameRecord(stats);
        }
      } else if (dbError) {
        console.error("Error fetching user record:", dbError);
        setError(`Failed to fetch user data: ${dbError.message}`);
      } else if (data) {
        console.log("User record found:", data);
        setUsername(data.username);
        const { user_id, username: uname, ...stats } = data;
        setGameRecord(stats);
      }
    } catch (err: any) {
      console.error("Error in user initialization:", err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isOnline, error]); // Added isOnline and error as dependencies

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]); // Fetch on initial mount and when fetchRecord changes (due to isOnline)

  // Update Username
  const updateUsername = useCallback(
    async (newUsername: string): Promise<boolean> => {
      if (!userId || !isOnline) {
        setError(
          isOnline
            ? "User ID not available."
            : "Network offline. Cannot update username."
        );
        return false;
      }
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: updateError } = await supabase
          .from("SodukoGameRecord")
          .update({ username: newUsername })
          .eq("user_id", userId)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating username:", updateError);
          setError(`Failed to update username: ${updateError.message}`);
          return false;
        }

        if (data) {
          console.log("Username updated successfully", data);
          setUsername(data.username);
          return true;
        }
        return false;
      } catch (err: any) {
        console.error("Error during username update:", err);
        setError(`An unexpected error occurred: ${err.message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, isOnline]
  );

  return (
    <UserContext.Provider
      value={{
        userId,
        username,
        gameRecord,
        isLoading,
        error,
        isOnline,
        fetchRecord,
        updateUsername,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
