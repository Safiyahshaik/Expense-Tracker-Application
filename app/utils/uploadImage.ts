export const uploadImageToFirestore = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  // Convert blob to base64
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
