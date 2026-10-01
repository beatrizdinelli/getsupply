import { put } from "@vercel/blob";

const extensionByContentType: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function uploadSupplierLogo(
  supplierId: number,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const extension = extensionByContentType[contentType] ?? "jpg";
  const blob = await put(
    `supplier-logos/${supplierId}-${Date.now()}.${extension}`,
    bytes,
    { access: "public", contentType },
  );
  return blob.url;
}
