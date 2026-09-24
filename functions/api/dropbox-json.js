async function getAccessToken(env) {
  if (env.DROPBOX_ACCESS_TOKEN) return env.DROPBOX_ACCESS_TOKEN;
  const key = env.DROPBOX_APP_KEY;
  const secret = env.DROPBOX_APP_SECRET;
  const refresh = env.DROPBOX_REFRESH_TOKEN;
  if (!key || !secret || !refresh) throw new Error('DROPBOX_NOT_CONFIGURED');
  const body = new URLSearchParams({grant_type:'refresh_token',refresh_token:refresh});
  const auth = btoa(`${key}:${secret}`);
  const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method:'POST', headers:{'Authorization':`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'}, body
  });
  if(!r.ok) throw new Error(`DROPBOX_TOKEN_${r.status}:${await r.text()}`);
  return (await r.json()).access_token;
}
function rootPath(env){
  const p=(env.DROPBOX_ROOT||'/RADAR_META_TESIS').trim();
  return p.startsWith('/')?p:'/'+p;
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8','cache-control':'no-store'}})}
export async function onRequest({request,env}){
 try{
  const token=await getAccessToken(env);const u=new URL(request.url);const rel=(u.searchParams.get('path')||'').replace(/^\/+/, '');if(!rel)return json({ok:false,error:'PATH_REQUIRED'},400);
  const full=`${rootPath(env)}/${rel}`.replace(/\/{2,}/g,'/');
  if(request.method==='GET'){
    const r=await fetch('https://content.dropboxapi.com/2/files/download',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Dropbox-API-Arg':JSON.stringify({path:full})}});
    if(r.status===409)return json({ok:true,exists:false,data:null}); if(!r.ok)return json({ok:false,error:await r.text()},r.status);
    return json({ok:true,exists:true,data:await r.json()});
  }
  if(request.method==='PUT' || request.method==='POST'){
    const data=await request.json();const bytes=new TextEncoder().encode(JSON.stringify(data,null,2));
    const r=await fetch('https://content.dropboxapi.com/2/files/upload',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Dropbox-API-Arg':JSON.stringify({path:full,mode:'overwrite',autorename:false,mute:true}),'Content-Type':'application/octet-stream'},body:bytes});
    if(!r.ok)return json({ok:false,error:await r.text()},r.status);return json({ok:true,meta:await r.json()});
  }
  return json({ok:false,error:'METHOD_NOT_ALLOWED'},405)
 }catch(e){return json({ok:false,error:String(e.message||e)},500)}
}
