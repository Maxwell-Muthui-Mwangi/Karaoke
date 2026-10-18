import {createClient} from '@supabase/supabase-js';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const allowed=new Set(['pending','approved','waitlisted','rejected']);
export default async function handler(request){
 if(!['GET','PATCH'].includes(request.method))return json({error:'Method not allowed'},405);
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'https://khwohfkxjzwhrgztfpat.supabase.co',key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)return json({error:'CMS server secret is unavailable to Netlify Functions. Configure SUPABASE_SERVICE_ROLE_KEY in the Functions runtime scope and redeploy.'},503);
 const bearer=request.headers.get('authorization')||'';
 if(!/^Bearer\s+\S+$/.test(bearer))return json({error:'Authentication required'},401);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(bearer.replace(/^Bearer\s+/,''));
 if(authError||!user)return json({error:'Invalid session'},401);
 const {data:member,error:roleError}=await db.from('cms_staff').select('role,active').eq('user_id',user.id).maybeSingle();
 if(roleError)return json({error:'CMS staff table not configured'},503);
 if(!member?.active)return json({error:'Not authorised for CMS'},403);
 if(request.method==='GET'){
  const parsed=new URL(request.url);const page=Number(parsed.searchParams.get('page')||0);if(!Number.isSafeInteger(page)||page<0||page>100000)return json({error:'Invalid page'},400);
  const kind=parsed.searchParams.get('kind')||'all';const status=parsed.searchParams.get('status')||'all';const search=(parsed.searchParams.get('search')||'').trim();const archive=parsed.searchParams.get('archive')||'active';if(!['all','member','performer'].includes(kind)||!['all',...allowed].includes(status)||!['active','archived','all'].includes(archive)||search.length>120)return json({error:'Invalid filters'},400);
  const size=100;let query=db.from('registrations').select('id,reference,kind,full_name,email,phone,affiliation,department,category,stage_name,act_description,status,created_at,archived_at',{count:'exact'}).order('created_at',{ascending:false}).order('id',{ascending:false});if(archive==='active')query=query.is('archived_at',null);else if(archive==='archived')query=query.not('archived_at','is',null);if(kind!=='all')query=query.eq('kind',kind);if(status!=='all')query=query.eq('status',status);if(search)query=query.or('full_name.ilike.%'+search.replace(/[%_,().]/g,'')+'%,email.ilike.%'+search.replace(/[%_,().]/g,'')+'%,reference.ilike.%'+search.replace(/[%_,().]/g,'')+'%');const {data,error,count}=await query.range(page*size,page*size+size-1);
  if(error)return json({error:'Unable to retrieve applications'},503);
  const [pending,approved,performers,members,archived]=await Promise.all([
   db.from('registrations').select('id',{count:'exact',head:true}).eq('status','pending'),
   db.from('registrations').select('id',{count:'exact',head:true}).eq('status','approved'),
   db.from('registrations').select('id',{count:'exact',head:true}).eq('kind','performer'),
   db.from('registrations').select('id',{count:'exact',head:true}).eq('kind','member'),
   db.from('registrations').select('id',{count:'exact',head:true}).not('archived_at','is',null)
  ]);
  if(pending.error||approved.error||performers.error||members.error||archived.error)return json({error:'Unable to retrieve application statistics'},503);
  return json({role:member.role,applications:data,total:count,page,page_size:size,stats:{pending:pending.count,approved:approved.count,performers:performers.count,members:members.count,archived:archived.count}});
 }
 if(!['admin','editor'].includes(member.role))return json({error:'Read-only role'},403);
 if(Number(request.headers.get('content-length'))>2048)return json({error:'Request too large'},413);
 let raw;try{raw=await request.text()}catch{return json({error:'Unable to read request'},400)}
 if(raw.length>2048)return json({error:'Request too large'},413);
 let body;try{body=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)||!(body.action==='archive'&&typeof body.archive==='boolean')&& !allowed.has(body.status))return json({error:'Invalid application update'},400);
 if(body.action==='archive' ? (typeof body.archive!=='boolean'||body.status!==undefined) : (body.action!==undefined||!allowed.has(body.status)||body.archive!==undefined))return json({error:'Invalid application action'},400);
 const publicKey=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY;
 if(!publicKey)return json({error:'CMS authentication configuration is incomplete'},503);
 const actorDb=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:bearer}}});
 if(body.action==='archive'){
  const {data:updated,error}=await actorDb.rpc('cms_set_application_archive',{p_id:body.id,p_archive:body.archive});
  if(error)return json({error:'Unable to change archive state'},error.code==='42501'?403:503);
  return json({application:Array.isArray(updated)?updated[0]:updated});
 }
 const {data:before,error:lookupError}=await db.from('registrations').select('id,status').eq('id',body.id).maybeSingle();
 if(lookupError||!before)return json({error:'Application not found'},404);
 const {data:updated,error}=await actorDb.rpc('cms_change_application_status',{p_id:body.id,p_status:body.status,p_expected_status:before.status});
 if(error){console.error('Atomic CMS status update failed',error.code);return json({error:error.code==='40001'?'Application changed; refresh and retry':'Unable to update application and audit record'},error.code==='40001'?409:503)}
 return json({application:Array.isArray(updated)?updated[0]:updated});
}
