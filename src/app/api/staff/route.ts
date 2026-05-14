import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

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

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const rows = await sql`
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
      WHERE hostelid = ${hostelId}
      ORDER BY status ASC, full_name ASC
    `;
    return NextResponse.json({ success: true, staff: rows });
  } catch (e) {
    console.error("GET /api/staff", e);
    return NextResponse.json(
      {
        success: false,
        message: e instanceof Error ? e.message : "Failed to load staff",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const body = (await request.json()) as Record<string, unknown>;

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

    const photoPath =
      typeof body.photoPath === "string" &&
      body.photoPath.startsWith("/uploads/staff/")
        ? body.photoPath
        : null;
    const contractPath =
      typeof body.contractDocumentPath === "string" &&
      (body.contractDocumentPath.startsWith("/uploads/staff/") ||
        body.contractDocumentPath.startsWith("/uploads/documents/"))
        ? body.contractDocumentPath
        : null;

    const statusRaw = String(body.status ?? "active").toLowerCase();
    const status =
      statusRaw === "inactive" || statusRaw === "terminated"
        ? statusRaw
        : "active";

    const [row] = await sql`
      INSERT INTO staff (
        hostelid,
        cnic,
        full_name,
        father_or_spouse_name,
        role,
        employment_type,
        join_date,
        salary_amount_monthly,
        salary_is_gross,
        salary_net_amount,
        bank_name,
        bank_account_or_iban,
        easypaisa_msisdn,
        jazzcash_msisdn,
        address,
        phone,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        photo_path,
        compliance_documents,
        contract_document_path,
        contract_language,
        status,
        notes
      )
      VALUES (
        ${hostelId},
        ${cnic},
        ${fullName},
        ${String(body.fatherOrSpouseName ?? "").trim() || null},
        ${role},
        ${employmentType},
        ${joinDate}::date,
        ${Number.isFinite(salary) ? salary : 0},
        ${salaryIsGross},
        ${salaryNet},
        ${String(body.bankName ?? "").trim() || null},
        ${String(body.bankAccountOrIban ?? "").trim() || null},
        ${String(body.easypaisaMsisdn ?? "").replace(/\D/g, "").slice(0, 20) || null},
        ${String(body.jazzcashMsisdn ?? "").replace(/\D/g, "").slice(0, 20) || null},
        ${sql.json(addr)},
        ${phone},
        ${String(body.emergencyContactName ?? "").trim() || null},
        ${String(body.emergencyContactPhone ?? "").trim() || null},
        ${String(body.emergencyContactRelation ?? "").trim() || null},
        ${photoPath},
        ${sql.json(compliance)},
        ${contractPath},
        ${String(body.contractLanguage ?? "ur").slice(0, 10)},
        ${status},
        ${String(body.notes ?? "").trim() || null}
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: row.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create staff";
    const code = (e as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json(
        { success: false, message: "CNIC already exists for this hostel" },
        { status: 409 }
      );
    }
    console.error("POST /api/staff", e);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
