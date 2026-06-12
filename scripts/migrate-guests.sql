-- Guest visit tracking (run once on existing databases)
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
