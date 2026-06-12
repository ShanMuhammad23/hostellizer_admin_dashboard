/** Stored DB value, e.g. `/uploads/students/uuid.jpg` */
export function isStoredUploadPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== "string") return false;
  return path.startsWith("/uploads/");
}

/** Authenticated URL for browser display/download (not directly on disk). */
export function getUploadServeUrl(path: string | null | undefined): string {
  if (!path || typeof path !== "string") return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/api/files/")) return path;
  if (path.startsWith("/uploads/")) {
    return `/api/files${path.slice("/uploads".length)}`;
  }
  return path;
}

export function isPrivateUploadPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== "string") return false;
  return (
    path.startsWith("/uploads/") ||
    path.startsWith("/api/files/") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  );
}
