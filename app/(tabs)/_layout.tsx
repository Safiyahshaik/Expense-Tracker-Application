import { Drawer } from "expo-router/drawer";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../../context/ThemeContext";

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { theme: t } = useTheme();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, paddingTop: 0 }}
      style={{ backgroundColor: t.BG }}
    >
      {/* Drawer header */}
      <View style={[styles.drawerHeader, { borderBottomColor: t.BORDER }]}>
        <View
          style={[
            styles.logoMark,
            { backgroundColor: t.ACCENT_BG, borderColor: t.ACCENT + "40" },
          ]}
        >
          <Image
            source={require("../../assets/images/cash-flow.png")}
            style={{ width: 50, height: 50, borderRadius: 5 }}
            resizeMode="cover"
          />
        </View>
        <Text style={[styles.appName, { color: t.TEXT_PRIMARY }]}>Spendly</Text>
        <Text style={[styles.appTagline, { color: t.TEXT_SECONDARY }]}>
          Track your finances
        </Text>
      </View>

      {/* Nav items rendered by expo-router */}
      <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }}>
        <DrawerItemList {...props} />
      </View>

      {/* Footer */}
      <View style={[styles.drawerFooter, { borderTopColor: t.BORDER }]}>
        <Text style={{ fontSize: 12, color: t.TEXT_SECONDARY }}>v1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

export default function MainLayout() {
  const { theme: t } = useTheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        // Header
        headerStyle: { backgroundColor: t.BG },
        headerTintColor: t.TEXT_PRIMARY,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          letterSpacing: -0.3,
        },

        // Drawer panel
        drawerStyle: { backgroundColor: t.BG, width: 260 },
        drawerActiveTintColor: t.ACCENT,
        drawerInactiveTintColor: t.TEXT_SECONDARY,
        drawerActiveBackgroundColor: t.ACCENT_BG,
        drawerItemStyle: {
          borderRadius: 10,
          marginVertical: 2,
        },
        drawerLabelStyle: {
          fontWeight: "600",
          fontSize: 15,
          letterSpacing: -0.1,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ title: "Dashboard", drawerLabel: "Dashboard" }}
      />
      <Drawer.Screen
        name="expenses"
        options={{ title: "Expenses", drawerLabel: "Expenses" }}
      />
      <Drawer.Screen
        name="add-expense"
        options={{ title: "Add Expense", drawerLabel: "Add Expense" }}
      />
      <Drawer.Screen
        name="settings"
        options={{ title: "Settings", drawerLabel: "Settings" }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    marginTop: 2,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
});
