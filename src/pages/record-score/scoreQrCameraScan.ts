import jsQR from "jsqr";

/** Normalize raw QR payload (URL with ?token= or raw token string). */
export function parseScoreQrTokenFromPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const asUrl = new URL(trimmed);
      return asUrl.searchParams.get("token")?.trim() ?? "";
    } catch {
      return "";
    }
  }

  return trimmed;
}

/**
 * Draws the current video frame into a downscaled canvas and returns ImageData for QR decoding.
 */
export function captureVideoFrameImageData(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  maxDimension = 960,
): ImageData | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  let w = vw;
  let h = vh;
  if (vw > vh && vw > maxDimension) {
    w = maxDimension;
    h = Math.round((vh * maxDimension) / vw);
  } else if (vh >= vw && vh > maxDimension) {
    h = maxDimension;
    w = Math.round((vw * maxDimension) / vh);
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/** Decode QR from image pixels; returns normalized score QR token or null. */
export function decodeScoreQrWithJsQR(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  const raw = result?.data?.trim() ?? "";
  if (!raw) return null;
  const token = parseScoreQrTokenFromPayload(raw);
  return token || null;
}
