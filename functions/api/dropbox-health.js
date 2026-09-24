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
export async function onRequestGet({env}){
  try{
    const token=await getAccessToken(env);
    const r=await fetch('https://api.dropboxapi.com/2/users/get_current_account',{method:'POST',headers:{Authorization:`Bearer ${token}`}});
    if(!r.ok) return json({ok:false,error:await r.text()},502);
    const account=await r.json();
    return json({ok:true,root:rootPath(env),account:{name:account.name?.display_name||'',email:account.email||''}});
  }catch(e){return json({ok:false,error:String(e.message||e)},503)}
}
