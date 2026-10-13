# Karaoke ZU

Zetech University Karaoke Night — The Dream. The Degree. The Mic.

Every Friday, 5–8 PM, Ruiru Campus, 3rd Floor Auditorium. WhatsApp: 079 442 5022.

## Development
Run `npm install` then `npm run dev` and `npm run build`.

This is an initial public-facing UI. Registrations are not collected until a secure backend and consent workflow are implemented. QR links point to the club registration section. See the accompanying source archive for the original Talent vs Career presentation; binary presentation upload is pending.

## Club registration
The Join Club and Perform forms post to `/api/register`. Production registrations require Vercel-compatible serverless hosting, Supabase database schema, and server-side environment variables. See `REGISTRATION_SETUP.md`. Until configured, submissions fail explicitly and no applicant data is stored. This is not yet a verified live registration service.
