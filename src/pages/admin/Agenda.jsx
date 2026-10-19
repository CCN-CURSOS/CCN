import { useState } from 'react'
import Icon from '../../components/Icons'
import { lunesDe, fmtHM, MINIMO_SEMANA_MIN, nombreGrupoWa, gruposSinWhatsapp, horaCorta, proximoRecontacto, recontactoVencido, reporteSemana } from '../../lib/ventas'
import { hasBackend, fechaCorta, guardarPendiente, marcarPendiente, borrarPendiente, guardarNota, borrarNota } from '../../lib/data.js'
import { Confirmar, Drawer, Seccion } from '../../components/ui.jsx'
import { dosMon, hoyISO } from './util.js'

/* ================= AGENDA (pendientes, notas, calendario) ================= */
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']

export function PendienteForm({ inicial, onClose, onSave }) {
  const [f, setF] = useState(inicial)
  return (
    <Drawer titulo={f.id ? 'Editar pendiente' : (f.vendedor ? 'Asignar pendiente' : 'Nuevo pendiente')} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={() => onSave(f)}>Guardar</button></>}>
      <div className="fs">
        <label>¿Qué hay que hacer?<input id="pd-tit" value={f.titulo} maxLength={160} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
        <label>Detalle (opcional)<textarea rows={3} value={f.detalle || ''} onChange={(e) => setF({ ...f, detalle: e.target.value })} /></label>
        <label>Fecha límite (opcional)<input id="pd-fec" type="date" value={f.fecha_limite || ''} onChange={(e) => setF({ ...f, fecha_limite: e.target.value })} /></label>
      </div>
    </Drawer>
  )
}

export function ListaPendientes({ lista, email, hacer, gerente, onEditar }) {
  const hoy = hoyISO()
  const [borrando, setBorrando] = useState(null)
  if (!lista.length) return <div className="vacio"><p>Nada por aquí.</p></div>
  return (
    <>
      <ul className="pend">
        {lista.map((x) => {
          const hecho = x.estado === 'realizado'
          const asignado = x.creado_por && x.creado_por !== x.vendedor
          const vencido = !hecho && x.fecha_limite && x.fecha_limite < hoy
          const puedeEditar = !hecho && (gerente || !asignado)
          return (
            <li key={x.id} className={`${hecho ? 'hecho' : ''} ${vencido ? 'vencido' : ''}`}>
              <input type="checkbox" checked={hecho} disabled={hecho} aria-label={`Marcar como realizado: ${x.titulo}`}
                onChange={() => hacer(() => marcarPendiente(x.id), 'Pendiente realizado ✅')} />
              <div>
                <b>{x.titulo}</b>
                {x.detalle && <small>{x.detalle}</small>}
                <small>
                  {asignado && <span className="tag">Asignado por gerencia</span>}
                  {x.fecha_limite && <span> · Para el {fechaCorta(x.fecha_limite)}{vencido ? ' ⚠️ vencido' : ''}</span>}
                  {hecho && x.realizado_en && <span> · Hecho el {fechaCorta(x.realizado_en)}</span>}
                </small>
              </div>
              {puedeEditar && (
                <span className="acc">
                  <button className="btn btn-line sm" onClick={() => onEditar(x)}>Editar</button>
                  <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar"><Icon n="trash" /></button>
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {borrando && <Confirmar texto={`¿Borrar «${borrando.titulo}»?`} onNo={() => setBorrando(null)} onSi={() => { const x = borrando; setBorrando(null); hacer(() => borrarPendiente(x.id), 'Pendiente borrado') }} />}
    </>
  )
}

export function Calendario({ data, email }) {
  const hoy = hoyISO()
  const [mes, setMes] = useState(hoy.slice(0, 7))
  const [dia, setDia] = useState(hoy)
  const [y, m] = mes.split('-').map(Number)
  const primero = new Date(y, m - 1, 1)
  const offset = (primero.getDay() + 6) % 7
  const nd = new Date(y, m, 0).getDate()
  const eventos = {}
  const add = (f, e) => { if (!f) return; const k = String(f).slice(0, 10); (eventos[k] = eventos[k] || []).push(e) }
  ;(data.prospectos || []).filter((p) => !p.vendedor || p.vendedor === email).forEach((p) => {
    if (['inscrito', 'perdido'].includes(p.estado)) return
    const r = proximoRecontacto(p); if (r) add(r.fecha, { tipo: 'rc', txt: `Volver a contactar a ${p.nombres}`, sub: `Contacto ${r.etapa + 1}${p.celular ? ' · ' + p.celular : ''}`, venc: r.fecha < hoy })
  })
  ;(data.pendientes || []).filter((x) => x.vendedor === email && x.estado === 'pendiente').forEach((x) => add(x.fecha_limite, { tipo: 'pd', txt: x.titulo, sub: 'Pendiente', venc: x.fecha_limite < hoy }))
  ;(data.instalaciones || []).filter((x) => x.estado === 'agendada').forEach((x) => add(x.fecha, { tipo: 'in', txt: `Instalación${x.programa ? ': ' + x.programa : ''}`, sub: horaCorta ? horaCorta(x.hora) : x.hora }))
  const cambiar = (d) => { const f = new Date(y, m - 1 + d, 1); setMes(f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0')) }
  const celdas = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= nd; d++) celdas.push(`${mes}-${String(d).padStart(2, '0')}`)
  const sel = eventos[dia] || []
  return (
    <div className="calendario">
      <div className="cal-head">
        <button className="btn btn-line sm" onClick={() => cambiar(-1)} aria-label="Mes anterior">‹</button>
        <b>{MESES[m - 1]} {y}</b>
        <button className="btn btn-line sm" onClick={() => cambiar(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="cal-grid">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
        {celdas.map((f, i) => f === null ? <span key={'v' + i} /> : (
          <button key={f} className={`cal-d ${f === hoy ? 'hoy' : ''} ${f === dia ? 'sel' : ''}`} onClick={() => setDia(f)} aria-label={`${Number(f.slice(8))} de ${MESES[m - 1]}`}>
            {Number(f.slice(8))}
            {eventos[f] && <i className={eventos[f].some((e) => e.venc) ? 'venc' : ''}>{eventos[f].length}</i>}
          </button>
        ))}
      </div>
      <h3 className="cal-tit">{fechaCorta(dia)}</h3>
      {!sel.length && <p className="note">Nada agendado este día.</p>}
      <ul className="cal-ev">
        {sel.map((e, i) => <li key={i} className={`${e.tipo} ${e.venc ? 'venc' : ''}`}><b>{e.txt}</b><small>{e.sub}{e.venc ? ' · ⚠️ vencido' : ''}</small></li>)}
      </ul>
    </div>
  )
}

export function Agenda({ data, email, hacer }) {
  const [sub, setSub] = useState('pendientes')
  const [form, setForm] = useState(null)
  const [nota, setNota] = useState(null)
  const [borrandoN, setBorrandoN] = useState(null)
  const mios = (data.pendientes || []).filter((x) => x.vendedor === email)
  const abiertos = mios.filter((x) => x.estado === 'pendiente').sort((a, b) => (a.fecha_limite || '9999').localeCompare(b.fecha_limite || '9999'))
  const hechos = mios.filter((x) => x.estado === 'realizado').sort((a, b) => String(b.realizado_en).localeCompare(String(a.realizado_en)))
  const notas = (data.notas_agenda || []).filter((x) => !x.vendedor || x.vendedor === email)
  const vencidos = (data.prospectos || []).filter((p) => (!p.vendedor || p.vendedor === email) && recontactoVencido(p))
  const wspFalta = gruposSinWhatsapp(data).map((g) => ({ g, nombre: nombreGrupoWa(g, (data.cursos || []).find((c) => String(c.id) === String(g.curso_id))) }))
  return (
    <>
      <Seccion titulo="Mi agenda" ayuda="Tus pendientes, notas y el calendario con los clientes a los que tienes que volver a contactar.">
        {sub === 'pendientes' && <button className="btn btn-teal" onClick={() => setForm({ titulo: '', detalle: '', fecha_limite: '' })}>+ Nuevo pendiente</button>}
        {sub === 'notas' && <button className="btn btn-teal" onClick={() => setNota({ titulo: '', texto: '' })}>+ Nueva nota</button>}
      </Seccion>
      {data.pendientesError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. Mensaje: {data.pendientesError}</p>}
      {vencidos.length > 0 && <div className="alertas"><p className="alerta"><b>Se te pasó volver a contactar a:</b> {vencidos.map((p) => p.nombres).join(', ')}. Cada cliente sin respuesta es una venta que se puede perder.</p></div>}
      <div className="tabs2" role="tablist">
        {[['pendientes', `Pendientes (${abiertos.length + wspFalta.length})`], ['realizados', `Realizados (${hechos.length})`], ['notas', 'Notas'], ['calendario', 'Calendario']].map(([k, n]) => (
          <button key={k} role="tab" aria-selected={sub === k} onClick={() => setSub(k)}>{n}</button>
        ))}
      </div>
      {sub === 'pendientes' && wspFalta.length > 0 && (
        <ul className="pend">
          {wspFalta.map(({ g, nombre }) => (
            <li key={'wsp' + g.id} className="vencido">
              <span aria-hidden="true">💬</span>
              <div>
                <b>Crear el grupo de WhatsApp de {g.codigo}</b>
                <small>Nombre: {nombre} · {g.inicio ? `inicia el ${fechaCorta(g.inicio)}` : 'sin fecha de inicio'}. Se quita solo cuando lo registras en Grupos.</small>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sub === 'pendientes' && <ListaPendientes lista={abiertos} email={email} hacer={hacer} onEditar={(x) => setForm(x)} />}
      {sub === 'realizados' && <><p className="note">Los pendientes realizados quedan como registro: ya no se pueden editar ni borrar.</p><ListaPendientes lista={hechos} email={email} hacer={hacer} onEditar={() => {}} /></>}
      {sub === 'calendario' && <Calendario data={data} email={email} />}
      {sub === 'notas' && (
        <div className="notas-grid">
          {!notas.length && <div className="vacio"><p>Aún no tienes notas.</p></div>}
          {notas.map((n) => (
            <article key={n.id} className="nota">
              <b>{n.titulo || 'Sin título'}</b>
              <p>{n.texto}</p>
              <span className="acc">
                <button className="btn btn-line sm" onClick={() => setNota(n)}>Editar</button>
                <button className="ib red" onClick={() => setBorrandoN(n)} aria-label="Borrar"><Icon n="trash" /></button>
              </span>
            </article>
          ))}
        </div>
      )}
      {form && <PendienteForm inicial={form} onClose={() => setForm(null)} onSave={(f) => hacer(async () => { await guardarPendiente(f); setForm(null) }, 'Pendiente guardado')} />}
      {nota && (
        <Drawer titulo={nota.id ? 'Editar nota' : 'Nueva nota'} onClose={() => setNota(null)}
          pie={<><button className="btn btn-line" onClick={() => setNota(null)}>Cancelar</button><button className="btn btn-teal" onClick={() => hacer(async () => { await guardarNota(nota); setNota(null) }, 'Nota guardada')}>Guardar</button></>}>
          <div className="fs">
            <label>Título<input id="nt-tit" value={nota.titulo} onChange={(e) => setNota({ ...nota, titulo: e.target.value })} /></label>
            <label>Nota<textarea id="nt-txt" rows={8} value={nota.texto} onChange={(e) => setNota({ ...nota, texto: e.target.value })} /></label>
          </div>
        </Drawer>
      )}
      {borrandoN && <Confirmar texto={`¿Borrar la nota «${borrandoN.titulo || 'sin título'}»?`} onNo={() => setBorrandoN(null)} onSi={() => { const x = borrandoN; setBorrandoN(null); hacer(() => borrarNota(x.id), 'Nota borrada') }} />}
    </>
  )
}

/* Gerente: reporte semanal automático de una vendedora */
export function ReporteSemanal({ data, email }) {
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const r = reporteSemana(data, email, lunes)
  const mover = (n) => { const x = new Date(lunes); x.setDate(x.getDate() + 7 * n); setLunes(x) }
  const dom = new Date(lunes); dom.setDate(dom.getDate() + 6)
  const rango = `${lunes.getDate()} ${MESES[lunes.getMonth()].slice(0, 3)} – ${dom.getDate()} ${MESES[dom.getMonth()].slice(0, 3)} ${dom.getFullYear()}`
  const ok = r.horas.total >= MINIMO_SEMANA_MIN
  const fila = (txt, val, mal) => <li className={mal ? 'mal' : ''}><span>{txt}</span><b>{val}</b></li>
  return (
    <section className="reporte">
      <div className="sec-h"><h3>Reporte semanal</h3>
        <span className="rep-nav"><button className="btn btn-line sm" onClick={() => mover(-1)} aria-label="Semana anterior">‹</button><b>{rango}</b><button className="btn btn-line sm" onClick={() => mover(1)} aria-label="Semana siguiente">›</button></span>
      </div>
      <div className="rep-grid">
        <div><h4>Ventas</h4><ul>
          {fila('Inscritos (alumnos)', r.inscritos)}
          {fila('Cupos / matrículas', r.matriculas)}
          {fila('Total vendido', dosMon({ PEN: r.vendido, USD: r.vendidoUSD || 0 }))}
        </ul></div>
        <div><h4>Atención</h4><ul>
          {fila('Prospectos nuevos', r.prospectosNuevos)}
          {fila('Interesados recibidos', r.interesados)}
          {fila('Atendidos', r.atendidos)}
          {fila('Sin atender', r.sinAtender, r.sinAtender > 0)}
        </ul></div>
        <div><h4>Volver a contactar</h4><ul>
          {fila('Programados esta semana', r.programados)}
          {fila('Se le pasaron (a hoy)', r.vencidos.length, r.vencidos.length > 0)}
        </ul>
          {r.vencidos.length > 0 && <small className="rep-det">{r.vencidos.map((p) => p.nombres).join(', ')}</small>}
        </div>
        <div><h4>Pendientes</h4><ul>
          {fila('Vencían esta semana', `${r.pendientes.cumplidosDeEsos} de ${r.pendientes.vencenSemana} cumplidos`, r.pendientes.cumplidosDeEsos < r.pendientes.vencenSemana)}
          {fila('Realizados en la semana', r.pendientes.hechosSemana)}
          {fila('Asignados por gerencia', r.pendientes.asignadosSemana)}
          {fila('Abiertos ahora', r.pendientes.abiertos)}
          {fila('Vencidos sin hacer', r.pendientes.vencidos.length, r.pendientes.vencidos.length > 0)}
        </ul></div>
        <div><h4>Horas</h4><ul>
          {fila('Trabajadas', `${fmtHM(r.horas.total)} / mín. 24 h`, !ok)}
          {fila('Días con jornada', r.horas.dias.filter((d) => d > 0).length)}
        </ul>
          <small className="rep-det">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => `${d} ${fmtHM(r.horas.dias[i])}`).join(' · ')}</small>
        </div>
      </div>
    </section>
  )
}

/* Gerente: pendientes de una vendedora (asignar y ver cumplimiento) */
export function PendientesDe({ data, email, hacer }) {
  const [form, setForm] = useState(null)
  const mios = (data.pendientes || []).filter((x) => x.vendedor === email)
  const abiertos = mios.filter((x) => x.estado === 'pendiente')
  const hechos = mios.filter((x) => x.estado === 'realizado')
  return (
    <section className="avance-sec">
      <div className="sec-h"><h3>Pendientes de la vendedora</h3><button className="btn btn-teal sm" onClick={() => setForm({ titulo: '', detalle: '', fecha_limite: '', vendedor: email })}>+ Asignar pendiente</button></div>
      <p className="note">{abiertos.length} por hacer · {hechos.length} realizados</p>
      <ListaPendientes lista={[...abiertos, ...hechos]} email={email} hacer={hacer} gerente onEditar={(x) => setForm(x)} />
      {form && <PendienteForm inicial={form} onClose={() => setForm(null)} onSave={(f) => hacer(async () => { await guardarPendiente(f); setForm(null) }, 'Pendiente guardado')} />}
    </section>
  )
}
