import { useMemo, useState } from 'react'
import { metricasVendedor, serieVendedor, historialVendedor, actividadMes, serieActividad, progresoMetas } from '../lib/ventas'
import { Barras, Embudo, Meta } from '../components/Charts'

const soles = (n) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const nombreMes = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
const corto = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
const cuando = (iso) => new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/* Avance de un vendedor: lo usa la vendedora en su panel y el gerente en la ficha del trabajador. */
export default function AvanceVendedor({ data, email, trab, verPago = true, historial = true, compacto = false }) {
  const hoy = new Date().toISOString().slice(0, 7)
  const [mes, setMes] = useState(hoy)
  const m = useMemo(() => metricasVendedor(data, email, mes, trab), [data, email, mes, trab])
  const serie = useMemo(() => serieVendedor(data, email, mes, trab, 6), [data, email, mes, trab])
  const hist = useMemo(() => historialVendedor(data, email), [data, email])
  const iniMes = trab?.fecha_inicio ? String(trab.fecha_inicio).slice(0, 7) : ''
  const meses = [...new Set([hoy, ...(data.matriculas || []).filter((x) => x.vendedor === email).map((x) => String(x.fecha_inscripcion).slice(0, 7))])].filter((x) => !iniMes || x >= iniMes).sort().reverse()
  const sig = m.comision.siguiente
  const [todo, setTodo] = useState(false)
  const [abierto, setAbierto] = useState(null)
  const [vista, setVista] = useState('semana')
  const act = useMemo(() => actividadMes(data, email, mes), [data, email, mes])
  const sa = useMemo(() => serieActividad(data, email, mes, vista), [data, email, mes, vista])
  const metas = useMemo(() => progresoMetas(data, email, trab), [data, email, trab])
  const proxima = metas.find((h) => !h.cumplida && !h.vencida) || metas[metas.length - 1]
  const techoCupos = Math.max(5, proxima ? proxima.cupos : 5)
  const techoSoles = techoCupos * 299
  const tit = vista === 'dia' ? 'por día' : vista === 'semana' ? 'por semana' : 'últimos 6 meses'
  const fmtF = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—')
  const r0 = (n) => Math.round(n * 100) / 100
  const KP = [['prospectos', m.prospectos, 'prospectos nuevos'], ['interesados', m.interesados, 'interesados derivados'], ['ventas', m.cupos, 'cupos vendidos'], ['vendido', soles(m.vendido), 'vendido'], ['cobrado', soles(m.cobrado), 'cobrado']]
  const KPV = compacto ? KP.filter((x) => x[0] !== 'vendido' && x[0] !== 'cobrado') : KP

  return (
    <div className="avance">
      <div className="av-top">
        <label className="mesel">Mes
          <select id="av-mes" value={mes} onChange={(e) => setMes(e.target.value)}>{meses.map((x) => <option key={x} value={x}>{nombreMes(x)}</option>)}</select>
        </label>
      </div>

      {compacto && (
        <section className="hero-din" aria-label="Lo que vas ganando">
          <small>Este mes vas ganando</small>
          <b className="monto">{soles(m.aPagar)}</b>
          <span>{soles(m.sueldo)} de sueldo{m.parcial ? ` (${m.dias} de ${m.diasMes} días)` : ''}{m.pasajes > 0 && ` + ${soles(m.pasajes)} de bono de pasajes`} + <b>{soles(m.comision.monto)}</b> de comisión{m.bono > 0 && <> + <b>{soles(m.bono)}</b> de bono 🎉</>}</span>
          {sig && (() => { const tk = m.cupos ? m.vendido / m.cupos : 299; const total = r0(m.sueldo + ((m.vendido + sig.faltan * tk) * sig.pct) / 100); return <div className="reto"><i>🔥</i><p>Cierra <b>{sig.faltan} cupo{sig.faltan === 1 ? '' : 's'} más</b> y tu comisión sube al <b>{sig.pct}%</b>: ganarías <b>{soles(total)}</b> este mes.</p></div> })()}
          {!sig && <div className="reto"><i>🏆</i><p>Estás en el tramo máximo: <b>{m.comision.pct}%</b> de comisión. ¡Sigue así!</p></div>}
          {proxima && <div className="hito"><div className="meta-top"><b>Próxima meta: {proxima.cupos} cupos{proxima.cursos > 1 ? ` en ${proxima.cursos} cursos` : ''}</b><span>{proxima.cumplida ? 'Cumplida' : `${fmtF(proxima.fecha)} · ${proxima.dias} día${proxima.dias === 1 ? '' : 's'}`}</span></div><div className="barra"><i style={{ width: `${proxima.pct}%` }} /></div><small>Llevas {proxima.cupos_actual} de {proxima.cupos}</small></div>}
        </section>
      )}

      <div className="kpis kpis-btn">
        {KPV.map(([k, v, n]) => <button key={k} type="button" className={abierto === k ? 'on' : ''} aria-pressed={abierto === k} onClick={() => setAbierto(abierto === k ? null : k)}><b>{v}</b><span>{n}</span></button>)}
      </div>

      {abierto && (
        <section className="detalle" aria-label="Detalle">
          <div className="detalle-h"><h3>{KP.find((x) => x[0] === abierto)[2]} · {nombreMes(mes)}</h3><button className="btn btn-line sm" onClick={() => setAbierto(null)}>Cerrar</button></div>
          {abierto === 'prospectos' && (act.prospectos.length === 0 ? <p className="note">No registró prospectos este mes.</p> : (
            <div className="cons-wrap"><table className="cons-table insc"><thead><tr><th>Fecha</th><th>Prospecto</th><th>Celular</th><th>Curso</th><th>Origen</th><th>Estado</th><th>Notas</th></tr></thead>
              <tbody>{act.prospectos.map((x, i) => <tr key={i}><td>{fmtF(x.t)}</td><td><b>{x.nombre}</b></td><td>{x.celular || '—'}</td><td>{x.curso || '—'}</td><td>{x.origen}</td><td>{x.estado}</td><td className="notas">{x.obs || '—'}</td></tr>)}</tbody></table></div>
          ))}
          {abierto === 'interesados' && (act.interesados.length === 0 ? <p className="note">No le derivaron interesados este mes.</p> : (
            <div className="cons-wrap"><table className="cons-table insc"><thead><tr><th>Derivado</th><th>Interesado</th><th>Celular</th><th>Curso</th><th>Contactado</th><th>¿Contestó?</th><th>Observación</th></tr></thead>
              <tbody>{act.interesados.map((x, i) => <tr key={i}><td>{fmtF(x.t)}</td><td><b>{x.nombre}</b></td><td>{x.celular}</td><td>{x.curso}</td><td>{x.atendido ? `Sí${x.contactado_en ? ' · ' + fmtF(x.contactado_en) : ''}` : 'Pendiente'}</td><td>{x.contesto === true ? 'Sí' : x.contesto === false ? 'No' : '—'}</td><td className="notas">{x.obs || '—'}</td></tr>)}</tbody></table></div>
          ))}
          {(abierto === 'ventas' || abierto === 'vendido') && (act.ventas.length === 0 ? <p className="note">No cerró ventas este mes.</p> : (
            <div className="cons-wrap"><table className="cons-table insc"><thead><tr><th>Fecha</th><th>Alumno</th><th>Curso</th><th>Grupo</th><th>Precio</th><th>Pagado</th><th>Saldo</th><th>T&amp;C</th><th>Requisitos PC</th></tr></thead>
              <tbody>{act.ventas.map((x, i) => <tr key={i}><td>{fmtF(x.fecha)}</td><td><b>{x.alumno}</b>{x.codigo && <small className="paq"><span className="cod">{x.codigo}</span></small>}</td><td>{x.curso}</td><td><span className="cod">{x.grupo}</span></td><td>{soles(x.precio)}</td><td>{soles(x.pagado)}</td><td>{x.saldo > 0 ? soles(x.saldo) : '—'}</td><td>{x.terminos ? 'Enviados' : <span className="wa falta">No</span>}</td><td>{!x.pideReq ? 'No aplica' : x.requisitos ? 'Enviados' : <span className="wa falta">No</span>}</td></tr>)}</tbody></table></div>
          ))}
          {abierto === 'cobrado' && (act.pagos.length === 0 ? <p className="note">No registró pagos este mes.</p> : (
            <div className="cons-wrap"><table className="cons-table insc"><thead><tr><th>Fecha</th><th>Alumno</th><th>Grupo</th><th>Pago N.º</th><th>Monto</th><th>Método</th><th>Comprobante</th></tr></thead>
              <tbody>{act.pagos.map((x, i) => <tr key={i}><td>{fmtF(x.fecha)}</td><td><b>{x.alumno}</b></td><td><span className="cod">{x.grupo}</span></td><td>{x.numero}</td><td>{soles(x.monto)}</td><td>{x.metodo}</td><td>{x.comprobante ? 'Subido' : <span className="wa falta">Sin comprobante</span>}</td></tr>)}</tbody></table></div>
          ))}
        </section>
      )}

      {!compacto && <section className="metas" aria-label="Metas">
        <h3 className="subh">Metas</h3>
        <div className="metas-lista">
          {metas.map((h) => (
            <div key={h.fecha} className={`meta-it ${h.cumplida ? 'ok' : h.vencida ? 'venc' : ''}`}>
              <div className="meta-top"><b>{h.cupos} cupos{h.cursos > 1 ? ` en ${h.cursos} cursos` : ''}</b><span>{h.cumplida ? 'Cumplida' : h.vencida ? 'No cumplida' : h.dias === 0 ? 'Vence hoy' : `${h.dias} día${h.dias === 1 ? '' : 's'}`} · {fmtF(h.fecha)}</span></div>
              <div className="barra"><i style={{ width: `${h.pct}%` }} /></div>
              <small>Llevas {h.cupos_actual} de {h.cupos}{h.cursos > 1 ? ` · cursos distintos: ${h.cursos_actual} de ${h.cursos}` : ''}</small>
            </div>
          ))}
        </div>
      </section>}

      {verPago && !compacto && (
        <section className="av-pago" aria-label="Lo que va ganando">
          <div>
            <small>Va ganando este mes</small>
            <b className="grande">{soles(m.aPagar)}</b>
            <span>{soles(m.sueldo)} de sueldo{m.parcial ? ` (${m.dias} de ${m.diasMes} días)` : ''}{m.pasajes > 0 && ` + ${soles(m.pasajes)} de bono de pasajes`} + {soles(m.comision.monto)} de comisión ({m.comision.pct}% de {soles(m.vendido)}){m.bono > 0 && ` + ${soles(m.bono)} de bono por curso cerrado (${m.bonos.map((b) => b.grupo).join(', ')})`}</span>
          </div>
          <div className="av-meta">
            <Meta valor={m.cupos} objetivo={sig ? sig.desde : Math.max(m.cupos, 1)} etiqueta={sig ? `Con ${sig.faltan} cupo${sig.faltan === 1 ? '' : 's'} más sube al ${sig.pct}% (llevas ${m.cupos})` : `Ya estás en el tramo máximo (${m.comision.pct}%)`} />
            <small className="tr">Tramos: {m.tramos.map((t) => `${t.desde}+ cupos: ${t.pct}%`).join(' · ')}</small>
          </div>
        </section>
      )}

      {!compacto && (<>
      <div className="vista" role="group" aria-label="Periodo de las gráficas">
        {[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map(([k, n]) => <button key={k} type="button" className={vista === k ? 'on' : ''} aria-pressed={vista === k} onClick={() => setVista(k)}>{n}</button>)}
      </div>
      <div className="av-grid">
        <section>
          <h3>Cupos y prospectos · {tit}</h3>
          <Barras datos={sa} minMax={techoCupos} series={[{ key: 'cupos', nombre: 'Cupos vendidos', color: 'var(--teal)' }, { key: 'prospectos', nombre: 'Prospectos nuevos', color: 'var(--navy-2, #3a5a94)' }]} />
        </section>
        <section>
          <h3>Vendido y cobrado · {tit}</h3>
          <Barras datos={sa} minMax={techoSoles} formato={soles}
            series={[{ key: 'vendido', nombre: 'Vendido', color: 'var(--navy-2, #3a5a94)' }, { key: 'cobrado', nombre: 'Cobrado', color: 'var(--teal)' }]} />
        </section>
        <section>
          <h3>Del interesado a la venta</h3>
          <Embudo pasos={[
            { label: 'Interesados', valor: m.interesados, color: '#3a5a94' },
            { label: 'Contactados', valor: m.contactados, color: '#2b8cc4' },
            { label: 'Contestaron', valor: m.contestaron, color: '#1FBFA8' },
            { label: 'Cupos vendidos', valor: m.cupos, color: '#0f9e8b' },
          ]} />
          <small className="nota-ch">Prospectos propios inscritos este mes: {m.prospectosInscritos} de {m.prospectos}.</small>
        </section>
      </div></>)}

      {verPago && !compacto && (
        <>
          <h3 className="subh">Pago mes a mes</h3>
          <div className="cons-wrap">
            <table className="cons-table" style={{ minWidth: 0 }}>
              <thead><tr><th>Mes</th><th>Cupos</th><th>Vendido</th><th>Tramo</th><th>Comisión</th><th>Sueldo</th><th>A pagar</th></tr></thead>
              <tbody>{[...serie].filter((s) => s.activo).reverse().map((s) => (
                <tr key={s.mes}><td>{nombreMes(s.mes)}</td><td>{s.cupos}</td><td>{soles(s.vendido)}</td><td>{s.comision.pct}%</td><td>{soles(s.comision.monto)}</td><td>{soles(s.sueldo + s.pasajes)}{s.parcial && <small className="paq">{s.dias} de {s.diasMes} días</small>}</td><td><b>{soles(s.aPagar)}</b></td></tr>
              ))}</tbody>
            </table>
          </div>
          {trab?.fecha_inicio && <small className="nota-ch">Inicio de labores: {new Date(String(trab.fecha_inicio).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}. El primer mes se paga el sueldo por los días trabajados.</small>}
          <small className="nota-ch">La comisión se calcula sobre el total vendido del mes, con el tramo que alcanzan los cupos cerrados ese mes.</small>
        </>
      )}

      {historial && !compacto && (
        <>
      <h3 className="subh">Historial</h3>
      {hist.length === 0 ? <div className="vacio"><p>Aún no hay actividad.</p></div> : (
        <ul className="hist">{(todo ? hist : hist.slice(0, 10)).map((e, i) => <li key={i}><span className="tag">{e.ico}</span><div>{e.txt}<small>{cuando(e.t)}</small></div></li>)}</ul>
      )}
      {hist.length > 10 && <button className="btn btn-line sm" style={{ justifySelf: 'start' }} onClick={() => setTodo(!todo)}>{todo ? 'Ver menos' : `Ver los ${hist.length} movimientos`}</button>}
        </>
      )}
    </div>
  )
}
