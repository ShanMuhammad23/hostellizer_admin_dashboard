import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

async function staffId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  return (await Promise.resolve(params)).id;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const sid = await staffId(context.params);

    const [s] = await sql`
      SELECT id FROM staff WHERE id = ${sid}::integer AND hostelid = ${hostelId}
    `;
    if (!s) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    const rows = await sql`
      SELECT
        l.id,
        l.entry_type AS "entryType",
        l.amount,
        l.occurred_on AS "occurredOn",
        l.reference,
        l.notes,
        l.payroll_entry_id AS "payrollEntryId",
        l.created_at AS "createdAt"
      FROM staff_advance_ledger l
      WHERE l.staff_id = ${sid}::integer
      ORDER BY l.occurred_on DESC, l.created_at DESC
    `;

    const [{ bal }] = await sql<{ bal: string }[]>`
      SELECT COALESCE(
        SUM(
          CASE
            WHEN entry_type IN ('advance', 'adjustment') THEN amount
            WHEN entry_type IN ('repayment', 'payroll_deduction') THEN -amount
            ELSE 0
          END
        ),
        0
      )::text AS bal
      FROM staff_advance_ledger
      WHERE staff_id = ${sid}::integer
    `;

    return NextResponse.json({
      success: true,
      entries: rows,
      outstandingAdvance: Number(bal),
    });
  } catch (e) {
    console.error("GET advances", e);
    return NextResponse.json(
      { success: false, message: "Failed to load advances" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const sid = await staffId(context.params);
    const body = (await request.json()) as Record<string, unknown>;

    const [s] = await sql`
      SELECT id FROM staff WHERE id = ${sid}::integer AND hostelid = ${hostelId}
    `;
    if (!s) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    const entryType = String(body.entryType ?? "").toLowerCase();
    if (
      !["advance", "repayment", "payroll_deduction", "adjustment"].includes(
        entryType
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid entry type" },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const occurredOn =
      typeof body.occurredOn === "string" && body.occurredOn
        ? body.occurredOn.slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    await sql`
      INSERT INTO staff_advance_ledger (
        staff_id,
        entry_type,
        amount,
        occurred_on,
        reference,
        notes
      )
      VALUES (
        ${sid}::integer,
        ${entryType},
        ${amount},
        ${occurredOn}::date,
        ${String(body.reference ?? "").trim() || null},
        ${String(body.notes ?? "").trim() || null}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST advances", e);
    return NextResponse.json(
      { success: false, message: "Failed to add ledger entry" },
      { status: 500 }
    );
  }
}
