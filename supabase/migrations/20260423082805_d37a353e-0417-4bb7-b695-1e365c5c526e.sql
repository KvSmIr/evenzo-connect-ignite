
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('user', 'organizer', 'admin');
CREATE TYPE public.organizer_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.event_category AS ENUM ('Soirée', 'Concert', 'Sport', 'Culture', 'Gastronomie', 'Networking', 'Autre');
CREATE TYPE public.event_privacy AS ENUM ('public', 'friends', 'invite');
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled');
CREATE TYPE public.flame_status AS ENUM ('chaud', 'going');

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  city TEXT DEFAULT 'Lomé',
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer for role checks (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'organizer' THEN 2 ELSE 3 END
  LIMIT 1
$$;

-- ============= ORGANIZER REQUESTS =============
CREATE TABLE public.organizer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT,
  proof_url TEXT,
  status public.organizer_request_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizer_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_org_req_user ON public.organizer_requests(user_id);
CREATE INDEX idx_org_req_status ON public.organizer_requests(status);

-- ============= EVENTS =============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location_name TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  category public.event_category NOT NULL DEFAULT 'Soirée',
  cover_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC DEFAULT 0,
  privacy public.event_privacy NOT NULL DEFAULT 'public',
  max_capacity INTEGER,
  status public.event_status NOT NULL DEFAULT 'published',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_status ON public.events(status);

-- ============= FLAMES =============
CREATE TABLE public.flames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status public.flame_status NOT NULL DEFAULT 'chaud',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
ALTER TABLE public.flames ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_flames_event ON public.flames(event_id);

-- ============= TIMESTAMP TRIGGER =============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_org_req_updated BEFORE UPDATE ON public.organizer_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============= NEW USER TRIGGER =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

  -- Default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Auto-promote admin
  IF _is_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= RLS POLICIES =============

-- profiles
CREATE POLICY "Profiles publicly visible" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- organizer_requests
CREATE POLICY "Users view own requests" ON public.organizer_requests
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own request" ON public.organizer_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update requests" ON public.organizer_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- events
CREATE POLICY "Public events visible to all" ON public.events
  FOR SELECT USING (
    status = 'published' AND privacy = 'public'
    OR auth.uid() = organizer_id
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Organizers create events" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND (
      public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin')
    )
  );
CREATE POLICY "Organizers update own events" ON public.events
  FOR UPDATE USING (auth.uid() = organizer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Organizers delete own events" ON public.events
  FOR DELETE USING (auth.uid() = organizer_id OR public.has_role(auth.uid(), 'admin'));

-- flames
CREATE POLICY "Flames visible to all" ON public.flames
  FOR SELECT USING (true);
CREATE POLICY "Users manage own flames" ON public.flames
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============= STORAGE BUCKETS =============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('event-covers', 'event-covers', true),
  ('organizer-proofs', 'organizer-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- avatars: public read, owner write
CREATE POLICY "Avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- event-covers: public read, organizers write
CREATE POLICY "Event covers public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-covers');
CREATE POLICY "Organizers upload covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Organizers update own covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-covers' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- organizer-proofs: private — owner + admin
CREATE POLICY "Owner reads own proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'organizer-proofs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Users upload own proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'organizer-proofs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
