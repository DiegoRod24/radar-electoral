// Ajustes de UX del Radar Electoral. Idempotente y sin envolver render().
(function(){
  'use strict';

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
    if(typeof state==='undefined' || state.page!=='cargas') return;

    // En Cargas, el filtro superior no debe confundir con el tipo de archivo a subir.
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
  }

  const toast=document.getElementById('toast-root');
  if(toast){
    new MutationObserver(resetZipProgressIfNeeded).observe(toast,{childList:true,subtree:true,characterData:true});
  }

  // Observamos solo cambios estructurales de la app para aplicar mejoras idempotentes.
  const app=document.getElementById('app');
  if(app){
    let queued=false;
    new MutationObserver(()=>{
      if(queued) return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;polishCarga();});
    }).observe(app,{childList:true,subtree:true});
  }

  setTimeout(polishCarga,0);
})();