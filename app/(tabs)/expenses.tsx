// app/(tabs)/expenses.tsx
import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ExpenseModal from "../components/expense-Modal";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";

interface Expense {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  locationName?: string;
  createdAt?: any;
  updatedAt?: any;
  imageUrl?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#F59E0B",
  Transport: "#10B981",
  Shopping: "#8B5CF6",
  Health: "#EF4444",
  Entertainment: "#3B82F6",
  Utilities: "#06B6D4",
  Other: "#6B7280",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#6B7280";
}

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Low–High", value: "amountAsc" },
  { label: "High–Low", value: "amountDesc" },
] as const;

function ExpenseCard({
  item,
  onPress,
  t,
  currency,
}: {
  item: Expense;
  onPress: () => void;
  t: ReturnType<typeof useTheme>["theme"];
  currency: string;
}) {
  const color = getCategoryColor(item.category);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />

      <View style={styles.cardMid}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : null}
        <Text style={[styles.cardCategory, { color: t.TEXT_PRIMARY }]}>
          {item.category}
        </Text>
        {item.notes ? (
          <Text
            style={[styles.cardMeta, { color: t.TEXT_SECONDARY }]}
            numberOfLines={1}
          >
            {item.notes}
          </Text>
        ) : null}
        {item.locationName ? (
          <Text
            style={[styles.cardMeta, { color: t.TEXT_SECONDARY }]}
            numberOfLines={1}
          >
            {item.locationName}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.cardAmount, { color: t.TEXT_PRIMARY }]}>
        {currency} {item.amount.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

export default function ExpensesScreen() {
  const { theme: t } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [selectedExpense, setSelected] = useState<Expense | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currency, setCurrency] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "amountAsc" | "amountDesc"
  >("newest");

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        let uid = userUid;
        if (!uid) {
          uid = await AsyncStorage.getItem("user");
          setUserUid(uid);
          if (!uid) return;
        }
        // Fetch user document
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.data() || {};
        // Set currency from user document
        if (userData.currency) {
          setCurrency(userData.currency);
        }
        setLoading(true);
        try {
          const snap = await getDocs(collection(db, "users", uid, "expenses"));
          setExpenses(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
          );
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
      };
      load();
    }, [userUid]),
  );

  const fetchExpenses = async () => {
    if (!userUid) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users", userUid, "expenses"));
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const displayed = [...expenses]
    .filter((e) => {
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return (
        e.category?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        e.locationName?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        case "amountAsc":
          return a.amount - b.amount;
        case "amountDesc":
          return b.amount - a.amount;
        default:
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
    });

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: t.BG }]}>
        <ActivityIndicator size="large" color={t.ACCENT} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: t.BG }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.TEXT_PRIMARY }]}>Expenses</Text>
        <Text style={[styles.subtitle, { color: t.TEXT_SECONDARY }]}>
          {expenses.length} {expenses.length === 1 ? "record" : "records"}
        </Text>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: t.CARD, borderColor: t.BORDER },
        ]}
      >
        <Text style={[styles.searchIcon, { color: t.TEXT_SECONDARY }]}>⌕</Text>
        <TextInput
          placeholder="Search..."
          value={searchText}
          onChangeText={setSearchText}
          style={[styles.searchInput, { color: t.TEXT_PRIMARY }]}
          placeholderTextColor={t.TEXT_SECONDARY + "60"}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: t.TEXT_SECONDARY, fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((s) => {
          const active = sortBy === s.value;
          return (
            <TouchableOpacity
              key={s.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortBy(s.value);
              }}
              style={[
                styles.sortBtn,
                {
                  backgroundColor: active ? t.ACCENT : "transparent",
                  borderColor: active ? t.ACCENT : t.BORDER,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sortLabel,
                  { color: active ? "#fff" : t.TEXT_SECONDARY },
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Thin divider */}
      <View style={[styles.divider, { backgroundColor: t.BORDER }]} />

      {/* List */}
      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseCard
            item={item}
            onPress={() => {
              setSelected(item);
              setModalVisible(true);
            }}
            t={t}
            currency={currency} // <-- pass currency here
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: t.TEXT_PRIMARY }]}>
              No expenses
            </Text>
            <Text style={[styles.emptySub, { color: t.TEXT_SECONDARY }]}>
              {searchText
                ? "No results for that search"
                : "Add your first expense to get started"}
            </Text>
          </View>
        }
      />

      {selectedExpense && userUid && (
        <ExpenseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          uid={userUid}
          expense={selectedExpense}
          onUpdate={fetchExpenses}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  root: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 3 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 18 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  sortRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  sortBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  sortLabel: { fontSize: 12, fontWeight: "500" },

  divider: { height: 1, marginBottom: 12 },

  list: { paddingBottom: 120, gap: 8 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardMid: { flex: 1 },
  thumb: { width: "100%", height: 100, borderRadius: 8, marginBottom: 8 },
  cardCategory: { fontSize: 14, fontWeight: "600" },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardAmount: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },

  empty: { alignItems: "center", paddingTop: 80, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySub: { fontSize: 13, textAlign: "center" },
});
