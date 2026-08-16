import React, { useMemo, useState } from 'react'
import { supabaseConfigured } from './lib/supabase.js'

const nav = [
  ['dashboard', 'Resumen'],
  ['organizaciones', 'Organizaciones'],
  ['publicaciones', 'Publicaciones'],
  ['evidencias', 'Evidencias'],
  ['equipo', 'Equipo'],
  ['reportes', 'Reportes'],
  ['configuracion', 'Configuración'],
]

const emptyStats = [
  ['Publicaciones detectadas', 0],
  ['Revisadas', 0],
  ['Pendientes', 0],
  ['Observadas', 0],
]

function StatusBadge({ ok, children }) {
  return <span className={`status ${ok ? 'ok' : 'warn'}`}><span className="dot" />{children}</span>
}

function Dashboard() {
  return <>
    <div className="hero">
      <div>
        <p className="eyebrow">ERM 2026 · Fiscalización digital</p>
        <h1>Centro de control electoral</h1>
        <p className="sub">Seguimiento colaborativo de Facebook, Instagram y TikTok con trazabilidad por organización, candidato, analista y evidencia.</p>
      </div>
      <button className="primary">+ Registrar publicación</button>
    </div>

    <div className="stats">
      {emptyStats.map(([label, value]) => <article className="stat" key={label}><span>{label}</span><strong>{value}</strong><small>Esperando datos del proceso</small></article>)}
    </div>

    <div className="grid two">
      <section className="panel">
        <div className="panelHead"><div><span className="kicker">OPERACIÓN</span><h2>Avance por organización</h2></div><button className="ghost">Ver todas</button></div>
        <div className="empty"><div className="emptyIcon">◎</div><b>Aún no hay organizaciones cargadas</b><p>Al conectar Supabase aparecerán aquí los partidos y el avance de cada responsable.</p></div>
      </section>
      <section className="panel">
        <div className="panelHead"><div><span className="kicker">BANDEJA</span><h2>Actividad reciente</h2></div></div>
        <div className="empty"><div className="emptyIcon">↻</div><b>Sin movimientos todavía</b><p>Las revisiones, cambios de estado y nuevas evidencias quedarán registradas aquí.</p></div>
      </section>
    </div>

    <section className="panel connectionPanel">
      <div>
        <span className="kicker">INFRAESTRUCTURA</span>
        <h2>Estado de conexiones</h2>
      </div>
      <div className="connections">
        <div><b>Cloudflare Pages</b><StatusBadge ok>En línea</StatusBadge><small>Despliegue automático desde GitHub</small></div>
        <div><b>GitHub</b><StatusBadge ok>Conectado</StatusBadge><small>DiegoRod24/radar-electoral</small></div>
        <div><b>Supabase</b><StatusBadge ok={supabaseConfigured}>{supabaseConfigured ? 'Configurado' : 'Pendiente'}</StatusBadge><small>{supabaseConfigured ? 'Variables detectadas' : 'Faltan variables de entorno'}</small></div>
        <div><b>Dropbox</b><StatusBadge>Pendiente</StatusBadge><small>Se usará para evidencia pesada</small></div>
      </div>
    </section>
  </>
}

function GenericPage({ title, text, action }) {
  return <section className="panel pagePanel"><div className="panelHead"><div><span className="kicker">RADAR ELECTORAL</span><h1>{title}</h1><p>{text}</p></div>{action && <button className="primary">{action}</button>}</div><div className="empty tall"><div className="emptyIcon">▦</div><b>Módulo preparado</b><p>Se habilitará con los datos compartidos en Supabase.</p></div></section>
}

export default function App() {
  const [active, setActive] = useState('dashboard')
  const current = useMemo(() => ({
    dashboard: <Dashboard />,
    organizaciones: <GenericPage title="Organizaciones políticas" text="Partidos, alianzas, candidatos, cargos, territorios y cuentas sociales monitoreadas." action="+ Organización" />,
    publicaciones: <GenericPage title="Publicaciones" text="Bandeja única para revisar hallazgos de Facebook, Instagram y TikTok." action="+ Registrar publicación" />,
    evidencias: <GenericPage title="Evidencias" text="Capturas, videos, transcripciones y respaldo documental de cada publicación validada." />,
    equipo: <GenericPage title="Equipo y asignaciones" text="Responsables por organización, carga de trabajo, estados y trazabilidad de revisión." action="+ Usuario" />,
    reportes: <GenericPage title="Reportes y consolidado" text="Consolidado total ERM, resúmenes por partido, candidato, analista, plataforma y estado." action="Descargar consolidado" />,
    configuracion: <GenericPage title="Configuración" text="Catálogos: personal, cargos, tipo de actividad, tipo, plataformas y reglas del proceso." />,
  }), [])

  return <div className="appShell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">R</div><div><b>Radar Electoral</b><small>ERM 2026</small></div></div>
      <nav>{nav.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}><span className="navDot" />{label}</button>)}</nav>
      <div className="sideFoot"><small>Sistema de control</small><b>Fiscalización digital</b></div>
    </aside>
    <main>
      <header className="topbar"><div><span className="crumb">Proceso activo</span><b>ERM 2026</b></div><div className="topActions"><StatusBadge ok>Cloudflare en línea</StatusBadge><div className="avatar">AD</div></div></header>
      <div className="content">{current[active]}</div>
    </main>
  </div>
}
