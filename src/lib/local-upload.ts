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

const STORED_FILENAME_RE = /^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif|pdf)$/i;

/** Private on-disk root (not served from /public). */
export function uploadsRootAbsolute(): string {
  return path.join(process.cwd(), "storage", "uploads");
}

/** @deprecated Legacy public folder — read-only fallback for older uploads. */
function legacyPublicUploadsRoot(): string {
  return path.join(process.cwd(), "public", "uploads");
}

/** Stored path saved in the database, e.g. `/uploads/students/uuid.jpg` */
export function webPathForUpload(folder: UploadFolder, filename: string): string {
  return `/uploads/${folder}/${filename}`;
}

export function isValidStoredUploadPath(
  webPath: string,
  allowedFolders?: UploadFolder[]
): boolean {
  if (!webPath || typeof webPath !== "string" || !webPath.startsWith("/uploads/")) {
    return false;
  }
  const segments = webPath.split("/").filter(Boolean);
  if (segments.length !== 3 || segments[0] !== "uploads") return false;
  const folder = segments[1] as UploadFolder;
  const filename = segments[2];
  if (!UPLOAD_FOLDERS.includes(folder)) return false;
  if (allowedFolders && !allowedFolders.includes(folder)) return false;
  return STORED_FILENAME_RE.test(filename);
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

function resolveUnderRoot(root: string, folder: string, filename: string): string | null {
  if (!STORED_FILENAME_RE.test(filename)) return null;
  const abs = path.resolve(root, folder, filename);
  const resolvedRoot = path.resolve(root);
  if (!abs.startsWith(resolvedRoot + path.sep) && abs !== resolvedRoot) {
    return null;
  }
  return abs;
}

/** Resolve a stored `/uploads/...` path to an absolute file (private storage, then legacy public). */
export function absolutePathForWebUpload(webPath: string): string | null {
  if (!webPath || typeof webPath !== "string" || !webPath.startsWith("/uploads/")) {
    return null;
  }
  const segments = webPath.split("/").filter(Boolean);
  if (segments.length !== 3 || segments[0] !== "uploads") return null;

  const folder = segments[1];
  const filename = segments[2];
  if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) return null;

  const privatePath = resolveUnderRoot(uploadsRootAbsolute(), folder, filename);
  if (privatePath) return privatePath;

  return resolveUnderRoot(legacyPublicUploadsRoot(), folder, filename);
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

export function contentTypeForFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}
