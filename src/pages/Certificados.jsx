import { useEffect, useMemo, useState } from 'react'
import { cargarAsistenciaGrupo, emitirCertificado, anularCertificado, enviarCertificadoCorreo, fechaCorta, guardarFirma, quitarFirma, cargarEntregasGrupo, save, remove } from '../lib/data.js'
import { resumenAlumno, fechaISOLima } from '../lib/clases.js'
import {
  TIPOS_CERT, MIN_ASISTENCIA, MIN_PARTICIPACION, CLASES_POR_PROGRAMA, documentosDe, nuevoCodigo, generarPdf, descargarBlob, nombreArchivo, hoyLima, esClub, procesarFirma,
} from '../lib/certificados.js'

const nombreDe = (a) => [a?.nombres, a?.apellido_paterno, a?.apellido_materno].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
const ETQ = { constancia: 'Constancia', certificado: 'Certificado', constancia_club: 'Club: constancia', certificado_club: 'Club: certificado' }
const etiqueta = (s) => (s.tipo === 'certificado' && s.bloque !== undefined ? `Certificado de ${s.curso}` : ETQ[s.tipo])

/* Datos para dibujar el PDF a partir de un registro guardado (las firmas se buscan en la tabla de firmas) */
const datosPdf = (c, firmas = []) => {
  const f = (clave) => firmas.find((x) => x.clave === String(clave))
  return {
    tipo: c.tipo, nombre: c.alumno_nombre, curso: c.curso_titulo, horas: c.horas, emision: c.fecha_emision, codigo: c.codigo,
    detalle: c.tipo.endsWith('_club') ? 'Word · Excel · PowerPoint' : '',
    instructor: { nombre: c.instructor_nombre, firma: f(c.instructor_clave)?.imagen || '' },
    direccion: { nombre: c.direccion_nombre, cargo: c.direccion_cargo, firma: f('direccion')?.imagen || '' },
  }
}

const EJEMPLO = {
  certificado: { tipo: 'certificado', curso: 'Notion desde 0', horas: 16 },
  constancia: { tipo: 'constancia', curso: 'Notion desde 0', horas: 16 },
  certificado_club: { tipo: 'certificado_club', curso: 'Club Ofimática', horas: 42, detalle: 'Word · Excel · PowerPoint' },
  constancia_club: { tipo: 'constancia_club', curso: 'Club Ofimática', horas: 42, detalle: 'Word · Excel · PowerPoint' },
}

/* Firmas reales: la de Dirección Académica y la de cada instructor. Se sube una foto o escaneo; el fondo se vuelve transparente. */
function Firmas({ data, hacer }) {
  const firmas = data.firmas || []
  const de = (clave) => firmas.find((f) => f.clave === String(clave))
  const dir = de('direccion')
  const [nom, setNom] = useState(dir?.nombre || '')
  const [cargo, setCargo] = useState(dir?.cargo || 'Dirección Académica')
  useEffect(() => { setNom(dir?.nombre || ''); setCargo(dir?.cargo || 'Dirección Académica') }, [dir?.nombre, dir?.cargo])
  const asignados = new Set((data.asignaciones || []).map((a) => a.trabajador_id))
  const instructores = (data.trabajadores || []).filter((t) => t.puesto === 'instructor' || asignados.has(t.id))

  const subir = (clave, extra) => async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    await hacer(async () => { const imagen = await procesarFirma(file); await guardarFirma(clave, { ...(de(clave) || {}), ...extra, imagen }) }, 'Firma guardada')
  }
  const Miniatura = ({ f }) => (f?.imagen ? <img src={f.imagen} alt="Firma" style={{ height: 38, maxWidth: 130, objectFit: 'contain', background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: 3 }} /> : <small className="cert-falta">Sin firma</small>)

  return (
    <details className="firmas-box" open={!dir?.imagen || undefined}>
      <summary><b>Firmas de los certificados</b> {dir?.imagen ? '' : '· ⚠️ falta cargar firmas'}</summary>
      <p className="note">Las firmas son reales: pide a cada profesor una foto o escaneo de su firma en papel blanco (mejor con lapicero azul o negro). El sistema quita el fondo solo. Sin firma del instructor y de Dirección no se puede emitir.</p>
      <div className="cons-wrap"><table className="cons-table" style={{ minWidth: 700 }}>
        <thead><tr><th>Quién firma</th><th>Firma</th><th /></tr></thead>
        <tbody>
          <tr>
            <td><b>Dirección Académica</b>
              <div className="cform" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginTop: 6, maxWidth: 300 }}>
                <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nombre completo del firmante" aria-label="Nombre del firmante" style={{ width: '100%' }} />
                <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Cargo" aria-label="Cargo" style={{ width: '100%' }} />
                <button className="btn btn-line sm" type="button" onClick={() => hacer(() => guardarFirma('direccion', { ...(dir || {}), nombre: nom.trim(), cargo: cargo.trim() || 'Dirección Académica', imagen: dir?.imagen || '' }), 'Datos guardados')}>Guardar nombre y cargo</button>
              </div></td>
            <td><Miniatura f={dir} /></td>
            <td className="acc"><label className="btn btn-teal sm" style={{ cursor: 'pointer' }}>{dir?.imagen ? 'Cambiar firma' : 'Subir firma'}<input type="file" accept="image/*" hidden onChange={subir('direccion', { nombre: nom.trim(), cargo: cargo.trim() || 'Dirección Académica' })} /></label>
              {dir?.imagen && <button className="btn btn-line sm" onClick={() => hacer(() => quitarFirma('direccion'), 'Firma quitada')}>Quitar</button>}</td>
          </tr>
          {instructores.map((t) => {
            const f = de(t.id)
            return (
              <tr key={t.id}>
                <td><b>{t.nombre}</b><small className="paq">Instructor(a)</small></td>
                <td><Miniatura f={f} /></td>
                <td className="acc"><label className="btn btn-teal sm" style={{ cursor: 'pointer' }}>{f?.imagen ? 'Cambiar firma' : 'Subir firma'}<input type="file" accept="image/*" hidden onChange={subir(t.id, { nombre: t.nombre })} /></label>
                  {f?.imagen && <button className="btn btn-line sm" onClick={() => hacer(() => quitarFirma(t.id), 'Firma quitada')}>Quitar</button>}</td>
              </tr>
            )
          })}
          {!instructores.length && <tr><td colSpan={3}>Aún no hay instructores. Créalos en Gerencia → Trabajadores (puesto Instructor) y asígnalos a un grupo.</td></tr>}
        </tbody>
      </table></div>
    </details>
  )
}

/* Entregables de cada curso (borrador sembrado por Claude: gerencia los ajusta; cada profesor confirma que sean realistas) */
function EntregablesEditor({ data, hacer }) {
  const cursos = data.cursos
  const [cid, setCid] = useState('')
  const [nuevo, setNuevo] = useState('')
  useEffect(() => { if (!cid && cursos[0]) setCid(String(cursos[0].id)) }, [cursos, cid])
  const curso = cursos.find((c) => String(c.id) === cid)
  const lista = (data.entregables || []).filter((e) => String(e.curso_id) === cid).sort((a, b) => a.orden - b.orden)
  const club = curso && esClub(curso.titulo)
  const cambiar = (e, cambios) => hacer(() => save('entregables', { ...e, ...cambios }), 'Entregable guardado')
  return (
    <details className="firmas-box">
      <summary><b>Trabajo final por curso</b> · el profesor revisa y marca quién aprobó</summary>
      <p className="note">Cada curso tiene un solo trabajo final (en el Club, uno por programa). Para el certificado hay que tenerlo <b>aprobado</b>. Las fechas se calculan solas en el Cronograma. Si un curso no tiene evaluaciones, el certificado usa la casilla manual «Entregó todo a tiempo».</p>
      {data.entregablesError && <p className="banner">Falta pegar <b>entregables.sql</b> en Supabase (SQL Editor): {data.entregablesError}</p>}
      <div className="cform" style={{ maxWidth: 460, marginBottom: 10 }}>
        <select style={{ width: '100%' }} value={cid} onChange={(e) => setCid(e.target.value)} aria-label="Curso">{cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}</select>
      </div>
      <div className="cons-wrap"><table className="cons-table" style={{ minWidth: 640 }}>
        <thead><tr><th>#</th><th>Etapa</th><th>Evaluación</th>{club && <th>Programa</th>}<th>Obligatorio</th><th /></tr></thead>
        <tbody>
          {lista.map((e) => (
            <tr key={e.id}>
              <td>{e.orden}</td>
              <td className="cform"><select value={e.etapa || 'T2'} onChange={(ev) => cambiar(e, { etapa: ev.target.value })} aria-label="Etapa"><option>T1</option><option>T2</option></select></td>
              <td className="cform"><input style={{ width: '100%' }} defaultValue={e.titulo} aria-label="Título" onBlur={(ev) => ev.target.value.trim() && ev.target.value.trim() !== e.titulo && cambiar(e, { titulo: ev.target.value.trim() })} /></td>
              {club && <td className="cform"><select value={e.programa || ''} onChange={(ev) => cambiar(e, { programa: ev.target.value })} aria-label="Programa"><option value="">—</option>{['Word', 'Excel', 'PowerPoint'].map((p) => <option key={p}>{p}</option>)}</select></td>}
              <td><input type="checkbox" checked={e.obligatorio} onChange={(ev) => cambiar(e, { obligatorio: ev.target.checked })} aria-label="Obligatorio" /></td>
              <td className="acc"><button className="btn btn-line sm" onClick={() => window.confirm('¿Quitar esta evaluación? También se borran sus marcas de revisión.') && hacer(() => remove('entregables', e.id), 'Entregable quitado')}>Quitar</button></td>
            </tr>
          ))}
          {!lista.length && <tr><td colSpan={club ? 6 : 5}>Este curso aún no tiene evaluaciones.</td></tr>}
        </tbody>
      </table></div>
      <div className="cform" style={{ display: 'flex', gap: 8, marginTop: 10, maxWidth: 640 }}>
        <input style={{ flex: 1 }} value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Nueva evaluación (ej. Proyecto final presentado)" aria-label="Nueva evaluación" />
        <button className="btn btn-teal sm" disabled={nuevo.trim().length < 3 || !cid} onClick={() => hacer(async () => { await save('entregables', { curso_id: cid, orden: (lista.reduce((m, x) => Math.max(m, x.orden), 0) || 0) + 1, titulo: nuevo.trim(), programa: '', etapa: 'T2', obligatorio: true, activo: true, detalle: '' }); setNuevo('') }, 'Entregable agregado')}>Agregar</button>
      </div>
    </details>
  )
}

export default function Certificados({ data, hacer, gerente = true }) {
  const cursoDe = (id) => data.cursos.find((c) => String(c.id) === String(id))
  const grupos = useMemo(() => [...data.grupos].filter((g) => data.matriculas.some((m) => String(m.grupo_id) === String(g.id) && m.estado === 'activa'))
    .sort((a, b) => String(a.codigo || '').localeCompare(String(b.codigo || ''))), [data.grupos, data.matriculas])
  const [gid, setGid] = useState('')
  const [carga, setCarga] = useState(null)
  const [err, setErr] = useState('')
  const [entrego, setEntrego] = useState({})      // matrícula -> entregó todo a tiempo
  const [busy, setBusy] = useState('')
  const [tipoEj, setTipoEj] = useState('certificado')
  const [buscar, setBuscar] = useState('')

  useEffect(() => { if (!gid && grupos[0]) setGid(String(grupos[0].id)) }, [grupos, gid])
  useEffect(() => {
    if (!gid) { setCarga(null); return }
    let vivo = true
    setCarga(null); setErr('')
    const g0 = grupos.find((g) => String(g.id) === gid)
    Promise.all([cargarAsistenciaGrupo(gid), cargarEntregasGrupo(gid, g0?.curso_id).catch(() => ({ entregables: [], entregas: [] }))])
      .then(([a, e]) => vivo && setCarga({ ...a, entregables: e.entregables, entregas: e.entregas })).catch((e) => vivo && setErr(e.message || 'No se pudo cargar la asistencia'))
    return () => { vivo = false }
  }, [gid, data.entregables])

  const grupo = grupos.find((g) => String(g.id) === gid)
  const asig = (data.asignaciones || []).find((a) => String(a.grupo_id) === gid)
  const instrT = asig && (data.trabajadores || []).find((t) => t.id === asig.trabajador_id)
  const instrR = (data.instructores || []).find((x) => String(x.grupo_id) === gid)   // coordinación académica: llega sin tarifas
  const instr = instrT || (instrR ? { id: instrR.trabajador_id, nombre: instrR.nombre } : null)
  const firmaDe = (clave) => (data.firmas || []).find((f) => f.clave === String(clave))
  const dirF = firmaDe('direccion')
  const faltaFirma = !grupo ? '' : !instr ? 'Asigna un instructor a este grupo (lo hace Gerencia en Trabajadores).' : !firmaDe(instr.id)?.imagen ? `Falta la firma de ${instr.nombre}.` : !dirF?.imagen || !dirF?.nombre ? 'Falta la firma o el nombre de Dirección Académica.' : ''
  const curso = grupo && cursoDe(grupo.curso_id)
  const filas = useMemo(() => (grupo ? data.matriculas.filter((m) => String(m.grupo_id) === gid && m.estado === 'activa') : [])
    .map((m) => ({ m, a: data.alumnos.find((x) => x.id === m.alumno_id) || {} }))
    .sort((x, y) => nombreDe(x.a).localeCompare(nombreDe(y.a))), [grupo, data.matriculas, data.alumnos, gid])

  const vigentes = (data.certificados || []).filter((c) => c.estado === 'vigente')
  const emitido = (m, s) => vigentes.find((c) => c.matricula_id === m.id && c.tipo === s.tipo && c.curso_titulo === s.curso)

  /* Estadísticas de un alumno para un documento (el curso entero, o el bloque de 6 clases de un programa del Club) */
  function stats(m, s) {
    if (!carga) return null
    const clases = s.bloque !== undefined ? carga.clases.slice(s.bloque * CLASES_POR_PROGRAMA, (s.bloque + 1) * CLASES_POR_PROGRAMA) : carga.clases
    const ids = new Set(clases.map((c) => c.id))
    const r = resumenAlumno(clases, carga.asistencias.filter((a) => ids.has(a.clase_id)), m.alumno_id)
    return { ...r, total: clases.length, terminado: clases.length > 0 && r.dictadas === clases.length, clases }
  }
  /* Entregables obligatorios cumplidos por un alumno (para el Club, cada programa cuenta solo los suyos) */
  function entrega(m, s = {}) {
    const lista = ((carga && carga.entregables) || []).filter((e) => e.obligatorio && (s.bloque === undefined || !e.programa || e.programa === s.curso))
    if (!lista.length) return { total: 0, hechos: 0 }
    const hechos = lista.filter((e) => carga.entregas.some((x) => x.alumno_id === m.alumno_id && x.entregable_id === e.id && x.aprobado)).length
    return { total: lista.length, hechos }
  }
  function motivo(st, s, m) {
    if (faltaFirma) return faltaFirma
    if (!st) return 'Cargando…'
    if (!st.total) return 'El grupo aún no tiene clases programadas'
    if (!st.terminado) return `El curso no terminó (${st.dictadas}/${st.total} clases con asistencia)`
    if (st.pct < MIN_ASISTENCIA) return `Asistencia ${st.pct} % (mínimo ${MIN_ASISTENCIA} %)`
    if (s.req === 'completo') {
      if (st.pctPart < MIN_PARTICIPACION) return `Participación ${st.pctPart} % (mínimo ${MIN_PARTICIPACION} %)`
      const en = entrega(m, s)
      if (en.total) { if (en.hechos < en.total) return `Trabajo final aprobado ${en.hechos}/${en.total} (falta por aprobar)` }
      else if (!entrego[m.id]) return 'Marca «Entregó todo a tiempo»'
    }
    return ''
  }

  async function emitir(m, a, s, st) {
    const fila = {
      tipo: s.tipo, matricula_id: m.id, alumno_id: m.alumno_id, alumno_nombre: nombreDe(a), alumno_doc: a.documento || '', alumno_codigo: a.codigo || '',
      curso_titulo: s.curso, horas: s.horas, grupo_codigo: m.grupo_codigo || '', fecha_inicio: fechaISOLima(st.clases[0].inicio), fecha_fin: fechaISOLima(st.clases[st.clases.length - 1].fin),
      fecha_emision: hoyLima(), asistencia: st.pct, participacion: st.pctPart,
      instructor_clave: String(instr.id), instructor_nombre: instr.nombre, direccion_nombre: dirF.nombre, direccion_cargo: dirF.cargo || 'Dirección Académica',
    }
    setBusy(m.id + s.clave)
    await hacer(async () => {
      const c = await emitirCertificado(fila, nuevoCodigo)
      descargarBlob(await generarPdf(datosPdf(c, data.firmas)), nombreArchivo(datosPdf(c)))
    }, 'Documento emitido y descargado')
    setBusy('')
  }
  async function descargar(c) {
    setBusy(c.id)
    try { descargarBlob(await generarPdf(datosPdf(c, data.firmas)), nombreArchivo(datosPdf(c))) } catch (e) { setErr(e.message) }
    setBusy('')
  }
  async function enviar(c) {
    if (!window.confirm(`¿Enviar ${TIPOS_CERT[c.tipo]} a ${c.alumno_nombre} por correo?`)) return
    setBusy('m' + c.id)
    await hacer(async () => { await enviarCertificadoCorreo(c, await generarPdf(datosPdf(c, data.firmas))) }, 'Correo enviado ✉️')
    setBusy('')
  }
  async function anular(c) {
    if (!window.confirm(`¿Anular ${TIPOS_CERT[c.tipo]} ${c.codigo} de ${c.alumno_nombre}? La verificación pública mostrará que fue anulado.`)) return
    await hacer(() => anularCertificado(c.id), 'Documento anulado')
  }
  async function ejemplo() {
    setBusy('ej')
    try {
      const e = EJEMPLO[tipoEj]
      const dd = (data.firmas || []).find((f) => f.clave === 'direccion')
      const d = { ...e, nombre: 'Nombre Apellido Apellido', emision: hoyLima(), codigo: 'EJEMPLO-000000', instructor: { nombre: instr?.nombre || '', firma: firmaDe(instr?.id)?.imagen || '' }, direccion: { nombre: dd?.nombre || '', cargo: dd?.cargo || '', firma: dd?.imagen || '' } }
      descargarBlob(await generarPdf(d), `Ejemplo-${tipoEj}.pdf`)
    } catch (e) { setErr(e.message) }
    setBusy('')
  }

  const registro = (data.certificados || []).filter((c) => !buscar.trim() || [c.codigo, c.alumno_nombre, c.alumno_doc, c.curso_titulo].join(' ').toLowerCase().includes(buscar.trim().toLowerCase())).slice(0, 150)

  return (
    <>
      <div className="sechead">
        <div><h1>Certificados</h1><p>Emite constancias y certificados con QR. Constancia: asistencia desde {MIN_ASISTENCIA} %. Certificado: además participación desde {MIN_PARTICIPACION} % y trabajo final aprobado. Solo se emiten cuando termina el curso.</p></div>
        <div className="secact cform">
          <select value={tipoEj} onChange={(e) => setTipoEj(e.target.value)} aria-label="Tipo de ejemplo">{Object.keys(EJEMPLO).map((k) => <option key={k} value={k}>{TIPOS_CERT[k]}</option>)}</select>
          <button className="btn btn-line sm" onClick={ejemplo} disabled={busy === 'ej'}>{busy === 'ej' ? 'Generando…' : 'Ver ejemplo (PDF)'}</button>
        </div>
      </div>
      {data.certificadosError && <p className="banner">Falta pegar <b>certificados.sql</b> en Supabase (SQL Editor): {data.certificadosError}</p>}
      {err && <p className="banner" role="alert">{err}</p>}

      {gerente && <Firmas data={data} hacer={hacer} />}
      <EntregablesEditor data={data} hacer={hacer} />

      <h3>Emitir por grupo</h3>
      {!grupos.length && <div className="vacio"><p>Aún no hay grupos con alumnos inscritos.</p></div>}
      {grupos.length > 0 && (
        <>
          <div className="cform" style={{ maxWidth: 560, marginBottom: 12 }}>
            <select style={{ width: '100%' }} value={gid} onChange={(e) => setGid(e.target.value)} aria-label="Grupo">
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.codigo || 'Grupo'} · {cursoDe(g.curso_id)?.titulo || ''}{g.inicio ? ` · inicio ${fechaCorta(g.inicio)}` : ''}</option>)}
            </select>
          </div>
          {faltaFirma && <p className="banner">⚠️ {faltaFirma} Mientras tanto no se pueden emitir documentos de este grupo.</p>}
          {curso && esClub(curso.titulo) && <p className="note">Club Ofimática: constancia y certificado del Club, más un certificado por programa (Word, Excel y PowerPoint, en ese orden de {CLASES_POR_PROGRAMA} clases cada uno).</p>}
          <div className="cons-wrap"><table className="cons-table" style={{ minWidth: 820 }}>
            <thead><tr><th>Alumno</th><th>Asistencia</th><th>Participación</th><th>Trabajo final</th><th>Documentos</th></tr></thead>
            <tbody>
              {filas.map(({ m, a }) => {
                const specs = documentosDe({ curso_titulo: m.curso_titulo || curso?.titulo, horas: cursoDe(m.curso_id)?.horas || curso?.horas })
                const g0 = stats(m, specs[0])
                return (
                  <tr key={m.id}>
                    <td><b>{nombreDe(a) || '—'}</b><small className="paq">{a.codigo || ''}</small></td>
                    <td>{g0 ? (g0.dictadas ? `${g0.asistio}/${g0.dictadas} (${g0.pct} %)` : '—') : '…'}</td>
                    <td>{g0 ? (g0.dictadas ? `${g0.participo}/${g0.dictadas} (${g0.pctPart} %)` : '—') : '…'}</td>
                    <td>{(() => { const en = entrega(m); return en.total ? <span className={en.hechos === en.total ? '' : 'err'}>{en.hechos}/{en.total}{en.hechos === en.total ? ' ✅' : ''}</span> : <input type="checkbox" checked={Boolean(entrego[m.id])} onChange={(e) => setEntrego({ ...entrego, [m.id]: e.target.checked })} aria-label="Entregó todo a tiempo" title="Este curso no tiene entregables definidos: marca a mano" /> })()}</td>
                    <td>
                      {specs.map((s) => {
                        const ya = emitido(m, s)
                        const st = stats(m, s)
                        const falta = ya ? '' : motivo(st, s, m)
                        return (
                          <div key={s.clave} className="cert-doc">
                            <span>{etiqueta(s)}</span>
                            {ya
                              ? <><button className="btn btn-line sm" disabled={busy === ya.id} onClick={() => descargar(ya)}>⬇ PDF</button><small>{ya.codigo}</small></>
                              : <button className="btn btn-teal sm" disabled={Boolean(falta) || busy === m.id + s.clave} title={falta} onClick={() => emitir(m, a, s, st)}>Emitir</button>}
                            {!ya && falta && <small className="cert-falta">{falta}</small>}
                          </div>
                        )
                      })}
                    </td>
                  </tr>
                )
              })}
              {!filas.length && <tr><td colSpan={5}>Este grupo no tiene alumnos activos.</td></tr>}
            </tbody>
          </table></div>
        </>
      )}

      <h3 style={{ marginTop: 28 }}>Registro de documentos emitidos</h3>
      <div className="cform" style={{ maxWidth: 380, marginBottom: 10 }}><input style={{ width: '100%' }} value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre, DNI, curso o número" aria-label="Buscar" /></div>
      {!registro.length && <div className="vacio"><p>Aún no se emitió ningún documento.</p></div>}
      {registro.length > 0 && (
        <div className="cons-wrap"><table className="cons-table" style={{ minWidth: 820 }}>
          <thead><tr><th>Número</th><th>Alumno</th><th>Documento</th><th>Curso</th><th>Emitido</th><th>Estado</th><th /></tr></thead>
          <tbody>{registro.map((c) => (
            <tr key={c.id}><td><b>{c.codigo}</b></td><td>{c.alumno_nombre}<small className="paq">{c.alumno_doc}</small></td><td>{TIPOS_CERT[c.tipo]}</td><td>{c.curso_titulo}</td><td>{fechaCorta(c.fecha_emision)}</td>
              <td>{c.estado === 'vigente' ? '✅ Vigente' : '🚫 Anulado'}</td>
              <td className="acc"><button className="btn btn-line sm" onClick={() => descargar(c)} disabled={busy === c.id}>⬇ PDF</button>{c.estado === 'vigente' && <button className="btn btn-line sm" onClick={() => enviar(c)} disabled={busy === 'm' + c.id} title={c.enviado_en ? 'Ya enviado el ' + fechaCorta(c.enviado_en) + ': enviar de nuevo' : 'Enviar por correo'}>{c.enviado_en ? '✉️ Reenviar' : '✉️ Enviar'}</button>}{c.estado === 'vigente' && <button className="btn btn-line sm" onClick={() => anular(c)}>Anular</button>}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  )
}
