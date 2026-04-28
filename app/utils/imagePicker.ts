// utils/imagePicker.ts
import * as ImagePicker from "expo-image-picker";

export async function pickImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Gallery permission denied");
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled) return null;

  return result.assets[0].uri;
}

export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Camera permission denied");
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
  });

  if (result.canceled) return null;

  return result.assets[0].uri;
}
