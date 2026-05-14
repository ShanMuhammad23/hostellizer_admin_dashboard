

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
CREATE TABLE public.applications (
  id integer NOT NULL DEFAULT nextval('applications_id_seq'::regclass),
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
  id integer NOT NULL DEFAULT nextval('attendance_id_seq'::regclass),
  student_id integer,
  date date NOT NULL,
  status character varying DEFAULT 'present'::character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  attendance_date date NOT NULL,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['present'::character varying::text, 'absent'::character varying::text, 'leave'::character varying::text])),
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE public.chats (
  id integer NOT NULL DEFAULT nextval('chats_id_seq'::regclass),
  sender_id integer,
  receiver_id integer,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT chats_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
CREATE TABLE public.expenses (
  id integer NOT NULL DEFAULT nextval('expenses_id_seq'::regclass),
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
CREATE TABLE public.hostel_settings (
  id integer NOT NULL DEFAULT nextval('hostel_settings_id_seq'::regclass),
  setting_key character varying NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT hostel_settings_pkey PRIMARY KEY (id)
);
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
  images ARRAY NOT NULL,
  isacceptingapplications boolean DEFAULT true,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now(),
  hostel_type text DEFAULT 'Boys'::text,
  amenities jsonb DEFAULT '{"mess": {"available": false, "price_per_month": 0}, "wifi": false, "kitchen": false, "laundry": false, "parking": false, "security": false, "transport": {"speedo_stop": "", "distance_in_meters": 0}, "electricity": {"price_per_unit": 0, "included_in_rent": false}, "powerBackup": false}'::jsonb
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
CREATE TABLE public.payment_history (
  id integer NOT NULL DEFAULT nextval('payment_history_id_seq'::regclass),
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
  id integer NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  student_id integer,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text,
  review_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_student_id_fkey FOREIGN KEY (stud
  ent_id) REFERENCES public.students(id)
);
CREATE TABLE public.rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text NOT NULL,
  hostelid uuid,
  createdat timestamp with time zone DEFAULT now(),
  updatedat timestamp with time zone DEFAULT now()
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
CREATE TABLE public.students (
  id integer NOT NULL DEFAULT nextval('students_id_seq'::regclass),
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
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  password_hash character varying,
  role character varying DEFAULT 'admin'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Migration for existing databases (run once if tables already exist without hostelid)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS hostelid uuid REFERENCES public.hostels(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS hostelid uuid REFERENCES public.hostels(id);
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hostelid uuid NOT NULL REFERENCES public.hostels(id),
  studentid integer NOT NULL REFERENCES public.students(id),
  documentdata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_students_hostelid ON public.students (hostelid);

-- Local profile image path (e.g. /uploads/students/uuid.jpg)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_image_path text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_taking_mess boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_expenses_hostelid ON public.expenses (hostelid);
CREATE INDEX IF NOT EXISTS idx_documents_studentid ON public.documents (studentid);
CREATE INDEX IF NOT EXISTS idx_documents_hostelid ON public.documents (hostelid);