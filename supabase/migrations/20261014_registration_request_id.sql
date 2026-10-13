-- Run once on existing deployments BEFORE using the current registration function.
-- Keep historical records; new registrations require a request identifier.
alter table public.registrations add column if not exists request_id uuid;
create unique index if not exists registrations_request_id_unique_idx on public.registrations(request_id);
-- Avoid forcing NOT NULL on old records. The Netlify function always supplies request_id.
-- The fresh-install schema defines request_id as NOT NULL.
-- Verify existing data and constraints before adding any additional unique indexes.
