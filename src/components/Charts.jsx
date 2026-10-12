/* Gráficos simples hechos a mano (SVG/CSS), sin librerías. */

export function Barras({ datos, series, alto = 150, formato = (n) => n, minMax = 1 }) {
  // datos: [{ label, a, b }]  series: [{ key, nombre, color }]
  const max = Math.max(1, minMax, ...datos.flatMap((d) => series.map((s) => Number(d[s.key] || 0))))
  const ancho = 100 / datos.length
  return (
    <figure className="chart" aria-label={series.map((s) => s.nombre).join(' y ')}>
      <svg viewBox={`0 0 100 ${alto / 3}`} preserveAspectRatio="none" role="img" style={{ height: alto }}>
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1="0" x2="100" y1={(alto / 3) * (1 - f) + 0.2} y2={(alto / 3) * (1 - f) + 0.2} className="grid" />)}
        {datos.map((d, i) => series.map((s, j) => {
          const h = ((Number(d[s.key] || 0)) / max) * (alto / 3 - 2)
          const w = (ancho * 0.7) / series.length
          return <rect key={`${i}-${j}`} x={i * ancho + ancho * 0.15 + j * w} y={alto / 3 - h} width={w - 0.4} height={h} rx="0.8" fill={s.color}><title>{`${d.label}: ${s.nombre} ${formato(d[s.key] || 0)}`}</title></rect>
        }))}
      </svg>
      <div className="chart-x">{datos.map((d, i) => <span key={i}>{d.label}</span>)}</div>
      <div className="chart-leg">{series.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.nombre}</span>)}</div>
    </figure>
  )
}

export function Embudo({ pasos }) {
  const max = Math.max(1, pasos[0]?.valor || 0, ...pasos.map((p) => p.valor))
  return (
    <div className="embudo">
      {pasos.map((p) => (
        <div key={p.label} className="emb-fila">
          <span>{p.label}</span>
          <div className="emb-bar"><i style={{ width: `${(p.valor / max) * 100}%`, background: p.color }} /></div>
          <b>{p.valor}</b>
        </div>
      ))}
    </div>
  )
}

export function Meta({ valor, objetivo, etiqueta }) {
  const pct = Math.min(100, objetivo ? (valor / objetivo) * 100 : 0)
  return (
    <div className="meta">
      <div className="barra"><i style={{ width: `${pct}%` }} /></div>
      <small>{etiqueta}</small>
    </div>
  )
}
