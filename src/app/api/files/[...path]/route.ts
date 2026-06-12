import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getAuthenticatedHostelId } from "@/lib/auth";
import { hostelCanAccessUpload } from "@/lib/upload-access";
import {
  UPLOAD_FOLDERS,
  absolutePathForWebUpload,
  contentTypeForFilename,
  type UploadFolder,
} from "@/lib/local-upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    if (!hostelId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const segments = params.path ?? [];
    if (segments.length !== 2) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [folder, filename] = segments;
    if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const allowed = await hostelCanAccessUpload(
      hostelId,
      folder as UploadFolder,
      filename
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const storedPath = `/uploads/${folder}/${filename}`;
    const absolutePath = absolutePathForWebUpload(storedPath);
    if (!absolutePath) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = await readFile(absolutePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentTypeForFilename(filename),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/files:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
