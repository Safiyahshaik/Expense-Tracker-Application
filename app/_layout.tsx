import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text } from "react-native";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const uid = await AsyncStorage.getItem("user");
      console.log("RootLayout UID:", uid);

      setUser(uid);
      setLoading(false);
    };

    checkUser();
  }, []);

  // Loading screen
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Wrap navigation stack in ThemeProvider
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}
