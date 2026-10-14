import { useMemo, useState } from 'react'
import { useState as useEstado } from 'react'
import { guardarEvaluacionGrupo, guardarAccesosGrupo, asignarInstructor, quitarInstructor, reabrirAsistencia, cerrarReapertura } from '../lib/data.js'
import { reabierta } from '../lib/clases.js'
import { cronogramaGrupo, textoCronograma, pdfCronograma, fechaHora, soloFecha, isoLima, HORAS_CERTIFICADO } from '../lib/cronograma.js'

/* Módulo Académico (gerencia y coordinación): cronograma exacto de T1 y T2 por grupo, enlaces de entrega y aviso de las 72 h */
export function Cronograma({ data, hacer, avisar }) {
  const [ver, setVer] = useState('activos')
  const [mins, setMins] = useState(() => new Set())
  const alternar = (id) => setMins((m) => { const n = new Set(m); n.has(id) ? n.delete(id) : n.add(id); return n })
  const clasesDe = useMemo(() => {
    const m = {}
    ;(data.clases || []).forEach((c) => { (m[String(c.grupo_id)] ||= []).push(c) })
    return m
  }, [data.clases])

  /* Profesor del grupo: id y nombre (para el asistente llega sin tarifas) */
  const instructorDe = (gid) => {
    const a = (data.asignaciones || []).find((x) => String(x.grupo_id) === gid)
    const t = a && (data.trabajadores || []).find((x) => x.id === a.trabajador_id)
    if (t) return { id: t.id, nombre: t.nombre }
    const r = (data.instructores || []).find((x) => String(x.grupo_id) === gid)
    return r ? { id: r.trabajador_id, nombre: r.nombre } : null
  }
  const disponibles = (data.instructoresDisp && data.instructoresDisp.length ? data.instructoresDisp
    : (data.trabajadores || []).filter((t) => t.activo !== false && t.puesto === 'instructor'))
    .map((t) => ({ id: t.id, nombre: t.nombre, acceso: t.acceso !== false }))

  const ahora = Date.now()
  const grupos = (data.grupos || [])
    .filter((g) => clasesDe[String(g.id)]?.length)
    .map((g) => {
      const cl = [...clasesDe[String(g.id)]].sort((a, b) => a.numero - b.numero)
      return { g, cl, fin: new Date(cl[cl.length - 1].fin).getTime() }
    })
    .filter((x) => ver === 'todos' || x.fin + HORAS_CERTIFICADO * 3600000 >= ahora)
    .sort((a, b) => new Date(a.cl[0].inicio) - new Date(b.cl[0].inicio))
  const sinClases = (data.grupos || []).filter((g) => g.activo !== false && g.estado !== 'cerrado' && !clasesDe[String(g.id)]?.length)

  return (
    <>
      <div className="head-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div><h1>Cronograma y accesos</h1><p>Profesor, Zoom, grabaciones y T1/T2 de cada grupo con fechas exactas. En la última clase el profesor repasa los trabajos que eligió y los alumnos hacen preguntas. El certificado sale dentro de las {HORAS_CERTIFICADO} h después de esa clase.</p></div>
        <label>Mostrar <select value={ver} onChange={(e) => setVer(e.target.value)} aria-label="Filtro de grupos"><option value="activos">Grupos en curso o por certificar</option><option value="todos">Todos</option></select></label>
      </div>
      <details className="firmas-box">
        <summary><b>Reglas del cronograma</b></summary>
        <ul className="note" style={{ margin: '8px 0 0 18px' }}>
          <li><b>T1:</b> se anuncia al cerrar la clase donde termina la primera mitad. Plazo: 3 días después.</li>
          <li><b>T2 (proyecto final):</b> se anuncia en la penúltima clase. Fecha límite: 48 h antes de la última clase.</li>
          <li><b>Última clase:</b> repaso de los trabajos elegidos por el profesor + preguntas.</li>
          <li><b>Club Ofimática:</b> cada programa (Word, Excel, PowerPoint) es un ciclo de 6 clases con su T1, T2 y cierre.</li>
          <li>Puedes cambiar la fecha límite de una evaluación en un grupo concreto. Si la dejas en «Auto», se calcula sola.</li>
        </ul>
      </details>
      {sinClases.length > 0 && <p className="banner">Sin clases generadas (no se puede calcular el cronograma): {sinClases.map((g) => g.codigo || 'grupo').join(', ')}. Gerencia las genera en Web → Horarios → «Generar clases».</p>}
      {!grupos.length && <div className="vacio"><p>No hay grupos con clases en este filtro.</p></div>}
      {grupos.length > 1 && (
        <div style={{ display: 'flex', gap: 8, margin: '10px 0 0' }}>
          <button className="btn btn-line sm" onClick={() => setMins(new Set(grupos.map(({ g }) => String(g.id))))}>Minimizar todos</button>
          <button className="btn btn-line sm" onClick={() => setMins(new Set())}>Expandir todos</button>
        </div>
      )}
      {grupos.map(({ g, cl }) => <GrupoCronograma key={g.id} g={g} cl={cl} data={data} hacer={hacer} avisar={avisar} instructor={instructorDe(String(g.id))} disponibles={disponibles} min={mins.has(String(g.id))} alternar={() => alternar(String(g.id))} />)}
    </>
  )
}

function GrupoCronograma({ g, cl, data, hacer, avisar, instructor, disponibles, min, alternar }) {
  const curso = (data.cursos || []).find((c) => String(c.id) === String(g.curso_id))
  const ents = (data.entregables || []).filter((e) => String(e.curso_id) === String(g.curso_id))
  const cfg = (data.grupo_evaluaciones || []).filter((x) => String(x.grupo_id) === String(g.id))
  const filas = cronogramaGrupo(cl, ents, cfg)
  const ultima = cl[cl.length - 1]
  const tope = new Date(new Date(ultima.fin).getTime() + HORAS_CERTIFICADO * 3600000)
  const ahora = Date.now()
  const termino = new Date(ultima.fin).getTime() < ahora
  const horasQuedan = Math.ceil((tope.getTime() - ahora) / 3600000)
  const titulo = curso?.titulo || 'Curso'
  const acc = (data.grupo_accesos || []).find((x) => String(x.grupo_id) === String(g.id)) || { zoom: '', grabaciones: '' }
  const conAsis = data.clasesConAsistencia ? new Set(data.clasesConAsistencia) : null
  const sinAsistencia = conAsis ? cl.filter((c) => new Date(c.fin).getTime() < ahora && !conAsis.has(c.id)) : []
  const guardarAcc = (cambios) => hacer(() => guardarAccesosGrupo({ grupo_id: g.id, zoom: acc.zoom, grabaciones: acc.grabaciones, ...cambios }), 'Guardado')
  const cambiarProfe = (id) => hacer(() => (id ? asignarInstructor(g.id, id) : quitarInstructor(g.id)), id ? 'Profesor asignado' : 'Profesor quitado')

  async function copiar() {
    const t = textoCronograma({ curso: titulo, codigo: g.codigo || '', horario: [g.dias, g.horario].filter(Boolean).join(' · '), instructor: instructor?.nombre || '', filas })
    try { await navigator.clipboard.writeText(t); avisar && avisar('Cronograma copiado, pégalo en el WhatsApp del profesor') }
    catch (e) { window.prompt('Copia este texto:', t) }
  }
  async function bajarPdf() {
    try { await pdfCronograma({ curso: titulo, codigo: g.codigo || '', horario: [g.dias, g.horario].filter(Boolean).join(' · '), instructor: instructor?.nombre || '', clases: cl, filas, zoom: acc.zoom }) }
    catch (e) { avisar && avisar('No se pudo generar el PDF', true) }
  }
  const guardar = (f, cambios) => hacer(() => guardarEvaluacionGrupo({ grupo_id: g.id, entregable_id: f.e.id, enlace: f.enlace, fecha_limite: f.manual ? isoLima(f.limite) : null, ...cambios }), 'Guardado')

  return (
    <section className="fs" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0 }}><button type="button" className="link" onClick={alternar} aria-expanded={!min} aria-label={min ? `Expandir ${titulo}` : `Minimizar ${titulo}`} style={{ marginRight: 6, fontSize: '1rem' }}>{min ? '▸' : '▾'}</button>{g.codigo ? `${g.codigo} · ` : ''}{titulo}</h3>
          <p className="note" style={{ margin: '4px 0 0' }}>{[g.dias, g.horario].filter(Boolean).join(' · ')} · {cl.length} clases · {instructor ? '' : '⚠️ sin profesor asignado'}</p>
          <p className="note" style={{ margin: '2px 0 0' }}>Primera clase {fechaHora(cl[0].inicio)} · <b>Última clase {fechaHora(ultima.inicio)}</b> · Certificados hasta {fechaHora(tope)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {termino && horasQuedan > 0 && <span className="paq" style={{ background: '#fff4d6', color: '#7a5a00' }}>⏰ Certificados: quedan {horasQuedan} h</span>}
          {termino && horasQuedan <= 0 && <span className="paq">Ciclo cerrado</span>}
          <button className="btn btn-line sm" onClick={copiar}>Copiar para WhatsApp</button>
          <button className="btn btn-line sm" onClick={bajarPdf}>Descargar PDF</button>
        </div>
      </div>
      {!min && <>
      <PendientesAsistencia g={g} sinAsistencia={sinAsistencia.filter((c) => !reabierta(c))} reabiertas={cl.filter((c) => reabierta(c))} hacer={hacer} />
      <div className="cform" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, margin: '10px 0' }}>
        <label>Profesor
          <select value={instructor?.id || ''} onChange={(e) => cambiarProfe(e.target.value)} aria-label={`Profesor del grupo ${g.codigo || ''}`}>
            <option value="">— Sin asignar —</option>
            {disponibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}{t.acceso ? '' : ' (sin acceso al panel)'}</option>)}
            {instructor && !disponibles.some((t) => t.id === instructor.id) && <option value={instructor.id}>{instructor.nombre}</option>}
          </select>
        </label>
        {instructor && disponibles.find((t) => t.id === instructor.id)?.acceso === false && <p className="banner" style={{ gridColumn: '1 / -1', margin: 0 }}>⚠️ {instructor.nombre} aún no tiene acceso al panel. Avisa a gerencia para darle su usuario.</p>}
        <label>Enlace de Zoom
          <input key={`z-${acc.zoom}`} defaultValue={acc.zoom} placeholder="https://zoom.us/j/…" aria-label={`Zoom ${g.codigo || ''}`} onBlur={(e) => e.target.value.trim() !== acc.zoom && guardarAcc({ zoom: e.target.value })} />
        </label>
        <label>Clases grabadas (carpeta o lista)
          <input key={`r-${acc.grabaciones}`} defaultValue={acc.grabaciones} placeholder="https://drive.google.com/…" aria-label={`Grabaciones ${g.codigo || ''}`} onBlur={(e) => e.target.value.trim() !== acc.grabaciones && guardarAcc({ grabaciones: e.target.value })} />
        </label>
      </div>
      {!filas.length && <p className="note">Este curso aún no tiene T1/T2 definidos (se editan en Certificados → «Evaluaciones por curso»).</p>}
      {filas.length > 0 && (
        <div className="cons-wrap"><table className="cons-table" style={{ minWidth: 720 }}>
          <thead><tr><th>Evaluación</th><th>Se anuncia</th><th>Fecha límite</th><th>Enlace de entrega (Drive o Forms)</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.e.id}>
                <td><b>{f.etapa}{f.programa ? ` · ${f.programa}` : ''}</b><br /><small>{f.e.titulo}</small></td>
                <td>{f.anuncio ? <>Clase {f.anuncio.numero}<br /><small>{soloFecha(f.anuncio.inicio)}</small></> : '—'}</td>
                <td>{f.limite ? (
                  <>
                    <input type="date" key={`${f.e.id}-${isoLima(f.limite)}`} defaultValue={isoLima(f.limite)} aria-label={`Fecha límite ${f.etapa}`}
                      onChange={(e) => e.target.value && guardar(f, { fecha_limite: e.target.value })} />
                    <br /><small>{f.manual ? 'Fecha propia · ' : 'Auto · '}{f.etapa === 'T2' ? `hasta ${fechaHora(f.limite)}` : fechaHora(f.limite)}</small>
                    {f.manual && <> <button className="btn btn-line sm" onClick={() => guardar(f, { fecha_limite: null })}>Auto</button></>}
                  </>
                ) : '—'}</td>
                <td><input style={{ width: '100%', minWidth: 220 }} key={`${f.e.id}-${f.enlace}`} defaultValue={f.enlace} placeholder="https://drive.google.com/… o https://forms.gle/…" aria-label={`Enlace ${f.etapa}`}
                  onBlur={(e) => e.target.value.trim() !== f.enlace && guardar(f, { enlace: e.target.value })} /></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      </>}
    </section>
  )
}

/* Clases que terminaron sin asistencia: se pueden reabrir por unas horas para que el profesor las registre */
function PendientesAsistencia({ g, sinAsistencia, reabiertas, hacer }) {
  const [abierta, setAbierta] = useEstado(null)     // clase a la que se le está escribiendo el motivo
  const [horas, setHoras] = useEstado(24)
  const [motivo, setMotivo] = useEstado('')
  if (!sinAsistencia.length && !reabiertas.length) return null
  return (
    <div className="banner aviso-inst" style={{ display: 'grid', gap: 8 }}>
      {reabiertas.map((c) => (
        <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>↻ <b>Clase {c.numero}</b>: asistencia reabierta hasta {fechaHora(c.reabierta_hasta)} ({String(c.reabierta_por || '').split('@')[0]}: {c.reabierta_motivo}).</span>
          <button className="btn btn-line sm" onClick={() => hacer(() => cerrarReapertura(c.id), 'Reapertura cerrada')}>Cerrar ya</button>
        </div>
      ))}
      {sinAsistencia.map((c) => (
        <div key={c.id}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>⚠️ <b>Clase {c.numero}</b> ({fechaHora(c.inicio)}) terminó sin asistencia.</span>
            <button className="btn btn-teal sm" onClick={() => { setAbierta(abierta === c.id ? null : c.id); setMotivo('') }}>Reabrir para el profesor</button>
          </div>
          {abierta === c.id && (
            <div className="cform" style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 8, marginTop: 8, alignItems: 'end' }}>
              <label>Dura<select value={horas} onChange={(e) => setHoras(Number(e.target.value))}>{[12, 24, 48].map((h) => <option key={h} value={h}>{h} horas</option>)}</select></label>
              <label>Motivo (queda registrado)<input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: el profesor olvidó tomarla, avisó por WhatsApp" /></label>
              <button className="btn btn-teal sm" disabled={motivo.trim().length < 10} onClick={() => hacer(async () => { await reabrirAsistencia(c.id, horas, motivo); setAbierta(null) }, 'Asistencia reabierta')}>Reabrir</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
