import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Netlify routes registration and CMS to server functions',()=>{
 const config=read('netlify.toml');
 for(const route of ['/api/register','/api/admin-applications'])assert.ok(config.includes('from = "'+route+'"'));
 assert.ok(config.includes('X-Content-Type-Options = "nosniff"'));
 assert.ok(config.includes('Content-Security-Policy = '));
});
test('Registration smoke tests never create users without explicit consent',()=>{
 const smoke=read('scripts/production-smoke.mjs');
 assert.match(smoke,/LIVE_TEST_CONSENT/);
 assert.match(smoke,/randomUUID/);
});
test('Workers claim jobs atomically and reject stale completion',()=>{
 for(const [file,service] of [['send-receipts.mjs','receipt']]){
  const worker=read('netlify/functions/'+file);
  assert.ok(worker.includes("db.rpc('karaoke_claim_jobs'"));
  assert.ok(worker.includes("p_service:'"+service+"'"));
  assert.ok(worker.includes('p_limit:5'),'Worker batch must remain bounded within its database lease');
  assert.ok(worker.includes(".eq('attempts',job.attempts).eq('state','processing')"));
  assert.ok(worker.includes("r.reference.startsWith('KZU-TEST-')"));
 }
});
test('Excel background sync is disabled',()=>{
 assert.doesNotMatch(read('netlify.toml'),/sync-excel/);
 assert.doesNotMatch(read('.github/workflows/ci.yml'),/sync-excel/);
 assert.equal(existsSync(new URL('../netlify/functions/sync-excel.mjs',import.meta.url)),false,'Excel worker must not be deployed');
});
test('CMS validates session, role and uses atomic update functions',()=>{
 const cms=read('netlify/functions/admin-applications.mjs');
 for(const marker of ['db.auth.getUser','cms_staff','cms_change_application_status','cms_set_application_archive'])assert.ok(cms.includes(marker));
});
test('No privileged service-role key is referenced by browser components',()=>{
 for(const file of ['src/AdminApp.jsx','src/RegistrationForm.jsx']){
  const code=read(file);
  assert.doesNotMatch(code,/SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|POWER_AUTOMATE_EXCEL_URL/);
 }
});

test('CMS rejects mixed archive and status updates',()=>{
 const cms=read('netlify/functions/admin-applications.mjs');
 assert.ok(cms.includes("body.status!==undefined"));
 assert.ok(cms.includes("body.archive!==undefined"));
 assert.ok(cms.includes("Invalid application action"));
});

test('Registration form prevents repeated in-flight submission attempts',()=>{
 const form=read('src/RegistrationForm.jsx');
 assert.ok(form.includes('if(submitting.current)return;'));
 assert.ok(form.includes('submitting.current=true;'));
 assert.ok(form.includes('submitting.current=false;'));
 assert.ok(form.includes('disabled={busy}'));
 assert.ok(form.includes('requestId.current'));
});

test('Registration network timeout retains retry safety',()=>{
 const form=read('src/RegistrationForm.jsx');
 assert.ok(form.includes('AbortSignal.timeout(20000)'));
 assert.ok(form.includes('requestId.current'));
 assert.ok(form.includes('submitting.current=false'));
});

test('CMS rejects active staff with unrecognised roles',()=>{
 const cms=read('netlify/functions/admin-applications.mjs');
 assert.ok(cms.includes("!['admin','editor','viewer'].includes(member.role)"));
});

test('CMS handles upstream authentication failures explicitly',()=>{
 const cms=read('netlify/functions/admin-applications.mjs');
 assert.ok(cms.includes('Authentication service temporarily unavailable'));
 assert.ok(cms.includes('result.data?.user'));
});
