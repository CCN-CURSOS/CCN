import { useMemo, useState } from 'react'
import AvanceVendedor from '../AvanceVendedor'
import JornadaCard from '../../components/JornadaCard'
import Icon from '../../components/Icons'
import { fmtHM, metasDe, PUESTOS, SUELDO_DEF, BONO_PASAJES_DEF, descuentosVendedora, tramosDe, metricasVendedor, metricasProfesor, gruposSinWhatsapp } from '../../lib/ventas'
import { soles, nombreMes, waTel } from '../../lib/formato.js'
import { hasBackend, save, remove, fechaCorta, guardarMiembro, guardarTrabajador, asignarGrupo, pagarTrabajador } from '../../lib/data.js'
import { PendientesDe, ReporteSemanal } from './Agenda.jsx'
import { DocumentosDe, armarTrabajadores } from './Contratos.jsx'
import { AlertasVenta } from './Quejas.jsx'
import { Confirmar, Drawer, Seccion } from '../../components/ui.jsx'
import { hoyISO } from './util.js'

export function TrabajadorForm({ inicial, equipo, cursos, onClose, onSave }) {
  const [f, setF] = useState({ ...inicial, comision_tramos: tramosDe(inicial), metas: metasDe(inicial), cursos: (inicial.cursos || []).map(String) })
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setT = (i, k, v) => set('comision_tramos', f.comision_tramos.map((t, j) => (j === i ? { ...t, [k]: v } : t)))
  const setM = (i, k, v) => set('metas', f.metas.map((h, j) => (j === i ? { ...h, [k]: v } : h)))
  const vend = f.puesto === 'vendedor'
  const alt = (id) => set('cursos', f.cursos.includes(String(id)) ? f.cursos.filter((x) => x !== String(id)) : [...f.cursos, String(id)])
  return (
    <Drawer titulo={inicial.id ? 'Editar datos' : (vend ? 'Nuevo vendedor' : 'Nuevo profesor')} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={() => onSave(f)}>Guardar</button></>}>
      <div className="fs">
        <label>Nombre completo<input id="tr-nom" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} /></label>
        <div className="g2">
          <label>DNI<input id="tr-doc" inputMode="numeric" value={f.documento || ''} onChange={(e) => set('documento', e.target.value)} /></label>
          <label>Celular<input id="tr-cel" inputMode="tel" value={f.celular || ''} onChange={(e) => set('celular', e.target.value)} /></label>
        </div>
        <label>Cargo<input value={f.cargo || ''} onChange={(e) => set('cargo', e.target.value)} placeholder={vend ? 'Ej. Vendedora' : 'Ej. Profesor de Excel'} /></label>
        {vend ? (
          <>
            <label>Correo de acceso al panel
              <select value={f.email || ''} onChange={(e) => set('email', e.target.value)}>
                <option value="">Sin acceso</option>{(equipo || []).filter((e) => e.rol === 'vendedora').map((e) => <option key={e.email} value={e.email}>{e.email}</option>)}
              </select>
            </label>
            <label>Inicio de contrato<input id="tr-ini" type="date" value={f.fecha_inicio || ''} onChange={(e) => set('fecha_inicio', e.target.value)} /><small>Desde este día se calcula su pago (y los descuentos). Antes de esta fecha el sistema no calcula nada.</small></label>
            <label>Sueldo base mensual (S/)<input id="tr-sue" type="number" min="0" value={f.sueldo_base} onChange={(e) => set('sueldo_base', e.target.value)} /></label>
            <label>Bono de pasajes mensual (S/)<input id="tr-bono" type="number" min="0" value={f.bono_pasajes ?? 0} onChange={(e) => set('bono_pasajes', e.target.value)} /><small>Si se aumenta el sueldo, se sube el sueldo base y este bono se mantiene.</small></label>
            <div>
              <b>Comisión por cupos cerrados en el mes</b>
              <p className="note">Se aplica sobre el total vendido del mes. Cada fila: desde cuántos cupos, qué porcentaje.</p>
              {f.comision_tramos.map((t, i) => (
                <div className="g2" key={i}>
                  <label>Desde (cupos)<input type="number" min="0" value={t.desde} onChange={(e) => setT(i, 'desde', e.target.value)} /></label>
                  <label>Comisión (%)<input type="number" min="0" step="0.5" value={t.pct} onChange={(e) => setT(i, 'pct', e.target.value)} /></label>
                </div>
              ))}
            </div>
            <div>
              <b>Metas (hitos acumulados desde su inicio)</b>
              <p className="note">Cada fila: fecha límite, cupos acumulados que debe llevar y en cuántos cursos distintos. Se ven en su panel con barra de avance.</p>
              {f.metas.map((h, i) => (
                <div className="g3" key={i}>
                  <label>Fecha<input type="date" value={h.fecha} onChange={(e) => setM(i, 'fecha', e.target.value)} /></label>
                  <label>Cupos<input type="number" min="1" value={h.cupos} onChange={(e) => setM(i, 'cupos', e.target.value)} /></label>
                  <label>Cursos<input type="number" min="1" value={h.cursos} onChange={(e) => setM(i, 'cursos', e.target.value)} /></label>
                </div>
              ))}
              <button type="button" className="btn btn-line sm" onClick={() => set('metas', [...f.metas, { fecha: '', cupos: 1, cursos: 1 }])}>+ Agregar meta</button>
              {f.metas.length > 0 && <button type="button" className="btn btn-line sm" onClick={() => set('metas', f.metas.slice(0, -1))}>Quitar la última</button>}
            </div>
          </>
        ) : (
          <>
            <label>Correo de acceso al panel del profesor
              <input id="tr-mail" type="email" autoComplete="off" value={f.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="profesor@correo.com" />
              <small>Al guardar, el sistema le da el rol Profesor automáticamente. Falta un solo paso: crear su usuario en Supabase → Authentication → Users (con Auto Confirm) con este mismo correo.</small>
            </label>
            <label>Tarifa por hora dictada (S/) — cada profesor tiene la suya<input id="tr-tar" type="number" min="0" step="0.5" value={f.tarifa_hora} onChange={(e) => set('tarifa_hora', e.target.value)} /></label>
            <p className="note">Es la tarifa que se copia a cada grupo que le asignes (después se puede ajustar grupo por grupo).</p>
            <div>
              <b>Cursos que dicta</b>
              <div className="chks">{(cursos || []).map((c) => <label key={c.id} className="chk"><input type="checkbox" checked={f.cursos.includes(String(c.id))} onChange={() => alt(c.id)} /> {c.titulo}</label>)}</div>
            </div>
          </>
        )}
        <label className="chk"><input type="checkbox" checked={f.activo !== false} onChange={(e) => set('activo', e.target.checked)} /> Activo</label>
        <label>Notas internas<textarea rows={3} value={f.notas || ''} onChange={(e) => set('notas', e.target.value)} /></label>
      </div>
    </Drawer>
  )
}

export function PagoProfesorForm({ t, fila, onClose, onSave }) {
  const [f, setF] = useState({ monto: fila ? fila.saldo || '' : '', fecha: new Date().toISOString().slice(0, 10), metodo: 'Transferencia', nota: '' })
  return (
    <Drawer titulo={`Pago a ${t.nombre}`} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={() => onSave({ trabajador_id: t.id, asignacion_id: fila?.a?.id, ...f })}>Registrar pago</button></>}>
      <div className="fs">
        {fila && <p className="note"><b>{fila.g.codigo}</b> · a pagar {soles(fila.debe)} · ya pagado {soles(fila.pagado)} · saldo {soles(fila.saldo)}</p>}
        <label>Monto (S/)<input id="pp-monto" type="number" min="0" step="0.5" value={f.monto} onChange={(e) => setF({ ...f, monto: e.target.value })} /></label>
        <div className="g2">
          <label>Fecha<input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></label>
          <label>Método<select value={f.metodo} onChange={(e) => setF({ ...f, metodo: e.target.value })}>{['Transferencia', 'Yape', 'Plin', 'Efectivo'].map((m) => <option key={m}>{m}</option>)}</select></label>
        </div>
        <label>Nota<input value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} /></label>
      </div>
    </Drawer>
  )
}

/* Ficha de un profesor: cursos que dicta → grupos dictados, horas, pagado */
export function FichaProfesor({ data, t, hacer }) {
  const m = useMemo(() => metricasProfesor(data, t), [data, t])
  const [pago, setPago] = useState(null)
  const tarifa = Number(t.tarifa_hora) || 0
  const cuando = (iso) => iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  const ajustar = (a, cambios) => hacer(() => save('asignaciones', { id: a.id, ...cambios }), 'Guardado')
  return (
    <>
      <div className="datos-prof">
        <span><small>DNI</small>{t.documento || '—'}</span>
        <span><small>Celular</small>{t.celular ? <a href={waTel(t.celular)} target="_blank" rel="noopener noreferrer">{t.celular}</a> : '—'}</span>
        <span><small>Tarifa por hora</small>{soles(t.tarifa_hora)}</span>
        <span><small>Estado</small>{t.activo === false ? 'Inactivo' : 'Activo'}</span>
      </div>
      <div className="kpis">
        <div><b>{m.cursos.length}</b><span>cursos que dicta</span></div>
        <div><b>{m.nGrupos}</b><span>grupos dictados</span></div>
        <div><b>{m.horas} h</b><span>horas dictadas</span></div>
        <div><b>{soles(m.totalPagado)}</b><span>total pagado</span></div>
        <div><b>{soles(m.porPagar)}</b><span>por pagar</span></div>
      </div>
      {data.profesoresError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase (sección de profesores). Mensaje: {data.profesoresError}</p>}
      {m.cursos.length === 0 && <div className="vacio"><p>Aún no tiene cursos. Edita sus datos y marca los cursos que dicta.</p></div>}
      {m.cursos.map(({ curso, grupos, nGrupos, horas, debe, pagado }) => (
        <section className="curso-prof" key={curso.id}>
          <header>
            <span className="sw" style={{ background: `var(--${curso.color})` }} />
            <div><b>{curso.titulo}</b><small>{curso.horas} h por grupo</small></div>
            <div className="tot"><span><i>{nGrupos}</i> grupos</span><span><i>{horas} h</i> dictadas</span><span><i>{soles(pagado)}</i> pagado</span><span><i>{soles(Math.max(0, debe - pagado))}</i> por pagar</span></div>
          </header>
          {grupos.length === 0 ? <p className="note">Todavía no hay grupos de este curso.</p> : (
            <div className="cons-wrap">
              <table className="cons-table" style={{ minWidth: 0 }}>
                <thead><tr><th>Grupo</th><th>Inicio</th><th>Horas dictadas</th><th>Tarifa/h</th><th>A pagar</th><th>Pagado</th><th>Saldo</th><th /></tr></thead>
                <tbody>
                  {grupos.map(({ g, a, debe: d, pagado: pg, saldo }) => a ? (
                    <tr key={g.id}>
                      <td><span className="cod">{g.codigo || '—'}</span></td>
                      <td>{g.inicio ? cuando(g.inicio) : 'Sin fecha'}</td>
                      <td><input className="num" type="number" min="0" step="0.5" aria-label={`Horas dictadas ${g.codigo}`} defaultValue={a.horas_dictadas} onBlur={(e) => Number(e.target.value) !== Number(a.horas_dictadas) && ajustar(a, { horas_dictadas: Number(e.target.value) || 0 })} /> <small>de {a.horas} h</small>
                        {Number(a.horas_dictadas) < Number(a.horas) && <button className="link" onClick={() => ajustar(a, { horas_dictadas: a.horas })}>Terminado</button>}</td>
                      <td><input className="num" type="number" min="0" step="0.5" aria-label={`Tarifa ${g.codigo}`} defaultValue={a.tarifa_hora} onBlur={(e) => Number(e.target.value) !== Number(a.tarifa_hora) && ajustar(a, { tarifa_hora: Number(e.target.value) || 0 })} /></td>
                      <td>{soles(d)}</td><td>{soles(pg)}</td><td><b>{saldo > 0 ? soles(saldo) : '—'}</b></td>
                      <td className="acc">
                        {saldo > 0 && <button className="btn btn-line sm" onClick={() => setPago({ g, a, debe: d, pagado: pg, saldo })}>+ Pago</button>}
                        <button className="ib red" aria-label="Quitar del grupo" title="Quitar a este profesor del grupo" onClick={() => hacer(() => remove('asignaciones', a.id), 'Grupo desasignado')}><Icon n="x" size={13} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={g.id} className="sinasig">
                      <td><span className="cod">{g.codigo || '—'}</span></td>
                      <td>{g.inicio ? cuando(g.inicio) : 'Sin fecha'}</td>
                      <td colSpan={5}><small>Sin profesor asignado</small></td>
                      <td className="acc"><button className="btn btn-teal sm" onClick={() => hacer(async () => { if (!(tarifa > 0)) throw new Error('Primero define la tarifa por hora de este profesor (Editar datos).'); await asignarGrupo({ grupo_id: g.id, trabajador_id: t.id, horas: curso.horas, tarifa_hora: tarifa }) }, 'Grupo asignado')}>Asignar a {t.nombre.split(' ')[0]}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      <h3 className="subh">Pagos realizados</h3>
      {m.pagos.length === 0 ? <div className="vacio"><p>Aún no se le ha registrado ningún pago.</p></div> : (
        <ul className="hist">{m.pagos.map((p) => {
          const a = (data.asignaciones || []).find((x) => x.id === p.asignacion_id)
          const g = a && data.grupos.find((x) => String(x.id) === String(a.grupo_id))
          return <li key={p.id}><span className="tag">Pago</span><div>{soles(p.monto)} · {p.metodo || 'sin método'}{g ? ` · ${g.codigo}` : ''}{p.nota ? ` — ${p.nota}` : ''}<small>{cuando(p.fecha)}</small></div></li>
        })}</ul>
      )}
      {pago && <PagoProfesorForm t={t} fila={pago} onClose={() => setPago(null)} onSave={(f) => hacer(async () => { await pagarTrabajador(f); setPago(null) }, 'Pago registrado')} />}
    </>
  )
}

export function Trabajadores({ data, hacer }) {
  const [sel, setSel] = useState(null)
  const [tab, setTab] = useState('instructor')
  const [form, setForm] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const lista = armarTrabajadores(data)
  const mes = new Date().toISOString().slice(0, 7)
  const nuevo = (puesto) => setForm({ nombre: '', puesto, cargo: '', email: '', documento: '', celular: '', sueldo_base: puesto === 'vendedor' ? SUELDO_DEF : 0, bono_pasajes: puesto === 'vendedor' ? BONO_PASAJES_DEF : 0, fecha_inicio: '', tarifa_hora: 0, cursos: [], comision_tramos: null, activo: true, notas: '' })
  const guardar = (f) => hacer(async () => {
    const mail = String(f.email || '').trim().toLowerCase()
    if (f.puesto === 'instructor' && mail) {
      if (!/^\S+@\S+\.\S+$/.test(mail)) throw new Error('Escribe un correo válido para el profesor.')
      const ya = (data.equipo || []).find((e) => e.email === mail)
      if (ya && ya.rol !== 'profesor') throw new Error(`Ese correo ya tiene el rol «${ya.rol}» en el equipo. Usa otro correo para el profesor.`)
      const otro = (data.trabajadores || []).find((x) => String(x.email || '').toLowerCase() === mail && x.id !== f.id)
      if (otro) throw new Error(`Ese correo ya está en la ficha de ${otro.nombre}.`)
      await guardarTrabajador({ ...f, email: mail, id: f.virtual ? undefined : f.id })
      if (!ya) await guardarMiembro({ email: mail, rol: 'profesor' })
    } else {
      await guardarTrabajador({ ...f, id: f.virtual ? undefined : f.id })
    }
    setForm(null); setSel(null)
  }, 'Guardado')
  const formEl = form && <TrabajadorForm inicial={form} equipo={data.equipo} cursos={data.cursos} onClose={() => setForm(null)} onSave={guardar} />

  const t = sel ? lista.find((x) => (x.id || x.email) === sel) : null
  if (t) {
    return (
      <>
        <button className="btn btn-line sm" onClick={() => setSel(null)}><Icon n="back" size={13} /> {PUESTOS[t.puesto] || 'Trabajadores'}</button>
        <Seccion titulo={t.nombre} ayuda={`${t.cargo || (t.puesto === 'instructor' ? 'Profesor' : 'Vendedor')}${t.puesto === 'vendedor' ? ` · sueldo base ${soles(t.sueldo_base)} + bono ${soles(t.bono_pasajes)} · ${t.fecha_inicio ? `contrato desde el ${fechaCorta(t.fecha_inicio)}` : 'SIN fecha de inicio de contrato'}` : ''}${t.activo === false ? ' · inactivo' : ''}`}>
          <button className="btn btn-teal" onClick={() => setForm(t)}>Editar datos</button>
          {!t.virtual && <button className="btn btn-line" onClick={() => setBorrando(t)}>Borrar</button>}
        </Seccion>
        {t.notas && <p className="note">{t.notas}</p>}
        {t.puesto === 'vendedor' && (t.email ? <AvanceVendedor data={data} email={t.email} trab={t} verPago historial={false} /> : <div className="vacio"><p>Esta persona no tiene correo de acceso asignado. Edita sus datos para vincularla.</p></div>)}
        {t.puesto === 'vendedor' && t.email && <DescuentosDe data={data} t={t} hacer={hacer} />}
        {t.puesto === 'vendedor' && t.email && <ReporteSemanal data={data} email={t.email} />}
        {t.puesto === 'vendedor' && t.email && <DocumentosDe data={data} t={t} hacer={hacer} />}
        {t.puesto === 'vendedor' && t.email && <PendientesDe data={data} email={t.email} hacer={hacer} />}
        {t.puesto === 'instructor' && (() => {
          const rolOk = (data.equipo || []).some((e) => e.rol === 'profesor' && e.email === t.email)
          const nG = (data.asignaciones || []).filter((a) => a.trabajador_id === t.id).length
          return <p className={rolOk && nG ? 'note' : 'banner'}>Acceso al panel del profesor: {t.email ? <b>{t.email}</b> : <b>sin correo</b>} · {rolOk ? '✅ rol Profesor activo' : '⚠️ aún no tiene el rol (edita sus datos y escribe su correo)'} · {nG ? `${nG} grupo${nG === 1 ? '' : 's'} asignado${nG === 1 ? '' : 's'}` : '⚠️ ningún grupo asignado (se asigna en Académico → Cronograma y accesos)'}. Si no ve sus grupos al entrar, revisa que su usuario exista en Supabase → Authentication con ese mismo correo.</p>
        })()}
        {t.puesto === 'instructor' && <FichaProfesor data={data} t={t} hacer={hacer} />}
        {formEl}
        {borrando && <Confirmar texto={`¿Borrar la ficha de ${borrando.nombre}?`} onNo={() => setBorrando(null)} onSi={() => { const x = borrando; setBorrando(null); setSel(null); hacer(() => remove('trabajadores', x.id), 'Ficha borrada') }} />}
      </>
    )
  }
  const del = lista.filter((x) => x.puesto === tab)
  return (
    <>
      <Seccion titulo="Trabajadores" ayuda="Tu equipo. Entra a la ficha de cada uno para ver su avance, lo que se le debe pagar y lo que ya se le pagó.">
        <button className="btn btn-teal" onClick={() => nuevo(tab)}>{tab === 'vendedor' ? '+ Nuevo vendedor' : '+ Nuevo profesor'}</button>
      </Seccion>
      <div className="tabs2" role="tablist" aria-label="Tipo de trabajador">
        {Object.entries(PUESTOS).map(([k, nombre]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{nombre} <em>{lista.filter((x) => x.puesto === k).length}</em></button>
        ))}
      </div>
      {data.trabajadoresError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. Mensaje: {data.trabajadoresError}</p>}
      {del.length === 0 && <div className="vacio"><p>{tab === 'vendedor' ? 'Aún no hay vendedores.' : 'Aún no hay profesores. Agrega el primero y marca los cursos que dicta.'}</p></div>}
      <div className="tcards">
        {del.map((x) => {
          const mv = x.puesto === 'vendedor' && x.email ? metricasVendedor(data, x.email, mes, x) : null
          const mp = x.puesto === 'instructor' && x.id ? metricasProfesor(data, x) : null
          return (
            <button key={x.id || x.email} className={`tcard ${x.activo === false ? 'off' : ''}`} onClick={() => setSel(x.id || x.email)}>
              <b>{x.nombre}</b><small>{x.cargo || PUESTOS[x.puesto]}{x.activo === false ? ' · inactivo' : ''}</small>
              {mv && <><span><i>{mv.cupos}</i> cupos · {soles(mv.vendido)} vendido</span><span>{!x.fecha_inicio ? <i>Falta el inicio de contrato</i> : x.fecha_inicio > hoyISO() ? <>Contrato inicia el <i>{fechaCorta(x.fecha_inicio)}</i></> : <>A pagar este mes: <i>{soles(Math.max(0, mv.aPagar - descuentosVendedora(data, x.email, mes, x).total))}</i></>}</span></>}
              {x.puesto === 'instructor' && <span style={{ fontSize: 12 }}>{(data.equipo || []).some((e) => e.rol === 'profesor' && e.email === x.email) ? '✅ Con acceso al panel' : (x.email ? '⚠️ Falta darle acceso (crear su usuario)' : '⚠️ Sin correo de acceso')}</span>}
              {mp && <><span><i>{mp.cursos.length}</i> cursos · <i>{mp.nGrupos}</i> grupos · <i>{mp.horas} h</i></span><span>Pagado: <i>{soles(mp.totalPagado)}</i> · por pagar: <i>{soles(mp.porPagar)}</i></span></>}
            </button>
          )
        })}
      </div>
      {formEl}
    </>
  )
}

/* ================= DESCUENTOS POR HORA (solo gerencia; la vendedora NO los ve) ================= */
export function DescuentosDe({ data, t, hacer }) {
  const hoyMes = hoyISO().slice(0, 7)
  const iniMes = t.fecha_inicio ? String(t.fecha_inicio).slice(0, 7) : ''
  const meses = []
  if (iniMes && iniMes <= hoyMes) { let [y, mm] = iniMes.split('-').map(Number); while (`${y}-${String(mm).padStart(2, '0')}` <= hoyMes) { meses.push(`${y}-${String(mm).padStart(2, '0')}`); mm++; if (mm > 12) { mm = 1; y++ } } }
  const [mes, setMes] = useState(hoyMes)
  const [dia, setDia] = useState(hoyISO())
  const [otro, setOtro] = useState({ horas: '', motivo: '' })
  const d = descuentosVendedora(data, t.email, mes, t)
  const m = metricasVendedor(data, t.email, mes, t)
  const neto = Math.max(0, m.aPagar - d.total)
  const reg = (horas, motivo, fecha) => hacer(() => save('descuentos_trab', { vendedor: t.email, mes, fecha: fecha || null, horas, motivo }), 'Descuento registrado')
  return (
    <>
      <Seccion titulo="Descuentos por hora (solo gerencia)" ayuda="Lo que se descuenta por horas no trabajadas y por días presenciales no asistidos. La vendedora no ve esta sección. Solo cuenta desde el inicio de contrato.">
        {meses.length > 1 && <select aria-label="Mes" value={mes} onChange={(e) => setMes(e.target.value)}>{meses.map((x) => <option key={x} value={x}>{nombreMes(x)}</option>)}</select>}
      </Seccion>
      {!t.fecha_inicio ? <p className="banner">Registra el <b>inicio de contrato</b> en “Editar datos” para calcular su pago y sus descuentos.</p>
        : t.fecha_inicio > hoyISO() ? <p className="note">Su contrato empieza el {fechaCorta(t.fecha_inicio)}. Hasta entonces no se calcula pago ni descuentos.</p> : (
          <div className="cons-wrap">
            <table className="cons-table" style={{ minWidth: 420 }}>
              <tbody>
                <tr><td>Periodo evaluado</td><td>{d.empezo ? `${fechaCorta(d.desde)} → ${fechaCorta(d.hasta)} (${d.dias} días${mes === hoyMes ? ', hasta ayer' : ''})` : 'Aún no hay días para evaluar'}</td></tr>
                <tr><td>Horas mínimas del periodo</td><td>{fmtHM(d.minMin)}</td></tr>
                <tr><td>Horas trabajadas</td><td>{fmtHM(d.trabMin)}</td></tr>
                <tr><td>Horas faltantes</td><td><b>{fmtHM(d.faltanMin)}</b></td></tr>
                <tr><td>Valor de la hora</td><td>{soles(d.valorHora)} <small>(sueldo + bono ÷ 104 h)</small></td></tr>
                <tr><td>Descuento por horas faltantes</td><td>{soles(d.descHoras)}</td></tr>
                <tr><td>Ajustes registrados</td><td>{soles(d.descAjustes)}</td></tr>
                <tr><td><b>Total descuento</b></td><td><b>{soles(d.total)}</b></td></tr>
                <tr><td>Pago del mes antes del descuento</td><td>{soles(m.aPagar)}</td></tr>
                <tr><td><b>A pagar neto</b></td><td><b>{soles(neto)}</b></td></tr>
              </tbody>
            </table>
          </div>
        )}
      {t.fecha_inicio && t.fecha_inicio <= hoyISO() && (
        <>
          <h3 className="sub">Registrar un descuento</h3>
          <div className="fila-form" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
            <label>Día presencial no asistido<input type="date" value={dia} onChange={(e) => setDia(e.target.value)} /></label>
            <button className="btn btn-line" disabled={!dia} onClick={() => reg(4, `Día presencial no asistido (${fechaCorta(dia)})`, dia)}>+ Descontar 4 h</button>
          </div>
          <div className="fila-form" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end', marginTop: 10 }}>
            <label>Otras horas<input type="number" min="0.5" step="0.5" value={otro.horas} onChange={(e) => setOtro({ ...otro, horas: e.target.value })} style={{ width: 90 }} /></label>
            <label style={{ flex: 1, minWidth: 180 }}>Motivo<input value={otro.motivo} onChange={(e) => setOtro({ ...otro, motivo: e.target.value })} placeholder="Ej.: salió antes de lo acordado" /></label>
            <button className="btn btn-line" disabled={!(Number(otro.horas) > 0) || otro.motivo.trim().length < 3} onClick={() => { reg(Number(otro.horas), otro.motivo.trim(), null); setOtro({ horas: '', motivo: '' }) }}>+ Descontar</button>
          </div>
          {d.ajustes.length > 0 && (
            <ul className="lista-simple" style={{ marginTop: 12 }}>
              {d.ajustes.map((x) => (
                <li key={x.id}>{x.horas} h · {x.motivo || 'Sin motivo'} <small>({soles(Number(x.horas) * d.valorHora)}{x.registrado_por ? ` · ${String(x.registrado_por).split('@')[0]}` : ''})</small> <button type="button" className="link" onClick={() => hacer(() => remove('descuentos_trab', x.id), 'Descuento quitado')}>Quitar</button></li>
              ))}
            </ul>
          )}
          <p className="note">Las horas extra del mismo mes compensan las faltantes. Los feriados cuentan como 4 h. Las horas se toman de “Iniciar/Terminar jornada”.</p>
        </>
      )}
    </>
  )
}

/* ================= VENTAS: MI AVANCE (vista de la vendedora) ================= */
export function MiAvance({ data, email, hacer }) {
  const t = armarTrabajadores(data).find((x) => x.email === email) || { sueldo_base: SUELDO_DEF, comision_tramos: null }
  return (
    <>
      <Seccion titulo="Mi avance" ayuda="Cómo vas este mes: prospectos, interesados, ventas y cuánto llevas ganado." />
      {gruposSinWhatsapp(data).length > 0 && (
        <div className="alertas"><p className="alerta"><b>Pendiente:</b> crear el grupo de WhatsApp de {gruposSinWhatsapp(data).map((g) => g.codigo).join(', ')} y registrarlo en la sección Grupos.</p></div>
      )}
      <AlertasVenta data={data} email={email} />
      <JornadaCard data={data} email={email} hacer={hacer} />
      <AvanceVendedor data={data} email={email} trab={t} verPago compacto />
    </>
  )
}
