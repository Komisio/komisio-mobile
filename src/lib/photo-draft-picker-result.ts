import type {
  ImagePickerResult,
  ImagePickerErrorResult,
} from "expo-image-picker";
import type { PhotoInput } from "./photo-draft";

export function pickedDraftPhotos(
  result: ImagePickerResult | ImagePickerErrorResult | null,
): PhotoInput[] {
  if (!result || ("canceled" in result && result.canceled)) return [];
  if (
    "code" in result ||
    !result.assets?.length ||
    result.assets.some((p) => p.type && p.type !== "image")
  )
    throw new Error("PHOTO_INVALID");
  return result.assets.map((p) => ({
    uri: p.uri,
    file: p.file,
    // Some Android providers omit metadata; storage verifies the actual bytes.
    fileSize: p.fileSize === 0 ? undefined : p.fileSize,
  }));
}
