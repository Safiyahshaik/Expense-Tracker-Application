// app/add-expense.tsx
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import { db } from "../firebase";
import { useTheme } from "../../context/ThemeContext";
import { getCurrentLocation } from "../utils/location";
import { addExpense as addExpenseToFirestore } from "../utils/expenses";
import { pickImage } from "../utils/imagePicker";
import { uploadImageToFirestore } from "../utils/uploadImage";
import * as Haptics from "expo-haptics";

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  t,
  leftElement,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  placeholder?: string;
  t: ReturnType<typeof useTheme>["theme"];
  leftElement?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.2,
          color: t.TEXT_SECONDARY,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.BG,
          borderWidth: 1,
          borderColor: t.BORDER,
          borderRadius: 12,
          paddingHorizontal: 14,
        }}
      >
        {leftElement && <View style={{ marginRight: 8 }}>{leftElement}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={t.TEXT_SECONDARY + "80"}
          style={{
            flex: 1,
            paddingVertical: 14,
            fontSize: 15,
            color: t.TEXT_PRIMARY,
          }}
        />
      </View>
    </View>
  );
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const { theme: t } = useTheme();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [currency, setCurrency] = useState("");

  useFocusEffect(
    useCallback(() => {
      async function loadUserData() {
        const uid = await AsyncStorage.getItem("user");
        if (!uid) return;

        setUserUid(uid);

        const userDocSnap = await getDoc(doc(db, "users", uid));

        const curr = userDocSnap.data()?.currency || "";

        if (curr) {
          console.log("curr:", curr);
          setCurrency(curr);
        }
      }

      loadUserData();
    }, []),
  );
  const handlePickImage = async () => {
    const uri = await pickImage();
    if (uri) setImageUri(uri);
  };

  const handleAddExpense = async () => {
    if (!amount || !category || !date) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    if (!userUid) {
      Alert.alert("Error", "User not found");
      return;
    }

    setLoading(true);
    try {
      const { latitude, longitude, locationName } = await getCurrentLocation();

      let imageData: string | undefined = undefined;
      if (imageUri) {
        imageData = await uploadImageToFirestore(imageUri);
      }

      await addExpenseToFirestore({
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        notes,
        latitude,
        longitude,
        locationName,
        imageUrl: imageData,
      });

      const userDoc = await getDoc(doc(db, "users", userUid));

      const budget = userDoc.data()?.budget || 0;

      const snapshot = await getDocs(
        collection(db, "users", userUid, "expenses"),
      );
      const totalSpent = snapshot.docs.reduce(
        (sum, d) => sum + (d.data().amount || 0),
        0,
      );
      Alert.alert("Expense added!");
      if (totalSpent > budget) {
        Alert.alert(
          "Budget Exceeded",
          `Spent $${totalSpent.toFixed(2)} of $${budget}`,
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      router.replace("/(tabs)/expenses");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={{ fontSize: 22, color: t.TEXT_SECONDARY }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: t.TEXT_PRIMARY }]}>
              Add Expense
            </Text>
            <Text
              style={{ fontSize: 13, color: t.TEXT_SECONDARY, marginTop: 2 }}
            >
              Record a new transaction
            </Text>
          </View>
        </View>

        {/* Form card */}
        <View
          style={[
            styles.card,
            { backgroundColor: t.CARD, borderColor: t.BORDER },
          ]}
        >
          <Field
            label="AMOUNT"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            t={t}
            leftElement={
              <Text
                style={{
                  color: t.TEXT_PRIMARY,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {currency}
              </Text>
            }
          />
          <Field
            label="CATEGORY"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Food, Transport"
            t={t}
          />
          <Field
            label="DATE"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            t={t}
          />
          <Field
            label="NOTES"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional note"
            t={t}
          />
        </View>

        {/* Receipt */}
        <View
          style={[
            styles.card,
            { backgroundColor: t.CARD, borderColor: t.BORDER },
          ]}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.2,
              color: t.TEXT_SECONDARY,
              marginBottom: 12,
            }}
          >
            RECEIPT
          </Text>

          <TouchableOpacity
            style={[
              styles.imageBtn,
              { backgroundColor: t.ACCENT_BG, borderColor: t.ACCENT + "50" },
            ]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handlePickImage();
            }}
            activeOpacity={0.75}
          >
            <Text style={{ color: t.ACCENT, fontWeight: "600", fontSize: 14 }}>
              {imageUri ? "Change Image" : "📎  Attach Receipt"}
            </Text>
          </TouchableOpacity>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: loading ? t.ACCENT_BG : t.ACCENT,
              borderColor: t.ACCENT + "60",
            },
          ]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleAddExpense();
          }}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: loading
                ? t.ACCENT
                : t.mode === "dark"
                  ? "#0F1117"
                  : "#fff",
              letterSpacing: 0.2,
            }}
          >
            {loading ? "Adding..." : "Add Expense"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  imageBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 14,
  },
  submitBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
});
