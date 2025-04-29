import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { View, Text, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import { UserProvider, useUser } from "@/context/UserContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Network Status Indicator Component
const NetworkStatusIndicator = () => {
  const { isOnline, error } = useUser();

  // Use the specific network error message, or any other persistent error
  const networkError =
    error === "Network offline. Progress may not be saved." ? error : null;

  if (isOnline && !networkError) {
    return null; // Don't show anything if online and no specific network error
  }

  return (
    <View
      style={[
        styles.networkIndicator,
        { backgroundColor: networkError ? "#dc3545" : "#ffc107" },
      ]}
    >
      <Text style={styles.networkText}>
        {networkError ? networkError : "Network Offline"}
      </Text>
    </View>
  );
};

function AppContent() {
  const colorScheme = useColorScheme();
  // Removed font loading here, assuming it's handled elsewhere or defaults are fine
  // const [loaded] = useFonts({ SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf") });
  // useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  // if (!loaded) return null;

  // Hide splash screen immediately now, UserProvider handles its loading state
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Hide all headers by default */}
          <Stack.Screen name="index" options={{ title: "Welcome" }} />
          <Stack.Screen
            name="sudoku"
            options={{ title: "Sudoku", headerShown: true }}
          />
          <Stack.Screen
            name="profile"
            options={{ title: "Profile", presentation: "modal" }}
          />
          <Stack.Screen
            name="leaderboard"
            options={{ title: "Leaderboard", presentation: "modal" }}
          />
        </Stack>
        <NetworkStatusIndicator />
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Font loading logic remains here
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    // Keep splash screen until fonts are loaded
    // if (loaded) {
    //   SplashScreen.hideAsync();
    // }
    // Splash screen is hidden in AppContent after fonts load
  }, [loaded]);

  if (!loaded) {
    return null; // Prevent rendering until fonts are loaded
  }

  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

// Added Styles
const styles = StyleSheet.create({
  networkIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000, // Ensure it's on top
  },
  networkText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
