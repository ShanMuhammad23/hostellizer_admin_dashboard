import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteLocalUploadFile } from "@/lib/local-upload";

export async function GET(request: NextRequest) {
  try {
    const hostel_id = await getAuthenticatedHostelId();

    const result = await sql`
      SELECT images
      FROM hostels
      WHERE id = ${hostel_id}::uuid;
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Hostel not found",
        },
        { status: 404 }
      );
    }

    const images = result[0].images || [];

    return NextResponse.json({
      success: true,
      images: images,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching images",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const hostel_id = await getAuthenticatedHostelId();

    if (!hostel_id) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const imageUrl = (body.imageUrl ?? body.imagePath) as string | undefined;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { success: false, message: "No image path provided" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE hostels
      SET images = array_append(COALESCE(images, ARRAY[]::text[]), ${imageUrl}::text)
      WHERE id = ${hostel_id}::uuid
      RETURNING images;
    `;

    return NextResponse.json({
      success: true,
      message: "Image added successfully",
      images: result[0].images,
    });
  } catch (error) {
    console.error("Error adding image:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error adding image",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const hostel_id = await getAuthenticatedHostelId();
    const { imagePath } = await request.json();

    if (!imagePath || typeof imagePath !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "No image path provided",
        },
        { status: 400 }
      );
    }

    if (imagePath.startsWith("/uploads/")) {
      await deleteLocalUploadFile(imagePath);
    }

    const result = await sql`
      UPDATE hostels
      SET images = array_remove(images, ${imagePath}::text)
      WHERE id = ${hostel_id}::uuid
      RETURNING images;
    `;

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      images: result[0].images,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error deleting image",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
