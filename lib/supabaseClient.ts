import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = "https://phvpcnenhgrbdinwwrfm.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBodnBjbmVuaGdyYmRpbnd3cmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MzM3NzYsImV4cCI6MjA2MTQwOTc3Nn0.8OAruicQFIk7gooSUNUlmTh86xPuCJtklghDicnfc_U";

// Define the structure of your SodukoGameRecord table
export interface GameRecord {
  user_id: string; // uuid maps to string in TS
  easy_passed: number;
  medium_passed: number;
  hard_passed: number;
  extreme_passed: number;
  username: string;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to get difficulty key string
export const getDifficultyKey = (
  difficultyValue: number | string | undefined
):
  | keyof Pick<
      GameRecord,
      "easy_passed" | "medium_passed" | "hard_passed" | "extreme_passed"
    >
  | null => {
  const numericDifficulty =
    typeof difficultyValue === "string"
      ? parseInt(difficultyValue, 10)
      : difficultyValue;
  switch (numericDifficulty) {
    case 40:
      return "easy_passed";
    case 50:
      return "medium_passed";
    case 60:
      return "hard_passed";
    case 70:
      return "extreme_passed";
    default:
      return null; // Or handle invalid/unknown difficulty
  }
};
