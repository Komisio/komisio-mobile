/** Browser drafts stay in IndexedDB; only a bounded JPEG copy leaves the device. */
export async function prepareExternalPhoto(uri: string): Promise<Uint8Array> {
  return preparePhoto(uri, 1536, 3 * 1024 * 1024, [0.8]);
}

export async function prepareGuestPhoto(uri: string): Promise<Uint8Array> {
  return preparePhoto(uri, 1024, 262144, [0.8, 0.65, 0.45, 0.25]);
}

async function preparePhoto(
  uri: string,
  edge: number,
  limit: number,
  qualities: number[],
): Promise<Uint8Array> {
  if (!uri.startsWith("blob:")) throw new Error("PHOTO_INVALID");
  const { ImageManipulator, SaveFormat } =
    await import("expo-image-manipulator");
  const context = ImageManipulator.manipulate(uri, {
    maxWidth: edge,
    maxHeight: edge,
  });
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  const temporary: string[] = [];
  try {
    rendered = await context.renderAsync();
    const scale = Math.min(1, edge / rendered.width, edge / rendered.height);
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
    for (const compress of qualities) {
      const result = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress,
      });
      if (!result.uri.startsWith("blob:") || result.uri === uri)
        throw new Error("PHOTO_INVALID");
      temporary.push(result.uri);
      const blob = await (await fetch(result.uri)).blob();
      if (blob.type !== "image/jpeg" || blob.size <= 0)
        throw new Error("PHOTO_INVALID");
      if (blob.size > limit) continue;
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (!bytes.length || bytes.length > limit)
        throw new Error("PHOTO_INVALID");
      return bytes;
    }
    throw new Error("PHOTO_INVALID");
  } finally {
    for (const saved of temporary) URL.revokeObjectURL(saved);
    rendered?.release();
    context.release();
  }
}
