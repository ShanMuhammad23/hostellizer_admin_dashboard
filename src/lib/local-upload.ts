import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export const UPLOAD_FOLDERS = ["students", "hostel", "documents", "staff"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function uploadsRootAbsolute(): string {
  return path.join(process.cwd(), "public", "uploads");
}

/** Public URL path, e.g. `/uploads/students/uuid.jpg` */
export function webPathForUpload(folder: UploadFolder, filename: string): string {
  return `/uploads/${folder}/${filename}`;
}

export async function saveUploadedFile(
  buffer: Buffer,
  mime: string,
  folder: UploadFolder
): Promise<string> {
  if (folder === "documents") {
    if (!MIME_TO_EXT[mime]) {
      throw new Error("Unsupported file type for documents");
    }
  } else if (!IMAGE_MIMES.has(mime)) {
    throw new Error("Unsupported image type");
  }

  const ext = MIME_TO_EXT[mime];
  if (!ext) {
    throw new Error("Unsupported file type");
  }
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(uploadsRootAbsolute(), folder);
  await mkdir(dir, { recursive: true });
  const abs = path.join(dir, filename);
  await writeFile(abs, buffer);
  return webPathForUpload(folder, filename);
}

/** Resolve `/uploads/...` to absolute path only if it stays under `public/uploads`. */
export function absolutePathForWebUpload(webPath: string): string | null {
  if (!webPath || typeof webPath !== "string" || !webPath.startsWith("/uploads/")) {
    return null;
  }
  const rel = webPath.replace(/^\/+/, "");
  const abs = path.resolve(process.cwd(), "public", rel);
  const root = path.resolve(uploadsRootAbsolute());
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    return null;
  }
  return abs;
}

export async function deleteLocalUploadFile(webPath: string): Promise<void> {
  const abs = absolutePathForWebUpload(webPath);
  if (!abs) return;
  try {
    await unlink(abs);
  } catch {
    // missing file is fine
  }
}
