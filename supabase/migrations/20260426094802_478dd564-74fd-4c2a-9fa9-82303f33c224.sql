-- 1) Allow independent chaud + going per user/event
-- Drop any existing unique constraint on (user_id, event_id) and add (user_id, event_id, status)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.flames'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.flames DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.flames
  ADD CONSTRAINT flames_user_event_status_unique UNIQUE (user_id, event_id, status);

-- 2) Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows visible to all" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);

-- 3) Add location_address to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS location_address text;