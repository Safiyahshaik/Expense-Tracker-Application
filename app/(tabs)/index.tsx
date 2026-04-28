// app/category-chart.tsx
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { getCategoryTotals } from "../utils/categoryTotals";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";

const COLORS = [
  "#6EE7B7",
  "#A78BFA",
  "#F59E0B",
  "#F87171",
  "#60A5FA",
  "#34D399",
];

const { width } = Dimensions.get("window");

export default function CategoryChart() {
  const { theme: t } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [budget, setBudget] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [currency, setCurrency] = useState("");
  const [loading, setLoading] = useState(true);
  const [uid, setUserUid] = useState(true);
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        setLoading(true);
        const uid = await AsyncStorage.getItem("user");
        console.log("Dashboard UID:", uid);

        if (!uid) {
          router.replace("/login");
          return;
        }

        await loadData(uid);

        setLoading(false);
      };

      fetch();
    }, []),
  );

  async function loadData(uid: string) {
    if (!uid) {
      console.log("No user found in storage");
      return;
    }

    try {
      // Fetch expenses
      const snap = await getDocs(collection(db, "users", uid, "expenses"));
      const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Calculate total spent
      const total = expenses.reduce(
        (sum, e: any) => sum + Number(e.amount || 0),
        0,
      );
      setTotalSpent(total);

      // Fetch user document
      const userDoc = await getDoc(doc(db, "users", uid));
      const userData = userDoc.data() || {};
      const userBudget = userData.budget || 0;
      setBudget(userBudget);

      // Set currency from user document
      if (userData.currency) {
        setCurrency(userData.currency);
      }

      //  Sort recent expenses
      const sorted = [...expenses].sort(
        (a: any, b: any) =>
          new Date(b.date?.toDate?.() || b.date).getTime() -
          new Date(a.date?.toDate?.() || a.date).getTime(),
      );
      setRecentExpenses(sorted.slice(0, 5));

      // Prepare chart data
      const totals = getCategoryTotals(expenses);
      const chartData = Object.entries(totals).map(([name, amount], i) => ({
        name,
        amount: Number(amount) || 0,
        color: COLORS[i % COLORS.length],
        legendFontColor: t.TEXT_SECONDARY,
        legendFontSize: 13,
      }));
      setData(chartData);
    } catch (error) {
      console.error(error);
    }
  }

  const budgetLeft = budget - totalSpent;
  const isOver = budgetLeft < 0;
  const budgetPercent = budget > 0 ? Math.min(totalSpent / budget, 1) : 0;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: t.BG }]}>
        <ActivityIndicator size="large" color={t.ACCENT} />
      </View>
    );
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.BG }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: t.TEXT_PRIMARY }]}>
          Overview
        </Text>
        <Text style={[styles.screenSubtitle, { color: t.TEXT_SECONDARY }]}>
          Your spending at a glance
        </Text>
      </View>

      {/* Stat cards */}
      <View style={styles.cardsRow}>
        <View
          style={[
            styles.card,
            { backgroundColor: t.CARD, borderColor: t.BORDER },
          ]}
        >
          <Text style={[styles.cardLabel, { color: t.TEXT_SECONDARY }]}>
            Total Spent
          </Text>
          <Text style={[styles.cardValue, { color: t.TEXT_PRIMARY }]}>
            {currency} {totalSpent.toFixed(2)}
          </Text>
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isOver ? t.LOGOUT_BG : t.ACCENT_BG,
              borderColor: isOver ? t.LOGOUT_BORDER : t.ACCENT + "40",
            },
          ]}
        >
          <Text
            style={[
              styles.cardLabel,
              { color: isOver ? t.LOGOUT_TEXT : t.ACCENT },
            ]}
          >
            Budget Left
          </Text>
          <Text
            style={[
              styles.cardValue,
              { color: isOver ? t.LOGOUT_TEXT : t.ACCENT },
            ]}
          >
            {currency} {budgetLeft.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Budget progress bar */}
      {budget > 0 && (
        <View
          style={[
            styles.section,
            { backgroundColor: t.CARD, borderColor: t.BORDER },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.sectionTitle, { color: t.TEXT_PRIMARY }]}>
              Budget Usage
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isOver ? t.LOGOUT_TEXT : t.ACCENT,
                fontWeight: "600",
              }}
            >
              {Math.round(budgetPercent * 100)}%
            </Text>
          </View>
          <View style={[styles.trackBg, { backgroundColor: t.BORDER }]}>
            <View
              style={[
                styles.trackFill,
                {
                  width: `${budgetPercent * 100}%` as any,
                  backgroundColor: isOver ? t.LOGOUT_TEXT : t.ACCENT,
                },
              ]}
            />
          </View>
          <View style={styles.progressFooter}>
            <Text style={{ fontSize: 12, color: t.TEXT_SECONDARY }}>
              {currency} {totalSpent.toFixed(2)} spent
            </Text>
            <Text style={{ fontSize: 12, color: t.TEXT_SECONDARY }}>
              {currency} {budget.toFixed(2)} budget
            </Text>
          </View>
        </View>
      )}

      {/* Pie Chart */}
      <View
        style={[
          styles.section,
          { backgroundColor: t.CARD, borderColor: t.BORDER },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: t.TEXT_PRIMARY }]}>
          Spending by Category
        </Text>
        {data.length > 0 ? (
          <PieChart
            data={data}
            width={width - 80}
            height={200}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="10"
            hasLegend={true}
            chartConfig={{
              backgroundColor: "transparent",
              backgroundGradientFrom: "transparent",
              backgroundGradientTo: "transparent",
              color: () => t.TEXT_PRIMARY,
            }}
          />
        ) : (
          <Text style={{ color: t.TEXT_SECONDARY, marginTop: 8 }}>
            No expenses found
          </Text>
        )}
      </View>

      {/* Recent Expenses */}
      <View
        style={[
          styles.section,
          { backgroundColor: t.CARD, borderColor: t.BORDER },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: t.TEXT_PRIMARY }]}>
          Recent Expenses
        </Text>
        {recentExpenses.length === 0 ? (
          <Text style={{ color: t.TEXT_SECONDARY, marginTop: 8 }}>
            No recent expenses
          </Text>
        ) : (
          recentExpenses.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.expenseRow,
                {
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: t.BORDER,
                },
              ]}
            >
              <View style={styles.expenseLeft}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: COLORS[index % COLORS.length] + "30",
                      borderColor: COLORS[index % COLORS.length] + "60",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dotInner,
                      { backgroundColor: COLORS[index % COLORS.length] },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.expenseCategory, { color: t.TEXT_PRIMARY }]}
                >
                  {item.category}
                </Text>
              </View>
              <Text style={[styles.expenseAmount, { color: t.TEXT_PRIMARY }]}>
                {currency} {Number(item.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  trackFill: {
    height: 8,
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expenseCategory: {
    fontSize: 15,
    fontWeight: "500",
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
