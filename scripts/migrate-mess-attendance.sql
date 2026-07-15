-- Align mess_attendance_records with students.id (integer, not uuid)

BEGIN;

DELETE FROM mess_attendance_records;

ALTER TABLE mess_attendance_records
  DROP COLUMN IF EXISTS student_id;

ALTER TABLE mess_attendance_records
  ADD COLUMN student_id integer NOT NULL REFERENCES public.students(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mess_attendance_records_student_date_meal_key'
  ) THEN
    ALTER TABLE mess_attendance_records
      ADD CONSTRAINT mess_attendance_records_student_date_meal_key
      UNIQUE (student_id, attendance_date, meal_type_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'meal_types_pkey'
  ) THEN
    ALTER TABLE meal_types ADD CONSTRAINT meal_types_pkey PRIMARY KEY (id);
  END IF;
END $$;

INSERT INTO meal_types (id, name, start_time, end_time, active)
VALUES
  ('00000000-0000-4000-b000-000000000001', 'Breakfast', '07:00', '09:00', true),
  ('00000000-0000-4000-b000-000000000002', 'Lunch', '12:30', '14:30', true),
  ('00000000-0000-4000-b000-000000000003', 'Dinner', '19:30', '21:30', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
