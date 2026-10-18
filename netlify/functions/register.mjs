import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
const categories=new Set(['Singing / Karaoke','Rap / Freestyle','Dance','Spoken Word','DJ / Music Production','Instruments','Comedy','Other']);
const affiliations=new Set(['Student','Staff','Alumni','Guest']);
async function sendReceipt({email,name,reference,kind}) {
 const key=process.env.RESEND_API_KEY;
 if(!key)return {sent:false,reason:'not_configured'};
 const safe=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const text='Hello '+name+',\n\nYour Zetech Karaoke '+(kind==='performer'?'performance application':'club registration')+' has been received.\nRegistration reference: '+reference+'\nStatus: Pending review. This is proof of submission, not confirmation of a performance slot.\n\nEvery Friday, 5–8 PM, Ruiru Campus, 3rd Floor Auditorium.\nFor help: 0794 425 022.\n\nZetech Karaoke';
 const payload={from:'Zetech Karaoke <Karaoke@ballershopke.ltd>',to:[email],cc:['MaxwellMuthuimwangi@gmail.com'],reply_to:'maxwell.mwangi@zetech.ac.ke',subject:'Zetech Karaoke registration received — '+reference,text,html:'<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#002147"><h1>Zetech Karaoke</h1><p>Hello '+safe(name)+',</p><p>We received your '+(kind==='performer'?'performance application':'club registration')+'. Keep this email as proof of submission.</p><p style="font-size:20px"><strong>Reference: '+safe(reference)+'</strong></p><p>Status: <strong>Pending review</strong></p><p>This receipt does not guarantee a performance slot.</p><p>Every Friday, 5–8 PM · Ruiru Campus, 3rd Floor Auditorium</p><p>Questions? 0794 425 022</p></div>'};
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'karaoke-receipt-'+reference},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});
  if(!response.ok){console.error('Resend receipt failed',response.status);return {sent:false,reason:'provider_error'}}
  return {sent:true};
 }catch(e){console.error('Resend receipt unavailable',e?.name);return {sent:false,reason:'network_error'}}
}
const reply=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const field=(x,max)=>typeof x==='string'&&x.length<=max?x.trim():null;
export default async function handler(request){
 if(request.method!=='POST')return reply({error:'Method not allowed'},405,{Allow:'POST'});
 const origin=request.headers.get('origin');const site=process.env.URL||process.env.DEPLOY_PRIME_URL;
 if(origin&&site){try{const allowed=new Set([new URL(site).origin,process.env.DEPLOY_PRIME_URL&&new URL(process.env.DEPLOY_PRIME_URL).origin].filter(Boolean));if(!allowed.has(new URL(origin).origin))return reply({error:'Origin not allowed'},403)}catch{return reply({error:'Invalid origin'},403)}}
 const contentType=request.headers.get('content-type')||'';
 if(!contentType.toLowerCase().startsWith('application/json'))return reply({error:'JSON required'},415);
 let bodyText;try{bodyText=await request.text()}catch{return reply({error:'Unable to read request'},400)}
 if(bodyText.length>10000)return reply({error:'Request too large'},413);
 let data;try{data=JSON.parse(bodyText)}catch{return reply({error:'Invalid JSON'},400)}
 if(!data||typeof data!=='object'||Array.isArray(data))return reply({error:'Invalid registration payload'},400);
 if(typeof data.website==='string'&&data.website.trim())return reply({error:'Unable to process this submission'},400);
 const kind=field(data.kind,20),full_name=field(data.full_name,120),email=field(data.email,254)?.toLowerCase(),phone=field(data.phone,20),affiliation=field(data.affiliation,20),department=field(data.department??'',120),category=field(data.category??'',80),stage_name=field(data.stage_name??'',100),act_description=field(data.act_description??'',1000);
 if(!['member','performer'].includes(kind)||!full_name||full_name.length<2||!email||!/^\S+@\S+\.\S+$/.test(email)||!phone||!/^\+?[0-9 ]{9,17}$/.test(phone)||!affiliations.has(affiliation)||department===null||category===null||stage_name===null||act_description===null||data.consent!=='yes'||(kind==='performer'&&(!categories.has(category)||act_description.length<10)))return reply({error:'Check the required registration fields.'},400);
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'https://khwohfkxjzwhrgztfpat.supabase.co',key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return reply({error:'Registration service is not configured. No application was saved.'},503);
 const request_id=field(data.request_id,36);if(!request_id||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request_id))return reply({error:'Invalid submission identifier'},400);const reference='KZU-'+randomUUID().slice(0,12).toUpperCase();
 try{
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await db.from('registrations').insert({reference,request_id,kind,full_name,email,phone,affiliation,department,category:kind==='performer'?category:null,stage_name:kind==='performer'?stage_name:null,act_description:kind==='performer'?act_description:null,consent_at:new Date().toISOString()});
 if(error?.code==='23505'){const {data:existing}=await db.from('registrations').select('reference,email,kind,full_name,phone,affiliation,department,category,stage_name,act_description').eq('request_id',request_id).maybeSingle();if(existing&&existing.email===email&&existing.kind===kind&&existing.full_name===full_name&&existing.phone===phone&&existing.affiliation===affiliation&&(existing.department||'')===department&&(existing.category||'')===(kind==='performer'?category:'')&&(existing.stage_name||'')===(kind==='performer'?stage_name:'')&&(existing.act_description||'')===(kind==='performer'?act_description:''))return reply({reference:existing.reference,email_status:'previously_submitted'},200);return reply({error:'A club membership may already exist for this email. Contact organisers to confirm.'},409)}if(error){console.error('Registration persistence failure',error.code);return reply({error:'Unable to confirm the save. Please contact organisers before resubmitting.'},503)}
 return reply({reference,email_status:'pending'},201);
 }catch(e){console.error('Registration service exception',e?.name);return reply({error:'Unable to confirm the save. Please contact organisers before resubmitting.'},503)}
}
