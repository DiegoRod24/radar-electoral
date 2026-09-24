// Radar Electoral · capa multiplataforma META + TIKTOK
// Se carga después de app.js y dropbox-integration.js.

(function(){
  'use strict';

  // ------------------------------------------------------------
  // Estado / utilidades
  // ------------------------------------------------------------
  if(!small.filters) small.filters={};
  if(small.filters.platform===undefined) small.filters.platform='';

  const MP={version:'1.0.0',localTikTokName:'',lastImport:null};

  function mpNum(v){
    if(v===null||v===undefined||v==='') return 0;
    if(typeof v==='number') return Number.isFinite(v)?v:0;
    const s=String(v).trim().toUpperCase().replace(/,/g,'');
    const m=s.match(/(-?\d+(?:\.\d+)?)\s*([KMB])?/);
    if(!m) return 0;
    const n=Number(m[1]);
    const f={K:1e3,M:1e6,B:1e9}[m[2]]||1;
    return Number.isFinite(n)?Math.round(n*f):0;
  }

  function mpFirst(o,...keys){
    for(const k of keys){
      const v=o?.[k];
      if(v!==undefined&&v!==null&&String(v).trim()!=='') return v;
    }
    return '';
  }

  function mpVideoId(url){
    const m=String(url||'').match(/\/video\/(\d+)/i);
    return m?m[1]:'';
  }

  function mpSource(a){
    const explicit=String(mpFirst(a,'PLATAFORMA_FUENTE','FUENTE','ORIGEN_PLATAFORMA')||'').toUpperCase();
    if(explicit.includes('TIKTOK')) return 'TIKTOK';
    if(explicit.includes('META')) return 'META';
    const link=String(mpFirst(a,'LINK DEL POST','LINK_PUBLICACION','LINK PUBLICACIÓN','LINK')||'').toLowerCase();
    if(link.includes('tiktok.com')) return 'TIKTOK';
    return 'META';
  }

  function mpNormalizeMeta(r){
    return {...r,PLATAFORMA_FUENTE:'META',FUENTE:'META',TIPO_REGISTRO:'ANUNCIO_META'};
  }

  function mpNormalizeTikTok(r){
    const link=String(mpFirst(r,'LINK DEL POST','LINK_POST','LINK_PUBLICACION','LINK PUBLICACIÓN')||'').trim();
    const perfil=String(mpFirst(r,'LINK DEL PERFIL','LINK_PERFIL')||'').trim();
    const candidato=String(mpFirst(r,'CANDIDATO POLITICO - NOMBRES Y APELLIDOS COMPLETOS','CANDIDATO','NOMBRE1')||'').trim();
    const partido=String(mpFirst(r,'PARTIDO POLITICO','PARTIDO')||'').trim();
    const fecha=String(mpFirst(r,'FECHA PUBLICACION','FECHA_PUBLICACION','FECHA')||'').trim();
    const desc=String(mpFirst(r,'DESCRIPCION_POST','DESCRIPCIÓN','DESCRIPCION')||'').trim();
    const videoId=mpVideoId(link) || String(mpFirst(r,'ID_TIKTOK','ID')||'').trim();
    const id='TT_'+(videoId||btoa(unescape(encodeURIComponent(link||candidato||Date.now()))).replace(/[^a-z0-9]/gi,'').slice(0,28));
    const vistas=mpNum(mpFirst(r,'VISTAS','IMPRESIONES'));
    const likes=mpNum(mpFirst(r,'LIKES'));
    const comentarios=mpNum(mpFirst(r,'COMENTARIOS'));
    const compartidos=mpNum(mpFirst(r,'COMPARTIDOS'));
    const interacciones=mpNum(mpFirst(r,'INTERACCIONES')) || likes+comentarios+compartidos;
    return {
      ...r,
      PLATAFORMA_FUENTE:'TIKTOK',
      FUENTE:'TIKTOK',
      TIPO_REGISTRO:'PUBLICACION_TIKTOK',
      PARTIDO:partido||'SIN PARTIDO',
      CANDIDATO:candidato||partido||'SIN CANDIDATO',
      NOMBRE_EN_PAGINA:String(mpFirst(r,'NOMBRE1','NOMBRE EN LA PAGINA')||candidato||partido||'').trim(),
      'IDENTIFICADOR DE LA BIBLIOTECA':id,
      ID_TIKTOK:videoId,
      FECHA_INICIO:fecha,
      FECHA_FIN:fecha,
      PLATAFORMAS:'TikTok',
      PAGADO_POR:'—',
      GASTO:'—',
      IMPRESIONES:vistas?String(vistas):'—',
      'DESCRIPCIÓN':desc,
      LINK_PUBLICACION:link,
      LINK_PERFIL_TIKTOK:perfil,
      VISTAS:vistas,
      LIKES:likes,
      COMENTARIOS:comentarios,
      COMPARTIDOS:compartidos,
      INTERACCIONES:interacciones,
      PROSELITISMO:mpFirst(r,'POSIBLE_PROSELITISMO_BOT','PROSELITISMO_DETECTADO','PROPAGANDA ELECTORAL'),
      NIVEL_PROSELITISMO:mpFirst(r,'NIVEL_PROSELITISMO'),
      FRASES_DETECTADAS:mpFirst(r,'FRASES_DETECTADAS'),
      TRANSCRIPCION:mpFirst(r,'TRANSCRIPCION'),
      TEXTO_OCR:mpFirst(r,'TEXTO_OCR'),
      FUENTE_METADATA:mpFirst(r,'FUENTE_METADATA'),
      ESTADO_ACCESO_TIKTOK:mpFirst(r,'ESTADO_ACCESO_TIKTOK')
    };
  }

  function mpNormalizeRows(rows,sourceHint=''){
    return (Array.isArray(rows)?rows:[]).map(r=>{
      const s=String(sourceHint||mpSource(r)).toUpperCase();
      return s==='TIKTOK'?mpNormalizeTikTok(r):mpNormalizeMeta(r);
    });
  }

  async function mpReadXlsxFile(file){
    if(typeof XLSX==='undefined') throw new Error('Librería XLSX no cargada.');
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array',cellDates:false});
    const preferred=['PUBLICACIONES','BASE_TIKTOK','TIKTOK','Sheet1'];
    const name=preferred.find(n=>wb.SheetNames.includes(n)) || wb.SheetNames[0];
    if(!name) return [];
    return XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});
  }

  async function mpReadDropboxData(root,path,source){
    const url='/api/dropbox-file?path='+encodeURIComponent(root+'/'+path);
    const r=await fetch(url);
    if(!r.ok) throw new Error(await r.text());
    if(/\.xlsx?$/i.test(path)){
      if(typeof XLSX==='undefined') throw new Error('Librería XLSX no cargada.');
      const buf=await r.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const preferred=source==='TIKTOK'?['PUBLICACIONES','BASE_TIKTOK','TIKTOK']:['ANUNCIOS','Sheet1'];
      const name=preferred.find(n=>wb.SheetNames.includes(n))||wb.SheetNames[0];
      return XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});
    }
    const data=await r.json();
    if(Array.isArray(data)) return data;
    if(Array.isArray(data?.data)) return data.data;
    if(Array.isArray(data?.records)) return data.records;
    return [];
  }

  function mpMergeIntoRuntime(rows,name,append=true){
    const existing=append && Array.isArray(runtime.ads)?runtime.ads:[];
    const byId=new Map();
    [...existing,...rows].forEach(a=>{
      const id=String(mpFirst(a,'IDENTIFICADOR DE LA BIBLIOTECA','ID_BIBLIOTECA','ID Biblioteca')||'').trim();
      const key=id||String(mpFirst(a,'LINK_PUBLICACION','LINK DEL POST')||Math.random());
      byId.set(key,a);
    });
    runtime.ads=[...byId.values()];
    runtime.packageMode=append&&existing.length?'MULTIPLATAFORMA':'LOCAL';
    runtime.packageName=name||'Importación multiplataforma';
    runtime.reviewIndex=0;
    small.page='resumen';
    audit('IMPORTACION_MULTIPLATAFORMA',`${name||'archivo'} · ${rows.length} registros`);
    render();
  }

  // ------------------------------------------------------------
  // Filtro plataforma sin romper filtros existentes
  // ------------------------------------------------------------
  const _mpVisibleAds=visibleAds;
  visibleAds=function(){
    const rows=_mpVisibleAds();
    const pf=String(small.filters.platform||'').toUpperCase();
    if(!pf) return rows;
    return rows.filter(a=>mpSource(a)===pf);
  };

  // ------------------------------------------------------------
  // Importación local de Excel TikTok
  // ------------------------------------------------------------
  async function mpImportTikTokLocal(file){
    try{
      const raw=await mpReadXlsxFile(file);
      const rows=mpNormalizeRows(raw,'TIKTOK');
      if(!rows.length) throw new Error('El Excel no contiene publicaciones.');
      MP.localTikTokName=file.name;
      mpMergeIntoRuntime(rows,file.name,true);
      toast(`TikTok cargado: ${fmt(rows.length)} publicaciones`,'ok');
    }catch(e){
      toast('No pude leer el Excel TikTok: '+(e.message||e),'warn');
    }
  }

  // ------------------------------------------------------------
  // Dropbox: aceptar META, TIKTOK o ambos en la misma corrida
  // ------------------------------------------------------------
  dbRunId=function(){return 'RUN_'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14)};

  dbUploadFiles=async function(items,name){
    if(!runtime.cloud.ok){dbToast('Dropbox todavía no está configurado en Cloudflare.','warn');return}
    if(runtime.cloud.uploading)return;
    runtime.cloud.uploading=true;
    const id=dbRunId(),root='PRIMERA_ENTREGA/'+id,total=items.length;
    let metaPath='',ttPath='',evPath='',done=0;
    try{
      for(const it of items){
        let rel=dbClean(it.rel||it.file.webkitRelativePath||it.file.name);
        const seg=rel.split('/');if(seg.length>1)rel=seg.slice(1).join('/');
        if(/ANUNCIOS_WEB\.json$/i.test(rel))metaPath=rel;
        if(/(CONSOLIDADO_TIKTOK.*\.xlsx|PUBLICACIONES_TIKTOK\.json|WEB_IMPORT\.json)$/i.test(rel))ttPath=rel;
        if(/EVIDENCIAS_WEB\.json$/i.test(rel))evPath=rel;
        setProgress(Math.round(done/Math.max(total,1)*100),`Dropbox: ${rel}`);
        await dbUploadOne(it.file,root+'/'+rel);done++;
      }
      if(!metaPath&&!ttPath) throw new Error('No encontré ANUNCIOS_WEB.json ni un consolidado TikTok compatible.');
      setProgress(96,'Registrando corrida en Dropbox…');
      let metaCount=0,ttCount=0;
      if(metaPath){try{metaCount=(await mpReadDropboxData(root,metaPath,'META')).length}catch{}}
      if(ttPath){try{ttCount=(await mpReadDropboxData(root,ttPath,'TIKTOK')).length}catch{}}
      const source=metaPath&&ttPath?'META+TIKTOK':ttPath?'TIKTOK':'META';
      let idx=await dbGetIndex();
      idx.unshift({
        id,name:name||id,root,source,
        ads:metaCount+ttCount,metaCount,ttCount,files:total,
        adsPath:metaPath||ttPath,metaPath,ttPath,evPath,
        created_at:new Date().toLocaleString('es-PE')
      });
      await dbPutIndex(idx);runtime.cloud.runs=idx;
      setProgress(100,'Subida terminada');
      audit('DROPBOX_SUBIDA',`${source} · ${name} · ${total} archivos`);
      dbToast(`Evidencia ${source} subida correctamente a Dropbox`);
      setTimeout(render,350);
    }catch(e){
      dbToast('Error al subir a Dropbox: '+(e.message||e),'warn');
      setProgress(0,'Error de subida');
    }finally{runtime.cloud.uploading=false}
  };

  dbOpenRun=async function(r){
    try{
      let rows=[];
      const metaPath=r.metaPath || (r.source==='META'?r.adsPath:'');
      const ttPath=r.ttPath || (r.source==='TIKTOK'?r.adsPath:'');
      if(metaPath){
        const m=await mpReadDropboxData(r.root,metaPath,'META');
        rows.push(...mpNormalizeRows(m,'META'));
      }
      if(ttPath){
        const t=await mpReadDropboxData(r.root,ttPath,'TIKTOK');
        rows.push(...mpNormalizeRows(t,'TIKTOK'));
      }
      // Compatibilidad con corridas antiguas que solo tenían adsPath.
      if(!rows.length && r.adsPath){
        const raw=await mpReadDropboxData(r.root,r.adsPath,r.source||'META');
        rows=mpNormalizeRows(raw,r.source||'META');
      }
      runtime.ads=rows;
      runtime.evidence=[];
      if(r.evPath){
        const e=await fetch('/api/dropbox-file?path='+encodeURIComponent(r.root+'/'+r.evPath));
        runtime.evidence=await e.json();
      }
      runtime.packageMode='DROPBOX';runtime.packageName=r.name;runtime.cloud.run=r;runtime.reviewIndex=0;
      small.page='revision';audit('DROPBOX_CORRIDA_ABIERTA',`${r.source||'META'} · ${r.name}`);
      dbToast(`Corrida ${r.source||''} abierta desde Dropbox`);render();
    }catch(e){dbToast('No pude abrir la corrida: '+(e.message||e),'warn')}
  };

  // ------------------------------------------------------------
  // UI: rebranding + filtro + importador TikTok + resumen tesis
  // ------------------------------------------------------------
  function mpAddPlatformFilter(){
    const actions=document.querySelector('.topActions');
    if(!actions||document.getElementById('platformFilter'))return;
    const select=document.createElement('select');
    select.id='platformFilter';select.className='input mpPlatform';
    select.innerHTML=`<option value="">Todas</option><option value="META">Meta</option><option value="TIKTOK">TikTok</option>`;
    select.value=small.filters.platform||'';
    select.onchange=()=>{small.filters.platform=select.value;saveSmall();runtime.reviewIndex=0;render()};
    actions.insertBefore(select,actions.firstChild);
  }

  function mpAddTikTokImport(){
    if(small.page!=='cargas'||document.getElementById('mpTikTokImport'))return;
    const options=document.querySelector('.uploadOptions');
    if(!options)return;
    const card=document.createElement('article');
    card.className='uploadOption';card.id='mpTikTokImport';
    card.innerHTML=`<p class="kicker">TIKTOK</p><h3>Importar consolidado TikTok</h3><p>Lee CON­SOLIDADO_TIKTOK.xlsx y lo suma a la evidencia Meta ya cargada, sin abrir ni subir videos.</p><input id="mpTikTokFile" hidden type="file" accept=".xlsx,.xls"><button class="primary" id="mpTikTokPick">Seleccionar Excel TikTok</button>`;
    options.appendChild(card);
    document.getElementById('mpTikTokPick').onclick=()=>document.getElementById('mpTikTokFile').click();
    document.getElementById('mpTikTokFile').onchange=e=>e.target.files?.[0]&&mpImportTikTokLocal(e.target.files[0]);
  }

  function mpAddSummary(){
    if(small.page!=='resumen'||document.getElementById('mpSummary'))return;
    const content=document.querySelector('.content section');
    if(!content)return;
    const all=runtime.ads||[];
    if(!all.length)return;
    const meta=all.filter(x=>mpSource(x)==='META');
    const tt=all.filter(x=>mpSource(x)==='TIKTOK');
    const ttViews=tt.reduce((a,x)=>a+mpNum(x.VISTAS||x.IMPRESIONES),0);
    const ttInt=tt.reduce((a,x)=>a+mpNum(x.INTERACCIONES),0);
    const pro=tt.filter(x=>String(x.PROSELITISMO||'').toUpperCase()==='SI').length;
    const box=document.createElement('section');box.className='panel mpPanel';box.id='mpSummary';
    box.innerHTML=`<div class="panelHead"><div><p class="kicker">RESUMEN MULTIPLATAFORMA</p><h2>Meta + TikTok</h2></div><span class="badge green">Tesis</span></div><div class="metrics mpMetrics"><article class="metric"><span>Meta</span><strong>${fmt(meta.length)}</strong><small>anuncios/registros</small></article><article class="metric"><span>TikTok</span><strong>${fmt(tt.length)}</strong><small>publicaciones</small></article><article class="metric"><span>Vistas TikTok</span><strong>${fmt(ttViews)}</strong><small>alcance observado</small></article><article class="metric"><span>Interacciones TikTok</span><strong>${fmt(ttInt)}</strong><small>likes + comentarios + compartidos</small></article><article class="metric"><span>Proselitismo alto</span><strong>${fmt(pro)}</strong><small>preclasificación del bot</small></article></div>`;
    const hero=content.querySelector('.hero');
    hero?.insertAdjacentElement('afterend',box);
  }

  function mpDecorate(){
    document.title='Radar Electoral · Meta + TikTok';
    document.querySelectorAll('.brand b').forEach(x=>{if(/Radar Meta/i.test(x.textContent))x.textContent='Radar Electoral'});
    document.querySelectorAll('.brand small').forEach(x=>{if(/Evidencia electoral|Observatorio/i.test(x.textContent))x.textContent='Meta + TikTok · Evidencia electoral'});
    document.querySelectorAll('.topbar b').forEach(x=>{if(/Monitoreo Meta/i.test(x.textContent))x.textContent=x.textContent.replace(/Monitoreo Meta/i,'Monitoreo Meta + TikTok')});
    mpAddPlatformFilter();
    mpAddTikTokImport();
    mpAddSummary();
  }

  const _mpRender=render;
  render=function(){_mpRender();setTimeout(mpDecorate,0)};

  // CSS complementario
  const st=document.createElement('style');
  st.textContent=`
    .mpPlatform{width:135px;min-width:135px;height:38px;background:#091624;color:#d9e6f4;border:1px solid #29435f;border-radius:10px;padding:0 10px}
    .mpPanel{margin:14px 0}.mpMetrics{grid-template-columns:repeat(5,minmax(0,1fr))!important}
    @media(max-width:1100px){.mpMetrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}.mpPlatform{width:110px;min-width:110px}}
  `;
  document.head.appendChild(st);

  if(small.session) setTimeout(()=>render(),0);
})();
