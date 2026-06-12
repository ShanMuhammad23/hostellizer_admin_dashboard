-- Application-scoped chats for the admin dashboard (local Postgres)
CREATE TABLE IF NOT EXISTS public.application_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id integer NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  last_message_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT application_chats_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_application_chats_last_message
  ON public.application_chats (last_message_at DESC);

-- Polymorphic sender: hostel UUID string or student integer id as text
ALTER TABLE public.messages
  ALTER COLUMN sender_id TYPE text USING sender_id::text;

COMMENT ON TABLE public.application_chats IS 'One chat thread per approved hostel application.';
