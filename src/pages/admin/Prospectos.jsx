import { useEffect, useMemo, useState } from 'react'
import Icon from '../../components/Icons'
import { proximoRecontacto, recontactoVencido } from '../../lib/ventas'
import { waTel } from '../../lib/formato.js'
import { descuentoMaxPct } from '../../lib/moneda.js'
import { variables as variablesManual, presentacion as presentacionManual, oferta as ofertaManual, faqs as faqsManual, seguimientos as seguimientosManual, cierres as cierresManual, casos as casosManual, PASOS as PASOS_MANUAL, REGLAS as REGLAS_MANUAL, NO_DECIR as NO_DECIR_MANUAL } from '../../lib/manual.js'
import { hasBackend, remove, fechaCorta, consultasCSV, interesadosCSV, marcarConsulta, seguimientoInteresado, reasignarInteresado, guardarProspecto, consultaAProspecto, asesoraNombre, grupoParaOferta, guionesVenta, borrarProspecto, ESTADOS_PROSPECTO, TIPOS_PROSPECTO, ORIGENES } from '../../lib/data.js'
import { Confirmar, Drawer, Seccion, Switch } from '../../components/ui.jsx'

/* ================= CONSULTAS (formulario de la web) ================= */
export function Consultas({ data, hacer, tabla = 'consultas', onInscribir, rolG = true }) {
  const esInt = tabla === 'interesados'
  const lista = data[tabla] || []
  const errTabla = esInt ? data.interesadosError : data.consultasError
  const [ver, setVer] = useState('todas')
  const [borrando, setBorrando] = useState(null)
  const nuevas = lista.filter((x) => x.estado === 'nuevo').length
  const mostrar = ver === 'nuevas' ? lista.filter((x) => x.estado === 'nuevo') : lista
  const bajar = () => {
    const blob = new Blob([(esInt ? interesadosCSV : consultasCSV)(lista)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${tabla}-ccn-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const cuando = (iso) => iso ? new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <>
      <Seccion titulo={esInt ? 'Interesados' : 'Consultas'} ayuda={esInt ? 'Aquí llegan las personas que se inscriben desde la página de cada curso (antes de seguir por WhatsApp). Solo las ve el equipo de CCN. Puedes descargarlas en Excel.' : 'Aquí llegan las solicitudes del formulario de la web. Solo las ve el equipo de CCN. Puedes descargarlas en Excel.'}>
        <button className="btn btn-line" onClick={() => setVer(ver === 'todas' ? 'nuevas' : 'todas')}>{ver === 'todas' ? `Ver solo nuevas (${nuevas})` : 'Ver todas'}</button>
        <button className="btn btn-teal" onClick={bajar} disabled={!lista.length}>Descargar Excel</button>
      </Seccion>
      {errTabla && hasBackend && (
        <p className="banner">Falta crear la tabla de {esInt ? 'interesados' : 'consultas'} en Supabase (paso del SQL). Mensaje: {errTabla}</p>
      )}
      {mostrar.length === 0 && !errTabla && <div className="vacio"><p>{lista.length ? (esInt ? 'No hay interesados nuevos.' : 'No hay solicitudes nuevas.') : (esInt ? 'Aún no se inscribe nadie.' : 'Aún no llega ninguna solicitud.')}</p></div>}
      {mostrar.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table">
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Documento</th><th>Celular</th><th>Email</th>{!esInt && <th>Modalidad</th>}<th>Curso</th><th>{esInt ? 'Contactado' : 'Atendida'}</th>{esInt && onInscribir && <th />}<th /></tr></thead>
            <tbody>
              {mostrar.map((x) => (
                <tr key={x.id} className={x.estado === 'nuevo' ? 'nueva' : ''}>
                  <td>{cuando(x.creado)}</td>
                  <td><b>{x.nombres} {x.apellido_paterno} {x.apellido_materno}</b></td>
                  <td>{x.tipo_doc} {x.documento}</td>
                  <td><a href={`https://wa.me/${String(x.celular).replace(/\D/g, '').replace(/^(\d{9})$/, '51$1')}`} target="_blank" rel="noopener noreferrer">{x.celular}</a></td>
                  <td>{x.email}</td>
                  {!esInt && <td>{x.modalidad}</td>}
                  <td>{esInt ? <>{x.curso}{x.lista_espera && <> <b>(lista de espera)</b></>}</> : (x.curso === 'Otro' ? `Otro: ${x.otro_tema}` : x.curso)}</td>
                  <td><Switch on={x.estado !== 'nuevo'} label={`Atendida: ${x.nombres}`} onChange={(v) => hacer(async () => { await marcarConsulta(x.id, v ? 'atendida' : 'nuevo', tabla); if (v && !esInt) await consultaAProspecto(x, data.prospectos || []) }, v ? (esInt ? 'Marcado como atendido' : 'Atendida ✅ y pasada a Prospectos') : 'Marcado como nuevo')} /></td>
                  {esInt && onInscribir && <td><button className="btn btn-line sm" onClick={() => onInscribir(x)}>Inscribir</button></td>}
                  <td>{rolG && <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar"><Icon n="trash" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {borrando && (
        <Confirmar texto={`¿Borrar el registro de ${borrando.nombres} ${borrando.apellido_paterno}?`} onNo={() => setBorrando(null)}
          onSi={() => { const x = borrando; setBorrando(null); hacer(() => remove(tabla, x.id), esInt ? 'Interesado borrado' : 'Solicitud borrada') }} />
      )}
    </>
  )
}

/* ================= INTERESADOS (vienen de la web; el vendedor los trabaja) ================= */
export function FilaInteresado({ x, hacer, onInscribir, onProspecto, gerente, onBorrar, vendedoras }) {
  const [obs, setObs] = useState(x.observacion || '')
  useEffect(() => setObs(x.observacion || ''), [x.observacion])
  const cuando = (iso) => iso ? new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  const cont = x.estado !== 'nuevo'
  return (
    <tr className={cont ? '' : 'nueva'}>
      <td>{cuando(x.creado)}</td>
      <td><b>{x.nombres} {x.apellido_paterno} {x.apellido_materno}</b><small className="paq">{x.tipo_doc} {x.documento}{x.email && <> · {x.email}</>}</small></td>
      <td><a href={waTel(x.celular)} target="_blank" rel="noopener noreferrer">{x.celular}</a></td>
      <td>{x.curso}{x.lista_espera && <small className="paq"><b>Lista de espera</b></small>}</td>
      {gerente && (
        <td>
          <select aria-label={`Derivado a, ${x.nombres}`} value={x.asignado_a || ''} onChange={(e) => hacer(() => reasignarInteresado(x.id, e.target.value), 'Reasignado')}>
            <option value="">Sin asignar</option>
            {vendedoras.map((v) => <option key={v} value={v}>{v.split('@')[0]}</option>)}
          </select>
          <small className="paq">{x.estado === 'nuevo' ? (x.asignado_a ? 'Pendiente' : 'Sin derivar') : 'Atendido'}</small>
        </td>
      )}
      <td><Switch on={cont} label={`Contactado: ${x.nombres}`} onChange={(v) => hacer(() => seguimientoInteresado(x.id, { contactado: v }), v ? 'Marcado como contactado' : 'Marcado sin contactar')} />
        {cont && x.contactado_por && <small className="paq">{x.contactado_por.split('@')[0]}, {cuando(x.contactado_en)}</small>}</td>
      <td>
        <select aria-label={`¿Contestó? ${x.nombres}`} disabled={!cont} value={x.contesto === true ? 'si' : x.contesto === false ? 'no' : ''}
          onChange={(e) => hacer(() => seguimientoInteresado(x.id, { contesto: e.target.value === '' ? null : e.target.value === 'si' }), 'Guardado')}>
          <option value="">—</option><option value="si">Sí</option><option value="no">No</option>
        </select>
      </td>
      <td><input className="obs" aria-label={`Observación ${x.nombres}`} value={obs} placeholder="Observación…" disabled={!cont}
        onChange={(e) => setObs(e.target.value)} onBlur={() => obs !== (x.observacion || '') && hacer(() => seguimientoInteresado(x.id, { observacion: obs }), 'Observación guardada')} /></td>
      <td className="acc">
        <button className="btn btn-line sm" onClick={() => onInscribir(x)}>Inscribir</button>
        <button className="btn btn-line sm" onClick={() => onProspecto(x)}>A prospectos</button>
        {gerente && <button className="ib red" onClick={() => onBorrar(x)} aria-label="Borrar"><Icon n="trash" /></button>}
      </td>
    </tr>
  )
}

export function Interesados({ data, hacer, onInscribir, onProspecto, gerente }) {
  const [ver, setVer] = useState('todos')
  const [de, setDe] = useState('')
  const [borrando, setBorrando] = useState(null)
  const vendedoras = (data.equipo || []).filter((e) => e.rol === 'vendedora').map((e) => e.email)
  const lista = (data.interesados || []).filter((x) => !de || (de === '_' ? !x.asignado_a : x.asignado_a === de))
  const filtros = { todos: lista, sin: lista.filter((x) => x.estado === 'nuevo'), cont: lista.filter((x) => x.estado !== 'nuevo'), no: lista.filter((x) => x.estado !== 'nuevo' && x.contesto === false) }
  const mostrar = filtros[ver]
  const bajar = () => {
    const blob = new Blob([interesadosCSV(lista)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `interesados-ccn-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <>
      <Seccion titulo="Interesados" ayuda={gerente ? "Cada interesado de la web se deriva solo a una vendedora. Aquí ves a quién, si ya fue atendido y quién lo atendió. Puedes reasignarlo." : "Los interesados que la web te derivó. Márcalos cuando los contactes, anota si contestaron y qué pasó."}>
        <button className="btn btn-line" onClick={bajar} disabled={!lista.length}>Descargar Excel</button>
      </Seccion>
      {data.interesadosError && hasBackend && <p className="banner">Falta crear la tabla de interesados en Supabase. Mensaje: {data.interesadosError}</p>}
      <div className="kpis">
        <div><b>{lista.length}</b><span>interesados</span></div>
        <div><b>{filtros.sin.length}</b><span>sin contactar</span></div>
        <div><b>{filtros.cont.length}</b><span>contactados</span></div>
        <div><b>{filtros.no.length}</b><span>no contestaron</span></div>
      </div>
      <div className="filtros">
        <label>Mostrar
          <select id="i-ver" value={ver} onChange={(e) => setVer(e.target.value)}>
            <option value="todos">Todos</option><option value="sin">Sin contactar</option><option value="cont">Contactados</option><option value="no">No contestaron</option>
          </select>
        </label>
        {gerente && (
          <label>Derivado a
            <select id="i-de" value={de} onChange={(e) => setDe(e.target.value)}>
              <option value="">Todos</option><option value="_">Sin asignar</option>{vendedoras.map((v) => <option key={v} value={v}>{v.split('@')[0]}</option>)}
            </select>
          </label>
        )}
      </div>
      {mostrar.length === 0 && !data.interesadosError && <div className="vacio"><p>{lista.length ? 'No hay interesados en este filtro.' : 'Aún no se inscribe nadie desde la web.'}</p></div>}
      {mostrar.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table insc">
            <thead><tr><th>Fecha</th><th>Interesado</th><th>Celular</th><th>Curso</th>{gerente && <th>Derivado a</th>}<th>Contactado</th><th>¿Contestó?</th><th>Observación</th><th /></tr></thead>
            <tbody>{mostrar.map((x) => <FilaInteresado key={x.id} x={x} hacer={hacer} onInscribir={onInscribir} onProspecto={onProspecto} gerente={gerente} onBorrar={setBorrando} vendedoras={vendedoras} />)}</tbody>
          </table>
        </div>
      )}
      {borrando && (
        <Confirmar texto={`¿Borrar el registro de ${borrando.nombres} ${borrando.apellido_paterno}?`} onNo={() => setBorrando(null)}
          onSi={() => { const x = borrando; setBorrando(null); hacer(() => remove('interesados', x.id), 'Interesado borrado') }} />
      )}
    </>
  )
}

/* ================= MANUAL DE VENTAS (speeches y respuestas, se arma solo con cada curso) ================= */
export function ManualVentas({ data, email }) {
  const [tab, setTab] = useState('guia')
  const [cursoId, setCursoId] = useState('')
  const [asesora, setAsesora] = useState(asesoraNombre(email, data.trabajadores))
  const [nombre, setNombre] = useState('')
  const [monedaMan, setMonedaMan] = useState('PEN')
  const [q, setQ] = useState('')
  const [grupoFaq, setGrupoFaq] = useState('Todas')
  const [copiado, setCopiado] = useState('')
  const curso = data.cursos.find((c) => c.id === cursoId) || null
  const grupo = curso ? grupoParaOferta(data.grupos, curso.id) : null
  const v = useMemo(() => variablesManual({ asesora, nombre: nombre.trim().split(/\s+/)[0], curso, grupo, cursos: data.cursos, descMax: descuentoMaxPct(data.ajustes), moneda: monedaMan }), [asesora, nombre, curso, grupo, data.cursos, data.ajustes, monedaMan])
  const copiar = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopiado(k); setTimeout(() => setCopiado(''), 1800) } catch { window.prompt('Copia el mensaje:', t) } }
  const Msg = ({ k, titulo, texto, nota, aviso }) => (
    <section className="guion-b" key={k}>
      <h4>{titulo}</h4>
      {aviso && <span className="pill warn">⚠️ Por confirmar con gerencia</span>}
      <pre>{texto}</pre>
      {nota && <small>{nota}</small>}
      <div className="btns"><button className="btn btn-line sm" onClick={() => copiar(k, texto)}>{copiado === k ? '✓ Copiado' : 'Copiar'}</button></div>
    </section>
  )
  const lista = faqsManual(v)
  const grupos = ['Todas', ...Array.from(new Set(lista.map((f) => f.g)))]
  const nq = q.trim().toLowerCase()
  const filtradas = lista.filter((f) => (grupoFaq === 'Todas' || f.g === grupoFaq) && (!nq || (f.q + ' ' + f.a).toLowerCase().includes(nq)))
  const TABS = [['guia', 'Guía rápida'], ['pres', 'Presentación'], ['faq', 'Preguntas frecuentes'], ['seg', 'Seguimiento'], ['cierre', 'Cierre y pago'], ['casos', 'Casos especiales']]
  return (
    <>
      <Seccion titulo="Manual de ventas" ayuda="Speeches listos para copiar. Se completan solos con el precio, la fecha, el horario y los cupos reales del curso que elijas." />
      <div className="fs" style={{ marginBottom: 12 }}>
        <div className="manual-fila">
          <label>Curso
            <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
              <option value="">Elegir curso…</option>{data.cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
            </select>
          </label>
          <label>Moneda del cliente
            <select value={monedaMan} onChange={(e) => setMonedaMan(e.target.value)}>
              <option value="PEN">Soles (S/)</option><option value="USD">Dólares (US$)</option>
            </select>
          </label>
          <label>Mi nombre (asesora)
            <input value={asesora} onChange={(e) => setAsesora(e.target.value)} />
          </label>
          <label>Nombre del cliente (opcional)
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. María" />
          </label>
        </div>
        {curso && !grupo && <p className="note">⚠️ Este curso no tiene un grupo abierto con fecha. Los mensajes dirán “fecha por confirmar”. Revisa en Grupos.</p>}
        {curso && grupo && <p className="note">Grupo usado: inicia el {v.fecha}{v.dias ? `, ${v.dias}` : ''}{v.horario ? ` de ${v.horario}` : ''} · quedan {v.cupos} cupos.</p>}
      </div>
      <div className="tabs2">{TABS.map(([k, n]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{n}</button>)}</div>

      {tab === 'guia' && (
        <div className="fs">
          <h4>Los 8 pasos de una venta</h4>
          <ol className="manual-pasos">{PASOS_MANUAL.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ol>
          <h4>Reglas de oro</h4>
          <ul className="manual-reglas">{REGLAS_MANUAL.map((r) => <li key={r}>{r}</li>)}</ul>
          <h4>Evita decir…</h4>
          <div className="manual-nodecir">{NO_DECIR_MANUAL.map(([a, b]) => <p key={a}><b>✖ {a}</b><span>{b}</span></p>)}</div>
        </div>
      )}

      {tab === 'pres' && (!curso
        ? <p className="note">Elige un curso arriba para armar el mensaje de presentación y la oferta.</p>
        : <>
          <p className="note">Orden: envía el flyer del curso → mensaje de presentación → mensaje de fecha, precio y cierre → temario en PDF.</p>
          <Msg k="p" titulo="1 · Presentación del curso" texto={presentacionManual(v, curso)} nota="Antes de este mensaje, envía el flyer del curso." />
          <Msg k="o" titulo="2 · Fecha, precio y cierre" texto={ofertaManual(v, curso)} nota="Incluye los cupos reales del grupo (máximo menos inscritos). Después envía el temario en PDF." />
        </>)}

      {tab === 'faq' && (
        <>
          <div className="fs">
            <input placeholder="Buscar una pregunta… (ej. caro, certificado, Mac)" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="chips">{grupos.map((g) => <button key={g} className={grupoFaq === g ? 'sel' : ''} onClick={() => setGrupoFaq(g)}>{g}</button>)}</div>
            {!curso && <p className="note">Elige un curso arriba para que las respuestas se completen con su precio, fecha y horario. Lo que falte aparece entre [corchetes].</p>}
          </div>
          {filtradas.length === 0 && <p className="note">No encontré esa pregunta. Si te la hacen, avisa a gerencia para sumarla al manual.</p>}
          {filtradas.map((f, i) => <Msg key={f.q} k={`f${i}`} titulo={f.q} texto={f.a} nota={f.tip ? `💡 ${f.tip}` : ''} aviso={f.pendiente} />)}
        </>
      )}

      {tab === 'seg' && <>
        <p className="note">Máximo 3 intentos. Después del tercero, marca el prospecto como perdido.</p>
        {seguimientosManual(v).map((s) => <Msg key={s.id} k={s.id} titulo={s.t} texto={s.a} nota={s.nota} />)}
      </>}
      {tab === 'cierre' && cierresManual(v).map((s) => <Msg key={s.id} k={s.id} titulo={s.t} texto={s.a} nota={s.nota} />)}
      {tab === 'casos' && casosManual(v).map((s) => <Msg key={s.id} k={s.id} titulo={s.t} texto={s.a} nota={s.nota} aviso={s.pendiente} />)}
    </>
  )
}

/* ================= PROSPECTOS (base propia del vendedor) ================= */
export function GuionVenta({ p, data, email, onClose }) {
  const [cursoId, setCursoId] = useState((data.cursos.find((c) => c.titulo === p.curso) || {}).id || '')
  const [copiado, setCopiado] = useState('')
  const curso = data.cursos.find((c) => c.id === cursoId) || null
  const grupo = curso ? grupoParaOferta(data.grupos, curso.id) : null
  const g = guionesVenta({ asesora: asesoraNombre(email, data.trabajadores), nombre: String(p.nombres || '').trim().split(/\s+/)[0], curso, grupo })
  const copiar = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopiado(k); setTimeout(() => setCopiado(''), 1800) } catch { window.prompt('Copia el mensaje:', t) } }
  const abrir = (t) => window.open(`${waTel(p.celular)}?text=${encodeURIComponent(t)}`, '_blank', 'noopener')
  const bloque = (k, titulo, t, nota) => t ? (
    <section className="guion-b" key={k}>
      <h4>{titulo}</h4>
      <pre>{t}</pre>
      {nota && <small>{nota}</small>}
      <div className="btns">
        <button className="btn btn-line sm" onClick={() => copiar(k, t)}>{copiado === k ? '✓ Copiado' : 'Copiar'}</button>
        {p.celular && <button className="btn btn-teal sm" onClick={() => abrir(t)}>Abrir en WhatsApp</button>}
      </div>
    </section>
  ) : null
  return (
    <Drawer titulo={`Guion · ${p.nombres}`} onClose={onClose} pie={<button className="btn btn-line" onClick={onClose}>Cerrar</button>}>
      <div className="fs">
        <p className="note">Orden: 1) saludo → 2) cuando responda, sube sus datos → 3) envía el flyer del curso y el mensaje de fecha, precio y cierre → 4) el temario en PDF.</p>
        {bloque('s', '1 · Saludo', g.saludo)}
        <label>Curso de interés
          <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
            <option value="">Elegir curso…</option>{data.cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </label>
        {!curso && <p className="note">Elige el curso para armar el mensaje con su precio, fecha y cupos.</p>}
        {bloque('o', '3 · Fecha, precio y cierre (después del flyer)', g.oferta, 'Antes de este mensaje envía la imagen (flyer) del curso.')}
        {curso && !grupo && <p className="note">⚠️ Este curso no tiene un grupo abierto con fecha. Revisa en Grupos.</p>}
      </div>
    </Drawer>
  )
}

export function Prospectos({ data, hacer, gerente, inicial, onCerrarInicial, email }) {
  const [guion, setGuion] = useState(null)
  const [rapido, setRapido] = useState({ nombres: '', celular: '', curso: '' })
  const dig9 = (t) => String(t || '').replace(/\D/g, '').slice(-9)
  const agregarRapido = () => hacer(async () => {
    const dup = dig9(rapido.celular) && (data.prospectos || []).find((x) => dig9(x.celular) === dig9(rapido.celular))
    if (dup) throw new Error(`Ya existe un prospecto con ese celular: ${dup.nombres}.`)
    await guardarProspecto({ nombres: rapido.nombres, celular: rapido.celular, curso: rapido.curso, origen: 'WhatsApp', estado: 'nuevo', tipo: 'medio' })
    setRapido({ nombres: '', celular: '', curso: '' })
  }, 'Prospecto agregado ⚡')
  const [form, setForm] = useState(inicial || null)
  const [ver, setVer] = useState('')
  const [fTipo, setFTipo] = useState('')
  const [fCurso, setFCurso] = useState('')
  const [fOrigen, setFOrigen] = useState('')
  const [fVend, setFVend] = useState('')
  const [fVenc, setFVenc] = useState(false)
  const [orden, setOrden] = useState('reciente')
  const [q, setQ] = useState('')
  const [borrando, setBorrando] = useState(null)
  const hoy = new Date().toISOString().slice(0, 10)
  const todos = data.prospectos || []
  const venc = (p) => { const r = proximoRecontacto(p); const f = r ? r.fecha : p.seguimiento; return !!f && f <= hoy && !['inscrito', 'perdido'].includes(p.estado) }
  const rank = { alto: 0, medio: 1, bajo: 2 }
  const hayFiltro = ver || fTipo || fCurso || fOrigen || fVend || fVenc || q.trim()
  const lista = todos.filter((p) => (!ver || p.estado === ver) && (!fTipo || (p.tipo || 'medio') === fTipo) && (!fCurso || p.curso === fCurso) && (!fOrigen || p.origen === fOrigen) && (!fVend || p.vendedor === fVend) && (!fVenc || venc(p)) && (!q.trim() || `${p.nombres} ${p.celular} ${p.curso} ${p.notas}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => orden === 'tipo' ? (rank[a.tipo || 'medio'] - rank[b.tipo || 'medio']) || String(b.creado).localeCompare(String(a.creado)) : orden === 'nombre' ? String(a.nombres).localeCompare(String(b.nombres)) : String(b.creado).localeCompare(String(a.creado)))
  const vendedoresP = [...new Set(todos.map((p) => p.vendedor).filter(Boolean))]
  const limpiar = () => { setVer(''); setFTipo(''); setFCurso(''); setFOrigen(''); setFVend(''); setFVenc(false); setQ('') }
  const activos = todos.filter((p) => !['inscrito', 'perdido'].includes(p.estado))
  const vencidos = activos.filter((p) => { const r = proximoRecontacto(p); return r ? r.fecha <= hoy : (p.seguimiento && p.seguimiento <= hoy) })
  const cerrar = () => { setForm(null); onCerrarInicial && onCerrarInicial() }
  const cambiar = (p, cambios) => hacer(() => guardarProspecto({ ...p, ...cambios }), 'Guardado')
  return (
    <>
      <Seccion titulo="Prospectos" ayuda={gerente ? 'La base de prospectos de cada vendedor.' : 'Tu base de prospectos: gente que conseguiste por WhatsApp, redes o referidos.'}>
        <button className="btn btn-teal" onClick={() => setForm({ nombres: '', celular: '', curso: '', origen: 'WhatsApp', estado: 'nuevo', tipo: 'medio', seguimiento: '', notas: '', recontactar1: '', recontactar2: '' })}>+ Nuevo prospecto</button>
      </Seccion>
      {data.prospectosError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. Mensaje: {data.prospectosError}</p>}
      <form className="rapido" onSubmit={(e) => { e.preventDefault(); agregarRapido() }}>
        <b>⚡ Registro rápido</b>
        <input aria-label="Nombre" placeholder="Nombre" value={rapido.nombres} onChange={(e) => setRapido({ ...rapido, nombres: e.target.value })} />
        <input aria-label="Celular" inputMode="tel" placeholder="Celular" value={rapido.celular} onChange={(e) => setRapido({ ...rapido, celular: e.target.value })} />
        <select aria-label="Curso" value={rapido.curso} onChange={(e) => setRapido({ ...rapido, curso: e.target.value })}>
          <option value="">Curso (opcional)</option>{data.cursos.map((c) => <option key={c.id} value={c.titulo}>{c.titulo}</option>)}
        </select>
        <button className="btn btn-teal sm" type="submit" disabled={rapido.nombres.trim().length < 2}>Agregar</button>
      </form>
      <div className="kpis">
        <div><b>{todos.length}</b><span>prospectos</span></div>
        <div><b>{activos.length}</b><span>en seguimiento</span></div>
        <div><b>{vencidos.length}</b><span>seguimientos de hoy o vencidos</span></div>
        <div><b>{activos.filter((p) => p.tipo === 'alto').length}</b><span>de tipo alto en seguimiento</span></div>
        <div><b>{todos.filter((p) => p.estado === 'inscrito').length}</b><span>inscritos</span></div>
      </div>
      <div className="filtros">
        <label>Tipo
          <select id="p-tipo" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
            <option value="">Todos</option>{Object.entries(TIPOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Estado
          <select id="p-est" value={ver} onChange={(e) => setVer(e.target.value)}>
            <option value="">Todos</option>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Curso
          <select id="p-cur" value={fCurso} onChange={(e) => setFCurso(e.target.value)}>
            <option value="">Todos</option>{[...new Set(todos.map((p) => p.curso).filter(Boolean))].sort().map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Origen
          <select id="p-ori" value={fOrigen} onChange={(e) => setFOrigen(e.target.value)}>
            <option value="">Todos</option>{ORIGENES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        {gerente && <label>Vendedor
          <select id="p-ven" value={fVend} onChange={(e) => setFVend(e.target.value)}>
            <option value="">Todos</option>{vendedoresP.map((v) => <option key={v} value={v}>{v.split('@')[0]}</option>)}
          </select>
        </label>}
        <label>Ordenar por
          <select id="p-ord" value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="reciente">Más recientes</option><option value="tipo">Tipo (alto primero)</option><option value="nombre">Nombre (A-Z)</option>
          </select>
        </label>
        <label className="chk"><input type="checkbox" checked={fVenc} onChange={(e) => setFVenc(e.target.checked)} /> Solo seguimientos de hoy o vencidos</label>
        <label className="buscar">Buscar<input id="p-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, celular, curso o notas" /></label>
        {hayFiltro && <button className="btn btn-line sm" onClick={limpiar}>Limpiar filtros</button>}
      </div>
      {hayFiltro && <p className="muted-s">Mostrando {lista.length} de {todos.length} prospectos.</p>}
      {lista.length === 0 && <div className="vacio"><p>{todos.length ? 'No hay prospectos con ese filtro.' : 'Aún no hay prospectos. Agrega el primero.'}</p></div>}
      {lista.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table insc">
            <thead><tr><th>Prospecto</th>{gerente && <th>Vendedor</th>}<th>Tipo</th><th>Curso</th><th>Origen</th><th>Estado</th><th>Seguimiento</th><th>Notas</th><th /></tr></thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className={(() => { const r = proximoRecontacto(p); const f = r ? r.fecha : p.seguimiento; return f && f <= hoy && !['inscrito', 'perdido'].includes(p.estado) ? 'nueva' : '' })()}>
                  <td><b>{p.nombres}</b>{p.celular && <small className="paq"><a href={waTel(p.celular)} target="_blank" rel="noopener noreferrer">{p.celular}</a></small>}</td>
                  {gerente && <td>{(p.vendedor || '').split('@')[0]}</td>}
                  <td><select aria-label={`Tipo de ${p.nombres}`} className={`tipo-${p.tipo || 'medio'}`} value={p.tipo || 'medio'} onChange={(e) => cambiar(p, { tipo: e.target.value })}>{Object.entries(TIPOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                  <td>{p.curso || '—'}</td>
                  <td>{p.origen}</td>
                  <td><select aria-label={`Estado de ${p.nombres}`} value={p.estado} onChange={(e) => cambiar(p, { estado: e.target.value })}>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                  <td>{(() => { const r = proximoRecontacto(p); const f = r ? r.fecha : p.seguimiento; return f ? <span className={recontactoVencido(p) ? 'vencido' : ''}>{fechaCorta(f)}{r ? ` · contacto ${r.etapa + 1}` : ''}{recontactoVencido(p) ? ' ⚠️' : ''}</span> : <small>{p.recontactar1 === 'no' || p.recontactar2 === 'no' ? 'No recontactar' : '—'}</small> })()}</td>
                  <td className="notas">{p.notas || '—'}</td>
                  <td className="acc">
                    <button className="btn btn-teal sm" onClick={() => setGuion(p)}>Guion</button>
                    <button className="btn btn-line sm" onClick={() => setForm(p)}>Editar</button>
                    <button className="ib red" onClick={() => setBorrando(p)} aria-label="Borrar"><Icon n="trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {guion && <GuionVenta p={guion} data={data} email={email} onClose={() => setGuion(null)} />}
      {form && (
        <Drawer titulo={form.id ? 'Editar prospecto' : 'Nuevo prospecto'} onClose={cerrar}
          pie={<><button className="btn btn-line" onClick={cerrar}>Cancelar</button>
            <button className="btn btn-teal" onClick={() => hacer(async () => { await guardarProspecto(form); cerrar() }, 'Prospecto guardado')}>Guardar</button></>}>
          <div className="fs">
            <label>Nombre<input id="pr-nom" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} /></label>
            <label>Celular<input id="pr-cel" inputMode="tel" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} /></label>
            <label>Curso de interés
              <select id="pr-cur" value={form.curso} onChange={(e) => setForm({ ...form, curso: e.target.value })}>
                <option value="">Sin definir</option>{data.cursos.map((c) => <option key={c.id} value={c.titulo}>{c.titulo}</option>)}
              </select>
            </label>
            <label>Tipo de prospecto<select value={form.tipo || 'medio'} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{Object.entries(TIPOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <div className="g2">
              <label>Origen<select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })}>{ORIGENES.map((o) => <option key={o}>{o}</option>)}</select></label>
              <label>Estado<select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            </div>
            <label>Notas generales<textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></label>
            {[1, 2].map((n) => {
              const f = (k) => `${k}${n}`
              const rc = form['recontactar' + n] || ''
              return (
                <fieldset key={n} className="contacto">
                  <legend>Contacto {n}{n === 1 ? ' · primera interacción' : ''}</legend>
                  <label>Fecha<input type="date" value={form['contacto' + n + '_fecha'] || ''} onChange={(e) => setForm({ ...form, ['contacto' + n + '_fecha']: e.target.value })} /></label>
                  <label>¿En qué quedó con el cliente?<textarea rows={2} value={form['contacto' + n + '_obs'] || ''} onChange={(e) => setForm({ ...form, ['contacto' + n + '_obs']: e.target.value })} /></label>
                  <div className="g2">
                    <label>¿Volver a contactar?
                      <select value={rc} onChange={(e) => setForm({ ...form, ['recontactar' + n]: e.target.value })}>
                        <option value="">Elegir…</option><option value="si">Sí</option><option value="no">No</option>
                      </select>
                    </label>
                    {rc === 'si' && <label>Volver a contactar el<input type="date" value={form['recontactar' + n + '_fecha'] || ''} onChange={(e) => setForm({ ...form, ['recontactar' + n + '_fecha']: e.target.value })} /></label>}
                  </div>
                  {n === 2 && rc === 'si' && <label className="chk"><input type="checkbox" checked={!!form.recontacto2_hecho} onChange={(e) => setForm({ ...form, recontacto2_hecho: e.target.checked })} /> Ya lo volví a contactar</label>}
                </fieldset>
              )
            })}
          </div>
        </Drawer>
      )}
      {borrando && (
        <Confirmar texto={`¿Borrar a ${borrando.nombres}?`} onNo={() => setBorrando(null)}
          onSi={() => { const p = borrando; setBorrando(null); hacer(() => borrarProspecto(p.id), 'Prospecto borrado') }} />
      )}
    </>
  )
}
