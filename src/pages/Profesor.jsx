import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Layout.jsx'
import Icon from '../components/Icons'
import { hasBackend, cargarProfesor, cargarClasesGrupo, guardarClases, guardarAsistencias, historialAsistencia, fechaCorta } from '../lib/data.js'
import {
  DIAS_SEMANA, diasDeTexto, horaDeTexto, generarFechas, aTs, fechaClase, horaClase, fechaISOLima, horaHHMM, horasDeClase, ventana,
  ESTADOS_ASIS, ETIQ_ASIS, resumenAlumno,
} from '../lib/clases.js'

/* ================= piezas pequeñas ================= */
function Seccion({ titulo, ayuda, children }) {
  return (
    <div className="sechead">
      <div><h1>{titulo}</h1><p>{ayuda}</p></div>
      <div className="secact">{children}</div>
    </div>
  )
}

function Drawer({ titulo, onClose, children, pie, ancho }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="ovl" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={`drawer ${ancho ? 'ancho' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="dr-head"><h2>{titulo}</h2><button className="x" onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="dr-body">{children}</div>
        {pie && <div className="dr-foot">{pie}</div>}
      </aside>
    </div>
  )
}

const nombreAlumno = (a) => `${a.apellido_paterno || ''} ${a.apellido_materno || ''}, ${a.nombres || ''}`.replace(/\s+,/, ',').trim()

/* Reloj para que los estados (en curso / cerrada) se actualicen solos */
function useAhora(seg = 20) {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), seg * 1000); return () => clearInterval(t) }, [seg])
  return ahora
}

/* Clases, alumnos y asistencias de un grupo */
function useBundle(grupoId) {
  const [b, setB] = useState(null)
  const [err, setErr] = useState('')
  const cargar = useCallback(() => cargarClasesGrupo(grupoId).then((x) => { setB(x); setErr('') }).catch((e) => setErr(e.message || 'No se pudo cargar')), [grupoId])
  useEffect(() => { setB(null); cargar() }, [cargar])
  return [b, cargar, err]
}

const ChipVentana = ({ v }) => (
  <span className={`vent ${v}`}>{v === 'abierta' ? '● En curso' : v === 'cerrada' ? '🔒 Cerrada' : 'Próxima'}</span>
)

/* ================= HOJA DE ASISTENCIA (una clase) ================= */
function Hoja({ clase, alumnos, registros, gerente, ahora, onClose, onSaved, avisar }) {
  const v = ventana(clase, ahora)
  const editable = gerente || v === 'abierta'
  const exigeMotivo = gerente && v !== 'abierta'
  const [f, setF] = useState(() => Object.fromEntries(alumnos.map((a) => {
    const r = registros.get(a.alumno_id)
    return [a.alumno_id, { estado: r?.estado || '', participo: Boolean(r?.participo) }]
  })))
  const [motivo, setMotivo] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [hist, setHist] = useState(null)
  const cambios = alumnos.filter((a) => {
    const r = registros.get(a.alumno_id); const x = f[a.alumno_id]
    return x.estado && (!r || r.estado !== x.estado || Boolean(r.participo) !== x.participo)
  })
  const poner = (id, k, val) => { setErr(''); setF((s) => ({ ...s, [id]: { ...s[id], [k]: val } })) }

  async function guardar() {
    setErr('')
    const sin = alumnos.filter((a) => !f[a.alumno_id].estado)
    if (sin.length) { setErr(`Falta marcar a ${sin.length} alumno${sin.length === 1 ? '' : 's'}. La asistencia es obligatoria para todos.`); return }
    if (!cambios.length) { setErr('No hay cambios que guardar.'); return }
    if (exigeMotivo && motivo.trim().length < 10) { setErr('Escribe el sustento (el correo del alumno): mínimo 10 letras.'); return }
    setBusy(true)
    try {
      await guardarAsistencias(cambios.map((a) => ({ clase_id: clase.id, alumno_id: a.alumno_id, estado: f[a.alumno_id].estado, participo: f[a.alumno_id].participo, motivo: exigeMotivo ? motivo.trim() : '' })), { gerente, clase })
      await onSaved()
      avisar(exigeMotivo ? 'Corrección guardada con su sustento' : 'Asistencia guardada')
      onClose()
    } catch (e) { setErr(e.message || 'No se pudo guardar'); setBusy(false) }
  }
  async function verCambios() {
    try { setHist(await historialAsistencia(clase.id)) } catch (e) { setErr(e.message) }
  }
  const nom = (id) => { const a = alumnos.find((x) => x.alumno_id === id); return a ? `${a.nombres} ${a.apellido_paterno}` : '—' }

  return (
    <Drawer ancho titulo={`Clase ${clase.numero} · ${fechaClase(clase.inicio)} · ${horaClase(clase.inicio)} – ${horaClase(clase.fin)}`} onClose={onClose}
      pie={<>
        {err && <span className="err">{err}</span>}
        <button className="btn btn-line" onClick={onClose}>{editable ? 'Cancelar' : 'Cerrar'}</button>
        {editable && <button className="btn btn-teal" disabled={busy} onClick={guardar}>{busy ? 'Guardando…' : exigeMotivo ? 'Guardar corrección' : 'Guardar asistencia'}</button>}
      </>}>
      <div className={`asis-aviso ${v}`}>
        {v === 'abierta' && <>● <b>Clase en curso.</b> La asistencia se cierra al terminar (<b>{horaClase(clase.fin)}</b>); después queda guardada y solo gerencia puede corregirla.</>}
        {v === 'futura' && !gerente && <>La clase aún no empieza. La asistencia se abre 10 minutos antes de empezar (<b>{horaClase(clase.inicio)}</b>).</>}
        {v === 'cerrada' && !gerente && <>🔒 <b>Clase cerrada.</b> La asistencia quedó guardada y no se puede cambiar. Si un alumno reclama, debe escribir al correo de la escuela con su sustento.</>}
        {exigeMotivo && <>🔒 <b>Fuera del horario de la clase.</b> Solo tú (gerencia) puedes cambiarla, con el sustento del correo del alumno. Queda registrado quién, cuándo y por qué.</>}
      </div>
      {alumnos.length === 0 && <p className="note">Este grupo todavía no tiene alumnos inscritos.</p>}
      {editable && alumnos.length > 0 && !exigeMotivo && (
        <button type="button" className="btn btn-line sm" style={{ justifySelf: 'start', width: 'auto' }} onClick={() => setF((s) => Object.fromEntries(Object.entries(s).map(([id, x]) => [id, { ...x, estado: x.estado || 'presente' }])))}>Marcar a todos los que faltan como «Asistió»</button>
      )}
      <div className="asis-lista">
        {alumnos.map((a) => {
          const x = f[a.alumno_id]
          return (
            <div className="asis-fila" key={a.alumno_id}>
              <div className="asis-nom"><b>{nombreAlumno(a)}</b><small>{a.codigo}</small></div>
              <div className="chips asis-est" role="group" aria-label={`Asistencia de ${a.nombres}`}>
                {ESTADOS_ASIS.map(([k, nombre]) => (
                  <button key={k} type="button" disabled={!editable} className={`${x.estado === k ? 'sel' : ''} ${k}`} onClick={() => poner(a.alumno_id, 'estado', k)}>{nombre}</button>
                ))}
              </div>
              <label className="chk asis-part"><input type="checkbox" disabled={!editable} checked={x.participo} onChange={(e) => poner(a.alumno_id, 'participo', e.target.checked)} /> Participó</label>
            </div>
          )
        })}
      </div>
      {exigeMotivo && (
        <label className="asis-motivo">Sustento del cambio (obligatorio)
          <textarea rows={3} value={motivo} onChange={(e) => { setErr(''); setMotivo(e.target.value) }} placeholder="Ej.: Correo del alumno del 10/11: se conectó pero falló su internet; adjunta captura." />
        </label>
      )}
      {gerente && (
        <div className="asis-hist">
          {hist === null ? <button type="button" className="link" onClick={verCambios}>Ver quién cambió qué en esta clase</button> : (
            hist.length === 0 ? <small>Todavía no hay cambios registrados.</small> : (
              <ul>{hist.map((h) => (
                <li key={h.id}><b>{nom(h.alumno_id)}</b>: {h.estado_antes ? `${ETIQ_ASIS[h.estado_antes]} → ` : ''}{ETIQ_ASIS[h.estado_nuevo]}{h.participo_nuevo ? ' · participó' : ''}<small> · {String(h.por).split('@')[0]} · {new Date(h.creado).toLocaleString('es-PE', { timeZone: 'America/Lima' })}{h.motivo ? ` · “${h.motivo}”` : ''}</small></li>
              ))}</ul>
            )
          )}
        </div>
      )}
    </Drawer>
  )
}

/* ================= ASISTENCIA DE UN GRUPO (resumen + lista de clases) ================= */
function AsistenciaGrupo({ bundle, recargar, gerente, avisar }) {
  const ahora = useAhora()
  const [abierta, setAbierta] = useState(null)
  const { clases, alumnos, asistencias } = bundle
  const porClase = useMemo(() => {
    const m = new Map()
    asistencias.forEach((a) => { if (!m.has(a.clase_id)) m.set(a.clase_id, new Map()); m.get(a.clase_id).set(a.alumno_id, a) })
    return m
  }, [asistencias])
  const dictadas = clases.filter((c) => ventana(c, ahora) === 'cerrada' && porClase.has(c.id)).length
  const sinTomar = clases.filter((c) => ventana(c, ahora) === 'cerrada' && !porClase.has(c.id))
  const claseAbierta = clases.find((c) => c.id === abierta)

  if (!clases.length) return <div className="vacio"><p>Este grupo todavía no tiene clases programadas.{gerente ? ' Genera las clases arriba.' : ' Gerencia las programa con el calendario del grupo.'}</p></div>
  return (
    <>
      {sinTomar.length > 0 && <p className="banner aviso-inst">⚠️ {sinTomar.length === 1 ? 'La clase' : 'Las clases'} {sinTomar.map((c) => c.numero).join(', ')} {sinTomar.length === 1 ? 'terminó' : 'terminaron'} <b>sin asistencia</b>. {gerente ? 'No cuentan como dictadas hasta que se registre con sustento.' : 'Avisa a gerencia: ya no puedes registrarla.'}</p>}
      <div className="kpis">
        <div><b>{clases.length}</b><span>clases programadas</span></div>
        <div><b>{dictadas}</b><span>dictadas (con asistencia)</span></div>
        <div><b>{alumnos.length}</b><span>alumnos</span></div>
      </div>

      <h3 className="sub">Clases</h3>
      <div className="cons-wrap">
        <table className="cons-table asis-clases" style={{ minWidth: 560 }}>
          <thead><tr><th>#</th><th>Día y hora</th><th>Estado</th><th>Asistencia</th><th /></tr></thead>
          <tbody>
            {clases.map((c) => {
              const v = ventana(c, ahora); const n = porClase.get(c.id)?.size || 0
              return (
                <tr key={c.id} className={v === 'abierta' ? 'nueva' : ''}>
                  <td><b>{c.numero}</b></td>
                  <td>{fechaClase(c.inicio)} · {horaClase(c.inicio)} – {horaClase(c.fin)}<small className="paq">{horasDeClase(c)} h</small></td>
                  <td><ChipVentana v={v} /></td>
                  <td>{n ? `${n}/${alumnos.length} registrados` : (v === 'cerrada' ? <span className="err">Sin asistencia</span> : '—')}</td>
                  <td>
                    {v === 'abierta' && <button className="btn btn-teal sm" onClick={() => setAbierta(c.id)}>{n ? 'Editar asistencia' : 'Tomar asistencia'}</button>}
                    {v === 'cerrada' && (n > 0 || gerente) && <button className="btn btn-line sm" onClick={() => setAbierta(c.id)}>{gerente ? (n ? 'Ver / corregir' : 'Registrar con sustento') : 'Ver'}</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h3 className="sub">Resumen por alumno</h3>
      <p className="note">Asistió = marcado como «Asistió», sobre las clases ya dictadas. Una falta justificada se corrige a «Asistió» (con sustento). Para el certificado se pedirá 80 % o más de asistencia.</p>
      {alumnos.length === 0 ? <p className="note">Aún no hay alumnos inscritos en este grupo.</p> : (
        <div className="cons-wrap">
          <table className="cons-table" style={{ minWidth: 560 }}>
            <thead><tr><th>Alumno</th><th>Asistencia</th><th>Participó</th><th>Faltas</th></tr></thead>
            <tbody>
              {alumnos.map((a) => {
                const r = resumenAlumno(clases, asistencias, a.alumno_id, ahora)
                return (
                  <tr key={a.alumno_id}>
                    <td><b>{nombreAlumno(a)}</b><small className="paq">{a.codigo}</small></td>
                    <td>{r.pct == null ? '—' : <><span className={`pill ${r.pct < 80 ? 'off baja' : ''}`}>{r.pct} %</span> <small>{r.asistio}/{r.dictadas}</small></>}</td>
                    <td>{r.pctPart == null ? '—' : <small>{r.participo}/{r.dictadas} ({r.pctPart} %)</small>}</td>
                    <td>{r.dictadas ? <small>{r.falta} falta{r.falta === 1 ? '' : 's'}</small> : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {claseAbierta && (
        <Hoja key={claseAbierta.id} clase={claseAbierta} alumnos={alumnos} registros={porClase.get(claseAbierta.id) || new Map()} gerente={gerente} ahora={ahora}
          onClose={() => setAbierta(null)} onSaved={recargar} avisar={avisar} />
      )}
    </>
  )
}

/* ================= GERENCIA: generar y ajustar las clases de un grupo ================= */
function GeneradorClases({ g, curso, bundle, onSaved, avisar }) {
  const existentes = bundle.clases
  const [ini0, fin0] = horaDeTexto(g.horario)
  const [dias, setDias] = useState(() => {
    if (!existentes.length) return diasDeTexto(g.dias)
    const nums = new Set(existentes.map((c) => new Date(fechaISOLima(c.inicio) + 'T12:00:00Z').getUTCDay()))
    return DIAS_SEMANA.filter(([, num]) => nums.has(num)).map(([l]) => l)
  })
  const [primera, setPrimera] = useState(g.inicio ? String(g.inicio).slice(0, 10) : '')
  const [hIni, setHIni] = useState(existentes[0] ? horaHHMM(existentes[0].inicio) : ini0 || '19:00')
  const [hFin, setHFin] = useState(existentes[0] ? horaHHMM(existentes[0].fin) : fin0 || '21:00')
  const [n, setN] = useState(existentes.length || Number(curso?.sesiones) || 6)
  const [filas, setFilas] = useState(() => existentes.map((c) => ({ numero: c.numero, id: c.id, fecha: fechaISOLima(c.inicio), ini: horaHHMM(c.inicio), fin: horaHHMM(c.fin) })))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const meta = Number(curso?.horas) || 0
  const conAsistencia = new Set(bundle.asistencias.map((a) => a.clase_id))
  const alternar = (l) => setDias((d) => (d.includes(l) ? d.filter((x) => x !== l) : [...d, l]))

  function generar() {
    setErr('')
    if (!primera) return setErr('Pon la fecha de la primera clase (o la fecha de inicio del grupo).')
    if (!dias.length) return setErr('Elige los días de clase.')
    if (!hIni || !hFin || hFin <= hIni) return setErr('Revisa la hora de inicio y de fin.')
    const fechas = generarFechas({ inicio: primera, dias, n: Number(n) })
    const aMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
    const aHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    const dur = aMin(hFin) - aMin(hIni)
    // Si las horas del curso no cuadran con n clases iguales, la última se acorta (ej. 14 h = 5 de 2,5 h + 1 de 1,5 h)
    const ultima = meta && fechas.length > 1 ? Math.round(meta * 60) - (fechas.length - 1) * dur : dur
    const finUltima = ultima >= 30 && ultima < dur ? aHora(aMin(hIni) + ultima) : hFin
    setFilas(fechas.map((f, i) => ({ numero: i + 1, id: existentes.find((c) => c.numero === i + 1)?.id, fecha: f, ini: hIni, fin: i === fechas.length - 1 ? finUltima : hFin })))
  }
  const set = (i, k, v) => { setErr(''); setFilas((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x))) }
  const total = filas.reduce((t, f) => { const h = f.fecha && f.ini && f.fin ? (new Date(aTs(f.fecha, f.fin)) - new Date(aTs(f.fecha, f.ini))) / 3600000 : 0; return t + (h > 0 ? h : 0) }, 0)

  async function guardar() {
    setErr('')
    if (!filas.length) return setErr('Primero genera las clases.')
    for (const f of filas) {
      if (!f.fecha || !f.ini || !f.fin) return setErr(`Completa fecha y horas de la clase ${f.numero}.`)
      if (f.fin <= f.ini) return setErr(`La clase ${f.numero} termina antes de empezar.`)
    }
    const quitar = existentes.filter((c) => !filas.some((f) => f.numero === c.numero)).map((c) => c.numero)
    setBusy(true)
    try {
      await guardarClases(g.id, filas.map((f) => ({ numero: f.numero, inicio: aTs(f.fecha, f.ini), fin: aTs(f.fecha, f.fin) })), quitar)
      await onSaved(); avisar('Clases guardadas')
    } catch (e) { setErr(e.message || 'No se pudo guardar'); }
    setBusy(false)
  }

  return (
    <div className="gen">
      <h3 className="sub">Calendario de clases</h3>
      <p className="note">El sistema usa estas fechas para abrir y cerrar la asistencia. Se saltan los feriados; puedes cambiar cualquier fecha u hora a mano.</p>
      <div className="gen-form">
        <label>Primera clase<input type="date" value={primera} onChange={(e) => setPrimera(e.target.value)} /></label>
        <label>Hora de inicio<input type="time" value={hIni} onChange={(e) => setHIni(e.target.value)} /></label>
        <label>Hora de fin<input type="time" value={hFin} onChange={(e) => setHFin(e.target.value)} /></label>
        <label>N.º de clases<input type="number" min="1" max="40" value={n} onChange={(e) => setN(e.target.value)} /></label>
      </div>
      <div className="chips" role="group" aria-label="Días de clase">
        {DIAS_SEMANA.map(([l, , nombre]) => <button key={l} type="button" className={dias.includes(l) ? 'sel' : ''} onClick={() => alternar(l)} title={nombre}>{l} · {nombre}</button>)}
      </div>
      <div className="gen-acc">
        <button type="button" className="btn btn-line sm" onClick={generar}>{filas.length ? 'Volver a generar fechas' : 'Generar fechas'}</button>
        {filas.length > 0 && <small className={meta && Math.abs(total - meta) > 0.01 ? 'err' : 'note'}>Total: <b>{Math.round(total * 100) / 100} h</b>{meta ? ` · el curso dice ${meta} h` : ''}</small>}
      </div>
      {filas.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table" style={{ minWidth: 520 }}>
            <thead><tr><th>#</th><th>Fecha</th><th>Inicio</th><th>Fin</th><th /></tr></thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.numero}>
                  <td><b>{f.numero}</b></td>
                  <td><input type="date" aria-label={`Fecha clase ${f.numero}`} value={f.fecha} onChange={(e) => set(i, 'fecha', e.target.value)} /></td>
                  <td><input type="time" aria-label={`Inicio clase ${f.numero}`} value={f.ini} onChange={(e) => set(i, 'ini', e.target.value)} /></td>
                  <td><input type="time" aria-label={`Fin clase ${f.numero}`} value={f.fin} onChange={(e) => set(i, 'fin', e.target.value)} /></td>
                  <td>{i === filas.length - 1 && !(f.id && conAsistencia.has(f.id)) && <button type="button" className="ib red" aria-label="Quitar la última clase" title="Quitar la última clase" onClick={() => setFilas((a) => a.slice(0, -1))}><Icon n="trash" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="gen-acc">
        {filas.length > 0 && <button type="button" className="btn btn-line sm" onClick={() => setFilas((a) => { const u = a[a.length - 1]; return [...a, { numero: a.length + 1, fecha: u?.fecha || primera, ini: u?.ini || hIni, fin: u?.fin || hFin }] })}>+ Agregar una clase</button>}
        <button type="button" className="btn btn-teal sm" disabled={busy || !filas.length} onClick={guardar}>{busy ? 'Guardando…' : 'Guardar clases'}</button>
        {err && <span className="err">{err}</span>}
      </div>
    </div>
  )
}

/* ================= GERENCIA: ventana de clases y asistencia de un grupo ================= */
export function ClasesDrawer({ g, curso, onClose, avisar }) {
  const [bundle, recargar, err] = useBundle(g.id)
  return (
    <Drawer ancho titulo={`Clases · ${g.codigo || ''} ${curso?.titulo || ''}`.trim()} onClose={onClose}>
      {err && <p className="banner">{err}</p>}
      {!bundle && !err && <p className="note">Cargando…</p>}
      {bundle && (
        <>
          <GeneradorClases key={bundle.clases.length} g={g} curso={curso} bundle={bundle} onSaved={recargar} avisar={avisar} />
          <hr className="sep" />
          <AsistenciaGrupo bundle={bundle} recargar={recargar} gerente avisar={avisar} />
        </>
      )}
    </Drawer>
  )
}

/* ================= PROFESOR: un grupo (Información · Alumnos · Asistencia) ================= */
function GrupoProfesor({ g, curso, volver, avisar }) {
  const [tab, setTab] = useState('info')
  const [bundle, recargar, err] = useBundle(g.id)
  const temario = Array.isArray(curso?.temario) ? curso.temario : []
  return (
    <>
      <Seccion titulo={`${g.codigo ? g.codigo + ' · ' : ''}${curso?.titulo || 'Curso'}`} ayuda={`${g.inicio ? 'Inicia el ' + fechaCorta(g.inicio) : 'Sin fecha de inicio'} · ${g.dias || 'días por definir'} · ${g.horario || 'horario por definir'}`}>
        <button className="btn btn-line" onClick={volver}>← Mis cursos</button>
      </Seccion>
      <div className="chips tabs" role="tablist">
        {[['info', 'Información'], ['alumnos', `Alumnos${bundle ? ` (${bundle.alumnos.length})` : ''}`], ['asistencia', 'Asistencia']].map(([k, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'sel' : ''} onClick={() => setTab(k)}>{n}</button>
        ))}
      </div>
      {err && tab !== 'info' && <p className="banner">{err}</p>}
      {tab === 'info' && (
        <div className="prof-info">
          <div className="kpis">
            <div><b>{curso?.horas || '—'} h</b><span>duración del curso</span></div>
            <div><b>{curso?.sesiones || '—'}</b><span>sesiones</span></div>
            <div><b>{g.inscritos ?? '—'}</b><span>inscritos (mín. {g.minimo || 5} · máx. {g.maximo || 20})</span></div>
          </div>
          {curso?.descripcion && <p className="note">{curso.descripcion}</p>}
          <h3 className="sub">Temario</h3>
          {temario.length ? <ol className="temario">{temario.map((t, i) => <li key={i}>{t}</li>)}</ol> : <p className="note">Este curso aún no tiene temario cargado.</p>}
          <p className="note">Recuerda: durante las clases haz preguntas de participación y pide los entregables del curso. La asistencia es obligatoria y se cierra al terminar cada clase.</p>
        </div>
      )}
      {tab === 'alumnos' && (!bundle ? (!err && <p className="note">Cargando…</p>) : (
        bundle.alumnos.length === 0 ? <div className="vacio"><p>Aún no hay alumnos inscritos en este grupo.</p></div> : (
          <div className="cons-wrap">
            <table className="cons-table" style={{ minWidth: 520 }}>
              <thead><tr><th>Alumno</th><th>Código</th><th>Correo</th></tr></thead>
              <tbody>{bundle.alumnos.map((a) => <tr key={a.alumno_id}><td><b>{nombreAlumno(a)}</b></td><td>{a.codigo}</td><td>{a.email || '—'}</td></tr>)}</tbody>
            </table>
          </div>
        )
      ))}
      {tab === 'asistencia' && (!bundle ? (!err && <p className="note">Cargando…</p>) : <AsistenciaGrupo bundle={bundle} recargar={recargar} gerente={false} avisar={avisar} />)}
    </>
  )
}

/* ================= PANEL DEL PROFESOR ================= */
export default function PanelProfesor({ email, onSalir }) {
  const [datos, setDatos] = useState(null)
  const [err, setErr] = useState('')
  const [sel, setSel] = useState(null)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const avisar = (texto, error) => { clearTimeout(timer.current); setToast({ texto, error }); timer.current = setTimeout(() => setToast(null), 2800) }
  useEffect(() => { cargarProfesor().then(setDatos).catch((e) => setErr(e.message || 'No se pudo cargar')) }, [])
  const curso = (g) => datos?.cursos.find((c) => String(c.id) === String(g.curso_id))
  const grupo = sel && datos?.grupos.find((g) => String(g.id) === String(sel))

  return (
    <div className="shell">
      <aside className="side">
        <Link className="logo" to="/" aria-label="CCN"><Logo fijo="oscuro" /></Link>
        <small className="sidetag">Profesor</small>
        <div className="snav" role="tablist" aria-label="Secciones">
          <button role="tab" aria-selected onClick={() => setSel(null)}>Mis cursos{datos && <em>{datos.grupos.length}</em>}</button>
        </div>
        <div className="sidefoot">
          {email && <span>{email}</span>}
          <Link to="/">Ver la web ↗</Link>
          {hasBackend && <button onClick={onSalir}>Salir</button>}
        </div>
      </aside>
      <main className="main">
        {!hasBackend && <p className="banner">Modo demostración: lo que cambies se guarda solo en este navegador.</p>}
        {err && <p className="banner">{err}</p>}
        {!datos && !err && <p className="note">Cargando…</p>}
        {datos && !grupo && (
          <>
            <Seccion titulo="Mis cursos" ayuda="Los grupos que dictas. Entra a uno para ver sus alumnos y tomar la asistencia durante la clase." />
            {datos.grupos.length === 0 && <div className="vacio"><p>Todavía no tienes grupos asignados. Gerencia te los asigna cuando abre un curso.</p></div>}
            <div className="tcards">
              {datos.grupos.map((g) => {
                const c = curso(g)
                return (
                  <button key={g.id} className="tcard" onClick={() => setSel(g.id)}>
                    <b>{g.codigo && <span className="cod">{g.codigo}</span>}{c?.titulo || 'Curso'}</b>
                    <small>{g.inicio ? 'Inicia el ' + fechaCorta(g.inicio) : 'Sin fecha'} · {g.dias || 'días por definir'}</small>
                    <span>{g.horario || 'Horario por definir'} · <i>{g.inscritos ?? 0}</i> inscritos</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
        {datos && grupo && <GrupoProfesor key={grupo.id} g={grupo} curso={curso(grupo)} volver={() => setSel(null)} avisar={avisar} />}
      </main>
      {toast && <div className={`toast ${toast.error ? 'bad' : ''}`} role="status">{toast.texto}</div>}
    </div>
  )
}
