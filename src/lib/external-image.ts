/** Browser drafts stay in IndexedDB; only a bounded JPEG copy leaves the device. */
export async function prepareExternalPhoto(uri: string): Promise<Uint8Array> {
  if (!uri.startsWith("blob:")) throw new Error("PHOTO_INVALID");
  const { ImageManipulator, SaveFormat } =
    await import("expo-image-manipulator");
  const context = ImageManipulator.manipulate(uri, {
    maxWidth: 1536,
    maxHeight: 1536,
  });
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  let temporary: string | undefined;
  try {
    rendered = await context.renderAsync();
    const scale = Math.min(1, 1536 / rendered.width, 1536 / rendered.height);
    if (!Number.isFinite(scale) || scale <= 0) throw new Error("PHOTO_INVALID");
    if (scale < 1) {
      context.resize({
        width: Math.max(1, Math.round(rendered.width * scale)),
        height: Math.max(1, Math.round(rendered.height * scale)),
      });
      const resized = await context.renderAsync();
      rendered.release();
      rendered = resized;
    }
    const result = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.8,
    });
    if (!result.uri.startsWith("blob:") || result.uri === uri)
      throw new Error("PHOTO_INVALID");
    temporary = result.uri;
    const blob = await (await fetch(temporary)).blob();
    if (
      blob.type !== "image/jpeg" ||
      blob.size <= 0 ||
      blob.size > 3 * 1024 * 1024
    )
      throw new Error("PHOTO_INVALID");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!bytes.length || bytes.length > 3 * 1024 * 1024)
      throw new Error("PHOTO_INVALID");
    return bytes;
  } finally {
    if (temporary) URL.revokeObjectURL(temporary);
    rendered?.release();
    context.release();
  }
}
