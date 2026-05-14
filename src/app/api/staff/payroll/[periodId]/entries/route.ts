import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

async function pid(
  params: Promise<{ periodId: string }> | { periodId: string }
): Promise<string> {
  return (await Promise.resolve(params)).periodId;
}

function sumJson(arr: unknown): number {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((s, r) => {
    const n = Number((r as { amount?: unknown }).amount);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ periodId: string }> | { periodId: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const periodId = await pid(context.params);
    const body = (await request.json()) as Record<string, unknown>;

    const [period] = await sql`
      SELECT id, status FROM staff_payroll_periods
      WHERE id = ${periodId}::integer AND hostelid = ${hostelId}
    `;
    if (!period) {
      return NextResponse.json(
        { success: false, message: "Period not found" },
        { status: 404 }
      );
    }
    if (String(period.status) === "locked" || String(period.status) === "paid") {
      return NextResponse.json(
        { success: false, message: "Period is locked; unlock to draft first" },
        { status: 409 }
      );
    }

    const staffId = Number(body.staffId);
    if (!Number.isInteger(staffId)) {
      return NextResponse.json(
        { success: false, message: "staffId required" },
        { status: 400 }
      );
    }

    const [st] = await sql`
      SELECT id FROM staff WHERE id = ${staffId}::integer AND hostelid = ${hostelId}
    `;
    if (!st) {
      return NextResponse.json(
        { success: false, message: "Staff not in this hostel" },
        { status: 400 }
      );
    }

    const base = Number(body.baseSalary ?? 0);
    const overtime = Number(body.overtimeAmount ?? 0);
    const holiday = Number(body.holidayDutyAmount ?? 0);
    const eid = Number(body.eidBonusAmount ?? 0);
    const mess = Number(body.messAllowanceAmount ?? 0);
    const otherAdd = Array.isArray(body.otherAdditions) ? body.otherAdditions : [];
    const advance = Number(body.advanceDeductionAmount ?? 0);
    const absence = Number(body.absenceDeductionAmount ?? 0);
    const damage = Number(body.damageChargeAmount ?? 0);
    const otherDed = Array.isArray(body.otherDeductions) ? body.otherDeductions : [];

    const gross =
      (Number.isFinite(base) ? base : 0) +
      (Number.isFinite(overtime) ? overtime : 0) +
      (Number.isFinite(holiday) ? holiday : 0) +
      (Number.isFinite(eid) ? eid : 0) +
      (Number.isFinite(mess) ? mess : 0) +
      sumJson(otherAdd);

    const totalDed =
      (Number.isFinite(advance) ? advance : 0) +
      (Number.isFinite(absence) ? absence : 0) +
      (Number.isFinite(damage) ? damage : 0) +
      sumJson(otherDed);

    const net = gross - totalDed;

    await sql`
      INSERT INTO staff_payroll_entries (
        payroll_period_id,
        staff_id,
        base_salary,
        overtime_amount,
        holiday_duty_amount,
        eid_bonus_amount,
        mess_allowance_amount,
        other_additions,
        advance_deduction_amount,
        absence_deduction_amount,
        damage_charge_amount,
        other_deductions,
        gross_earnings,
        total_deductions,
        net_payable,
        salary_slip_path,
        slip_locale,
        signed_by_name,
        signed_at,
        notes
      )
      VALUES (
        ${periodId}::integer,
        ${staffId}::integer,
        ${base},
        ${overtime},
        ${holiday},
        ${eid},
        ${mess},
        ${sql.json(otherAdd)},
        ${advance},
        ${absence},
        ${damage},
        ${sql.json(otherDed)},
        ${gross},
        ${totalDed},
        ${net},
        ${typeof body.salarySlipPath === "string" ? body.salarySlipPath || null : null},
        ${String(body.slipLocale ?? "ur_PK").slice(0, 8)},
        ${String(body.signedByName ?? "").trim() || null},
        ${body.signedAt ? new Date(String(body.signedAt)) : null},
        ${String(body.notes ?? "").trim() || null}
      )
      ON CONFLICT (payroll_period_id, staff_id) DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        overtime_amount = EXCLUDED.overtime_amount,
        holiday_duty_amount = EXCLUDED.holiday_duty_amount,
        eid_bonus_amount = EXCLUDED.eid_bonus_amount,
        mess_allowance_amount = EXCLUDED.mess_allowance_amount,
        other_additions = EXCLUDED.other_additions,
        advance_deduction_amount = EXCLUDED.advance_deduction_amount,
        absence_deduction_amount = EXCLUDED.absence_deduction_amount,
        damage_charge_amount = EXCLUDED.damage_charge_amount,
        other_deductions = EXCLUDED.other_deductions,
        gross_earnings = EXCLUDED.gross_earnings,
        total_deductions = EXCLUDED.total_deductions,
        net_payable = EXCLUDED.net_payable,
        salary_slip_path = EXCLUDED.salary_slip_path,
        slip_locale = EXCLUDED.slip_locale,
        signed_by_name = EXCLUDED.signed_by_name,
        signed_at = EXCLUDED.signed_at,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ success: true, gross, totalDeductions: totalDed, net });
  } catch (e) {
    console.error("POST payroll entry", e);
    return NextResponse.json(
      { success: false, message: "Failed to save payroll entry" },
      { status: 500 }
    );
  }
}
