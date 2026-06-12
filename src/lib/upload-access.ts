import { access } from "fs/promises";
import { sql } from "@/lib/db";
import {
  absolutePathForWebUpload,
  type UploadFolder,
} from "@/lib/local-upload";

export async function hostelCanAccessUpload(
  hostelId: string,
  folder: UploadFolder,
  filename: string
): Promise<boolean> {
  const storedPath = `/uploads/${folder}/${filename}`;

  if (folder === "students") {
    const rows = await sql`
      SELECT 1 FROM students
      WHERE hostelid = ${hostelId}::uuid
        AND profile_image_path = ${storedPath}
      LIMIT 1
    `;
    if (rows.length > 0) return true;
  }

  if (folder === "staff") {
    const rows = await sql`
      SELECT 1 FROM staff
      WHERE hostelid = ${hostelId}::uuid
        AND (
          photo_path = ${storedPath}
          OR contract_document_path = ${storedPath}
        )
      LIMIT 1
    `;
    if (rows.length > 0) return true;
  }

  if (folder === "hostel") {
    const rows = await sql`
      SELECT 1 FROM hostels
      WHERE id = ${hostelId}::uuid
        AND ${storedPath} = ANY(COALESCE(images, ARRAY[]::text[]))
      LIMIT 1
    `;
    if (rows.length > 0) return true;
  }

  if (folder === "documents") {
    const like = `%${storedPath}%`;
    const docRows = await sql`
      SELECT 1 FROM documents
      WHERE hostelid = ${hostelId}::uuid
        AND documentdata::text LIKE ${like}
      LIMIT 1
    `;
    if (docRows.length > 0) return true;

    const staffRows = await sql`
      SELECT 1 FROM staff
      WHERE hostelid = ${hostelId}::uuid
        AND (
          contract_document_path = ${storedPath}
          OR compliance_documents::text LIKE ${like}
        )
      LIMIT 1
    `;
    if (staffRows.length > 0) return true;
  }

  // Fresh uploads (preview before DB save): auth + UUID filename on disk.
  const absolutePath = absolutePathForWebUpload(storedPath);
  if (!absolutePath) return false;
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}
