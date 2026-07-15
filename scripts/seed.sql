-- Demo seed data (applied by scripts/run-seed.mjs)
-- Markers: hostel demo@hostellizer.pk, admin user admin@hostellizer.pk

BEGIN;

-- Remove previous seed rows (children first)
DELETE FROM staff_advance_ledger
WHERE staff_id IN (
  SELECT s.id FROM staff s
  JOIN hostels h ON h.id = s.hostelid
  WHERE h.email = 'demo@hostellizer.pk'
);

DELETE FROM staff_attendance
WHERE staff_id IN (
  SELECT s.id FROM staff s
  JOIN hostels h ON h.id = s.hostelid
  WHERE h.email = 'demo@hostellizer.pk'
);

DELETE FROM staff_leave_requests
WHERE staff_id IN (
  SELECT s.id FROM staff s
  JOIN hostels h ON h.id = s.hostelid
  WHERE h.email = 'demo@hostellizer.pk'
);

DELETE FROM staff_payroll_entries
WHERE payroll_period_id IN (
  SELECT p.id FROM staff_payroll_periods p
  JOIN hostels h ON h.id = p.hostelid
  WHERE h.email = 'demo@hostellizer.pk'
);

DELETE FROM staff_payroll_periods
WHERE hostelid IN (SELECT id FROM hostels WHERE email = 'demo@hostellizer.pk');

DELETE FROM staff
WHERE hostelid IN (SELECT id FROM hostels WHERE email = 'demo@hostellizer.pk');

DELETE FROM guest_visits
WHERE hostelid IN (SELECT id FROM hostels WHERE email = 'demo@hostellizer.pk');

DELETE FROM expenses
WHERE hostelid IN (SELECT id FROM hostels WHERE email = 'demo@hostellizer.pk');

DELETE FROM payment_history
WHERE student_id IN (
  SELECT id FROM students WHERE email LIKE '%@student.hostellizer.pk'
);

DELETE FROM mess_attendance_records
WHERE student_id IN (
  SELECT id FROM students WHERE email LIKE '%@student.hostellizer.pk'
);

DELETE FROM students
WHERE email LIKE '%@student.hostellizer.pk';

DELETE FROM hostels WHERE email = 'demo@hostellizer.pk';
DELETE FROM users WHERE email = 'admin@hostellizer.pk';

-- Hostel (login account for the dashboard)
INSERT INTO hostels (
  id,
  name,
  phone,
  email,
  password,
  rentrange,
  totalrooms,
  vacanciesavailable,
  roomsavailable,
  totalstudents,
  totalvacancies,
  totalrevenue,
  totalexpenses,
  totalprofit,
  images,
  isacceptingapplications,
  hostel_type,
  amenities
) VALUES (
  '00000000-0000-4000-a000-000000000001',
  'Hostellizer Demo Boys Hostel',
  '+923001234567',
  'demo@hostellizer.pk',
  :hostel_password_hash,
  '{"min": 12000, "max": 18000}'::jsonb,
  20,
  5,
  15,
  4,
  5,
  72000,
  45000,
  27000,
  ARRAY['/uploads/hostels/demo-front.jpg', '/uploads/hostels/demo-room.jpg'],
  true,
  'Boys',
  '{"mess": {"available": true, "price_per_month": 8000}, "wifi": true, "kitchen": false, "laundry": true, "parking": true, "security": true, "transport": {"speedo_stop": "GT Road Stop 12", "distance_in_meters": 350}, "electricity": {"price_per_unit": 45, "included_in_rent": false}, "powerBackup": true}'::jsonb
);

-- Dashboard admin user (chats / staff attendance reference)
INSERT INTO users (email, name, password_hash, role)
VALUES (
  'admin@hostellizer.pk',
  'Demo Admin',
  :admin_password_hash,
  'admin'
);

-- Students
INSERT INTO students (
  name, email, phone, address, room_number, status, joined_date,
  accommodation_type, monthly_rent, payment_status, payment_due_date,
  is_taking_mess, hostelid
) VALUES
  (
    'Ahmed Hassan',
    'ahmed.hassan@student.hostellizer.pk',
    '+923111000001',
    '{"street": "House 14, Gulberg", "town": "Gulberg", "city": "Lahore"}'::jsonb,
    101, 'active', CURRENT_DATE - INTERVAL '120 days',
    'shared', 15000, 'paid', date_trunc('month', CURRENT_DATE)::date + INTERVAL '1 month' - INTERVAL '1 day',
    true, '00000000-0000-4000-a000-000000000001'
  ),
  (
    'Usman Ali',
    'usman.ali@student.hostellizer.pk',
    '+923111000002',
    '{"street": "Street 5, Model Town", "town": "Model Town", "city": "Lahore"}'::jsonb,
    102, 'active', CURRENT_DATE - INTERVAL '90 days',
    'shared', 15000, 'pending', date_trunc('month', CURRENT_DATE)::date + INTERVAL '5 days',
    true, '00000000-0000-4000-a000-000000000001'
  ),
  (
    'Bilal Khan',
    'bilal.khan@student.hostellizer.pk',
    '+923111000003',
    '{"street": "Block C, Johar Town", "town": "Johar Town", "city": "Lahore"}'::jsonb,
    103, 'active', CURRENT_DATE - INTERVAL '45 days',
    'single', 18000, 'paid', date_trunc('month', CURRENT_DATE)::date + INTERVAL '1 month' - INTERVAL '1 day',
    false, '00000000-0000-4000-a000-000000000001'
  ),
  (
    'Hamza Raza',
    'hamza.raza@student.hostellizer.pk',
    '+923111000004',
    '{"street": "Satiana Road", "town": "Samundri", "city": "Faisalabad"}'::jsonb,
    104, 'active', CURRENT_DATE - INTERVAL '14 days',
    'shared', 14000, 'pending', date_trunc('month', CURRENT_DATE)::date + INTERVAL '10 days',
    true, '00000000-0000-4000-a000-000000000001'
  );

-- Expenses
INSERT INTO expenses (hostelid, name, amount, description, expense_date, category)
VALUES
  (
    '00000000-0000-4000-a000-000000000001',
    'Electricity bill',
    18500,
    'WAPDA bill for common areas and mess',
    CURRENT_DATE - INTERVAL '5 days',
    'utilities'
  ),
  (
    '00000000-0000-4000-a000-000000000001',
    'Weekly groceries',
    22000,
    'Ration for mess: rice, daal, vegetables, cooking oil',
    CURRENT_DATE - INTERVAL '3 days',
    'mess'
  ),
  (
    '00000000-0000-4000-a000-000000000001',
    'Plumbing repair',
    4500,
    'Fixed bathroom leak on 2nd floor',
    CURRENT_DATE - INTERVAL '12 days',
    'maintenance'
  ),
  (
    '00000000-0000-4000-a000-000000000001',
    'Security cameras',
    35000,
    'Two CCTV cameras for main gate',
    CURRENT_DATE - INTERVAL '20 days',
    'capital'
  );

-- Staff
INSERT INTO staff (
  hostelid, cnic, full_name, father_or_spouse_name, role, employment_type,
  join_date, salary_amount_monthly, salary_is_gross, phone, address, status, notes
) VALUES
  (
    '00000000-0000-4000-a000-000000000001',
    '3520212345671',
    'Muhammad Aslam',
    'Muhammad Siddique',
    'Warden',
    'permanent',
    CURRENT_DATE - INTERVAL '400 days',
    45000, true, '+923001112233',
    '{"street": "Mohalla Islamia", "town": "Samanabad", "city": "Lahore"}'::jsonb,
    'active',
    'Night shift warden'
  ),
  (
    '00000000-0000-4000-a000-000000000001',
    '3520298765432',
    'Rashida Bibi',
    'Abdul Ghafoor',
    'Cook',
    'permanent',
    CURRENT_DATE - INTERVAL '300 days',
    32000, true, '+923004445566',
    '{"street": "Street 8", "town": "Ichhra", "city": "Lahore"}'::jsonb,
    'active',
    'Mess in-charge'
  ),
  (
    '00000000-0000-4000-a000-000000000001',
    '3520311122233',
    'Imran Shah',
    'Shahid Mehmood',
    'Security Guard',
    'daily_wage',
    CURRENT_DATE - INTERVAL '60 days',
    18000, true, '+923007778899',
    '{"street": "Defence Road", "town": "Cantt", "city": "Lahore"}'::jsonb,
    'active',
    'Main gate duty'
  );

-- Staff attendance (today + yesterday for warden)
INSERT INTO staff_attendance (
  staff_id, attendance_date, check_in, check_out, status, marked_by_user_id, shift_code
)
SELECT
  s.id,
  CURRENT_DATE,
  TIME '20:00',
  NULL,
  'present',
  u.id,
  'night'
FROM staff s
CROSS JOIN users u
WHERE s.cnic = '3520212345671'
  AND u.email = 'admin@hostellizer.pk';

INSERT INTO staff_attendance (
  staff_id, attendance_date, check_in, check_out, status, marked_by_user_id, shift_code
)
SELECT
  s.id,
  CURRENT_DATE - INTERVAL '1 day',
  TIME '20:05',
  TIME '08:00',
  'present',
  u.id,
  'night'
FROM staff s
CROSS JOIN users u
WHERE s.cnic = '3520212345671'
  AND u.email = 'admin@hostellizer.pk';

-- Advance ledger sample for cook
INSERT INTO staff_advance_ledger (staff_id, entry_type, amount, occurred_on, reference, notes)
SELECT
  s.id,
  'advance',
  5000,
  CURRENT_DATE - INTERVAL '15 days',
  'ADV-001',
  'Emergency family expense'
FROM staff s
WHERE s.cnic = '3520298765432';

-- Default meal types (shared across hostels)
INSERT INTO meal_types (id, name, start_time, end_time, active)
VALUES
  ('00000000-0000-4000-b000-000000000001', 'Breakfast', '07:00', '09:00', true),
  ('00000000-0000-4000-b000-000000000002', 'Lunch', '12:30', '14:30', true),
  ('00000000-0000-4000-b000-000000000003', 'Dinner', '19:30', '21:30', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  active = EXCLUDED.active;

COMMIT;
