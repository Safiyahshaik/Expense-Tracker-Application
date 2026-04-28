// app/components/ExpenseModal.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useState, useEffect } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  uid: string;
  expense: any;
  onUpdate: () => void;
}

function Field({
  label,
  value,
  onChangeText,
  editable,
  keyboardType,
  t,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  editable: boolean;
  keyboardType?: any;
  t: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: t.TEXT_SECONDARY, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        style={{
          backgroundColor: editable ? t.CARD : t.BG,
          borderWidth: 1,
          borderColor: editable ? t.ACCENT + "60" : t.BORDER,
          borderRadius: 12,
          padding: 14,
          fontSize: 15,
          color: editable ? t.TEXT_PRIMARY : t.TEXT_SECONDARY,
        }}
        placeholderTextColor={t.TEXT_SECONDARY}
      />
    </View>
  );
}

export default function ExpenseModal({
  visible,
  onClose,
  uid,
  expense,
  onUpdate,
}: ExpenseModalProps) {
  const { theme: t } = useTheme();
  const [editing, setEditing]       = useState(false);
  const [amount, setAmount]         = useState("");
  const [category, setCategory]     = useState("");
  const [notes, setNotes]           = useState("");
  const [lightbox, setLightbox]     = useState(false);

  useEffect(() => {
    if (!expense) return;
    setAmount(expense.amount?.toString() || "");
    setCategory(expense.category || "");
    setNotes(expense.notes || "");
    setEditing(false);
    setLightbox(false);
  }, [expense]);

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", uid, "expenses", expense.id), {
        amount: parseFloat(amount),
        category,
        notes,
        updatedAt: new Date(),
      });
      onUpdate();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setEditing(false);
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update expense");
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", uid, "expenses", expense.id));
            onUpdate();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete expense");
          }
        },
      },
    ]);
  };

  return (
    <>
      {/*  Main bottom sheet  */}
      <Modal visible={visible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.overlay}>
            <View style={[styles.sheet, { backgroundColor: t.BG, borderColor: t.BORDER }]}>

              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: t.BORDER }]} />

              <Text style={[styles.title, { color: t.TEXT_PRIMARY }]}>
                {editing ? "Edit Expense" : "Expense Details"}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>

                {/* Receipt thumbnail — tap to expand */}
                {expense?.imageUrl ? (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLightbox(true);
                    }}
                    activeOpacity={0.85}
                    style={styles.thumbWrapper}
                  >
                    <Image
                      source={{ uri: expense.imageUrl }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                    <View style={styles.thumbOverlay}>
                      <Text style={styles.thumbOverlayText}>Tap to expand</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                <Field label="AMOUNT"   value={amount}   onChangeText={setAmount}   editable={editing} keyboardType="numeric" t={t} />
                <Field label="CATEGORY" value={category} onChangeText={setCategory} editable={editing} t={t} />
                <Field label="NOTES"    value={notes}    onChangeText={setNotes}    editable={editing} t={t} />
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                {editing ? (
                  <>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: t.ACCENT_BG, borderColor: t.ACCENT + "60", flex: 1 }]}
                      onPress={handleSave}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: t.ACCENT, fontWeight: "700", fontSize: 15 }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: t.CARD, borderColor: t.BORDER, flex: 1 }]}
                      onPress={() => setEditing(false)}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: t.TEXT_SECONDARY, fontWeight: "600", fontSize: 15 }}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: t.CARD, borderColor: t.BORDER, flex: 1 }]}
                      onPress={() => setEditing(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: t.TEXT_PRIMARY, fontWeight: "600", fontSize: 15 }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: t.LOGOUT_BG, borderColor: t.LOGOUT_BORDER, flex: 1 }]}
                      onPress={handleDelete}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: t.LOGOUT_TEXT, fontWeight: "600", fontSize: 15 }}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={{ color: t.TEXT_SECONDARY, fontSize: 14, fontWeight: "500" }}>Close</Text>
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Lightbox  */}
      <Modal visible={lightbox} transparent animationType="fade">
        <View style={styles.lightboxOverlay}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setLightbox(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Full image */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setLightbox(false)}
            style={styles.lightboxImageWrapper}
          >
            <Image
              source={{ uri: expense?.imageUrl }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.lightboxHint}>Tap image to close</Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingTop: 12,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 24,
  },

  // Thumbnail
  thumbWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
  },
  thumb: {
    width: "100%",
    height: 160,
  },
  thumbOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    backgroundColor: "#00000055",
    alignItems: "center",
  },
  thumbOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },

  // Lightbox
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "#000000ee",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff22",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  lightboxCloseText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  lightboxImageWrapper: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImage: {
    width: SCREEN_W - 32,
    height: SCREEN_H * 0.7,
    borderRadius: 16,
  },
  lightboxHint: {
    color: "#ffffff55",
    fontSize: 12,
    marginTop: 16,
    letterSpacing: 0.3,
  },
});