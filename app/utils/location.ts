// utils/location.ts
import * as Location from "expo-location";

export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const { latitude, longitude } = location.coords;

  const [place] = await Location.reverseGeocodeAsync({
    latitude,
    longitude,
  });

  const area =
    place.district ||
    place.subregion ||
    place.street ||
    "";

  const city = place.city || "";
  const region = place.region || "";
  const countryCode = place.isoCountryCode || "";

  const locationName = [
    area,
    city ? `• ${city}` : "",
    region ? `, ${region}` : "",
    countryCode ? ` ${countryCode}` : "",
  ]
    .join(" ")
    .trim();

  return {
    latitude,
    longitude,
    locationName,
  };
}