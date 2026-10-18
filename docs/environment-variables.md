# Zetech Karaoke production environment

Set these values in Netlify Site configuration → Environment variables for zukaraoke45.netlify.app. Never commit actual keys.

| Variable | Scope | Purpose |
| --- | --- | --- |
| VITE_SUPABASE_URL | Builds | Public Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Builds | Public CMS authentication key |
| SUPABASE_URL | Functions | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Functions, secret | Server database writes and workers |
| SUPABASE_ANON_KEY | Functions | CMS authentication/status updates |
| RESEND_API_KEY | Functions, secret | Email receipt delivery |
| POWER_AUTOMATE_EXCEL_URL | Functions, secret, optional | Microsoft Excel sync flow |

Verify ballershopke.ltd in Resend and authorise sender Karaoke@ballershopke.ltd. Never put server keys in VITE_ variables. Netlify Functions cannot read runtime variables defined only in netlify.toml. Redeploy after adding or updating variables.

Run an end-to-end consented test through /#join: confirm reference in Supabase and /admin, confirm receipt queue transitions pending → sent, and confirm email arrives. Check Netlify function logs and Resend logs. Excel sync requires a separate Power Automate flow and confirmed upsert acknowledgement.

Environment configuration alone cannot guarantee 100% availability or prevent all data loss. Configure database backups, restore drills, error monitoring, and alerts for failed outbox jobs.
