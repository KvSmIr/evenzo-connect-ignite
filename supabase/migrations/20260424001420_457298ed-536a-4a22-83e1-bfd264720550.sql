-- Notifications table
CREATE TYPE public.notification_type AS ENUM ('flame', 'event_published', 'welcome', 'friend_joined', 'event_reminder');

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  actor_user_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- User settings table for notif preferences
CREATE TABLE public.user_settings (
  user_id UUID NOT NULL PRIMARY KEY,
  notif_friends_activity BOOLEAN NOT NULL DEFAULT true,
  notif_event_reminders BOOLEAN NOT NULL DEFAULT true,
  notif_nearby_events BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: send welcome notification + event_published notification
CREATE OR REPLACE FUNCTION public.notify_event_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status <> 'published') THEN
    INSERT INTO public.notifications (user_id, type, title, body, event_id)
    VALUES (
      NEW.organizer_id,
      'event_published',
      'Ton événement a été publié 🔥',
      NEW.title,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_event_published
AFTER INSERT OR UPDATE OF status ON public.events
FOR EACH ROW EXECUTE FUNCTION public.notify_event_published();

-- Welcome notification on signup (extend handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
  _is_admin BOOLEAN;
BEGIN
  _username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(NEW.id::text, 1, 4)
  );
  _is_admin := LOWER(NEW.email) = 'kvsmirkeglo@gmail.com';

  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', _username),
    _username
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _is_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (NEW.id, 'welcome', 'Bienvenue sur EVENZO ! 🎉', 'Découvre les événements qui chauffent à Lomé.');

  RETURN NEW;
END;
$$;

-- Ensure auth trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flames;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.flames REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;