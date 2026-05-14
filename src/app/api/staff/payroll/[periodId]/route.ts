import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

async function pid(
  params: Promise<{ periodId: string }> | { periodId: string }
): Promise<string> {
  return (await Promise.resolve(params)).periodId;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ periodId: string }> | { periodId: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const periodId = await pid(context.params);

    const [period] = await sql`
      SELECT id, year, month, status, notes, created_at AS "createdAt"
      FROM staff_payroll_periods
      WHERE id = ${periodId}::integer AND hostelid = ${hostelId}
    `;
    if (!period) {
      return NextResponse.json(
        { success: false, message: "Period not found" },
        { status: 404 }
      );
    }

    const entries = await sql`
      SELECT
        e.id,
        e.staff_id AS "staffId",
        s.full_name AS "fullName",
        e.base_salary AS "baseSalary",
        e.overtime_amount AS "overtimeAmount",
        e.holiday_duty_amount AS "holidayDutyAmount",
        e.eid_bonus_amount AS "eidBonusAmount",
        e.mess_allowance_amount AS "messAllowanceAmount",
        e.other_additions AS "otherAdditions",
        e.advance_deduction_amount AS "advanceDeductionAmount",
        e.absence_deduction_amount AS "absenceDeductionAmount",
        e.damage_charge_amount AS "damageChargeAmount",
        e.other_deductions AS "otherDeductions",
        e.gross_earnings AS "grossEarnings",
        e.total_deductions AS "totalDeductions",
        e.net_payable AS "netPayable",
        e.salary_slip_path AS "salarySlipPath",
        e.slip_locale AS "slipLocale",
        e.signed_by_name AS "signedByName",
        e.signed_at AS "signedAt"
      FROM staff_payroll_entries e
      INNER JOIN staff s ON s.id = e.staff_id AND s.hostelid = ${hostelId}
      WHERE e.payroll_period_id = ${periodId}::integer
      ORDER BY s.full_name ASC
    `;

    return NextResponse.json({ success: true, period, entries });
  } catch (e) {
    console.error("GET payroll period", e);
    return NextResponse.json(
      { success: false, message: "Failed to load payroll" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ periodId: string }> | { periodId: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const periodId = await pid(context.params);
    const body = (await request.json()) as { status?: string; notes?: string };

    const statusRaw = body.status !== undefined ? String(body.status).toLowerCase() : "";
    if (statusRaw && !["draft", "locked", "paid"].includes(statusRaw)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const notesParam = body.notes !== undefined ? String(body.notes) : null;

    const [row] = statusRaw
      ? await sql`
          UPDATE staff_payroll_periods
          SET
            status = ${statusRaw},
            notes = COALESCE(${notesParam}, notes),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${periodId}::integer AND hostelid = ${hostelId}
          RETURNING id
        `
      : await sql`
          UPDATE staff_payroll_periods
          SET
            notes = COALESCE(${notesParam}, notes),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${periodId}::integer AND hostelid = ${hostelId}
          RETURNING id
        `;

    if (!row) {
      return NextResponse.json(
        { success: false, message: "Period not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH payroll period", e);
    return NextResponse.json(
      { success: false, message: "Failed to update period" },
      { status: 500 }
    );
  }
}
