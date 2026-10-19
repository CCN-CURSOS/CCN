import { useState } from 'react'
import { alertasVenta } from '../../lib/ventas'
import { waTel } from '../../lib/formato.js'
import { fmtMoneda } from '../../lib/moneda.js'
import { hasBackend, fechaCorta, guardarQueja, atenderQueja, numeroGerencia } from '../../lib/data.js'
import { Drawer, Seccion } from '../../components/ui.jsx'

/* ================= ALERTAS DE VENTA ================= */
export function AlertasVenta({ data, email, gerente }) {
  const { vacantes, gruposAdmin } = alertasVenta(data, gerente ? '' : email)
  if (!vacantes.length && !gruposAdmin.length) return null
  const etiqueta = { retirar: '🚫 Retirar', hoy: '⏰ Hoy', pronto: '📅 Pronto' }
  return (
    <div className="alertas">
      {vacantes.map((v, i) => (
        <p key={i} className={`alerta ${v.nivel === 'retirar' ? 'rojo' : ''}`}>
          <b>{etiqueta[v.nivel]} · {v.alumno}</b> debe {fmtMoneda(v.saldo, v.moneda)} ({v.grupo || 'curso'} empieza {fechaCorta(v.inicio)}). {v.txt}
          {v.celular && <> <a href={waTel(v.celular)} target="_blank" rel="noopener noreferrer">Escribirle</a></>}
        </p>
      ))}
      {gruposAdmin.length > 0 && <p className="alerta"><b>🔒 Falta dejar en «solo admins»</b> el grupo de WhatsApp de: {gruposAdmin.map((g) => g.codigo).join(', ')}. Nadie debe escribir hasta antes del curso.</p>}
    </div>
  )
}

/* ================= QUEJAS Y RECLAMOS ================= */
export const TIPO_QUEJA = { queja: 'Queja', reclamo: 'Reclamo', problema: 'Problema de alumno' }

export function Quejas({ data, hacer, gerente, email }) {
  const [form, setForm] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [atender, setAtender] = useState(null)
  const lista = (data.quejas || []).filter((q) => gerente || q.vendedor === email)
  const msg = (q) => `🚨 ${TIPO_QUEJA[q.tipo] || 'Queja'} — aviso inmediato\nAlumno: ${q.alumno || 'sin nombre'}${q.celular ? ' (' + q.celular + ')' : ''}\n${q.detalle}\nReporta: ${(q.vendedor || email || '').split('@')[0]}`
  const linkAviso = (q) => `https://wa.me/${String(numeroGerencia()).replace(/\D/g, '')}?text=${encodeURIComponent(msg(q))}`
  return (
    <>
      <Seccion titulo="Quejas y reclamos" ayuda={gerente ? 'Lo que reporta tu equipo. Atiéndelo y márcalo como atendido.' : 'Si un alumno se queja o reclama, regístralo aquí Y avisa de inmediato a gerencia. Si es un problema de un alumno, consulta siempre con gerencia cómo solucionarlo.'}>
        {!gerente && <button className="btn btn-teal" onClick={() => setForm({ tipo: 'queja', alumno: '', celular: '', detalle: '' })}>+ Reportar</button>}
      </Seccion>
      {data.quejasError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. {data.quejasError}</p>}
      {!lista.length && <div className="vacio"><p>No hay quejas ni reclamos registrados.</p></div>}
      <ul className="pend">
        {lista.map((q) => (
          <li key={q.id} className={q.estado === 'nueva' ? 'vencido' : 'hecho'}>
            <span>{q.estado === 'nueva' ? '🚨' : '✅'}</span>
            <div>
              <b>{TIPO_QUEJA[q.tipo]} · {q.alumno || 'sin nombre'}</b>
              <small>{q.detalle}</small>
              <small>{gerente && <>Reporta {(q.vendedor || '').split('@')[0]} · </>}{fechaCorta(q.creado)}{q.celular && <> · <a href={waTel(q.celular)} target="_blank" rel="noopener noreferrer">{q.celular}</a></>}</small>
              {q.nota_gerencia && <small><b>Gerencia:</b> {q.nota_gerencia}</small>}
            </div>
            <span className="acc">
              {!gerente && q.estado === 'nueva' && <a className="btn btn-line sm" href={linkAviso(q)} target="_blank" rel="noopener noreferrer">Avisar a gerencia</a>}
              {gerente && q.estado === 'nueva' && <button className="btn btn-teal sm" onClick={() => setAtender({ id: q.id, nota: '' })}>Atendido</button>}
            </span>
          </li>
        ))}
      </ul>
      {form && (
        <Drawer titulo="Reportar queja o reclamo" onClose={() => setForm(null)}
          pie={<><button className="btn btn-line" onClick={() => setForm(null)}>Cancelar</button><button className="btn btn-teal" onClick={() => hacer(async () => { const r = await guardarQueja(form); setForm(null); setAviso(r) }, 'Registrado. Ahora avisa a gerencia 👇')}>Registrar</button></>}>
          <div className="fs">
            <label>Tipo<select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{Object.entries(TIPO_QUEJA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Alumno<input id="q-al" value={form.alumno} onChange={(e) => setForm({ ...form, alumno: e.target.value })} /></label>
            <label>Celular<input value={form.celular} inputMode="tel" onChange={(e) => setForm({ ...form, celular: e.target.value })} /></label>
            <label>¿Qué pasó?<textarea id="q-det" rows={5} value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} /></label>
            <p className="note">Al registrar te saldrá el botón para avisar a gerencia por WhatsApp. El aviso es obligatorio e inmediato.</p>
          </div>
        </Drawer>
      )}
      {aviso && (
        <Drawer titulo="Avisa ahora a gerencia" onClose={() => setAviso(null)} pie={<button className="btn btn-line" onClick={() => setAviso(null)}>Ya avisé</button>}>
          <p className="alerta rojo"><b>Falta un paso:</b> la queja ya quedó registrada, pero gerencia debe enterarse <b>de inmediato</b>.</p>
          <a className="btn btn-teal" href={linkAviso(aviso)} target="_blank" rel="noopener noreferrer">Avisar por WhatsApp a gerencia</a>
        </Drawer>
      )}
      {atender && (
        <Drawer titulo="Marcar como atendido" onClose={() => setAtender(null)}
          pie={<><button className="btn btn-line" onClick={() => setAtender(null)}>Cancelar</button><button className="btn btn-teal" onClick={() => hacer(async () => { await atenderQueja(atender.id, atender.nota); setAtender(null) }, 'Marcado como atendido')}>Guardar</button></>}>
          <label>Nota (qué se hizo / qué debe hacer la vendedora)<textarea rows={4} value={atender.nota} onChange={(e) => setAtender({ ...atender, nota: e.target.value })} /></label>
        </Drawer>
      )}
    </>
  )
}
