-- Required for gen_random_uuid() (PG < 13) and uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Integer ID sequences (legacy tables)
CREATE SEQUENCE IF NOT EXISTS public.applications_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.attendance_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.chats_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.expenses_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.hostel_settings_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.payment_history_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.students_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.users_id_seq AS integer START WITH 1 INCREMENT BY 1;

-- Base tables (no FK dependencies on other app tables)
CREATE TABLE public.hostels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  rentrange jsonb NOT NULL,
  totalrooms integer NOT NULL,
  vacanciesavailable integer NOT NULL,
  roomsavailable integer NOT NULL,
  totalstudents integer,
  totalvacancies integer NOT NULL,
  totalrevenue integer,
  totalexpenses integer,
  notification jsonb,
  totalprofit integer,
  images text[] NOT NULL,
  isacceptingapplications boolean DEFAULT true,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  hostel_type text DEFAULT 'Boys'::text,
  amenities jsonb DEFAULT '{"mess": {"available": false, "price_per_month": 0}, "wifi": false, "kitchen": false, "laundry": false, "parking": false, "security": false, "transport": {"speedo_stop": "", "distance_in_meters": 0}, "electricity": {"price_per_unit": 0, "included_in_rent": false}, "powerBackup": false}'::jsonb,
  CONSTRAINT hostels_pkey PRIMARY KEY (id)
);

CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('public.users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  password_hash character varying,
  role character varying DEFAULT 'admin'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.students (
  id integer NOT NULL DEFAULT nextval('public.students_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  address jsonb,
  room_number integer,
  status character varying DEFAULT 'active'::character varying,
  joined_date date,
  accommodation_type character varying,
  monthly_rent numeric,
  payment_status character varying DEFAULT 'pending'::character varying,
  payment_due_date date,
  is_taking_mess boolean NOT NULL DEFAULT false,
  profile_image_path text,
  hostelid uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_hostelid_fkey FOREIGN KEY (hostelid) REFERENCES public.hostels(id)
);

-- Tables with FK dependencies on hostels / users / students
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  street text NOT NULL,
  town text NOT NULL,
  city text NOT NULL,
  hostelid uuid,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

CREATE TABLE public.amenities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  available boolean NOT NULL,
  hostelid uuid,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

CREATE TABLE public.rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text NOT NULL,
  hostelid uuid,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
);

CREATE TABLE public.hostel_settings (
  id integer NOT NULL DEFAULT nextval('public.hostel_settings_id_seq'::regclass),
  setting_key character varying NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT hostel_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE public.expenses (
  id integer NOT NULL DEFAULT nextval('public.expenses_id_seq'::regclass),
  name character varying NOT NULL,
  amount numeric NOT NULL,
  description text,
  expense_date date NOT NULL,
  category character varying,
  hostelid uuid,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_hostelid_fkey FOREIGN KEY (hostelid) REFERENCES public.hostels(id)
);

CREATE TABLE public.applications (
  id integer NOT NULL DEFAULT nextval('public.applications_id_seq'::regclass),
  student_id integer,
  status character varying DEFAULT 'pending'::character varying,
  application_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

CREATE TABLE public.attendance (
  id integer NOT NULL DEFAULT nextval('public.attendance_id_seq'::regclass),
  student_id integer,
  date date NOT NULL,
  status character varying DEFAULT 'present'::character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

CREATE TABLE public.payment_history (
  id integer NOT NULL DEFAULT nextval('public.payment_history_id_seq'::regclass),
  student_id integer,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method character varying,
  reference_number character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payment_history_pkey PRIMARY KEY (id),
  CONSTRAINT payment_history_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

CREATE TABLE public.reviews (
  id integer NOT NULL DEFAULT nextval('public.reviews_id_seq'::regclass),
  student_id integer,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text,
  review_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hostelid uuid NOT NULL,
  studentid integer NOT NULL,
  documentdata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_hostelid_fkey FOREIGN KEY (hostelid) REFERENCES public.hostels(id),
  CONSTRAINT documents_studentid_fkey FOREIGN KEY (studentid) REFERENCES public.students(id)
);

CREATE TABLE public.chats (
  id integer NOT NULL DEFAULT nextval('public.chats_id_seq'::regclass),
  sender_id integer,
  receiver_id integer,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT chats_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);

-- Standalone / loosely coupled tables
CREATE TABLE public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  attendance_date date NOT NULL,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['present'::character varying::text, 'absent'::character varying::text, 'leave'::character varying::text])),
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.meal_types (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  active boolean DEFAULT true
);

CREATE TABLE public.mess_attendance_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL,
  attendance_date date NOT NULL,
  meal_type_id uuid NOT NULL,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['present'::character varying::text, 'absent'::character varying::text, 'late'::character varying::text])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text NOT NULL,
  sender_id uuid NOT NULL,
  sender_type character varying NOT NULL CHECK (sender_type::text = ANY (ARRAY['hostel'::character varying::text, 'student'::character varying::text])),
  chat_id uuid NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.payment_histories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  date date NOT NULL,
  studentid uuid,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  payment_channel character varying,
  transaction_id character varying
);

-- Migration for existing databases (safe to re-run; no-ops on fresh install)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS hostelid uuid REFERENCES public.hostels(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS hostelid uuid REFERENCES public.hostels(id);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_image_path text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_taking_mess boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_students_hostelid ON public.students (hostelid);
CREATE INDEX IF NOT EXISTS idx_expenses_hostelid ON public.expenses (hostelid);
CREATE INDEX IF NOT EXISTS idx_documents_studentid ON public.documents (studentid);
CREATE INDEX IF NOT EXISTS idx_documents_hostelid ON public.documents (hostelid);

-- ═══════════════════════════════════════════════════════════════════════════
-- G1. Staff directory & payroll (Pakistan-oriented hostel operations)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS public.staff_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.staff (
  id integer NOT NULL DEFAULT nextval('public.staff_id_seq'::regclass),
  hostelid uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  cnic character varying(15) NOT NULL,
  full_name character varying(255) NOT NULL,
  father_or_spouse_name character varying(255),
  role character varying(120) NOT NULL,
  employment_type character varying(20) NOT NULL DEFAULT 'permanent'::character varying
    CHECK (employment_type::text = ANY (ARRAY['permanent'::character varying::text, 'daily_wage'::character varying::text])),
  join_date date NOT NULL DEFAULT CURRENT_DATE,
  salary_amount_monthly numeric(14, 2) NOT NULL DEFAULT 0,
  salary_is_gross boolean NOT NULL DEFAULT true,
  salary_net_amount numeric(14, 2),
  bank_name character varying(120),
  bank_account_or_iban character varying(64),
  easypaisa_msisdn character varying(20),
  jazzcash_msisdn character varying(20),
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  phone character varying(32) NOT NULL,
  emergency_contact_name character varying(255),
  emergency_contact_phone character varying(32),
  emergency_contact_relation character varying(80),
  photo_path text,
  compliance_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  contract_document_path text,
  contract_language character varying(10) DEFAULT 'ur'::character varying,
  status character varying(20) NOT NULL DEFAULT 'active'::character varying
    CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'inactive'::character varying::text, 'terminated'::character varying::text])),
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_hostel_cnic_key UNIQUE (hostelid, cnic)
);

CREATE INDEX IF NOT EXISTS idx_staff_hostelid ON public.staff (hostelid);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff (role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff (status);

COMMENT ON TABLE public.staff IS 'Hostel staff directory; CNIC unique per hostel for NADRA-style records.';
COMMENT ON COLUMN public.staff.cnic IS 'Store normalized 13-digit CNIC without dashes where possible.';
COMMENT ON COLUMN public.staff.compliance_documents IS 'JSON array: [{type, file_path, notes, uploaded_at}] e.g. CNIC copy, police verification, medical.';
COMMENT ON COLUMN public.staff.contract_document_path IS 'Scanned employment agreement (Urdu/English).';

CREATE SEQUENCE IF NOT EXISTS public.staff_advance_ledger_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.staff_advance_ledger (
  id integer NOT NULL DEFAULT nextval('public.staff_advance_ledger_id_seq'::regclass),
  staff_id integer NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  entry_type character varying(16) NOT NULL
    CHECK (entry_type::text = ANY (ARRAY['advance'::character varying::text, 'repayment'::character varying::text, 'payroll_deduction'::character varying::text, 'adjustment'::character varying::text])),
  amount numeric(14, 2) NOT NULL CHECK (amount >= 0::numeric),
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  reference character varying(120),
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_advance_ledger_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_staff_advance_staff ON public.staff_advance_ledger (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_advance_date ON public.staff_advance_ledger (occurred_on DESC);

COMMENT ON TABLE public.staff_advance_ledger IS 'Running ledger: advances, repayments, payroll deductions; disputes resolved via immutable rows.';

CREATE SEQUENCE IF NOT EXISTS public.staff_leave_requests_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.staff_leave_requests (
  id integer NOT NULL DEFAULT nextval('public.staff_leave_requests_id_seq'::regclass),
  staff_id integer NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type character varying(24) NOT NULL
    CHECK (leave_type::text = ANY (ARRAY['casual'::character varying::text, 'sick'::character varying::text, 'annual'::character varying::text, 'unpaid'::character varying::text, 'other'::character varying::text])),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count numeric(6, 2) NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  status character varying(20) NOT NULL DEFAULT 'pending'::character varying
    CHECK (status::text = ANY (ARRAY['pending'::character varying::text, 'approved'::character varying::text, 'rejected'::character varying::text, 'cancelled'::character varying::text])),
  approved_by text,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_leave_requests_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_staff ON public.staff_leave_requests (staff_id);

CREATE SEQUENCE IF NOT EXISTS public.staff_attendance_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id integer NOT NULL DEFAULT nextval('public.staff_attendance_id_seq'::regclass),
  staff_id integer NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  check_in time without time zone,
  check_out time without time zone,
  status character varying(20) NOT NULL DEFAULT 'present'::character varying
    CHECK (status::text = ANY (ARRAY['present'::character varying::text, 'absent'::character varying::text, 'late'::character varying::text, 'half_day'::character varying::text, 'leave'::character varying::text])),
  marked_by_user_id integer REFERENCES public.users(id),
  shift_code character varying(40),
  late_minutes integer DEFAULT 0,
  overtime_minutes integer DEFAULT 0,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT staff_attendance_staff_date_key UNIQUE (staff_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON public.staff_attendance (attendance_date DESC);

CREATE SEQUENCE IF NOT EXISTS public.staff_payroll_periods_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.staff_payroll_periods (
  id integer NOT NULL DEFAULT nextval('public.staff_payroll_periods_id_seq'::regclass),
  hostelid uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  year smallint NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month smallint NOT NULL CHECK (month >= 1 AND month <= 12),
  status character varying(20) NOT NULL DEFAULT 'draft'::character varying
    CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'locked'::character varying::text, 'paid'::character varying::text])),
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_payroll_periods_pkey PRIMARY KEY (id),
  CONSTRAINT staff_payroll_periods_hostel_month_key UNIQUE (hostelid, year, month)
);

CREATE INDEX IF NOT EXISTS idx_staff_payroll_periods_hostel ON public.staff_payroll_periods (hostelid);

CREATE SEQUENCE IF NOT EXISTS public.staff_payroll_entries_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.staff_payroll_entries (
  id integer NOT NULL DEFAULT nextval('public.staff_payroll_entries_id_seq'::regclass),
  payroll_period_id integer NOT NULL REFERENCES public.staff_payroll_periods(id) ON DELETE CASCADE,
  staff_id integer NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  base_salary numeric(14, 2) NOT NULL DEFAULT 0,
  overtime_amount numeric(14, 2) NOT NULL DEFAULT 0,
  holiday_duty_amount numeric(14, 2) NOT NULL DEFAULT 0,
  eid_bonus_amount numeric(14, 2) NOT NULL DEFAULT 0,
  mess_allowance_amount numeric(14, 2) NOT NULL DEFAULT 0,
  other_additions jsonb NOT NULL DEFAULT '[]'::jsonb,
  advance_deduction_amount numeric(14, 2) NOT NULL DEFAULT 0,
  absence_deduction_amount numeric(14, 2) NOT NULL DEFAULT 0,
  damage_charge_amount numeric(14, 2) NOT NULL DEFAULT 0,
  other_deductions jsonb NOT NULL DEFAULT '[]'::jsonb,
  gross_earnings numeric(14, 2) NOT NULL DEFAULT 0,
  total_deductions numeric(14, 2) NOT NULL DEFAULT 0,
  net_payable numeric(14, 2) NOT NULL DEFAULT 0,
  salary_slip_path text,
  slip_locale character varying(8) DEFAULT 'ur_PK'::character varying,
  signed_by_name character varying(255),
  signed_at timestamp without time zone,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_payroll_entries_pkey PRIMARY KEY (id),
  CONSTRAINT staff_payroll_entries_period_staff_key UNIQUE (payroll_period_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_payroll_entries_staff ON public.staff_payroll_entries (staff_id);

COMMENT ON COLUMN public.staff_payroll_entries.other_additions IS 'JSON array: [{label, amount}] for night premium, custom bonuses.';
COMMENT ON COLUMN public.staff_payroll_entries.other_deductions IS 'JSON array: [{label, amount}] for misc charges.';
COMMENT ON COLUMN public.staff_payroll_entries.net_payable IS 'Final PKR payable after all adds/deducts; slip PDF path optional in salary_slip_path.';

-- Link ledger repayments/deductions to a posted payroll line (added after payroll table exists)
ALTER TABLE public.staff_advance_ledger
  ADD COLUMN IF NOT EXISTS payroll_entry_id integer REFERENCES public.staff_payroll_entries(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Guest visits (who is hosting whom, and for which dates)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS public.guest_visits_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.guest_visits (
  id integer NOT NULL DEFAULT nextval('public.guest_visits_id_seq'::regclass),
  hostelid uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  student_id integer NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guest_name character varying(255) NOT NULL,
  guest_phone character varying(32),
  guest_cnic character varying(15),
  relationship character varying(80),
  visit_start date NOT NULL,
  visit_end date NOT NULL,
  check_in_at timestamp without time zone,
  check_out_at timestamp without time zone,
  status character varying(20) NOT NULL DEFAULT 'scheduled'::character varying
    CHECK (status::text = ANY (ARRAY['scheduled'::character varying::text, 'checked_in'::character varying::text, 'checked_out'::character varying::text, 'cancelled'::character varying::text])),
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT guest_visits_pkey PRIMARY KEY (id),
  CONSTRAINT guest_visits_dates_check CHECK (visit_end >= visit_start)
);

CREATE INDEX IF NOT EXISTS idx_guest_visits_hostel ON public.guest_visits (hostelid);
CREATE INDEX IF NOT EXISTS idx_guest_visits_student ON public.guest_visits (student_id);
CREATE INDEX IF NOT EXISTS idx_guest_visits_dates ON public.guest_visits (visit_start, visit_end);
CREATE INDEX IF NOT EXISTS idx_guest_visits_status ON public.guest_visits (status);

COMMENT ON TABLE public.guest_visits IS 'Guest register: which student is hosting which visitor, from visit_start through visit_end.';
