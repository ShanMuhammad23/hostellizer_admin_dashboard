/** Mirrors `public.staff` — CNIC unique per hostel (normalize to 13 digits without dashes in app). */
export type StaffEmploymentType = "permanent" | "daily_wage";
export type StaffRecordStatus = "active" | "inactive" | "terminated";

export interface StaffComplianceDoc {
  type: string;
  file_path: string;
  notes?: string;
  uploaded_at?: string;
}

export interface StaffRow {
  id: number;
  hostelid: string;
  cnic: string;
  full_name: string;
  father_or_spouse_name: string | null;
  role: string;
  employment_type: StaffEmploymentType;
  join_date: string;
  salary_amount_monthly: string | number;
  salary_is_gross: boolean;
  salary_net_amount: string | number | null;
  bank_name: string | null;
  bank_account_or_iban: string | null;
  easypaisa_msisdn: string | null;
  jazzcash_msisdn: string | null;
  address: Record<string, unknown>;
  phone: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  photo_path: string | null;
  compliance_documents: StaffComplianceDoc[];
  contract_document_path: string | null;
  contract_language: string | null;
  status: StaffRecordStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AdvanceLedgerEntryType =
  | "advance"
  | "repayment"
  | "payroll_deduction"
  | "adjustment";

export interface StaffPayrollLineExtra {
  label: string;
  amount: number;
}

export interface StaffPayrollEntryRow {
  id: number;
  payroll_period_id: number;
  staff_id: number;
  base_salary: string | number;
  overtime_amount: string | number;
  holiday_duty_amount: string | number;
  eid_bonus_amount: string | number;
  mess_allowance_amount: string | number;
  other_additions: StaffPayrollLineExtra[];
  advance_deduction_amount: string | number;
  absence_deduction_amount: string | number;
  damage_charge_amount: string | number;
  other_deductions: StaffPayrollLineExtra[];
  gross_earnings: string | number;
  total_deductions: string | number;
  net_payable: string | number;
  salary_slip_path: string | null;
  slip_locale: string | null;
  signed_by_name: string | null;
  signed_at: string | null;
  notes: string | null;
}
