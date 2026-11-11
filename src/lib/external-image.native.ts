const edge = 1536;

/** Decode at upload size, including HEIC originals, without modifying the draft. */
export async function prepareExternalPhoto(uri: string): Promise<Uint8Array> {
  if (!uri.startsWith("file://")) throw new Error("PHOTO_INVALID");
  const { ImageManipulator, SaveFormat } =
    await import("expo-image-manipulator");
  const { File, Paths } = await import("expo-file-system");
  const context = ImageManipulator.manipulate(uri, {
    maxWidth: edge,
    maxHeight: edge,
  });
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  let temporary: string | undefined;
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
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.8,
    });
    temporary = saved.uri;
    const file = new File(saved.uri);
    if (!file.exists || file.size <= 0 || file.size > 3 * 1024 * 1024)
      throw new Error("PHOTO_INVALID");
    return await file.bytes();
  } finally {
    rendered?.release();
    context.release();
    if (temporary && temporary !== uri) {
      const target = new URL(temporary),
        cache = new URL(Paths.cache.uri);
      const path = decodeURIComponent(target.pathname),
        base = decodeURIComponent(cache.pathname).replace(/\/?$/, "/");
      if (
        target.protocol === "file:" &&
        target.host === cache.host &&
        path.startsWith(base) &&
        !path.includes("\\") &&
        !path.slice(base.length).split("/").includes("..")
      ) {
        try {
          const file = new File(temporary);
          if (file.exists) file.delete();
        } catch {
          /* OS cache cleanup can retry; the original is never touched. */
        }
      }
    }
  }
}
