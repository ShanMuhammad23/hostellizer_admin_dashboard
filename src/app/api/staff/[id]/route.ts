import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";
import { deleteLocalUploadFile, isValidStoredUploadPath } from "@/lib/local-upload";

async function resolveId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  return (await Promise.resolve(params)).id;
}

function normalizeCnic(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\D/g, "").slice(0, 15);
}

function parseAddress(raw: unknown): Record<string, string> {
  if (typeof raw === "string") {
    return { street: raw, town: "", city: "" };
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return {
      street: String(o.street ?? ""),
      town: String(o.town ?? ""),
      city: String(o.city ?? ""),
    };
  }
  return { street: "", town: "", city: "" };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const id = await resolveId(context.params);

    const [row] = await sql`
      SELECT
        id,
        hostelid,
        cnic,
        full_name AS "fullName",
        father_or_spouse_name AS "fatherOrSpouseName",
        role,
        employment_type AS "employmentType",
        join_date AS "joinDate",
        salary_amount_monthly AS "salaryAmountMonthly",
        salary_is_gross AS "salaryIsGross",
        salary_net_amount AS "salaryNetAmount",
        bank_name AS "bankName",
        bank_account_or_iban AS "bankAccountOrIban",
        easypaisa_msisdn AS "easypaisaMsisdn",
        jazzcash_msisdn AS "jazzcashMsisdn",
        address,
        phone,
        emergency_contact_name AS "emergencyContactName",
        emergency_contact_phone AS "emergencyContactPhone",
        emergency_contact_relation AS "emergencyContactRelation",
        COALESCE(photo_path, '') AS "photoPath",
        compliance_documents AS "complianceDocuments",
        contract_document_path AS "contractDocumentPath",
        contract_language AS "contractLanguage",
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM staff
      WHERE id = ${id}::integer AND hostelid = ${hostelId}
    `;

    if (!row) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, staff: row });
  } catch (e) {
    console.error("GET /api/staff/[id]", e);
    return NextResponse.json(
      { success: false, message: "Failed to load staff" },
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
    const id = await resolveId(context.params);
    const body = (await request.json()) as Record<string, unknown>;

    const [existing] = await sql`
      SELECT id, photo_path, contract_document_path FROM staff
      WHERE id = ${id}::integer AND hostelid = ${hostelId}
    `;
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    const cnic = normalizeCnic(body.cnic);
    const fullName = String(body.fullName ?? "").trim();
    const role = String(body.role ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (!cnic || !fullName || !role || !phone) {
      return NextResponse.json(
        { success: false, message: "CNIC, full name, role, and phone are required" },
        { status: 400 }
      );
    }

    const employmentType =
      body.employmentType === "daily_wage" ? "daily_wage" : "permanent";
    const joinDate =
      typeof body.joinDate === "string" && body.joinDate
        ? body.joinDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const salary = Number(body.salaryAmountMonthly ?? 0);
    const salaryIsGross = body.salaryIsGross !== false;
    const salaryNet =
      body.salaryNetAmount != null && body.salaryNetAmount !== ""
        ? Number(body.salaryNetAmount)
        : null;
    const addr = parseAddress(body.address);
    const compliance = Array.isArray(body.complianceDocuments)
      ? body.complianceDocuments
      : [];

    const nextPhoto =
      "photoPath" in body
        ? typeof body.photoPath === "string" &&
          isValidStoredUploadPath(body.photoPath, ["staff"])
          ? body.photoPath
          : null
        : (existing.photo_path as string | null);

    const nextContract =
      "contractDocumentPath" in body
        ? typeof body.contractDocumentPath === "string" &&
          isValidStoredUploadPath(body.contractDocumentPath, ["staff", "documents"])
          ? body.contractDocumentPath
          : null
        : (existing.contract_document_path as string | null);

    const statusRaw = String(body.status ?? "active").toLowerCase();
    const status =
      statusRaw === "inactive" || statusRaw === "terminated"
        ? statusRaw
        : "active";

    await sql`
      UPDATE staff SET
        cnic = ${cnic},
        full_name = ${fullName},
        father_or_spouse_name = ${String(body.fatherOrSpouseName ?? "").trim() || null},
        role = ${role},
        employment_type = ${employmentType},
        join_date = ${joinDate}::date,
        salary_amount_monthly = ${Number.isFinite(salary) ? salary : 0},
        salary_is_gross = ${salaryIsGross},
        salary_net_amount = ${salaryNet},
        bank_name = ${String(body.bankName ?? "").trim() || null},
        bank_account_or_iban = ${String(body.bankAccountOrIban ?? "").trim() || null},
        easypaisa_msisdn = ${String(body.easypaisaMsisdn ?? "").replace(/\D/g, "").slice(0, 20) || null},
        jazzcash_msisdn = ${String(body.jazzcashMsisdn ?? "").replace(/\D/g, "").slice(0, 20) || null},
        address = ${sql.json(addr)},
        phone = ${phone},
        emergency_contact_name = ${String(body.emergencyContactName ?? "").trim() || null},
        emergency_contact_phone = ${String(body.emergencyContactPhone ?? "").trim() || null},
        emergency_contact_relation = ${String(body.emergencyContactRelation ?? "").trim() || null},
        photo_path = ${nextPhoto},
        compliance_documents = ${sql.json(compliance)},
        contract_document_path = ${nextContract},
        contract_language = ${String(body.contractLanguage ?? "ur").slice(0, 10)},
        status = ${status},
        notes = ${String(body.notes ?? "").trim() || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::integer AND hostelid = ${hostelId}
    `;

    const oldPhoto = existing.photo_path as string | null;
    if (
      oldPhoto &&
      oldPhoto.startsWith("/uploads/") &&
      oldPhoto !== nextPhoto
    ) {
      await deleteLocalUploadFile(oldPhoto);
    }
    const oldContract = existing.contract_document_path as string | null;
    if (
      oldContract &&
      oldContract.startsWith("/uploads/") &&
      oldContract !== nextContract
    ) {
      await deleteLocalUploadFile(oldContract);
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update";
    const code = (e as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json(
        { success: false, message: "CNIC already exists for this hostel" },
        { status: 409 }
      );
    }
    console.error("PUT /api/staff/[id]", e);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const id = await resolveId(context.params);

    const [row] = await sql`
      DELETE FROM staff
      WHERE id = ${id}::integer AND hostelid = ${hostelId}
      RETURNING photo_path, contract_document_path
    `;

    if (!row) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    const p = row.photo_path as string | null;
    const c = row.contract_document_path as string | null;
    if (p && p.startsWith("/uploads/")) await deleteLocalUploadFile(p);
    if (c && c.startsWith("/uploads/")) await deleteLocalUploadFile(c);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/staff/[id]", e);
    return NextResponse.json(
      { success: false, message: "Failed to delete" },
      { status: 500 }
    );
  }
}
