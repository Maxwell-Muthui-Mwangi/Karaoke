# Zetech Karaoke

Zetech University Karaoke Night — The Dream. The Degree. The Mic.

Every Friday, 5–8 PM, Ruiru Campus, 3rd Floor Auditorium. WhatsApp: 079 442 5022.

## Development
Run `npm install` then `npm run dev` and `npm run build`.

The React/Vite website includes a registration form, a Netlify Functions API, a Supabase-backed application CMS and a scheduled email-receipt worker. Production operation depends on Netlify configuration and deployment. QR links point to the club registration section.

## Club registration
The Join Club and Perform forms post to `/api/register`. Production registrations require Netlify Functions, the Supabase database schema and server-side environment variables. See `docs/environment-variables.md` for deployment settings. The API fails explicitly if its server secret is missing; do not treat source code alone as proof of a working production deployment.

The staff CMS is at `/admin` and supports authorised application review and status changes. Excel synchronisation has been disabled to avoid unnecessary scheduled compute; the receipt worker remains enabled. Read-only production checks are configured in `.github/workflows/production-smoke.yml`. Verify GitHub Actions and the deployed site before relying on these checks.
