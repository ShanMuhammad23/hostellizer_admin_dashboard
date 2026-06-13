-- Track when the hostel admin last read each application chat thread
ALTER TABLE public.application_chats
  ADD COLUMN IF NOT EXISTS hostel_last_read_at timestamp without time zone;

-- Treat existing threads as already read so only new student messages show as unread
UPDATE public.application_chats
SET hostel_last_read_at = COALESCE(last_message_at, created_at, CURRENT_TIMESTAMP)
WHERE hostel_last_read_at IS NULL;
