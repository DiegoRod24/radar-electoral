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
export async function onRequestPost({request,env}){
  try{
    const token=await getAccessToken(env);
    const u=new URL(request.url); const action=u.searchParams.get('action')||'';
    const root=rootPath(env); const rel=(u.searchParams.get('path')||'').replace(/^\/+/, '');
    const full=`${root}/${rel}`.replace(/\/{2,}/g,'/');
    const body=await request.arrayBuffer();
    let endpoint='',arg={};
    if(action==='small'){
      endpoint='https://content.dropboxapi.com/2/files/upload';
      arg={path:full,mode:'overwrite',autorename:false,mute:true,strict_conflict:false};
    }else if(action==='start'){
      endpoint='https://content.dropboxapi.com/2/files/upload_session/start'; arg={close:false};
    }else if(action==='append'){
      endpoint='https://content.dropboxapi.com/2/files/upload_session/append_v2';
      arg={cursor:{session_id:u.searchParams.get('session_id'),offset:Number(u.searchParams.get('offset')||0)},close:false};
    }else if(action==='finish'){
      endpoint='https://content.dropboxapi.com/2/files/upload_session/finish';
      arg={cursor:{session_id:u.searchParams.get('session_id'),offset:Number(u.searchParams.get('offset')||0)},commit:{path:full,mode:'overwrite',autorename:false,mute:true,strict_conflict:false}};
    }else return json({ok:false,error:'ACTION_INVALID'},400);
    const r=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Dropbox-API-Arg':JSON.stringify(arg),'Content-Type':'application/octet-stream'},body});
    if(!r.ok) return json({ok:false,error:await r.text()},r.status);
    const out=await r.json(); return json({ok:true,...out});
  }catch(e){return json({ok:false,error:String(e.message||e)},500)}
}
