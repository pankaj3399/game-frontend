/**
 * Client-side image compression via HTML Canvas (DEV.to / canvas approach).
 * Compresses only when the file is larger than 1 MB; otherwise returns the original.
 */

const COMPRESS_THRESHOLD_BYTES = 1 * 1024 * 1024;
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const JPEG_QUALITY = 0.82;

function getImageDimensions(image: HTMLImageElement): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (image.complete && image.naturalWidth > 0) {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      return;
    }
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => reject(new Error("Failed to load image for compression"));
  });
}

function compressImage(
  image: HTMLImageElement,
  scaleFactor: number,
  width: number,
  height: number,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const scaledWidth = Math.max(1, Math.round(width * scaleFactor));
    const scaledHeight = Math.max(1, Math.round(height * scaleFactor));
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas is not supported in this browser"));
      return;
    }

    ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image file"));
    };
    image.src = url;
  });
}

function pickOutputMime(file: File): string {
  // Preserve PNG/WebP so canvas compression does not flatten transparency to JPEG.
  if (file.type === "image/png" || file.type === "image/webp") {
    return file.type;
  }
  return "image/jpeg";
}

/**
 * If `file` is ≤ 1 MB, returns it unchanged.
 * If larger, resizes (max 1600px) and re-encodes via canvas; returns the smaller result.
 */
export async function maybeCompressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const { width, height } = await getImageDimensions(image);
  const outputMime = pickOutputMime(file);
  const quality = outputMime === "image/jpeg" ? JPEG_QUALITY : undefined;

  const scale = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height);
  const compressedBlob = await compressImage(
    image,
    scale,
    width,
    height,
    outputMime,
    quality ?? 1,
  );

  if (compressedBlob.size >= file.size) {
    return file;
  }

  const extension = outputMime === "image/png" ? "png" : outputMime === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([compressedBlob], `${baseName}.${extension}`, {
    type: outputMime,
    lastModified: Date.now(),
  });
}

export const IMAGE_COMPRESS_THRESHOLD_BYTES = COMPRESS_THRESHOLD_BYTES;
