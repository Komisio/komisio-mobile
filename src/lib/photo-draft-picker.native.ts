import { pickedDraftPhotos } from "./photo-draft-picker-result";

export async function pickDraftPhotos(camera: boolean, remaining: number) {
  if (remaining < 1) throw new Error("PHOTO_LIMIT");
  const picker = await import("expo-image-picker");
  if (camera) {
    const permission = await picker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        permission.canAskAgain ? "CAMERA_DENIED" : "CAMERA_SETTINGS",
      );
  }
  const options = {
    mediaTypes: ["images"] as ["images"],
    quality: 0.85,
    exif: false,
    base64: false,
  };
  return pickedDraftPhotos(
    camera
      ? await picker.launchCameraAsync(options)
      : await picker.launchImageLibraryAsync({
          ...options,
          allowsMultipleSelection: true,
          selectionLimit: remaining,
          orderedSelection: true,
        }),
  );
}
export async function recoverDraftPhotos() {
  const picker = await import("expo-image-picker");
  return pickedDraftPhotos(await picker.getPendingResultAsync());
}
