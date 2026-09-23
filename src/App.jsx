import React, { useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'

const PARTIDOS = [
  { id: 'podemos', nombre: 'PODEMOS PERÚ', total: 611, asignado: 'Analista 1' },
  { id: 'app', nombre: 'ALIANZA PARA EL PROGRESO', total: 394, asignado: 'Analista 2' },
  { id: 'rp', nombre: 'PARTIDO RENOVACIÓN POPULAR', total: 101, asignado: 'Analista 3' },
  { id: 'sp', nombre: 'PARTIDO DEMOCRÁTICO SOMOS PERÚ', total: 78, asignado: 'Analista 4' },
]

const DEMO_AD = {
  'PARTIDO': 'PODEMOS PERÚ',
  'CANDIDATO': 'JOSÉ LEÓN LUNA GÁLVEZ',
  'NOMBRE_EN_PAGINA': 'José Luna Gálvez',
  'IDENTIFICADOR DE LA BIBLIOTECA': '123456789012345',
  'FECHA_INICIO': '14/03/2026',
  'FECHA_FIN': '18/03/2026',
  'PAGADO_POR': 'Podemos Perú',
  'GASTO_MIN': 500,
  'GASTO_MAX': 699,
  'IMPRESIONES_MIN': 10000,
  'IMPRESIONES_MAX': 15000,
  'PLATAFORMAS': 'Facebook, Instagram',
  'DESCRIPCIÓN': 'Ejemplo de anuncio cargado para visualizar la ficha de revisión.',
  'LINK_PUBLICACION': 'https://www.facebook.com/ads/library/',
  'ESTADO_REVISION': 'PENDIENTE',
}

const NAV = [
  ['dashboard', 'Resumen'],
  ['cargas', 'Cargas'],
  ['asignaciones', 'Asignaciones'],
  ['revision', 'Revisión'],
  ['observados', 'Observados'],
  ['reportes', 'Reportes'],
  ['usuarios', 'Usuarios'],
  ['publico', 'Vista pública'],
]

const fmt = value => new Intl.NumberFormat('es-PE').format(Number(value || 0))

function Badge({ tone='neutral', children }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

function Metric({ label, value, helper }) {
  return <article className="metric">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{helper}</small>
  </article>
}

function Shell({ active, setActive, role, setRole, children }) {
  const visibleNav = NAV.filter(([id]) => role !== 'PUBLICO' || ['dashboard','publico'].includes(id))
  return <div className="appShell">
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">R</div>
        <div><b>Radar Meta</b><small>Evidencia electoral</small></div>
      </div>
      <nav>
        {visibleNav.map(([id,label]) => (
          <button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}>
            <span className="navDot"/>{label}
          </button>
        ))}
      </nav>
      <div className="scopeCard">
        <small>ALCANCE TESIS</small>
        <b>Primera Entrega</b>
        <span>4 partidos políticos</span>
      </div>
    </aside>
    <main>
      <header className="topbar">
        <div><span className="crumb">Proceso activo</span><b>Monitoreo Meta · Primera Entrega</b></div>
        <div className="topActions">
          <label className="roleSwitch">
            <span>Vista</span>
            <select value={role} onChange={e=>setRole(e.target.value)}>
              <option value="ADMIN">Administrador</option>
              <option value="ANALISTA">Analista</option>
              <option value="PUBLICO">Público</option>
            </select>
          </label>
          <div className="avatar">{role==='ADMIN'?'AD':role==='ANALISTA'?'AN':'PU'}</div>
        </div>
      </header>
      <div className="content">{children}</div>
    </main>
  </div>
}

function Dashboard({ anuncios, revisiones }) {
  const total = anuncios.length || 1184
  const validados = revisiones.filter(x=>x.estado==='VALIDADO').length
  const observados = revisiones.filter(x=>x.estado==='OBSERVADO').length
  const pendientes = anuncios.length ? Math.max(anuncios.length-validados-observados,0) : 1184
  return <>
    <div className="hero">
      <div>
        <p className="eyebrow">CENTRO DE REVISIÓN COLABORATIVA</p>
        <h1>Monitoreo de publicidad política en Meta</h1>
        <p className="sub">Carga la evidencia generada por el bot, reparte los partidos, revisa cada anuncio con sus imágenes o videos y consolida únicamente la propaganda electoral validada.</p>
      </div>
      <Badge tone="blue">Primera Entrega</Badge>
    </div>

    <div className="metrics">
      <Metric label="Anuncios detectados" value={fmt(total)} helper="Bruto recolectado por Meta" />
      <Metric label="Validados" value={fmt(validados)} helper="Clasificación humana confirmada" />
      <Metric label="Pendientes" value={fmt(pendientes)} helper="Aún sin revisar" />
      <Metric label="Observados" value={fmt(observados)} helper="Requieren segunda revisión" />
    </div>

    <section className="panel">
      <div className="panelHead"><div><span className="kicker">AVANCE</span><h2>Distribución por partido político</h2></div><Badge tone="green">4 partidos</Badge></div>
      <div className="partyGrid">
        {PARTIDOS.map(p => {
          const pct = Math.round((p.total/1184)*100)
          return <article className="partyCard" key={p.id}>
            <div className="partyTop"><div><small>{p.asignado}</small><b>{p.nombre}</b></div><strong>{p.total}</strong></div>
            <div className="bar"><span style={{width:`${pct}%`}}/></div>
            <div className="partyFoot"><span>{pct}% del total</span><span>Pendiente de validación</span></div>
          </article>
        })}
      </div>
    </section>

    <div className="grid2">
      <section className="panel">
        <div className="panelHead"><div><span className="kicker">FLUJO</span><h2>Cadena de trazabilidad</h2></div></div>
        <div className="flow">
          {['Bot local','Paquete web','Analista','Administrador','Consolidado'].map((x,i)=><React.Fragment key={x}><div>{x}</div>{i<4&&<span>→</span>}</React.Fragment>)}
        </div>
      </section>
      <section className="panel">
        <div className="panelHead"><div><span className="kicker">CRITERIO</span><h2>Separación del gasto</h2></div></div>
        <div className="splitStats">
          <div><span>Gasto bruto Meta</span><strong>Todo lo detectado</strong></div>
          <div><span>Gasto electoral validado</span><strong>Directa + indirecta</strong></div>
        </div>
      </section>
    </div>
  </>
}

function Cargas({ onImport, importInfo }) {
  const input = useRef(null)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')

  async function readZip(file){
    setBusy(true); setError('')
    try{
      const zip = await JSZip.loadAsync(file)
      const names = Object.keys(zip.files)
      const adPath = names.find(n=>n.endsWith('ANUNCIOS_WEB.json'))
      const evPath = names.find(n=>n.endsWith('EVIDENCIAS_WEB.json'))
      if(!adPath) throw new Error('No encontré DATA/ANUNCIOS_WEB.json dentro del ZIP.')
      const anuncios = JSON.parse(await zip.file(adPath).async('string'))
      const evidencias = evPath ? JSON.parse(await zip.file(evPath).async('string')) : []
      onImport({ anuncios, evidencias, fileName:file.name, fileCount:names.filter(n=>!zip.files[n].dir).length })
    }catch(e){ setError(e.message || String(e)) } finally { setBusy(false) }
  }

  return <section className="page">
    <div className="hero"><div><p className="eyebrow">IMPORTADOR</p><h1>Cargar corrida del bot</h1><p className="sub">Sube directamente el <b>PAQUETE_WEB_META_ADS_....zip</b>. La web leerá los JSON de anuncios y evidencias sin alterar tu copia local.</p></div></div>
    <div className="uploadBox" onClick={()=>input.current?.click()}>
      <input ref={input} hidden type="file" accept=".zip" onChange={e=>e.target.files?.[0]&&readZip(e.target.files[0])}/>
      <div className="uploadIcon">⇧</div>
      <h2>{busy?'Leyendo paquete...':'Arrastra o selecciona tu ZIP'}</h2>
      <p>ANUNCIOS_WEB.json · EVIDENCIAS_WEB.json · imágenes · videos · HTML · metadata</p>
      <button className="primary" disabled={busy}>{busy?'Procesando...':'Seleccionar paquete'}</button>
    </div>
    {error&&<div className="alert error"><b>No se pudo importar</b><span>{error}</span></div>}
    {importInfo&&<div className="alert success"><b>Paquete reconocido</b><span>{importInfo.fileName} · {fmt(importInfo.anuncios)} anuncios · {fmt(importInfo.evidencias)} evidencias · {fmt(importInfo.fileCount)} archivos en el ZIP</span></div>}
  </section>
}

function Asignaciones() {
  return <section className="page">
    <div className="hero"><div><p className="eyebrow">DISTRIBUCIÓN DE TRABAJO</p><h1>Asignaciones por partido</h1><p className="sub">Tú decides quién revisa cada bloque. Más adelante podremos subdividir un partido por candidato o cuenta.</p></div><button className="primary">Guardar asignaciones</button></div>
    <section className="panel tableWrap">
      <table><thead><tr><th>Partido</th><th>Anuncios</th><th>Responsable</th><th>Estado</th><th>Avance</th></tr></thead>
      <tbody>{PARTIDOS.map((p,i)=><tr key={p.id}><td><b>{p.nombre}</b></td><td>{p.total}</td><td><select defaultValue={p.asignado}><option>Analista 1</option><option>Analista 2</option><option>Analista 3</option><option>Analista 4</option></select></td><td><Badge tone={i===0?'blue':'neutral'}>{i===0?'ASIGNADO':'PENDIENTE'}</Badge></td><td><div className="miniProgress"><span style={{width:i===0?'18%':'0%'}}/></div></td></tr>)}</tbody></table>
    </section>
  </section>
}

function EvidenceGallery({ ad }) {
  let items = []
  try {
    const raw = ad?.MULTIMEDIA_ITEMS_JSON
    items = Array.isArray(raw) ? raw : raw ? JSON.parse(raw) : []
  } catch {}
  if(!items.length) items = [{tipo:'IMAGEN',placeholder:true},{tipo:'IMAGEN',placeholder:true},{tipo:'VIDEO',placeholder:true}]
  return <div className="gallery">
    {items.slice(0,8).map((m,i)=><div className={`mediaCard ${m.tipo==='VIDEO'?'video':''}`} key={i}>
      {m.placeholder ? <><div className="mediaPlaceholder">{m.tipo==='VIDEO'?'▶':'▧'}</div><small>Evidencia {i+1}</small></> :
      <><div className="mediaPlaceholder">{m.tipo==='VIDEO'?'▶':'▧'}</div><small>{m.tipo} {i+1}</small><span>{m.archivo_local?'Archivo local':'URL registrada'}</span></>}
    </div>)}
  </div>
}

function Revision({ anuncios, onSave }) {
  const [index,setIndex] = useState(0)
  const [clasificacion,setClasificacion] = useState('PROPAGANDA_ELECTORAL_DIRECTA')
  const [mensaje,setMensaje] = useState('PROPUESTA')
  const [obs,setObs] = useState('')
  const list = anuncios.length ? anuncios : [DEMO_AD]
  const ad = list[index % list.length]

  const field = (label,...keys) => {
    const value = keys.map(k=>ad?.[k]).find(v=>v!==undefined&&v!==null&&String(v)!=='') ?? '—'
    return <div className="dataField"><span>{label}</span><b>{String(value)}</b></div>
  }

  function save(estado){
    onSave({
      id: ad['IDENTIFICADOR DE LA BIBLIOTECA'] || ad['ID_BIBLIOTECA'] || `${index}`,
      estado, clasificacion, mensaje, observacion:obs, fecha:new Date().toISOString()
    })
    setObs('')
    setIndex(i=>(i+1)%list.length)
  }

  return <section className="page">
    <div className="reviewHeader">
      <div><p className="eyebrow">FICHA DE REVISIÓN</p><h1>Anuncio {index+1} de {list.length}</h1></div>
      <div className="reviewNav"><button className="ghost" onClick={()=>setIndex(i=>Math.max(i-1,0))}>← Anterior</button><button className="ghost" onClick={()=>setIndex(i=>(i+1)%list.length)}>Siguiente →</button></div>
    </div>

    <div className="reviewLayout">
      <section className="panel">
        <div className="panelHead"><div><span className="kicker">DATOS EXTRAÍDOS DE META</span><h2>{ad.PARTIDO || 'Sin partido'}</h2></div><Badge tone="blue">{ad.ESTADO_REVISION || 'PENDIENTE'}</Badge></div>
        <div className="dataGrid">
          {field('Candidato','CANDIDATO','Candidato')}
          {field('Cuenta / página','NOMBRE_EN_PAGINA','Candidato')}
          {field('ID Biblioteca','IDENTIFICADOR DE LA BIBLIOTECA','ID_BIBLIOTECA','ID Biblioteca')}
          {field('Pagado por','PAGADO_POR','Pagado Por')}
          {field('Fecha inicio','FECHA_INICIO','Fecha-Min')}
          {field('Fecha fin','FECHA_FIN','Fecha-Max')}
          {field('Plataformas','PLATAFORMAS')}
          {field('Gasto','GASTO','Gasto')}
          {field('Gasto mínimo','GASTO_MIN','Min')}
          {field('Gasto máximo','GASTO_MAX','Max')}
          {field('Impresiones mín.','IMPRESIONES_MIN')}
          {field('Impresiones máx.','IMPRESIONES_MAX')}
        </div>
        <div className="description"><span>Texto / descripción</span><p>{ad['DESCRIPCIÓN'] || ad.DESCRIPCION || 'Sin descripción extraída.'}</p></div>
        <a className="metaLink" href={ad.LINK_PUBLICACION || ad['Link Publicación'] || '#'} target="_blank" rel="noreferrer">Abrir anuncio original en Meta ↗</a>
      </section>

      <section className="panel evidencePanel">
        <div className="panelHead"><div><span className="kicker">EVIDENCIA VISUAL</span><h2>Imágenes y videos</h2></div><Badge tone="green">{ad.TOTAL_MULTIMEDIA_EVIDENCIA || 'Galería'}</Badge></div>
        <EvidenceGallery ad={ad}/>
        <div className="evidenceHint">En producción, estas tarjetas mostrarán directamente los archivos del paquete almacenados en el repositorio de evidencias.</div>
      </section>
    </div>

    <section className="panel classifyPanel">
      <div className="panelHead"><div><span className="kicker">CLASIFICACIÓN HUMANA</span><h2>¿Qué contiene realmente este anuncio?</h2></div></div>
      <div className="classifyGrid">
        <label><span>Clasificación principal</span><select value={clasificacion} onChange={e=>setClasificacion(e.target.value)}>
          <option value="PROPAGANDA_ELECTORAL_DIRECTA">Propaganda electoral directa</option>
          <option value="PROPAGANDA_ELECTORAL_INDIRECTA">Propaganda electoral indirecta</option>
          <option value="PUBLICIDAD_POLITICA_NO_ELECTORAL">Publicidad política no electoral</option>
          <option value="INSTITUCIONAL_PARTIDARIA">Contenido institucional / partidario</option>
          <option value="PERSONAL">Contenido personal</option>
          <option value="INFORMATIVO">Contenido informativo</option>
          <option value="NO_CORRESPONDE">No corresponde</option>
          <option value="REQUIERE_REVISION">Requiere revisión</option>
        </select></label>
        <label><span>Tipo de mensaje</span><select value={mensaje} onChange={e=>setMensaje(e.target.value)}>
          <option>PROPUESTA</option><option>IMAGEN_PERSONAL</option><option>EVENTO</option><option>GESTION</option><option>ATAQUE_CONTRASTE</option><option>SALUDO_EFEMERIDE</option><option>POSICIONAMIENTO</option><option>OTRO</option>
        </select></label>
        <label className="wide"><span>Observación del analista</span><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Describe por qué se clasifica así o qué debe revisar el administrador."/></label>
      </div>
      <div className="reviewActions"><button className="successBtn" onClick={()=>save('VALIDADO')}>✓ Validar</button><button className="warnBtn" onClick={()=>save('OBSERVADO')}>⚠ Observar</button><button className="ghost" onClick={()=>setIndex(i=>(i+1)%list.length)}>Omitir por ahora</button></div>
    </section>
  </section>
}

function Observados({ revisiones }) {
  const list = revisiones.filter(x=>x.estado==='OBSERVADO')
  return <section className="page"><div className="hero"><div><p className="eyebrow">SEGUNDA REVISIÓN</p><h1>Observados</h1><p className="sub">Aquí se concentran los anuncios dudosos, enlaces rotos, pagadores ambiguos o casos que necesitan abrir Meta para confirmar el contenido.</p></div></div>
  <section className="panel tableWrap">{list.length?<table><thead><tr><th>ID</th><th>Clasificación</th><th>Tipo mensaje</th><th>Observación</th><th>Acción</th></tr></thead><tbody>{list.map(x=><tr key={x.id}><td>{x.id}</td><td>{x.clasificacion}</td><td>{x.mensaje}</td><td>{x.observacion||'—'}</td><td><button className="ghost">Revisar</button></td></tr>)}</tbody></table>:<div className="emptyState">Todavía no hay anuncios observados en esta sesión.</div>}</section></section>
}

function Reports({ anuncios, revisiones }) {
  const valid = revisiones.filter(x=>x.estado==='VALIDADO')
  return <section className="page"><div className="hero"><div><p className="eyebrow">SALIDA VALIDADA</p><h1>Reportes y consolidado</h1><p className="sub">El consolidado final distinguirá el bruto detectado por Meta de lo que el equipo confirmó realmente como propaganda electoral.</p></div><button className="primary">Descargar consolidado validado</button></div>
  <div className="metrics"><Metric label="Bruto Meta" value={fmt(anuncios.length||1184)} helper="Todo lo recolectado"/><Metric label="Validados" value={fmt(valid.length)} helper="Revisión humana"/><Metric label="Propaganda directa" value={fmt(valid.filter(x=>x.clasificacion==='PROPAGANDA_ELECTORAL_DIRECTA').length)} helper="Clasificación confirmada"/><Metric label="Propaganda indirecta" value={fmt(valid.filter(x=>x.clasificacion==='PROPAGANDA_ELECTORAL_INDIRECTA').length)} helper="Clasificación confirmada"/></div>
  <section className="panel"><div className="panelHead"><div><span className="kicker">INDICADORES</span><h2>Gráficos previstos</h2></div></div><div className="chartPlaceholder"><div>Por partido</div><div>Por candidato</div><div>Por tipo de contenido</div><div>Gasto bruto vs. electoral</div><div>Evolución temporal</div></div></section></section>
}

function Usuarios() {
  return <section className="page"><div className="hero"><div><p className="eyebrow">CONTROL DE ACCESO</p><h1>Usuarios y roles</h1><p className="sub">Administrador, analistas/recolectores y público tendrán permisos diferentes. Esta pantalla se conectará a Supabase Auth + RLS.</p></div><button className="primary">+ Usuario</button></div>
  <section className="panel tableWrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Alcance</th><th>Estado</th></tr></thead><tbody><tr><td>Administrador</td><td><Badge tone="blue">ADMIN</Badge></td><td>Todo el sistema</td><td><Badge tone="green">ACTIVO</Badge></td></tr><tr><td>Analista 1</td><td><Badge>ANALISTA</Badge></td><td>Partidos asignados</td><td><Badge tone="green">ACTIVO</Badge></td></tr><tr><td>Público</td><td><Badge>LECTURA</Badge></td><td>Solo datos publicados</td><td><Badge tone="green">ACTIVO</Badge></td></tr></tbody></table></section></section>
}

function PublicView() {
  return <section className="page publicView"><div className="hero"><div><p className="eyebrow">OBSERVATORIO PÚBLICO</p><h1>Publicidad política monitoreada</h1><p className="sub">Esta vista mostrará solamente información aprobada por el administrador. No incluye controles de edición ni observaciones internas.</p></div></div>
  <div className="metrics"><Metric label="Partidos analizados" value="4" helper="Alcance de la investigación"/><Metric label="Anuncios detectados" value="1,184" helper="Primera Entrega"/><Metric label="Periodo" value="2026" helper="Proceso analizado"/><Metric label="Fuente" value="Meta" helper="Biblioteca de anuncios"/></div>
  <section className="panel"><div className="panelHead"><div><span className="kicker">TRANSPARENCIA</span><h2>Comparación por partido</h2></div></div><div className="publicBars">{PARTIDOS.map(p=><div key={p.id}><div><b>{p.nombre}</b><span>{p.total} anuncios</span></div><div className="bar"><span style={{width:`${(p.total/611)*100}%`}}/></div></div>)}</div></section></section>
}

export default function App(){
  const [active,setActive]=useState('dashboard')
  const [role,setRole]=useState('ADMIN')
  const [anuncios,setAnuncios]=useState([])
  const [evidencias,setEvidencias]=useState([])
  const [importInfo,setImportInfo]=useState(null)
  const [revisiones,setRevisiones]=useState([])

  const pages = useMemo(()=>({
    dashboard:<Dashboard anuncios={anuncios} revisiones={revisiones}/>,
    cargas:<Cargas onImport={({anuncios:a,evidencias:e,...info})=>{setAnuncios(a);setEvidencias(e);setImportInfo({...info,anuncios:a.length,evidencias:e.length})}} importInfo={importInfo}/>,
    asignaciones:<Asignaciones/>,
    revision:<Revision anuncios={anuncios} onSave={r=>setRevisiones(prev=>[...prev.filter(x=>x.id!==r.id),r])}/>,
    observados:<Observados revisiones={revisiones}/>,
    reportes:<Reports anuncios={anuncios} revisiones={revisiones}/>,
    usuarios:<Usuarios/>,
    publico:<PublicView/>,
  }),[anuncios,evidencias,importInfo,revisiones])

  return <Shell active={active} setActive={setActive} role={role} setRole={setRole}>{pages[active]}</Shell>
}
