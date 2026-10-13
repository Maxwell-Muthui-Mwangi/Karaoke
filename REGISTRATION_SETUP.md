# Secure registration setup

1. Create a Supabase project and run `supabase/schema.sql` in SQL Editor.
2. Deploy to Vercel and set server-side `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables. Never prefix the service key with `VITE_`.
3. Verify a real test registration returns `KZU-...`, and confirm its row appears in the private `registrations` table.
4. Check invalid submissions, duplicate entries, mobile, and network errors. Configure rate limiting, bot protection, data retention and organizer-only administration before promoting the form publicly.
5. Set up backups, restricted organizer access, and a documented privacy notice. Do not collect registrations on static cPanel hosting without a compatible secure backend.

No data is stored in browser localStorage. The form explicitly reports failure when the backend is missing, so applicants are not falsely told they are registered.
