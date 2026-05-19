-- ============================================================
-- TRAVEL APP - SUPABASE FULL SETUP
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PUBLIC USERS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);


-- ─────────────────────────────────────────────
-- 2. TRIPS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  destination text not null,
  start_date date,
  end_date date,
  itinerary jsonb default '[]',   -- array of day objects
  budget numeric default 0,
  status text default 'active'    -- active | past | saved
    check (status in ('active', 'past', 'saved')),
  shared_with text[] default '{}',-- array of emails
  created_at timestamptz default now()
);

alter table public.trips enable row level security;

create policy "Users can manage their own trips"
  on public.trips for all
  using (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 3. DOCUMENTS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null              -- passport | visa | ticket | other
    check (type in ('passport', 'visa', 'ticket', 'other')),
  file_url text,
  reminder_date date,
  notes text,
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can manage their own documents"
  on public.documents for all
  using (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 4. AUTO-INSERT INTO public.users ON SIGNUP
--    Triggered from auth.users after registration
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  return new;
end;
$$;

-- Drop trigger if exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────
-- 5. STORAGE BUCKET FOR DOCUMENTS
-- ─────────────────────────────────────────────
-- Run this in Supabase Dashboard > SQL Editor

insert into storage.buckets (id, name, public)
values ('travel-documents', 'travel-documents', false)
on conflict do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'travel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own documents
create policy "Users can read their own documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'travel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own documents
create policy "Users can delete their own documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'travel-documents' AND auth.uid()::text = (storage.foldername(name))[1]);