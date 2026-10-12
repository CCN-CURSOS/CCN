import { useMemo, useState } from 'react'
import { metricasVendedor, serieVendedor, historialVendedor } from '../lib/ventas'
import { Barras, Embudo, Meta } from '../components/Charts'

const soles = (n) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const nombreMes = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
const corto = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
const cuando = (iso) => new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/* Avance de un vendedor: lo usa la vendedora en su panel y el gerente en la ficha del trabajador. */
export default function AvanceVendedor({ data, email, trab, verPago = true }) {
  const hoy = new Date().toISOString().slice(0, 7)
  const [mes, setMes] = useState(hoy)
  const m = useMemo(() => metricasVendedor(data, email, mes, trab), [data, email, mes, trab])
  const serie = useMemo(() => serieVendedor(data, email, mes, trab, 6), [data, email, mes, trab])
  const hist = useMemo(() => historialVendedor(data, email), [data, email])
  const meses = [...new Set([hoy, ...(data.matriculas || []).filter((x) => x.vendedor === email).map((x) => String(x.fecha_inscripcion).slice(0, 7))])].sort().reverse()
  const sig = m.comision.siguiente

  return (
    <div className="avance">
      <div className="av-top">
        <label className="mesel">Mes
          <select id="av-mes" value={mes} onChange={(e) => setMes(e.target.value)}>{meses.map((x) => <option key={x} value={x}>{nombreMes(x)}</option>)}</select>
        </label>
      </div>

      <div className="kpis">
        <div><b>{m.prospectos}</b><span>prospectos nuevos</span></div>
        <div><b>{m.interesados}</b><span>interesados derivados</span></div>
        <div><b>{m.cupos}</b><span>cupos vendidos</span></div>
        <div><b>{soles(m.vendido)}</b><span>vendido</span></div>
        <div><b>{soles(m.cobrado)}</b><span>cobrado</span></div>
      </div>

      {verPago && (
        <section className="av-pago" aria-label="Lo que va ganando">
          <div>
            <small>Va ganando este mes</small>
            <b className="grande">{soles(m.aPagar)}</b>
            <span>{soles(m.sueldo)} de sueldo + {soles(m.comision.monto)} de comisión ({m.comision.pct}% de {soles(m.vendido)})</span>
          </div>
          <div className="av-meta">
            <Meta valor={m.cupos} objetivo={sig ? sig.desde : Math.max(m.cupos, 1)} etiqueta={sig ? `Con ${sig.faltan} cupo${sig.faltan === 1 ? '' : 's'} más sube al ${sig.pct}% (llevas ${m.cupos})` : `Ya estás en el tramo máximo (${m.comision.pct}%)`} />
            <small className="tr">Tramos: {m.tramos.map((t) => `${t.desde}+ cupos → ${t.pct}%`).join(' · ')}</small>
          </div>
        </section>
      )}

      <div className="av-grid">
        <section>
          <h3>Cupos y prospectos por semana</h3>
          <Barras datos={m.sem} series={[{ key: 'cupos', nombre: 'Cupos vendidos', color: 'var(--teal)' }, { key: 'prospectos', nombre: 'Prospectos nuevos', color: 'var(--navy-2, #3a5a94)' }]} />
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
        <section>
          <h3>Últimos 6 meses · cupos vendidos</h3>
          <Barras datos={serie.map((s) => ({ label: corto(s.mes), cupos: s.cupos }))} series={[{ key: 'cupos', nombre: 'Cupos', color: 'var(--teal)' }]} />
        </section>
        <section>
          <h3>Últimos 6 meses · vendido</h3>
          <Barras datos={serie.map((s) => ({ label: corto(s.mes), vendido: s.vendido, cobrado: s.cobrado }))} formato={soles}
            series={[{ key: 'vendido', nombre: 'Vendido', color: 'var(--navy-2, #3a5a94)' }, { key: 'cobrado', nombre: 'Cobrado', color: 'var(--teal)' }]} />
        </section>
      </div>

      {verPago && (
        <>
          <h3 className="subh">Pago mes a mes</h3>
          <div className="cons-wrap">
            <table className="cons-table" style={{ minWidth: 0 }}>
              <thead><tr><th>Mes</th><th>Cupos</th><th>Vendido</th><th>Tramo</th><th>Comisión</th><th>Sueldo</th><th>A pagar</th></tr></thead>
              <tbody>{[...serie].reverse().map((s) => (
                <tr key={s.mes}><td>{nombreMes(s.mes)}</td><td>{s.cupos}</td><td>{soles(s.vendido)}</td><td>{s.comision.pct}%</td><td>{soles(s.comision.monto)}</td><td>{soles(s.sueldo)}</td><td><b>{soles(s.aPagar)}</b></td></tr>
              ))}</tbody>
            </table>
          </div>
          <small className="nota-ch">La comisión se calcula sobre el total vendido del mes, con el tramo que alcanzan los cupos cerrados ese mes.</small>
        </>
      )}

      <h3 className="subh">Historial</h3>
      {hist.length === 0 ? <div className="vacio"><p>Aún no hay actividad.</p></div> : (
        <ul className="hist">{hist.map((e, i) => <li key={i}><span aria-hidden="true">{e.ico}</span><div>{e.txt}<small>{cuando(e.t)}</small></div></li>)}</ul>
      )}
    </div>
  )
}
