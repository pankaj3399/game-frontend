import { api } from "@/lib/api/client";
import { maybeCompressImage } from "@/lib/image/compressImage";

export type AssetKind =
  | "user_avatar"
  | "club_logo"
  | "tournament_logo"
  | "sponsor_logo";

export type UploadedImageResponse = {
  url: string;
  key: string;
};

type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
};

/**
 * Compress (if > 1 MB) → request presigned PUT URL → upload directly to S3 → return CDN URL.
 *
 * Does not delete a previous asset — callers should delete `replaceUrl` only after the new
 * URL has been persisted successfully (avoids orphaning the DB on a failed save).
 */
export async function uploadImageFile(params: {
  file: File;
  kind: AssetKind;
  assetId?: string;
}): Promise<UploadedImageResponse> {
  const file = await maybeCompressImage(params.file);
  const contentType = (file.type || "image/jpeg") as
    | "image/png"
    | "image/jpeg"
    | "image/jpg"
    | "image/webp";
  const normalizedType = contentType === "image/jpg" ? "image/jpeg" : contentType;

  const { data: presign } = await api.post<PresignResponse>("/api/uploads/presign", {
    kind: params.kind,
    contentType: normalizedType,
    assetId: params.assetId,
    contentLength: file.size,
  });

  const putResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": normalizedType,
      "Content-Length": String(file.size),
    },
    body: file,
    signal: AbortSignal.timeout(30_000),
  });

  if (!putResponse.ok) {
    throw new Error(`Failed to upload image to storage (${putResponse.status})`);
  }

  return {
    url: presign.publicUrl,
    key: presign.key,
  };
}

/** Best-effort delete of a previous CDN object after the new URL is saved. */
export async function deleteUploadedImage(url: string | null | undefined): Promise<void> {
  if (!url?.startsWith("http")) return;
  try {
    await api.delete("/api/uploads", { data: { url } });
  } catch {
    /* orphan cleanup script / next overwrite can reclaim */
  }
}
