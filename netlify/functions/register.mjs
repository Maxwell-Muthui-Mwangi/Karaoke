import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
const categories=new Set(['Singing / Karaoke','Rap / Freestyle','Dance','Spoken Word','DJ / Music Production','Instruments','Comedy','Other']);
const affiliations=new Set(['Student','Staff','Alumni','Guest']);
const reply=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const field=(x,max)=>typeof x==='string'&&x.length<=max?x.trim():null;
export default async function handler(request){
 if(request.method!=='POST')return reply({error:'Method not allowed'},405,{Allow:'POST'});
 const origin=request.headers.get('origin');const site=process.env.URL||process.env.DEPLOY_PRIME_URL;
 if(origin&&site&&new URL(origin).origin!==new URL(site).origin)return reply({error:'Origin not allowed'},403);
 const contentType=request.headers.get('content-type')||'';
 if(!contentType.toLowerCase().startsWith('application/json'))return reply({error:'JSON required'},415);
 const bodyText=await request.text();
 if(bodyText.length>10000)return reply({error:'Request too large'},413);
 let data;try{data=JSON.parse(bodyText)}catch{return reply({error:'Invalid JSON'},400)}
 const kind=field(data.kind,20),full_name=field(data.full_name,120),email=field(data.email,254)?.toLowerCase(),phone=field(data.phone,20),affiliation=field(data.affiliation,20),department=field(data.department??'',120),category=field(data.category??'',80),stage_name=field(data.stage_name??'',100),act_description=field(data.act_description??'',1000);
 if(!['member','performer'].includes(kind)||!full_name||full_name.length<2||!email||!/^\S+@\S+\.\S+$/.test(email)||!phone||!/^\+?[0-9 ]{9,17}$/.test(phone)||!affiliations.has(affiliation)||department===null||category===null||stage_name===null||act_description===null||data.consent!=='yes'||(kind==='performer'&&(!categories.has(category)||act_description.length<10)))return reply({error:'Check the required registration fields.'},400);
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return reply({error:'Registration service is not configured. No application was saved.'},503);
 const request_id=field(data.request_id,36);if(!request_id||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request_id))return reply({error:'Invalid submission identifier'},400);const reference='KZU-'+randomUUID().slice(0,12).toUpperCase();
 try{
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await db.from('registrations').insert({reference,request_id,kind,full_name,email,phone,affiliation,department,category:kind==='performer'?category:null,stage_name:kind==='performer'?stage_name:null,act_description:kind==='performer'?act_description:null,consent_at:new Date().toISOString()});
 if(error?.code==='23505'){const {data:existing}=await db.from('registrations').select('reference,email').eq('request_id',request_id).maybeSingle();if(existing&&existing.email===email)return reply({reference:existing.reference},200);return reply({error:'A club membership may already exist for this email. Contact organizers to confirm.'},409)}if(error){console.error('Registration persistence failure',error.code);return reply({error:'Unable to confirm the save. Please contact organizers before resubmitting.'},503)}
 return reply({reference},201);
 }catch(e){console.error('Registration service exception',e?.name);return reply({error:'Unable to confirm the save. Please contact organizers before resubmitting.'},503)}
}
