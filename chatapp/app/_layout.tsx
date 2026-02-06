import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Platform } from "react-native";
import "react-native-reanimated";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { initSocket, disconnectSocket } from "@/services/socket";

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 🔍 App boot
  useEffect(() => {
    console.log("🚀 App opened");
    console.log("📱 Platform:", Platform.OS);
  }, []);

  // 🔍 Track route changes
  useEffect(() => {
    console.log("📍 Current route:", pathname);
  }, [pathname]);

  // 🔑 AUTH REDIRECT
  useEffect(() => {
    console.log("🔐 Auth check:", { isAuthenticated, loading });

    if (!loading) {
      if (isAuthenticated) {
        console.log("➡ Redirecting to /(tabs)/home");
        router.replace("/(tabs)/home");
      } else {
        console.log("➡ Redirecting to /login");
        router.replace("/login");
      }
    }
  }, [isAuthenticated, loading]);

  // 🔌 SOCKET LIFECYCLE
  useEffect(() => {
    if (isAuthenticated) {
      console.log("🔌 Initializing socket");
      initSocket();
    } else {
      console.log("❌ Disconnecting socket");
      disconnectSocket();
    }
  }, [isAuthenticated]);

  // ⏳ Loading screen
  if (loading) {
    console.log("⏳ Auth loading...");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
