// utils/expenses.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "../../app/firebase";

export const addExpense = async ({
  amount,
  category,
  date,
  notes,
  latitude,
  longitude,
  locationName,
  imageUrl,
}: {
  amount: number;
  category: string;
  date: Date;
  notes?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  imageUrl?: string;
}) => {
  const uid = await AsyncStorage.getItem("user");
  if (!uid) throw new Error("User not logged in");

  const docRef = await addDoc(collection(db, "users", uid, "expenses"), {
    amount,
    category,
    date,
    notes: notes || "",
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    locationName: locationName ?? "",
    imageUrl: imageUrl ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};
