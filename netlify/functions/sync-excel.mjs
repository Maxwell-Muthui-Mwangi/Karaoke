import {createClient} from '@supabase/supabase-js';

// Runs on Netlify's schedule. Supabase stores every submission first; Excel is a retryable mirror.
// Configure POWER_AUTOMATE_EXCEL_URL as a secret in Netlify, never in frontend or GitHub.
export const config={schedule:'*/5 * * * *'};
export default async function handler(){
 const {SUPABASE_SERVICE_ROLE_KEY:key,POWER_AUTOMATE_EXCEL_URL:flow}=process.env;
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'https://khwohfkxjzwhrgztfpat.supabase.co';
 if(!url||!key||!flow){console.error('Excel sync not configured');return new Response('Excel sync not configured',{status:503})}
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:queue,error}=await db.rpc('karaoke_claim_jobs',{p_service:'excel',p_limit:25});
 if(error){console.error('Excel queue unavailable',error.code);return new Response('Queue unavailable',{status:503})}
 let completed=0,failed=0;
 for(const job of queue||[]){
  const {data:r,error:readError}=await db.from('registrations').select('reference,kind,full_name,email,phone,affiliation,department,category,stage_name,act_description,status,consent_at,created_at').eq('id',job.registration_id).single();
  if(readError||!r){failed++;continue}
  if(r.reference.startsWith('KZU-TEST-')){await db.from('registration_excel_sync').update({state:'skipped',last_error:'Integration fixture',lease_until:null}).eq('registration_id',job.registration_id).eq('state','processing');continue;}
  try{
   // Flow MUST upsert on reference (not blindly append), otherwise retries create duplicate Excel rows.
   const response=await fetch(flow,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({registration_reference:r.reference,...r}),signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error('Microsoft flow HTTP '+response.status);
   const acknowledgement=await response.json().catch(()=>null);
   if(acknowledgement?.saved!==true)throw Error('Microsoft flow did not confirm Excel write');
   const {data:savedRows,error:saveError}=await db.from('registration_excel_sync').update({state:'synced',attempts:job.attempts,last_error:null,last_attempt_at:new Date().toISOString(),lease_until:null,synced_at:new Date().toISOString()}).eq('registration_id',job.registration_id).eq('attempts',job.attempts).eq('state','processing').select('registration_id');
   if(saveError||!savedRows?.length)throw Error('Queue update failed');
   completed++;
  }catch(e){
   failed++;console.error('Excel sync delivery failed',r.reference,e?.message);
   await db.from('registration_excel_sync').update({state:'failed',attempts:job.attempts,last_error:String(e?.message||'Delivery failed').slice(0,200),last_attempt_at:new Date().toISOString(),lease_until:null}).eq('registration_id',job.registration_id).eq('attempts',job.attempts);
  }
 }
 return new Response(JSON.stringify({completed,failed}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
