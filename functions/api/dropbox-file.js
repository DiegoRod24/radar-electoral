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
function mimeFor(path){const x=path.toLowerCase(); if(x.endsWith('.png'))return'image/png';if(/\.(jpg|jpeg)$/.test(x))return'image/jpeg';if(x.endsWith('.webp'))return'image/webp';if(x.endsWith('.gif'))return'image/gif';if(x.endsWith('.mp4'))return'video/mp4';if(x.endsWith('.webm'))return'video/webm';if(x.endsWith('.json'))return'application/json';if(x.endsWith('.html'))return'text/html;charset=UTF-8';if(x.endsWith('.txt'))return'text/plain;charset=UTF-8';return'application/octet-stream'}
export async function onRequestGet({request,env}){
 try{
  const token=await getAccessToken(env);const u=new URL(request.url);const rel=(u.searchParams.get('path')||'').replace(/^\/+/, '');
  if(!rel)return json({ok:false,error:'PATH_REQUIRED'},400);
  const full=`${rootPath(env)}/${rel}`.replace(/\/{2,}/g,'/');
  const r=await fetch('https://content.dropboxapi.com/2/files/download',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Dropbox-API-Arg':JSON.stringify({path:full})}});
  if(!r.ok)return json({ok:false,error:await r.text()},r.status);
  const h=new Headers();h.set('content-type',mimeFor(rel));h.set('cache-control','private,max-age=300');h.set('accept-ranges','bytes');
  return new Response(r.body,{status:200,headers:h});
 }catch(e){return json({ok:false,error:String(e.message||e)},500)}
}
