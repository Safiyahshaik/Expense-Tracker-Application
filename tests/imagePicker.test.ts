// tests/imagePicker.test.ts
import { pickImage, takePhoto } from "../app/utils/imagePicker";

// Mocks

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestMediaLibraryPermissionsAsync(),
  launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibraryAsync(...args),
  requestCameraPermissionsAsync: () => mockRequestCameraPermissionsAsync(),
  launchCameraAsync: (...args: any[]) => mockLaunchCameraAsync(...args),
}));

// pickImage tests

describe("pickImage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws when media library permission is denied", async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(pickImage()).rejects.toThrow("Gallery permission denied");
    expect(mockLaunchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it("returns null when the user cancels the picker", async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });

    const result = await pickImage();
    expect(result).toBeNull();
  });

  it("returns the uri of the selected image", async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///path/to/image.jpg" }],
    });

    const result = await pickImage();
    expect(result).toBe("file:///path/to/image.jpg");
  });

  it("launches the library with editing enabled and full quality", async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///img.png" }],
    });

    await pickImage();

    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsEditing: true, quality: 1 })
    );
  });

  it("requests media library permission before opening picker", async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });

    await pickImage();
    expect(mockRequestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});

//  takePhoto tests

describe("takePhoto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws when camera permission is denied", async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(takePhoto()).rejects.toThrow("Camera permission denied");
    expect(mockLaunchCameraAsync).not.toHaveBeenCalled();
  });

  it("returns null when the user cancels the camera", async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({ canceled: true, assets: [] });

    const result = await takePhoto();
    expect(result).toBeNull();
  });

  it("returns the captured photo uri", async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///camera/photo.jpg" }],
    });

    const result = await takePhoto();
    expect(result).toBe("file:///camera/photo.jpg");
  });

  it("launches the camera with quality 0.7", async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///photo.jpg" }],
    });

    await takePhoto();
    expect(mockLaunchCameraAsync).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 0.7 })
    );
  });

  it("requests camera permission before launching the camera", async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({ canceled: true, assets: [] });

    await takePhoto();
    expect(mockRequestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});