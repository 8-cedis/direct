import { supabase } from "./supabaseData";

export const PRODUCT_IMAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET || "alfred";

const formatStorageError = (error) => {
  if (!error) return null;

  const message = String(error.message || error || "");
  if (message.toLowerCase().includes("bucket not found")) {
    return new Error(
      `Supabase storage bucket "${PRODUCT_IMAGE_BUCKET}" was not found. Create that public bucket in Supabase Storage or set NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET to the bucket you already use.`
    );
  }

  return error instanceof Error ? error : new Error(message || "Product image upload failed");
};

export async function uploadProductImage(file, productName = "product") {
  if (!file) {
    throw new Error("No file provided");
  }

  const safeName = String(productName || "product")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";

  const safeFileName = String(file.name || "image")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
  const fileName = `${safeName}-${Date.now()}-${safeFileName}`;
  const filePath = `${safeName}/${fileName}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    throw formatStorageError(error);
  }

  // Return ONLY the path, not the full public URL.
  // This is more flexible as the frontend can resolve it based on its own config.
  return filePath;
}
