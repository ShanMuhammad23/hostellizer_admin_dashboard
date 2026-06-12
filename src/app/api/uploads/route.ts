import { NextResponse } from "next/server";
import { getAuthenticatedHostelId } from "@/lib/auth";
import {
  saveUploadedFile,
  UPLOAD_FOLDERS,
  type UploadFolder,
} from "@/lib/local-upload";
import { getUploadServeUrl } from "@/lib/upload-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;

function parseFolder(value: string | null): UploadFolder | null {
  if (!value || !UPLOAD_FOLDERS.includes(value as UploadFolder)) return null;
  return value as UploadFolder;
}

export async function POST(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    if (!hostelId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw =
      (formData.get("folder") as string | null) ??
      new URL(request.url).searchParams.get("folder");

    const folder = parseFolder(folderRaw);
    if (!folder) {
      return NextResponse.json(
        { error: "Invalid or missing folder (use students, hostel, documents, or staff)" },
        { status: 400 }
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxBytes =
      folder === "documents" ? MAX_DOCUMENT_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `File too large (max ${maxBytes / (1024 * 1024)} MB)`,
        },
        { status: 400 }
      );
    }

    let mime = file.type || "application/octet-stream";
    if (
      folder === "documents" &&
      (!mime || mime === "application/octet-stream") &&
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      mime = "application/pdf";
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicPath = await saveUploadedFile(buffer, mime, folder);

    return NextResponse.json({
      path: publicPath,
      url: getUploadServeUrl(publicPath),
    });
  } catch (e) {
    console.error("Upload error:", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
