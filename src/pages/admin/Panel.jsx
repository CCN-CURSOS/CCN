import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icons'
import { recontactoVencido } from '../../lib/ventas'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Layout.jsx'
import Certificados from '../Certificados'
import { Cronograma } from '../Academico.jsx'
import { hasBackend, loadAll, save, marcarConsulta, crearInscripcion, agregarPago } from '../../lib/data.js'
import { Agenda } from './Agenda.jsx'
import { Contratos, Firmar, PlanTrabajo, armarTrabajadores } from './Contratos.jsx'
import { Accesos, CursosGerencia, Equipo, Horas, Resumen } from './Gerencia.jsx'
import { InscripcionForm, Inscritos, PagoForm } from './Inscritos.jsx'
import { Instalaciones } from './Instalaciones.jsx'
import { MiAvance, Trabajadores } from './Personal.jsx'
import { Consultas, Interesados, ManualVentas, Prospectos } from './Prospectos.jsx'
import { Quejas } from './Quejas.jsx'
import { Ajustes, Cursos, Enlaces, GrupoForm, Grupos } from './Web.jsx'

/* ================= PANEL (módulos) ================= */
export const MODULOS = {
  ventas: { nombre: 'Ventas', icono: 'ventas', secciones: [['mi', 'Mi avance'], ['agenda', 'Agenda'], ['firmar', 'Firmar'], ['plan', 'Plan de trabajo'], ['interesados', 'Interesados'], ['prospectos', 'Prospectos'], ['manual', 'Manual de ventas'], ['inscritos', 'Inscritos'], ['quejas', 'Quejas y reclamos'], ['consultas', 'Consultas'], ['grupos', 'Grupos'], ['instalaciones', 'Instalaciones']] },
  web: { nombre: 'Web', icono: 'web', secciones: [['cursos', 'Cursos'], ['grupos', 'Horarios'], ['enlaces', 'Enlaces'], ['ajustes', 'Ajustes']] },
  gerencia: { nombre: 'Gerencia', icono: 'gerencia', secciones: [['resumen', 'Resumen'], ['fichas', 'Cursos'], ['trabajadores', 'Trabajadores'], ['contratos', 'Contratos'], ['horas', 'Horas trabajadas'], ['accesos', 'Accesos'], ['equipo', 'Equipo']] },
  academico: { nombre: 'Académico', icono: 'academico', secciones: [['grupos', 'Grupos'], ['cronograma', 'Cronograma y accesos'], ['certificados', 'Certificados']] },
}

export const POR_ROL = { gerente: ['gerencia', 'ventas', 'web', 'academico'], vendedora: ['ventas'], asistente: ['academico'] }

export const ETIQUETA_ROL = { gerente: 'Gerente', vendedora: 'Vendedora', asistente: 'Asistente académico' }

export function Panel({ email, rol, coordina, onSalir }) {
  const gerente = rol === 'gerente'
  const modulos = [...(POR_ROL[rol] || []), ...(coordina && rol === 'vendedora' ? ['academico'] : [])]
  const [modulo, setModulo] = useState(gerente ? 'gerencia' : (modulos[0] || 'ventas'))
  const [tab, setTab] = useState(gerente ? 'resumen' : (modulos[0] === 'academico' ? 'grupos' : 'mi'))
  const [data, setData] = useState({ cursos: [], grupos: [], enlaces: [], consultas: [], interesados: [], alumnos: [], matriculas: [], pagos: [], historial: [], prospectos: [], pendientes: [], notas_agenda: [], plantillas: [], documentos: [], quejas: [], trabajadores: [], instalaciones: [], gruposWa: [], asignaciones: [], pagos_trabajador: [], equipo: [], ajustes: {} })
  const [grupoForm, setGrupoForm] = useState(null)
  const [inscForm, setInscForm] = useState(null)
  const [pagoForm, setPagoForm] = useState(null)
  const [protoInicial, setProtoInicial] = useState(null)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const avisar = (texto, error) => {
    clearTimeout(timer.current)
    setToast({ texto, error })
    timer.current = setTimeout(() => setToast(null), 2600)
  }
  const recargar = () => loadAll().then(setData)
  useEffect(() => { recargar().catch((e) => avisar(e.message, true)) }, [])

  /* ejecuta un cambio, recarga y avisa */
  const hacer = async (fn, ok) => {
    try { await fn(); await recargar(); avisar(ok) } catch (e) { avisar(e.message || 'No se pudo guardar', true) }
  }
  const ir = (m, t) => { setModulo(m); setTab(t || MODULOS[m].secciones.find(([k]) => !['mi', 'agenda', 'firmar', 'plan'].includes(k) || !gerente)[0]) }
  const abrirGrupo = (cursoId) => setGrupoForm({ curso_id: cursoId })
  const abiertos = data.grupos.filter((g) => g.estado === 'abierto' && g.activo).length
  const nInscritos = new Set(data.matriculas.filter((m) => m.estado === 'activa').map((m) => m.paquete_id)).size
  const nuevosInt = (data.interesados || []).filter((x) => x.estado === 'nuevo').length
  const nProsp = (data.prospectos || []).filter((x) => !['inscrito', 'perdido'].includes(x.estado)).length
  const nuevosCon = (data.consultas || []).filter((x) => x.estado === 'nuevo').length
  const cuenta = { quejas: (data.quejas || []).filter((q) => q.estado === 'nueva').length, firmar: (data.documentos || []).filter((d) => d.vendedor === email && d.estado === 'enviado').length, agenda: (data.pendientes || []).filter((x) => x.vendedor === email && x.estado === 'pendiente').length + (data.prospectos || []).filter((p) => recontactoVencido(p)).length, prospectos: nProsp, inscritos: nInscritos, interesados: nuevosInt, consultas: nuevosCon, grupos: abiertos, certificados: (data.certificados || []).filter((c) => c.estado === 'vigente').length, cursos: data.cursos.length, enlaces: (data.enlaces || []).length, equipo: (data.equipo || []).length, trabajadores: armarTrabajadores(data).length, instalaciones: (data.instalaciones || []).filter((x) => x.estado === 'agendada' && x.fecha >= new Date().toISOString().slice(0, 10)).length }
  const nombreSec = (m, k, n) => n
  const verSecciones = MODULOS[modulo].secciones.filter(([k]) => !['mi', 'agenda', 'firmar', 'plan'].includes(k) || !gerente)

  /* Pasar un interesado a inscrito: carga sus datos y el grupo de su curso */
  const inscribirDesde = (x) => {
    const g = data.grupos.find((y) => String(y.curso_id) === String(x.curso_id) && y.estado !== 'cerrado') || null
    setInscForm({ grupo_id: g?.id || '', interesado: x, alumno: { tipo_doc: x.tipo_doc, documento: x.documento, nombres: x.nombres, apellido_paterno: x.apellido_paterno, apellido_materno: x.apellido_materno, email: x.email, celular: x.celular } })
  }

  return (
    <div className="shell">
      <aside className="side">
        <Link className="logo" to="/" aria-label="CCN"><Logo fijo="oscuro" /></Link>
        <small className="sidetag">{ETIQUETA_ROL[rol] || 'Panel'}</small>
        {modulos.length > 1 && (
          <div className="mods" role="tablist" aria-label="Módulos">
            {modulos.map((m) => (
              <button key={m} role="tab" aria-selected={modulo === m} onClick={() => ir(m)}><Icon n={MODULOS[m].icono} size={16} />{MODULOS[m].nombre}</button>
            ))}
          </div>
        )}
        <small className="sidetag modname">Módulo {MODULOS[modulo].nombre}</small>
        <div className="snav" role="tablist" aria-label="Secciones">
          {verSecciones.map(([k, nombre]) => {
            const n = cuenta[k]
            return (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {nombreSec(modulo, k, nombre)}{n !== undefined && <em>{n}</em>}
              </button>
            )
          })}
        </div>
        <div className="sidefoot">
          {email && <span>{email}</span>}
          <Link to="/">Ver la web ↗</Link>
          {hasBackend && <button onClick={onSalir}>Salir</button>}
        </div>
      </aside>

      <main className="main">
        {!hasBackend && (
          <p className="banner">Modo demostración: lo que cambies se guarda solo en este navegador. Para usarlo de verdad, conecta Supabase (mira el README).</p>
        )}
        {modulo === 'web' && tab === 'cursos' && <Cursos data={data} hacer={hacer} abrirGrupo={abrirGrupo} />}
        {tab === 'grupos' && <Grupos data={data} hacer={hacer} abrirGrupo={abrirGrupo} editarGrupo={setGrupoForm} soloLeer={modulo !== 'web' && modulo !== 'academico'} sinBorrar={!gerente} />}
        {modulo === 'web' && tab === 'enlaces' && <Enlaces data={data} hacer={hacer} />}
        {modulo === 'web' && tab === 'ajustes' && <Ajustes data={data} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'consultas' && <Consultas data={data} hacer={hacer} rolG={gerente} />}
        {modulo === 'ventas' && tab === 'interesados' && <Interesados data={data} hacer={hacer} onInscribir={inscribirDesde} gerente={gerente}
          onProspecto={(x) => { setProtoInicial({ nombres: `${x.nombres} ${x.apellido_paterno}`.trim(), celular: x.celular, curso: x.curso, origen: 'Web', estado: 'contactado', seguimiento: '', notas: '' }); setTab('prospectos') }} />}
        {modulo === 'ventas' && tab === 'prospectos' && <Prospectos data={data} hacer={hacer} gerente={gerente} inicial={protoInicial} onCerrarInicial={() => setProtoInicial(null)} email={email} />}
        {modulo === 'ventas' && tab === 'manual' && <ManualVentas data={data} email={email} />}
        {modulo === 'ventas' && tab === 'inscritos' && <Inscritos data={data} hacer={hacer} rol={rol} nuevaInscripcion={() => setInscForm({})} registrarPago={setPagoForm} />}
        {modulo === 'ventas' && tab === 'instalaciones' && <Instalaciones data={data} hacer={hacer} gerente={gerente} />}
        {modulo === 'ventas' && tab === 'quejas' && <Quejas data={data} hacer={hacer} gerente={gerente} email={email} />}
        {modulo === 'ventas' && tab === 'firmar' && !gerente && <Firmar data={data} email={email} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'plan' && !gerente && <PlanTrabajo data={data} email={email} />}
        {modulo === 'gerencia' && tab === 'contratos' && <Contratos data={data} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'agenda' && !gerente && <Agenda data={data} email={email} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'mi' && <MiAvance data={data} email={email} hacer={hacer} />}
        {modulo === 'gerencia' && tab === 'resumen' && <Resumen data={data} />}
        {modulo === 'gerencia' && tab === 'fichas' && <CursosGerencia data={data} hacer={hacer} abrirGrupo={abrirGrupo} editarGrupo={setGrupoForm} irWeb={() => ir('web', 'cursos')} />}
        {modulo === 'gerencia' && tab === 'trabajadores' && <Trabajadores data={data} hacer={hacer} />}
        {modulo === 'academico' && tab === 'cronograma' && <Cronograma data={data} hacer={hacer} avisar={avisar} />}
        {modulo === 'academico' && tab === 'certificados' && <Certificados data={data} hacer={hacer} gerente={gerente} />}
        {modulo === 'gerencia' && tab === 'horas' && <Horas data={data} hacer={hacer} />}
        {modulo === 'gerencia' && tab === 'accesos' && <Accesos data={data} hacer={hacer} />}
        {modulo === 'gerencia' && tab === 'equipo' && <Equipo data={data} hacer={hacer} email={email} />}
      </main>

      {grupoForm && (
        <GrupoForm inicial={grupoForm} cursos={data.cursos} onClose={() => setGrupoForm(null)}
          onSave={async (row) => { await save('grupos', row); setGrupoForm(null); await hacer(async () => {}, grupoForm.id ? 'Grupo guardado' : 'Grupo publicado'); if (modulo === 'web') setTab('grupos') }} />
      )}
      {inscForm && (
        <InscripcionForm inicial={inscForm} data={data} gerente={gerente} onClose={() => setInscForm(null)}
          onSave={async (datos) => {
            const codigo = await crearInscripcion(datos)
            if (inscForm.interesado && inscForm.interesado.estado === 'nuevo') await marcarConsulta(inscForm.interesado.id, 'atendida', 'interesados')
            setInscForm(null)
            await hacer(async () => {}, codigo ? `Inscripción registrada · alumno ${codigo}` : 'Inscripción registrada')
            ir('ventas', 'inscritos')
          }} />
      )}
      {pagoForm && (
        <PagoForm insc={pagoForm} onClose={() => setPagoForm(null)}
          onSave={async (datos) => { await agregarPago(datos); setPagoForm(null); await hacer(async () => {}, 'Pago registrado') }} />
      )}
      {toast && <div className={`toast ${toast.error ? 'bad' : ''}`} role="status">{toast.texto}</div>}
    </div>
  )
}
