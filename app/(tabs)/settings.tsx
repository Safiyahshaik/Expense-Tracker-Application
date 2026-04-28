import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Switch,
} from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";

interface UserPreferences {
  budget?: number;
  totalSavings?: number;
  currency?: string;
  totalSpent?: number;
  themeMode?: "light" | "dark";
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme: t, toggleTheme } = useTheme();
  const [userUid, setUserUid] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      const uid = await AsyncStorage.getItem("user");
      setUserUid(uid);
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        const budget = userData?.budget || 0;
        const totalSavings = userData?.totalSavings || 0;
        const currency = userData?.currency || "$";
        const themeMode = userData?.themeMode || "light";

        const snapshot = await getDocs(
          collection(db, "users", uid, "expenses"),
        );
        const expenses = snapshot.docs.map((doc) => doc.data() as any);
        const totalSpent = expenses.reduce(
          (sum, e) => sum + (e.amount || 0),
          0,
        );

        setPreferences({
          budget,
          totalSavings,
          currency,
          totalSpent,
          themeMode,
        });

        if (themeMode !== t.mode) toggleTheme();
      } catch (err) {
        console.error("Failed to fetch preferences or expenses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Save field on blur
  const handleBlur = async (field: keyof UserPreferences) => {
    if (!userUid) return;
    try {
      await setDoc(
        doc(db, "users", userUid),
        { [field]: preferences[field] },
        { merge: true },
      );
    } catch (err) {
      console.error(`Failed to save ${field}:`, err);
    }
  };

  // Toggle and save theme preference
  const handleToggleTheme = async () => {
    toggleTheme();
    if (!userUid) return;
    try {
      await setDoc(
        doc(db, "users", userUid),
        { themeMode: t.mode === "dark" ? "light" : "dark" },
        { merge: true },
      );
    } catch (err) {
      console.error("Failed to save theme preference:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      const checkb = await AsyncStorage.getItem("user");
      console.log("uid settings:", checkb);
      await AsyncStorage.removeItem("user");

      const check = await AsyncStorage.getItem("user");
      console.log("After logout, user:", check);

      router.replace("/login");
    } catch (error) {
      console.log(error);
      alert("Logout failed");
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.BG,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={t.ACCENT} />
      </View>
    );
  }

  const cur = preferences.currency ?? "$";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.BG }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: t.TEXT_SECONDARY }]}>
          PREFERENCES
        </Text>
        <View style={styles.cardGroup}>
          {/* Editable Monthly Budget */}
          <View
            style={[
              styles.editableCard,
              {
                backgroundColor: t.CARD,
                borderColor: t.BORDER,
              },
            ]}
          >
            <Text style={{ color: t.TEXT_SECONDARY }}>Monthly Budget</Text>
            <TextInput
              style={[
                styles.inputCard,
                {
                  backgroundColor: t.CARD,
                  color: t.TEXT_PRIMARY,
                  borderColor: t.BORDER,
                },
              ]}
              keyboardType="numeric"
              value={preferences.budget?.toString() || ""}
              onChangeText={(val) =>
                setPreferences((prev) => ({
                  ...prev,
                  budget: parseFloat(val) || 0,
                }))
              }
              onBlur={() => handleBlur("budget")}
            />
          </View>

          {/* Editable Total Savings */}
          <View
            style={[
              styles.editableCard,
              {
                backgroundColor: t.CARD,
                borderColor: t.BORDER,
              },
            ]}
          >
            <Text style={{ color: t.TEXT_SECONDARY }}>Total Savings</Text>
            <TextInput
              style={[
                styles.inputCard,
                {
                  backgroundColor: t.CARD,
                  color: t.TEXT_PRIMARY,
                  borderColor: t.BORDER,
                },
              ]}
              keyboardType="numeric"
              value={preferences.totalSavings?.toString() || ""}
              onChangeText={(val) =>
                setPreferences((prev) => ({
                  ...prev,
                  totalSavings: parseFloat(val) || 0,
                }))
              }
              onBlur={() => handleBlur("totalSavings")}
            />
          </View>

          {/* Editable Currency */}
          <View
            style={[
              styles.editableCard,
              {
                backgroundColor: t.CARD,
                borderColor: t.BORDER,
              },
            ]}
          >
            <Text style={{ color: t.TEXT_SECONDARY }}>Currency</Text>
            <TextInput
              style={[
                styles.inputCard,
                {
                  backgroundColor: t.CARD,
                  color: t.TEXT_PRIMARY,
                  borderColor: t.BORDER,
                },
              ]}
              value={preferences.currency || "$"}
              onChangeText={(val) =>
                setPreferences((prev) => ({ ...prev, currency: val }))
              }
              onBlur={() => handleBlur("currency")}
            />
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: t.TEXT_SECONDARY }]}>
          APPEARANCE
        </Text>
        <View
          style={{
            backgroundColor: t.CARD,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: t.BORDER,
            paddingHorizontal: 20,
            paddingVertical: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: t.TEXT_PRIMARY }}
            >
              {t.mode === "dark" ? "Dark Mode" : "Light Mode"}
            </Text>
            <Text
              style={{ fontSize: 13, color: t.TEXT_SECONDARY, marginTop: 2 }}
            >
              {t.mode === "dark"
                ? "Easy on the eyes at night"
                : "Bright and clear"}
            </Text>
          </View>
          <Switch
            value={t.mode === "dark"}
            onValueChange={async () => {
              // Light haptic
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Toggle theme
              handleToggleTheme();
            }}
            trackColor={{ false: t.TOGGLE_TRACK_OFF, true: t.ACCENT + "70" }}
            thumbColor={t.mode === "dark" ? t.ACCENT : t.TOGGLE_THUMB}
            ios_backgroundColor={t.TOGGLE_TRACK_OFF}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={{
          marginTop: 8,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: t.LOGOUT_BORDER,
          backgroundColor: t.LOGOUT_BG,
          paddingVertical: 16,
          alignItems: "center",
        }}
        onPress={async () => {
          // Light haptic
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          handleLogout();
        }}
        activeOpacity={0.75}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: t.LOGOUT_TEXT,
            letterSpacing: 0.2,
          }}
        >
          Log Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  cardGroup: {
    gap: 10,
  },
  editableCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 16,
  },
  inputCard: {
    marginTop: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 16,
  },
});
