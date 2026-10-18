import {createClient} from '@supabase/supabase-js';
export const config={schedule:'*/10 * * * *'};
const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(){
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'https://khwohfkxjzwhrgztfpat.supabase.co';
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY,mailKey=process.env.RESEND_API_KEY;
 if(!key||!mailKey)return new Response('Receipt service not configured',{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:queue,error}=await db.from('registration_receipt_outbox').select('registration_id,attempts').neq('state','sent').order('created_at').limit(25);
 if(error)return new Response('Receipt queue unavailable',{status:503});
 let sent=0,failed=0;
 for(const job of queue||[]){
  const {data:r,error:lookupError}=await db.from('registrations').select('reference,email,full_name,kind').eq('id',job.registration_id).single();
  if(lookupError||!r){failed++;continue}
  // Never send a real email for clearly labelled integration fixtures.
  if(r.reference.startsWith('KZU-TEST-'))continue;
  try{
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+mailKey,'Content-Type':'application/json','Idempotency-Key':'karaoke-receipt-'+r.reference},body:JSON.stringify({from:'Zetech Karaoke <Karaoke@ballershopke.ltd>',to:[r.email],reply_to:'maxwell.mwangi@zetech.ac.ke',subject:'Zetech Karaoke registration received — '+r.reference,text:'Hello '+r.full_name+',\n\nYour Zetech Karaoke registration was received.\nReference: '+r.reference+'\nStatus: Pending review. A performance slot is not guaranteed.\n\nEvery Friday, 5–8 PM, Ruiru Campus, 3rd Floor Auditorium.\nContact: 0794 425 022.',html:'<h1>Zetech Karaoke</h1><p>Hello '+escapeHtml(r.full_name)+',</p><p>Your registration was received.</p><p>Reference: <strong>'+escapeHtml(r.reference)+'</strong></p><p>Status: Pending review. A performance slot is not guaranteed.</p><p>Every Friday, 5–8 PM, Ruiru Campus, 3rd Floor Auditorium.</p>'}),signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('Email provider HTTP '+response.status);
   const {error:saveError}=await db.from('registration_receipt_outbox').update({state:'sent',attempts:job.attempts+1,sent_at:new Date().toISOString(),last_error:null,last_attempt_at:new Date().toISOString()}).eq('registration_id',job.registration_id).eq('attempts',job.attempts);
   if(saveError)throw Error('Receipt status update failed');
   sent++;
  }catch(e){
   failed++;
   console.error('Receipt retry failure',r.reference,e?.message);
   await db.from('registration_receipt_outbox').update({state:'failed',attempts:job.attempts+1,last_error:String(e?.message||'Email unavailable').slice(0,160),last_attempt_at:new Date().toISOString()}).eq('registration_id',job.registration_id).eq('attempts',job.attempts);
  }
 }
 return new Response(JSON.stringify({sent,failed}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
