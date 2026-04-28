// tests/location.test.ts
import { getCurrentLocation } from "../app/utils/location";

// Mocks

const mockRequestForegroundPermissionsAsync = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
const mockReverseGeocodeAsync = jest.fn();

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: () =>
    mockRequestForegroundPermissionsAsync(),
  getCurrentPositionAsync: (...args: any[]) =>
    mockGetCurrentPositionAsync(...args),
  reverseGeocodeAsync: (...args: any[]) => mockReverseGeocodeAsync(...args),
  Accuracy: { High: 4 },
}));

// Helpers

const MOCK_COORDS = { latitude: 25.2048, longitude: 55.2708 };
const MOCK_POSITION = { coords: MOCK_COORDS };

function mockPlace(overrides: any = {}) {
  return [
    {
      district: "district" in overrides ? overrides.district : "Downtown",
      subregion: "subregion" in overrides ? overrides.subregion : null,
      street: "street" in overrides ? overrides.street : null,
      city: "city" in overrides ? overrides.city : "Dubai",
      region: "region" in overrides ? overrides.region : "Dubai",
      isoCountryCode:
        "isoCountryCode" in overrides ? overrides.isoCountryCode : "AE",
    },
  ];
}

// Tests

describe("getCurrentLocation", () => {
  beforeEach(() => jest.clearAllMocks());

  // Permission handling

  it("throws when location permission is denied", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "denied",
    });

    await expect(getCurrentLocation()).rejects.toThrow(
      "Location permission denied",
    );
    expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it("proceeds when permission is granted", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockGetCurrentPositionAsync.mockResolvedValue(MOCK_POSITION);
    mockReverseGeocodeAsync.mockResolvedValue(mockPlace());

    const result = await getCurrentLocation();
    expect(result).toBeDefined();
  });

  // Returned coordinates

  it("returns the correct latitude and longitude", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockGetCurrentPositionAsync.mockResolvedValue(MOCK_POSITION);
    mockReverseGeocodeAsync.mockResolvedValue(mockPlace());

    const result = await getCurrentLocation();
    expect(result.latitude).toBe(25.2048);
    expect(result.longitude).toBe(55.2708);
  });

  // Location name assembly

  it("builds a locationName that includes district, city, region and country code", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockGetCurrentPositionAsync.mockResolvedValue(MOCK_POSITION);
    mockReverseGeocodeAsync.mockResolvedValue(
      mockPlace({
        district: "Downtown",
        city: "Dubai",
        region: "Dubai",
        isoCountryCode: "AE",
      }),
    );

    const { locationName } = await getCurrentLocation();
    expect(locationName).toContain("Downtown");
    expect(locationName).toContain("Dubai");
    expect(locationName).toContain("AE");
  });

  it("falls back to subregion when district is null", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockGetCurrentPositionAsync.mockResolvedValue(MOCK_POSITION);
    mockReverseGeocodeAsync.mockResolvedValue(
      mockPlace({
        district: undefined,
        subregion: "Marina District",
        city: "Dubai",
      }),
    );

    const { locationName } = await getCurrentLocation();
    expect(locationName).toContain("Marina District");
  });

  it("falls back to street when district and subregion are null", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockGetCurrentPositionAsync.mockResolvedValue(MOCK_POSITION);
    mockReverseGeocodeAsync.mockResolvedValue(
      mockPlace({
        district: undefined,
        subregion: undefined,
        street: "Sheikh Zayed Rd",
      }),
    );

    const { locationName } = await getCurrentLocation();
    
    expect(locationName).toContain("Sheikh Zayed Rd");
  });

  it("returns a trimmed locationName with no leading/trailing whitespace", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockGetCurrentPositionAsync.mockResolvedValue(MOCK_POSITION);
    mockReverseGeocodeAsync.mockResolvedValue(
      mockPlace({
        district: undefined,
        subregion: undefined,
        street: undefined,
        city: "Abu Dhabi",
      }),
    );

    const { locationName } = await getCurrentLocation();
    expect(locationName).toBe(locationName.trim());
  });

  // High accuracy

  it("requests High accuracy when fetching position", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockGetCurrentPositionAsync.mockResolvedValue(MOCK_POSITION);
    mockReverseGeocodeAsync.mockResolvedValue(mockPlace());

    await getCurrentLocation();

    expect(mockGetCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: 4 });
  });

  //  Reverse geocode failure

  it("propagates errors from reverseGeocodeAsync", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockGetCurrentPositionAsync.mockResolvedValue(MOCK_POSITION);
    mockReverseGeocodeAsync.mockRejectedValue(
      new Error("Geocode service unavailable"),
    );

    await expect(getCurrentLocation()).rejects.toThrow(
      "Geocode service unavailable",
    );
  });
});
