import type { PhotoInput } from "./photo-draft";

export async function capturedPhotoInput(uri: string): Promise<PhotoInput> {
  if (!uri.startsWith("file://")) throw new Error("PHOTO_INVALID");
  return { uri };
}
