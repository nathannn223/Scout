import { put } from "@vercel/blob";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export class BlobUploadError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "BlobUploadError";
  }
}

async function putToBlob(
  data: Buffer | Blob,
  contentType: string,
  extension: string
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new BlobUploadError("BLOB_READ_WRITE_TOKEN is not set");
  }

  const key = `scans/${crypto.randomUUID()}.${extension}`;

  try {
    const blob = await put(key, data, {
      access: "public",
      contentType,
    });
    return blob.url;
  } catch (err) {
    throw new BlobUploadError("Could not upload image.", err);
  }
}

export async function uploadImage(file: File): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  return putToBlob(file, file.type, extension);
}

/**
 * Downloads an externally-hosted image (e.g. a right-click capture from
 * Instagram/Pinterest) and re-hosts it on our own Blob store. Several CDNs
 * (Pinterest, Google's image proxies, Wikimedia) disallow Claude's own
 * fetcher via robots.txt even though a plain server-side fetch works fine —
 * mirroring the bytes ourselves sidesteps that entirely, and is invisible
 * to the end user (same right-click flow, no extra step).
 */
export async function mirrorImageUrl(sourceUrl: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(sourceUrl);
  } catch (err) {
    throw new BlobUploadError("Could not download the source image.", err);
  }

  if (!response.ok) {
    throw new BlobUploadError(`Source image returned status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new BlobUploadError(`Source URL is not an image (content-type: ${contentType || "unknown"}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new BlobUploadError("Source image exceeds 5MB limit.");
  }

  const extension = contentType.split("/")[1]?.split(";")[0] || "jpg";
  return putToBlob(Buffer.from(arrayBuffer), contentType, extension);
}
