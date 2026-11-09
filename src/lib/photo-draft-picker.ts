import * as picker from "expo-image-picker";
import { pickedDraftPhotos } from "./photo-draft-picker-result";

export function pickDraftPhotos(camera: boolean, remaining: number) {
  if (remaining < 1) return Promise.reject(new Error("PHOTO_LIMIT"));
  // Keep the browser chooser synchronous with the initiating user gesture.
  const result = camera
    ? picker.launchCameraAsync({ mediaTypes: ["images"] })
    : picker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });
  return result.then(pickedDraftPhotos);
}
export async function recoverDraftPhotos() {
  return [];
}
