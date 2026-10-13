-- Apply after supabase/schema.sql; existing registrations must already contain status and id.
-- Staff are provisioned in Supabase Auth by a trusted administrator.
create table if not exists public.cms_staff(
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('admin','editor','viewer')),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.cms_application_audit(
 id bigint generated always as identity primary key,
 application_id uuid not null references public.registrations(id),
 actor_id uuid not null references auth.users(id),
 previous_status text not null,
 new_status text not null,
 created_at timestamptz not null default now()
);
alter table public.cms_staff enable row level security;
alter table public.cms_application_audit enable row level security;
-- Intentionally no anon/authenticated table policies. Only the server's
-- service-role key accesses applications, staff membership, and audit history.
-- Bootstrap a staff user after creating them in Supabase Authentication:
-- insert into public.cms_staff(user_id,role) values ('AUTH_USER_UUID','admin');
