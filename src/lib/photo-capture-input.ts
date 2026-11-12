import { MAX_PHOTO_BYTES, type PhotoInput } from "./photo-draft";

export async function capturedPhotoInput(uri: string): Promise<PhotoInput> {
  if (!uri.startsWith("data:image/") || uri.length > MAX_PHOTO_BYTES * 1.4)
    throw new Error("PHOTO_INVALID");
  const file = await (await fetch(uri)).blob();
  if (
    !file.type.startsWith("image/") ||
    !file.size ||
    file.size > MAX_PHOTO_BYTES
  )
    throw new Error("PHOTO_INVALID");
  return { uri, file, fileSize: file.size };
}
