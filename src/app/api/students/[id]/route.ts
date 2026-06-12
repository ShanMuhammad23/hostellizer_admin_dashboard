import { NextRequest, NextResponse } from "next/server";
import type postgres from "postgres";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";
import { deleteLocalUploadFile, isValidStoredUploadPath } from "@/lib/local-upload";

async function resolveParamsId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  return (await Promise.resolve(params)).id;
}

/** undefined = leave unchanged; null = clear; string = set (must be under /uploads/students/) */
function parseStudentProfilePath(
  body: Record<string, unknown>
): string | null | undefined {
  if (!("profileImagePath" in body) && !("image" in body)) return undefined;
  const v = body.profileImagePath ?? body.image;
  if (v === null || v === "") return null;
  if (typeof v === "string" && isValidStoredUploadPath(v, ["students"])) return v;
  return undefined;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
  try {
    const data = (await request.json()) as Record<string, unknown>;
    const id = await resolveParamsId(context.params);
    const hostelId = await getAuthenticatedHostelId();

    const [existing] = await sql`
      SELECT id, profile_image_path FROM students
      WHERE id = ${id}::integer AND hostelid = ${hostelId}
    `;
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const parsed = parseStudentProfilePath(data);
    const finalPath =
      parsed === undefined ? existing.profile_image_path : parsed;

    const response = await sql`
      UPDATE students
      SET
        name = ${data.name as string},
        email = ${data.email as string},
        phone = ${data.phone as string},
        address = ${sql.json(data.address as postgres.JSONValue)},
        room_number = ${data.roomnumber as number},
        status = ${data.status as string},
        accommodation_type = ${data.accomodationtype as string},
        monthly_rent = ${data.monthlyrent as number},
        payment_status = ${data.paymentstatus as string},
        payment_due_date = ${data.payment_due_date as string | null},
        profile_image_path = ${finalPath},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::integer
        AND hostelid = ${hostelId}
      RETURNING *
    `;

    if (response.length === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const oldPath = existing.profile_image_path as string | null;
    if (
      oldPath &&
      oldPath.startsWith("/uploads/") &&
      oldPath !== finalPath
    ) {
      await deleteLocalUploadFile(oldPath);
    }

    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      student: response[0],
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { success: false, message: "Error updating student" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
  try {
    const id = await resolveParamsId(context.params);
    const hostelId = await getAuthenticatedHostelId();

    const response = await sql`
      DELETE FROM students
      WHERE id = ${id}::integer
        AND hostelid = ${hostelId}
      RETURNING profile_image_path
    `;

    if (response.length === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const p = response[0].profile_image_path as string | null;
    if (p && p.startsWith("/uploads/")) {
      await deleteLocalUploadFile(p);
    }

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting student" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await resolveParamsId(context.params);
    const hostelId = await getAuthenticatedHostelId();
    const response = await sql`
      WITH student_data AS (
        SELECT
          s.id,
          s.name,
          s.email,
          s.phone,
          s.address,
          s.room_number AS "roomnumber",
          s.status,
          s.joined_date AS "joineddate",
          NULL::date AS "leavedate",
          s.accommodation_type AS "accomodationtype",
          s.monthly_rent AS "monthlyrent",
          s.is_taking_mess AS "istakingmess",
          s.payment_status AS "paymentstatus",
          s.payment_due_date AS "payment_due_date",
          COALESCE(s.profile_image_path, '') AS "image"
        FROM students s
        WHERE s.id = ${id}::integer
          AND s.hostelid = ${hostelId}
      ),
      payment_data AS (
        SELECT
          ph.student_id AS studentid,
          json_agg(
            json_build_object(
              'id', ph.id,
              'amount', ph.amount,
              'date', ph.payment_date,
              'createdAt', ph.created_at,
              'paymentChannel', ph.payment_method,
              'transactionId', ph.reference_number
            ) ORDER BY ph.payment_date DESC
          ) AS payment_history,
          COALESCE(SUM(ph.amount), 0) AS total_amount_paid
        FROM payment_history ph
        WHERE ph.student_id = ${id}::integer
        GROUP BY ph.student_id
      )
      SELECT
        sd.*,
        COALESCE(pd.payment_history, '[]'::json) AS payment_history,
        COALESCE(pd.total_amount_paid, 0) AS total_amount_paid
      FROM student_data sd
      LEFT JOIN payment_data pd ON sd.id = pd.studentid
    `;

    if (response.length === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: response[0],
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const paramsId = await resolveParamsId(context.params);
    const body = (await request.json()) as Record<string, unknown>;
    const hasMessKey =
      Object.prototype.hasOwnProperty.call(body, "istakingmess") ||
      Object.prototype.hasOwnProperty.call(body, "is_taking_mess");

    const name = body.name as string;
    const email = body.email as string;
    const phone = body.phone as string;
    const roomNumberRaw = body.roomNumber ?? body.roomnumber;
    const roomNumber =
      roomNumberRaw === null ||
      roomNumberRaw === undefined ||
      roomNumberRaw === ""
        ? null
        : Number(roomNumberRaw);
    const status = body.status as string;
    const accomodationType = (body.accomodationType ??
      body.accomodationtype) as string;
    const monthlyRentRaw = body.monthlyRent ?? body.monthlyrent;
    const monthlyRent =
      monthlyRentRaw === null || monthlyRentRaw === undefined || monthlyRentRaw === ""
        ? null
        : Number(monthlyRentRaw);

    const paymentStatusRaw = (body.paymentStatus ??
      body.paymentstatus) as string | undefined;
    const paymentStatusNorm =
      paymentStatusRaw === "paid" ||
      paymentStatusRaw === "pending" ||
      paymentStatusRaw === "overdue"
        ? paymentStatusRaw
        : "pending";

    const dueRaw = body.payment_due_date as string | undefined;
    const paymentDueDate =
      typeof dueRaw === "string" && dueRaw.trim() !== ""
        ? dueRaw.trim().slice(0, 10)
        : null;

    const messRaw = body.istakingmess ?? body.is_taking_mess;
    const isTakingMessFromBody =
      messRaw === true || messRaw === "true" || messRaw === 1;

    const addressRaw = body.address;
    const address =
      typeof addressRaw === "string"
        ? { street: addressRaw, town: "", city: "" }
        : addressRaw;

    if (
      !name ||
      !email ||
      !phone ||
      address == null ||
      !status ||
      !accomodationType ||
      monthlyRent == null ||
      Number.isNaN(monthlyRent) ||
      (roomNumber !== null && Number.isNaN(roomNumber))
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [existing] = await sql`
      SELECT id, profile_image_path, is_taking_mess FROM students
      WHERE id = ${paramsId}::integer AND hostelid = ${hostelId}
    `;
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const parsed = parseStudentProfilePath(body);
    const finalPath =
      parsed === undefined ? existing.profile_image_path : parsed;

    const isTakingMess = hasMessKey
      ? isTakingMessFromBody
      : Boolean(existing.is_taking_mess);

    const result = await sql`
      UPDATE students
      SET
        name = ${name},
        email = ${email},
        phone = ${phone},
        address = ${sql.json(address as postgres.JSONValue)},
        room_number = ${roomNumber},
        status = ${status},
        accommodation_type = ${accomodationType},
        monthly_rent = ${monthlyRent},
        payment_status = ${paymentStatusNorm},
        payment_due_date = ${paymentDueDate},
        is_taking_mess = ${isTakingMess},
        profile_image_path = ${finalPath},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${paramsId}::integer
        AND hostelid = ${hostelId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const oldPath = existing.profile_image_path as string | null;
    if (
      oldPath &&
      oldPath.startsWith("/uploads/") &&
      oldPath !== finalPath
    ) {
      await deleteLocalUploadFile(oldPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update student" },
      { status: 500 }
    );
  }
}
