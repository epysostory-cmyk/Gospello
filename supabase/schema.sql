-- ============================================================
-- Gospello - Christian Event Discovery Platform
-- Supabase PostgreSQL Schema
-- ============================================================

-- Enable extensions
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

create type account_type as enum ('church', 'organizer');
create type admin_role as enum ('super_admin', 'admin', 'moderator');
create type event_status as enum ('pending', 'approved', 'rejected');
create type event_category as enum ('worship', 'prayer', 'conference', 'youth', 'training', 'other');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  account_type account_type not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- CHURCHES
-- ============================================================

create table public.churches (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  address text,
  city text default 'Lagos' not null,
  state text default 'Lagos' not null,
  country text default 'Nigeria' not null,
  service_times text,          -- e.g. "Sundays 9am & 11am, Wednesdays 6pm"
  logo_url text,
  banner_url text,
  website_url text,
  phone text,
  is_featured boolean default false not null,
  is_verified boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.churches enable row level security;

create policy "Churches are viewable by everyone"
  on public.churches for select using (true);

create policy "Church owners can insert"
  on public.churches for insert with check (
    auth.uid() = profile_id
  );

create policy "Church owners can update"
  on public.churches for update using (
    auth.uid() = profile_id
  );

create policy "Church owners can delete"
  on public.churches for delete using (
    auth.uid() = profile_id
  );

-- ============================================================
-- EVENTS
-- ============================================================

create table public.events (
  id uuid default gen_random_uuid() primary key,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  church_id uuid references public.churches(id) on delete set null,
  title text not null,
  slug text unique not null,
  description text not null,
  category event_category not null,
  status event_status default 'pending' not null,
  banner_url text,
  start_date timestamptz not null,
  end_date timestamptz,
  location_name text not null,          -- venue name
  address text,
  city text default 'Lagos' not null,
  state text default 'Lagos' not null,
  country text default 'Nigeria' not null,
  external_link text,                   -- registration link
  is_featured boolean default false not null,
  is_free boolean default true not null,
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.events enable row level security;

-- Anyone can view approved events
create policy "Approved events are viewable by everyone"
  on public.events for select using (
    status = 'approved' or auth.uid() = organizer_id
  );

create policy "Authenticated users can insert events"
  on public.events for insert with check (
    auth.uid() = organizer_id
  );

create policy "Organizers can update their own events"
  on public.events for update using (
    auth.uid() = organizer_id
  );

create policy "Organizers can delete their own events"
  on public.events for delete using (
    auth.uid() = organizer_id
  );

-- ============================================================
-- ADMIN USERS
-- ============================================================

create table public.admin_users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role admin_role not null default 'moderator',
  created_at timestamptz default now() not null
);

alter table public.admin_users enable row level security;

create policy "Admin users can view admin table"
  on public.admin_users for select using (
    auth.uid() in (select id from public.admin_users)
  );

-- ============================================================
-- FULL TEXT SEARCH INDEXES
-- ============================================================

create index events_search_idx on public.events
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(city, '')));

create index churches_search_idx on public.churches
  using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(city, '')));

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

create index events_status_idx on public.events(status);
create index events_start_date_idx on public.events(start_date);
create index events_category_idx on public.events(category);
create index events_city_idx on public.events(city);
create index events_featured_idx on public.events(is_featured) where is_featured = true;
create index churches_featured_idx on public.churches(is_featured) where is_featured = true;
create index churches_city_idx on public.churches(city);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_churches_updated_at
  before update on public.churches
  for each row execute procedure public.handle_updated_at();

create trigger handle_events_updated_at
  before update on public.events
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- NEW USER TRIGGER (auto-create profile)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, account_type, display_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'account_type')::account_type, 'organizer'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ADMIN HELPER FUNCTION (bypass RLS for admins)
-- ============================================================

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.admin_users where id = auth.uid()
  );
$$ language sql security definer;

-- Allow admins to update event status
create policy "Admins can update any event"
  on public.events for update using (public.is_admin());

create policy "Admins can view all events"
  on public.events for select using (public.is_admin());

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('event-banners', 'event-banners', true);
-- insert into storage.buckets (id, name, public) values ('church-assets', 'church-assets', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
