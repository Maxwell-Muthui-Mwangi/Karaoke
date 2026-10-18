# Zetech Karaoke: Supabase → Microsoft Excel synchronisation

## Current state
Supabase stores registrations and the `registration_excel_sync` table queues every insert and status change. The scheduled Netlify function `netlify/functions/sync-excel.mjs` sends queued rows every five minutes. **Excel writes cannot happen until the Power Automate flow is created and its HTTP trigger URL is saved as a Netlify secret.**

## Microsoft setup (workbook owner)
1. Open the target workbook in OneDrive and create a formatted **Excel Table** (not just a worksheet range) named `KaraokeRegistrations`. Set headers:
   `registration_reference`, `reference`, `kind`, `full_name`, `email`, `phone`, `affiliation`, `department`, `category`, `stage_name`, `act_description`, `status`, `consent_at`, `created_at`.
2. In Power Automate, create a cloud flow with **When an HTTP request is received**. Configure the trigger's authentication/security settings appropriately and use the generated trigger URL only as a secret. Sample request body:
   ```json
   {"registration_reference":"KZU-EXAMPLE","reference":"KZU-EXAMPLE","kind":"member","full_name":"Example Person","email":"example@example.invalid","phone":"0794000000","affiliation":"Student","department":"Example","category":null,"stage_name":null,"act_description":null,"status":"pending","consent_at":"2026-10-18T00:00:00Z","created_at":"2026-10-18T00:00:00Z"}
   ```
3. Use **Excel Online (Business) → List rows present in a table** filtered by the exact `registration_reference`. If present, **Update a row**; otherwise **Add a row into a table**. Map every field above. Configure trigger concurrency to **1** to prevent duplicate rows from overlapping deliveries.
4. Add **Response** as the final action **after** the Excel write succeeds, returning HTTP 200 and `{"saved":true}`. On Excel failure return a non-2xx response so the Netlify job retries. Do not respond with success before the write is complete. Microsoft licensing and connector availability depend on the account.
5. In Netlify → Site configuration → Environment variables, add `POWER_AUTOMATE_EXCEL_URL` with the generated private trigger URL, scoped to Functions. Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured as server-only secrets. Trigger a new deployment.
6. Verify one genuine consented registration: Supabase row exists; sync queue becomes `synced`; Excel contains **exactly one** row with the same reference. Retry the same reference and verify it updates, rather than duplicates. Verify an approval-status change updates the same Excel row.

## Operational safety
- Never publish the trigger URL or Supabase service-role key in GitHub, browser code, screenshots or logs.
- The public form saves to Supabase first. Excel is a delayed mirror and should never be the only copy.
- The queue also contains older registrations after migration; connecting the flow will backfill them. Confirm permission and retention requirements before exposing personal information in Excel.
- A successful HTTP status from the flow is meaningful **only if** its Response action runs after Excel writes.
- Keep the workbook private and share access only with authorised organisers.
- Do not add arbitrary registration quotas; the user has requested unrestricted legitimate registrations.
