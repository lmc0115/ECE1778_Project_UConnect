CREATE TABLE public.activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  location text,
  introduction text,
  image_urls ARRAY,
  organizer_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now(),
  expo_push_token text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_id uuid NOT NULL,
  registered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT registrations_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id)
);

alter policy "profile insert"
on "public"."profiles"
to public
with check (
  (auth.uid() = id)
);

alter policy "profile select"
on "public"."profiles"
to public
using (
  (auth.uid() = id)
);

alter policy "profile update"
on "public"."profiles"
to public
using (
  (auth.uid() = id)
);

alter policy "profiles readable for notifications"
on "public"."profiles"
to authenticated
using (
  (auth.role() = 'authenticated'::text)
);

alter policy "registrations delete own"
on "public"."registrations"
to public
using (
  ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()))
);

alter policy "registrations insert own"
on "public"."registrations"
to public
with check (
  ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()))
);

alter policy "registrations readable for counts"
on "public"."registrations"
to authenticated
using (
  (auth.role() = 'authenticated'::text)
);

-- Schema: storage  Table: objects  Policy: Allow public read access 1ht8hdi_0
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY ""Allow public read access 1ht8hdi_0"" ON storage.objects FOR SELECT TO PUBLIC USING ((bucket_id = 'activity-images'::text));

-- Schema: storage  Table: objects  Policy: Public read profile photos yndkpx_0
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY ""Public read profile photos yndkpx_0"" ON storage.objects FOR SELECT TO PUBLIC USING ((bucket_id = 'profile-photos'::text));

-- Schema: storage  Table: objects  Policy: Users upload own profile photo yndkpx_0
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY ""Users upload own profile photo yndkpx_0"" ON storage.objects FOR INSERT TO PUBLIC WITH CHECK (((bucket_id = 'profile-photos'::text) AND (auth.role() = 'authenticated'::text)));

-- Schema: storage  Table: objects  Policy: Users upload own profile photo yndkpx_1
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY ""Users upload own profile photo yndkpx_1"" ON storage.objects FOR UPDATE TO PUBLIC USING (((bucket_id = 'profile-photos'::text) AND (auth.role() = 'authenticated'::text)));

-- Schema: storage  Table: objects  Policy: supabase.auth.signUp 1ht8hdi_0
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY ""supabase.auth.signUp 1ht8hdi_0"" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'activity-images'::text) AND COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'organizer'::text), false)));

-- Schema: storage  Table: objects  Policy: supabase.auth.signUp 1ht8hdi_1
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY ""supabase.auth.signUp 1ht8hdi_1"" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'activity-images'::text) AND COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'organizer'::text), false)));

-- Schema: storage  Table: objects  Policy: supabase.auth.signUp 1ht8hdi_2
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY ""supabase.auth.signUp 1ht8hdi_2"" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'activity-images'::text) AND COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'organizer'::text), false)));
