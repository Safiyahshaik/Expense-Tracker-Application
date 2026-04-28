// tests/integration.addExpenseFlow.test.ts
/**
 * Integration tests: full Add-Expense workflow
 *
 * This suite wires together the three util modules used by AddExpenseScreen:
 *   1. getCurrentLocation  (location.ts)
 *   2. pickImage           (imagePicker.ts)
 *   3. addExpense          (expenses.ts)
 *
 * External I/O (Firestore, AsyncStorage, expo-location, expo-image-picker)
 * is mocked so tests are fast and deterministic.
 */

// Mocks

jest.mock("../app/firebase", () => ({ db: {}, auth: {} }));

const mockAddDoc = jest.fn();
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "MOCK_REF"),
  serverTimestamp: jest.fn(() => "MOCK_TS"),
  addDoc: (...args: any[]) => mockAddDoc(...args),
}));

const mockGetItem = jest.fn();
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (...args: any[]) => mockGetItem(...args),
  setItem: jest.fn(),
}));

const mockLocationPermission = jest.fn();
const mockGetPosition = jest.fn();
const mockReverseGeocode = jest.fn();
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: () => mockLocationPermission(),
  getCurrentPositionAsync: (...args: any[]) => mockGetPosition(...args),
  reverseGeocodeAsync: (...args: any[]) => mockReverseGeocode(...args),
  Accuracy: { High: 4 },
}));

const mockMediaPermission = jest.fn();
const mockLaunchLibrary = jest.fn();
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () => mockMediaPermission(),
  launchImageLibraryAsync: (...args: any[]) => mockLaunchLibrary(...args),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { getCurrentLocation } from "../app/utils/location";
import { pickImage } from "../app/utils/imagePicker";
import { addExpense } from "../app/utils/expenses";

//  Tests 

describe("Integration: Add Expense full workflow", () => {
  beforeEach(() => jest.clearAllMocks());


  it("completes the full flow: fetch location → pick image → save expense", async () => {
    // User is authenticated
    mockGetItem.mockResolvedValue("user-uid-001");

    // Location granted
    mockLocationPermission.mockResolvedValue({ status: "granted" });
    mockGetPosition.mockResolvedValue({ coords: { latitude: 25.2, longitude: 55.3 } });
    mockReverseGeocode.mockResolvedValue([{
      district: "DIFC",
      subregion: null,
      street: null,
      city: "Dubai",
      region: "Dubai",
      isoCountryCode: "AE",
    }]);

    // Image selected
    mockMediaPermission.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///receipt.jpg" }],
    });

    // Firestore write succeeds
    mockAddDoc.mockResolvedValue({ id: "saved-doc-001" });

    //  Run the flow
    const location = await getCurrentLocation();
    const imageUri = await pickImage();
    const docId = await addExpense({
      amount: 75.5,
      category: "Food",
      date: new Date("2024-07-15"),
      notes: "Team lunch",
      latitude: location.latitude,
      longitude: location.longitude,
      locationName: location.locationName,
      imageUrl: imageUri ?? undefined,
    });

    //  Assertions
    expect(docId).toBe("saved-doc-001");
    const savedData = mockAddDoc.mock.calls[0][1];
    expect(savedData.amount).toBe(75.5);
    expect(savedData.category).toBe("Food");
    expect(savedData.notes).toBe("Team lunch");
    expect(savedData.latitude).toBe(25.2);
    expect(savedData.longitude).toBe(55.3);
    expect(savedData.locationName).toContain("DIFC");
    expect(savedData.imageUrl).toBe("file:///receipt.jpg");
  });

  //  Auth guard blocks the save

  it("does not reach Firestore when the user is unauthenticated", async () => {
    mockGetItem.mockResolvedValue(null); // No user

    await expect(
      addExpense({ amount: 20, category: "Transport", date: new Date() })
    ).rejects.toThrow("User not logged in");

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  // partial data: location skipped

  it("saves expense without location when permission is denied", async () => {
    mockGetItem.mockResolvedValue("user-uid-002");
    mockLocationPermission.mockResolvedValue({ status: "denied" });
    mockAddDoc.mockResolvedValue({ id: "no-location-doc" });

    // Location step will throw — user skips it
    await expect(getCurrentLocation()).rejects.toThrow("Location permission denied");

    // Expense still saves without location
    const docId = await addExpense({
      amount: 30,
      category: "Shopping",
      date: new Date(),
    });

    expect(docId).toBe("no-location-doc");
    const savedData = mockAddDoc.mock.calls[0][1];
    expect(savedData.latitude).toBeNull();
    expect(savedData.longitude).toBeNull();
    expect(savedData.locationName).toBe("");
  });

  // Partial data: image skipped

  it("saves expense without image when user cancels the picker", async () => {
    mockGetItem.mockResolvedValue("user-uid-003");
    mockMediaPermission.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });
    mockAddDoc.mockResolvedValue({ id: "no-image-doc" });

    const imageUri = await pickImage(); // returns null
    expect(imageUri).toBeNull();

    const docId = await addExpense({
      amount: 45,
      category: "Health",
      date: new Date(),
      imageUrl: imageUri ?? undefined,
    });

    expect(docId).toBe("no-image-doc");
    const savedData = mockAddDoc.mock.calls[0][1];
    expect(savedData.imageUrl).toBe("");
  });

  //  Multiple expenses in a session

  it("saves multiple expenses sequentially for the same user", async () => {
    mockGetItem.mockResolvedValue("user-uid-multi");
    mockAddDoc
      .mockResolvedValueOnce({ id: "doc-1" })
      .mockResolvedValueOnce({ id: "doc-2" })
      .mockResolvedValueOnce({ id: "doc-3" });

    const ids = await Promise.all([
      addExpense({ amount: 10, category: "Food", date: new Date() }),
      addExpense({ amount: 20, category: "Transport", date: new Date() }),
      addExpense({ amount: 30, category: "Shopping", date: new Date() }),
    ]);

    expect(ids).toEqual(["doc-1", "doc-2", "doc-3"]);
    expect(mockAddDoc).toHaveBeenCalledTimes(3);
  });

  // Firestore failure mid-flow

  it("propagates Firestore failure after successfully fetching location", async () => {
    mockGetItem.mockResolvedValue("user-uid-004");
    mockLocationPermission.mockResolvedValue({ status: "granted" });
    mockGetPosition.mockResolvedValue({ coords: { latitude: 1, longitude: 2 } });
    mockReverseGeocode.mockResolvedValue([{
      district: "Test", subregion: null, street: null,
      city: "City", region: "Region", isoCountryCode: "XX",
    }]);
    mockAddDoc.mockRejectedValue(new Error("Network error"));

    const location = await getCurrentLocation();
    await expect(
      addExpense({
        amount: 50,
        category: "Utilities",
        date: new Date(),
        latitude: location.latitude,
        longitude: location.longitude,
      })
    ).rejects.toThrow("Network error");
  });
});