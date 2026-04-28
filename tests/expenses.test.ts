// tests/expenses.test.ts
import { addExpense } from "../app/utils/expenses";

// Mocks

// Mock firebase
jest.mock("../app/firebase", () => ({
  db: {},
}));

// Mock Firestore functions
const mockAddDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => "MOCK_TIMESTAMP");
const mockCollection = jest.fn(() => "MOCK_COLLECTION_REF");

jest.mock("firebase/firestore", () => ({
  collection: (...args: any[]) => mockCollection(...(args as [])),
  serverTimestamp: () => mockServerTimestamp(),
  addDoc: (...args: any[]) => mockAddDoc(...(args as [])),
}));

// Mock AsyncStorage
const mockGetItem = jest.fn();
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (...args: any[]) => mockGetItem(...args),
  setItem: jest.fn(),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("addExpense", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Auth / user checks ─────────────────────────────────────────────────

  it("throws an error when no user is logged in", async () => {
    mockGetItem.mockResolvedValue(null);
    await expect(
      addExpense({ amount: 10, category: "Food", date: new Date() }),
    ).rejects.toThrow("User not logged in");
  });

  it("reads the uid from AsyncStorage key 'user'", async () => {
    mockGetItem.mockResolvedValue("test-uid-123");
    mockAddDoc.mockResolvedValue({ id: "doc-id-1" });

    await addExpense({ amount: 10, category: "Food", date: new Date() });

    expect(mockGetItem).toHaveBeenCalledWith("user");
  });

  // ─── Happy-path / data integrity ────────────────────────────────────────

  it("returns the new document id on success", async () => {
    mockGetItem.mockResolvedValue("uid-abc");
    mockAddDoc.mockResolvedValue({ id: "new-doc-456" });

    const id = await addExpense({
      amount: 50,
      category: "Transport",
      date: new Date(),
    });
    expect(id).toBe("new-doc-456");
  });

  it("passes required fields to Firestore addDoc", async () => {
    mockGetItem.mockResolvedValue("uid-abc");
    mockAddDoc.mockResolvedValue({ id: "doc-id" });

    const date = new Date("2024-06-01");
    await addExpense({ amount: 100, category: "Shopping", date });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const docData = mockAddDoc.mock.calls[0][1];
    expect(docData.amount).toBe(100);
    expect(docData.category).toBe("Shopping");
    expect(docData.date).toEqual(date);
  });

  it("defaults notes to empty string when not provided", async () => {
    mockGetItem.mockResolvedValue("uid-xyz");
    mockAddDoc.mockResolvedValue({ id: "doc-id" });

    await addExpense({ amount: 20, category: "Health", date: new Date() });

    const docData = mockAddDoc.mock.calls[0][1];
    expect(docData.notes).toBe("");
  });

  it("stores notes when provided", async () => {
    mockGetItem.mockResolvedValue("uid-xyz");
    mockAddDoc.mockResolvedValue({ id: "doc-id" });

    await addExpense({
      amount: 20,
      category: "Health",
      date: new Date(),
      notes: "Doctor visit",
    });

    const docData = mockAddDoc.mock.calls[0][1];
    expect(docData.notes).toBe("Doctor visit");
  });

  it("defaults latitude/longitude/locationName/imageUrl to null or empty when not provided", async () => {
    mockGetItem.mockResolvedValue("uid-xyz");
    mockAddDoc.mockResolvedValue({ id: "doc-id" });

    await addExpense({ amount: 15, category: "Food", date: new Date() });

    const docData = mockAddDoc.mock.calls[0][1];
    expect(docData.latitude).toBeNull();
    expect(docData.longitude).toBeNull();
    expect(docData.locationName).toBe("");
    expect(docData.imageUrl).toBe("");
  });

  it("stores optional fields (latitude, longitude, locationName, imageUrl) when provided", async () => {
    mockGetItem.mockResolvedValue("uid-xyz");
    mockAddDoc.mockResolvedValue({ id: "doc-id" });

    await addExpense({
      amount: 15,
      category: "Food",
      date: new Date(),
      latitude: 25.2048,
      longitude: 55.2708,
      locationName: "Dubai",
      imageUrl: "https://example.com/receipt.jpg",
    });

    const docData = mockAddDoc.mock.calls[0][1];
    expect(docData.latitude).toBe(25.2048);
    expect(docData.longitude).toBe(55.2708);
    expect(docData.locationName).toBe("Dubai");
    expect(docData.imageUrl).toBe("https://example.com/receipt.jpg");
  });

  it("includes createdAt and updatedAt timestamps", async () => {
    mockGetItem.mockResolvedValue("uid-xyz");
    mockAddDoc.mockResolvedValue({ id: "doc-id" });

    await addExpense({ amount: 30, category: "Utilities", date: new Date() });

    const docData = mockAddDoc.mock.calls[0][1];
    expect(docData.createdAt).toBe("MOCK_TIMESTAMP");
    expect(docData.updatedAt).toBe("MOCK_TIMESTAMP");
  });

  // ─── Firestore failure ──────────────────────────────────────────────────

  it("propagates Firestore errors to the caller", async () => {
    mockGetItem.mockResolvedValue("uid-xyz");
    mockAddDoc.mockRejectedValue(new Error("Firestore write failed"));

    await expect(
      addExpense({ amount: 10, category: "Food", date: new Date() }),
    ).rejects.toThrow("Firestore write failed");
  });
});
