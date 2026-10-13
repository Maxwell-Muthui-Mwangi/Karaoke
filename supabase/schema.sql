-- Run in Supabase SQL editor before enabling registrations.
create table if not exists public.registrations (
 id uuid primary key default gen_random_uuid(), reference text unique not null,
 kind text not null check(kind in ('member','performer')),
 full_name text not null, email text not null, phone text not null,
 affiliation text not null, department text,
 category text, stage_name text, act_description text,
 status text not null default 'pending' check(status in ('pending','approved','waitlisted','rejected')),
 consent_at timestamptz not null,
 created_at timestamptz not null default now()
);
alter table public.registrations enable row level security;
-- No public SELECT, UPDATE or DELETE policies: registrations are private.
create index if not exists registrations_created_at_idx on public.registrations(created_at desc);
create index if not exists registrations_kind_status_idx on public.registrations(kind,status);
