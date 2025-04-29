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
import * as Crypto from "expo-crypto";
import { v5 as uuidv5 } from "uuid";

const USER_ID_KEY = "sudokuUserId";
const UUID_NAMESPACE = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

// Helper function to check if a string looks like a UUID
const isValidUuid = (id: string | null): id is string =>
  !!id && id.length === 36 && id.includes("-");

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
      // 1. Get or Generate User ID (UUID format)
      if (!deviceId) {
        console.log(
          "[fetchRecord] Current userId state is null. Checking Storage..."
        );
        let storedUuid = null;
        try {
          if (Platform.OS === "web") {
            storedUuid = localStorage.getItem(USER_ID_KEY);
          } else {
            storedUuid = await AsyncStorage.getItem(USER_ID_KEY);
          }
          console.log(
            `[fetchRecord] Value from Storage for ${USER_ID_KEY}:`,
            storedUuid
          );
        } catch (storageError) {
          console.error(
            "[fetchRecord] Error reading from Storage:",
            storageError
          );
          setError("Failed to read user identity from storage.");
        }

        // Validate stored value using the helper function defined outside
        if (storedUuid && !isValidUuid(storedUuid)) {
          console.warn(
            `[fetchRecord] Found invalid stored ID: ${storedUuid}. Will generate a new one.`
          );
          storedUuid = null;
          try {
            // Remove invalid stored ID
            if (Platform.OS === "web") localStorage.removeItem(USER_ID_KEY);
            else await AsyncStorage.removeItem(USER_ID_KEY);
          } catch (removeError) {
            console.error(
              "[fetchRecord] Failed to remove invalid stored ID:",
              removeError
            );
          }
        }

        if (storedUuid) {
          deviceId = storedUuid;
          console.log(
            "[fetchRecord] Using stored valid User ID (UUID):",
            deviceId
          );
        } else {
          console.log(
            "[fetchRecord] No valid stored UUID found. Generating new one..."
          );
          let generatedUuid = null;

          // Platform specific generation
          if (Platform.OS === "android") {
            try {
              const androidId = await DeviceInfo.getUniqueId();
              console.log("[fetchRecord] Retrieved Android ID:", androidId);
              if (!androidId || androidId === "unknown") {
                throw new Error("Failed to get a valid Android ID.");
              }
              // Create a deterministic UUID v5 from the Android ID
              generatedUuid = uuidv5(androidId, UUID_NAMESPACE);
              console.log(
                "[fetchRecord] Generated UUID from Android ID:",
                generatedUuid
              );
            } catch (androidError: any) {
              console.error(
                "[fetchRecord] Error getting/hashing Android ID:",
                androidError
              );
              setError(
                `Failed to generate identity from Android ID: ${androidError.message}`
              );
              // Fallback: Generate random UUID for this session if Android ID fails
              generatedUuid = Crypto.randomUUID
                ? Crypto.randomUUID()
                : `fallback-${Date.now()}`;
              console.warn(
                "[fetchRecord] Falling back to random UUID for Android."
              );
            }
          } else {
            // iOS or Web
            try {
              if (typeof Crypto !== "undefined" && Crypto.randomUUID) {
                generatedUuid = Crypto.randomUUID();
                console.log(
                  "[fetchRecord] Generated random UUID for iOS/Web:",
                  generatedUuid
                );
              } else {
                throw new Error("Crypto.randomUUID is not available.");
              }
            } catch (randomUuidError: any) {
              console.error(
                "[fetchRecord] Error generating random UUID:",
                randomUuidError
              );
              setError(
                `Failed to generate user identity: ${randomUuidError.message}`
              );
              generatedUuid = null;
            }
          }

          // Store the newly generated valid UUID
          if (generatedUuid) {
            try {
              if (Platform.OS === "web") {
                localStorage.setItem(USER_ID_KEY, generatedUuid);
              } else {
                await AsyncStorage.setItem(USER_ID_KEY, generatedUuid);
              }
              deviceId = generatedUuid;
              console.log("[fetchRecord] Stored new UUID in Storage.");
            } catch (storageError: any) {
              console.error(
                "[fetchRecord] Error storing new UUID:",
                storageError
              );
              setError(`Failed to save user identity: ${storageError.message}`);
              deviceId = null; // Don't proceed if storage failed
            }
          } else {
            // Failed to generate any usable UUID
            deviceId = null;
          }
        }

        // Set state only if we have a valid UUID
        if (deviceId && isValidUuid(deviceId)) {
          setUserId(deviceId);
          console.log("[fetchRecord] Set userId state to:", deviceId);
        } else {
          console.error(
            "[fetchRecord] Failed to obtain or generate a valid UUID."
          );
          // Set error only if not already set
          if (!error) setError("Could not establish valid user identity.");
          deviceId = null; // Ensure it's null if invalid
        }
      }

      // Ensure deviceId is a valid UUID before Supabase query
      if (!deviceId || !isValidUuid(deviceId)) {
        console.error("Invalid UUID before Supabase query.", { deviceId });
        // Error should be set already
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
  }, [userId, isOnline, error]); // Dependencies

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
