# Secure registration setup

1. Create a Supabase project and run `supabase/schema.sql` in SQL Editor.
2. Deploy to Vercel and set server-side `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables. Never prefix the service key with `VITE_`.
3. Verify a real test registration returns `KZU-...`, and confirm its row appears in the private `registrations` table.
4. Check invalid submissions, duplicate entries, mobile, and network errors. Configure rate limiting, bot protection, data retention and organizer-only administration before promoting the form publicly.
5. Set up backups, restricted organizer access, and a documented privacy notice. Do not collect registrations on static cPanel hosting without a compatible secure backend.

No data is stored in browser localStorage. The form explicitly reports failure when the backend is missing, so applicants are not falsely told they are registered.

## Netlify deployment and security release gate
- Netlify build command: `npm run build`; publish directory: `dist`. `netlify.toml` routes `/api/register` to the Netlify function.
- Set `SUPABASE_URL=https://khwohfkxjzwhrgztfpat.supabase.co` and `SUPABASE_SERVICE_ROLE_KEY` in Netlify environment variables with Functions runtime scope; do not commit the secret.
- Confirm the Netlify site is linked to the correct GitHub repository and deploys the latest main commit.
- Test one real member and one performer submission; verify exact records in Supabase, no duplicate records after retries, and no sensitive fields in logs.
- Confirm 503 errors when secrets are missing; confirm 400 on invalid input and 405 on GET.
- Configure platform-side bot protection/rate limiting before public launch; an origin check alone is not bot protection.
- Configure restricted organizer dashboard and least-privilege accounts, MFA, tested backups and point-in-time recovery appropriate to plan, retention and deletion policy, monitoring and alerts.
- Security review must cover dependency advisories, CSP, accessibility, and incident response. Database backups are not yet configured or restore-tested.
- Avoid claiming zero data loss or 100% security without recovery testing and independent security review.
