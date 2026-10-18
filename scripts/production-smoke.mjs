// Safe production checks. No applicant is created unless LIVE_TEST_CONSENT=yes.
// Run: node scripts/production-smoke.mjs
import {randomUUID} from 'node:crypto';
const site=(process.env.SITE_URL||'https://zukaraoke45.netlify.app').replace(/\/$/,'');
const get=async(path,options={})=>{const r=await fetch(site+path,{...options,signal:AbortSignal.timeout(15000)});return r};
const assert=(condition,message)=>{if(!condition)throw Error(message)};
try{
 const home=await get('/');assert(home.ok,'Home returned '+home.status);const html=await home.text();assert(html.includes('id="root"')||html.includes('id="app"'),'SPA mount point missing');console.log('PASS homepage HTTP '+home.status);
 const api=await get('/api/register');assert(api.status===405,'Registration GET expected 405, got '+api.status);console.log('PASS registration endpoint method guard');
 const invalid=await get('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});assert(invalid.status===400,'Invalid registration expected 400, got '+invalid.status);console.log('PASS invalid registration rejected');
 const cms=await get('/api/admin-applications');assert(cms.status===401,'CMS without credentials expected 401, got '+cms.status);console.log('PASS CMS unauthenticated response '+cms.status);
 if(process.env.LIVE_TEST_CONSENT!=='yes'){console.log('SKIP real registration: set LIVE_TEST_CONSENT=yes and LIVE_TEST_EMAIL, LIVE_TEST_NAME, LIVE_TEST_PHONE only with consent');process.exit(0)}
 const email=process.env.LIVE_TEST_EMAIL,name=process.env.LIVE_TEST_NAME,phone=process.env.LIVE_TEST_PHONE;
 assert(email&&name&&phone,'LIVE_TEST_EMAIL, LIVE_TEST_NAME and LIVE_TEST_PHONE are required');
 const payload={request_id:randomUUID(),kind:'performer',full_name:name,email,phone,affiliation:'Guest',department:'Production verification',category:'Singing / Karaoke',stage_name:'Production verification',act_description:'Consented end-to-end verification application',consent:'yes'};
 const submit=()=>get('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const created=await submit();const result=await created.json();assert(created.status===201&&/^KZU-/.test(result.reference||''),'Live registration failed: '+created.status+' '+JSON.stringify(result));console.log('PASS live registration reference '+result.reference);
 const retry=await submit();const repeated=await retry.json();assert(retry.status===200&&repeated.reference===result.reference,'Idempotent retry failed');console.log('PASS same-payload retry did not duplicate');
 console.log('MANUAL FOLLOW-UP: Verify '+result.reference+' in Supabase registrations and /admin; wait for receipt queue state sent and confirm email arrival in '+email+'.');
}catch(e){console.error('FAIL',e.message);process.exitCode=1}
