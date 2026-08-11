import { NextRequest, NextResponse } from "next/server";
import { uploadImage, MAX_IMAGE_BYTES, BlobUploadError } from "@/lib/blob";

/**
 * Public, unauthenticated image hosting only — no Claude/SerpApi call here.
 * Lets the landing page's try-it widget host a photo before asking anyone
 * to sign in; the expensive identification step still happens in
 * /api/scan, which requires a real account.
 */
export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "'image' is required." }, { status: 400 });
  }
  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "'image' must be an image file." }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image exceeds 5MB limit." }, { status: 400 });
  }

  try {
    const url = await uploadImage(image);
    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    if (err instanceof BlobUploadError) {
      console.error("[upload] blob upload failed:", err.message, err.cause ?? "");
      return NextResponse.json({ error: "Could not upload image." }, { status: 500 });
    }
    throw err;
  }
}
