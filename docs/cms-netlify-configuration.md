# Restore Zetech Karaoke CMS on Netlify

The CMS at `/admin` requires two **public, build-time** Vite variables. These are not the service-role secret.

1. In the correct Netlify site (the screenshot shows `zukaraoke45.netlify.app`), open **Site configuration → Environment variables**.
2. Set `VITE_SUPABASE_URL` to `https://khwohfkxjzwhrgztfpat.supabase.co`.
3. In Supabase → Project Settings → API Keys, copy the **publishable/anon** key into `VITE_SUPABASE_ANON_KEY`. **Never use the service_role/secret key here.**
4. Scope both variables to **Builds** (or All scopes), then trigger a **new deploy with a rebuild**. Vite embeds these values at build time; simply refreshing the browser cannot fix an old bundle.
5. Confirm `/admin` displays the staff sign-in form.
6. Create or invite the intended staff user through Supabase Authentication, then grant access in `public.cms_staff` only after verifying the user's auth UUID. The table is currently empty; do not expose public signups as CMS admins.
7. For server endpoints, configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` in Netlify **Functions** scope. Keep service-role key server-only.
8. Verify sign-in, applications GET, and authorised status changes. Verify unauthorised users are rejected.

Excel sync additionally needs a configured Microsoft Power Automate flow and a private `POWER_AUTOMATE_EXCEL_URL` Netlify secret. See `docs/excel-sync-setup.md`.
