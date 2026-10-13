# Zetech Karaoke Applications CMS
The staff CMS is available at /admin after deployment. It uses Supabase Auth password login and a separate server-side authorization check. Public registration remains at /#join.
## Deployment prerequisites
1. Run supabase/schema.sql on a fresh database. For an existing database, apply supabase/migrations/20261014_registration_request_id.sql first, then apply supabase/cms.sql. Do not rerun fresh-install SQL over an existing database without reviewing changes.
2. Set Netlify server environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (secret; never use VITE_ prefix).
3. Set Netlify build environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (public anon key). Rebuild to include them in the frontend.
4. Create staff accounts through Supabase Authentication. Add authorized users to public.cms_staff with roles admin, editor, or viewer using the SQL editor. Disable open public signup if the project is staff-only.
5. Test sign-in, unauthorized user denial, listing, status update, and audit log; verify a real registration appears in the CMS.
## Security and limitations
No public SELECT access to registrations. Server validates bearer JWT against Supabase Auth and checks active staff role. Admin/editor can update statuses; viewer can read. Audit table tracks status changes. Lists are capped at 200 recent submissions; pagination, export, email notifications, password reset UI, bulk actions, and approval workflows remain future work. Registration anti-spam and rate limiting need additional deployment protection. Do not use real student data in tests without approval.

## Release verification checklist
- Run npm ci and npm run build; confirm dist/index.html is generated.
- Deploy to Netlify and confirm /, /admin, /api/register, and /api/admin-applications route correctly.
- Verify anonymous /api/admin-applications returns 401 and unlisted Supabase users return 403.
- Submit a consented test registration; verify a reference number and exactly one database row; retry the same request_id and verify no duplicate.
- Sign in as viewer, editor, and admin; verify role restrictions, status changes, and audit entries.
- Check event QR code, copy-link, WhatsApp and Facebook sharing on mobile and desktop.
- Test keyboard navigation, reduced-motion behavior, Instagram/YouTube embeds, and responsive layouts.
- Set up rate limiting and monitoring before publicly promoting the registration form.

**Current verification status:** Source changes are committed; Netlify deployment, database migrations, and end-to-end testing are not yet confirmed.
