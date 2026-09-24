// Ajustes de UX del Radar Electoral. Idempotente y sin envolver render().
(function(){
  'use strict';

  function setPageState(){
    try{
      document.body.dataset.page=(typeof state!=='undefined' && state.page)?state.page:'';
    }catch(_){ }
  }

  function decorateUploadCards(){
    document.querySelectorAll('.uploadCard').forEach(card=>{
      const txt=(card.textContent||'').toLowerCase();
      card.classList.remove('uploadRecommended','uploadZip','uploadTikTok');
      let label='Carga';
      if(txt.includes('carpeta')){card.classList.add('uploadRecommended');label='Recomendado'}
      else if(txt.includes('zip')){card.classList.add('uploadZip');label='Paquete'}
      else if(txt.includes('tiktok')||txt.includes('excel')){card.classList.add('uploadTikTok');label='TikTok'}
      let badge=card.querySelector('.uploadBadge');
      if(!badge){
        badge=document.createElement('span');
        badge.className='uploadBadge';
        const h=card.querySelector('h3');
        if(h) card.insertBefore(badge,h); else card.prepend(badge);
      }
      badge.textContent=label;
    });
  }

  function resetZipProgressIfNeeded(){
    const root=document.getElementById('toast-root');
    if(!root) return;
    const txt=(root.textContent||'').toLowerCase();
    if(txt.includes('zip demasiado grande')){
      try{ setProgress(0,'ZIP no procesado · usa “Seleccionar carpeta”'); }catch(_){ }
      const dz=document.getElementById('dropzone');
      if(dz){
        dz.classList.remove('drag');
        dz.innerHTML='<div class="uploadIcon">📁</div><h2>Este paquete es grande</h2><p>Usa <b>Seleccionar carpeta</b>. Es más estable y no carga todo el ZIP en memoria.</p>';
      }
    }
  }

  function polishCarga(){
    setPageState();
    if(typeof state==='undefined' || state.page!=='cargas') return;

    const p=document.getElementById('platformTop');
    if(p && !runtime.rows.length && state.filters.platform){
      state.filters.platform='';
      p.value='';
      try{ saveState(); }catch(_){ }
    }

    const cloud=document.querySelector('.cloudStatus');
    if(cloud && !runtime.cloud.ok){
      cloud.title='Puedes trabajar localmente. Dropbox se habilita al configurar Cloudflare.';
    }

    decorateUploadCards();
  }

  const toast=document.getElementById('toast-root');
  if(toast){
    new MutationObserver(resetZipProgressIfNeeded).observe(toast,{childList:true,subtree:true,characterData:true});
  }

  const app=document.getElementById('app');
  if(app){
    let queued=false;
    new MutationObserver(()=>{
      if(queued) return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        setPageState();
        polishCarga();
      });
    }).observe(app,{childList:true,subtree:true});
  }

  setPageState();
  setTimeout(polishCarga,0);
})();