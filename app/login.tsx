import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";

export default function LoginScreen() {
  const router = useRouter();
  const { theme: t } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await AsyncStorage.setItem("user", userCredential.user.uid);
      router.replace("/");
    } catch (err: any) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.BG }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: t.ACCENT + "20",
                borderColor: t.ACCENT + "40",
              },
            ]}
          >
            <Image
              source={require("../assets/images/cash-flow.png")}
              style={{ width: 50, height: 50, borderRadius: 5 }}
              resizeMode="cover"
            />
          </View>
          <Text style={[styles.title, { color: t.TEXT_PRIMARY }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: t.TEXT_SECONDARY }]}>
            Sign in to continue tracking
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: t.TEXT_SECONDARY }]}>
              EMAIL
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: t.CARD, borderColor: t.BORDER },
              ]}
            >
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={t.TEXT_SECONDARY + "80"}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: t.TEXT_PRIMARY }]}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: t.TEXT_SECONDARY }]}>
              PASSWORD
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: t.CARD, borderColor: t.BORDER },
              ]}
            >
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={t.TEXT_SECONDARY + "80"}
                secureTextEntry
                style={[styles.input, { color: t.TEXT_PRIMARY }]}
              />
            </View>
          </View>

          {/* Error message */}
          {error !== "" && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
              ]}
            >
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Login button */}
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: t.ACCENT },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: t.BORDER }]} />
            <Text style={[styles.dividerText, { color: t.TEXT_SECONDARY }]}>
              or
            </Text>
            <View style={[styles.divider, { backgroundColor: t.BORDER }]} />
          </View>

          {/* Register link */}
          <TouchableOpacity
            style={[
              styles.outlineBtn,
              { borderColor: t.BORDER, backgroundColor: t.CARD },
            ]}
            onPress={() => router.push("/register")}
            activeOpacity={0.85}
          >
            <Text style={[styles.outlineBtnText, { color: t.TEXT_PRIMARY }]}>
              Create an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
  form: {
    gap: 4,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "500",
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  outlineBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
