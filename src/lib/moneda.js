/* Dos monedas: soles (PEN) y dólares (US$). Cada inscripción y cada pago va en UNA sola moneda; no hay tipo de cambio. */
export const MONEDAS = {
  PEN: { simbolo: 'S/', nombre: 'Soles' },
  USD: { simbolo: 'US$', nombre: 'Dólares' },
}
export const monedaDe = (x) => (x && x.moneda === 'USD' ? 'USD' : 'PEN')
export const simbolo = (m) => (m === 'USD' ? 'US$' : 'S/')

export const fmtMoneda = (n, moneda = 'PEN') =>
  `${simbolo(moneda)} ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

/* Precio final y precio tachado del curso en la moneda elegida (0 = aún no tiene precio en esa moneda) */
export const precioEn = (curso, moneda = 'PEN') => Number((moneda === 'USD' ? curso?.precio_usd : curso?.precio) || 0)
export const antesEn = (curso, moneda = 'PEN') => Number((moneda === 'USD' ? curso?.precio_antes_usd : curso?.precio_antes) || 0)
export const vendeEnUsd = (curso) => Number(curso?.precio_usd || 0) > 0

/* Tope de descuento libre de las vendedoras (en %), definido por gerencia en Web > Ajustes. 0 = no hay descuento libre. */
export const descuentoMaxPct = (ajustes) => {
  const n = Number(ajustes?.descuento_max_pct)
  return n > 0 && n <= 100 ? n : 0
}
/* Precio mínimo que puede ofrecer sin pedir autorización (se redondea hacia arriba: nunca queda por debajo del tope) */
export const precioMinimoLibre = (lista, pct) => (pct > 0 && lista > 0 ? Math.ceil(lista * (1 - pct / 100) - 1e-9) : lista)

/* Suma por moneda: devuelve { PEN, USD } */
export const sumaPorMoneda = (filas, valor, moneda = (f) => monedaDe(f)) =>
  filas.reduce((acc, f) => { const k = moneda(f); acc[k] = Math.round((acc[k] + Number(valor(f) || 0)) * 100) / 100; return acc }, { PEN: 0, USD: 0 })

/* ---------- Web pública: precio a mostrar según la moneda elegida por el visitante ---------- */
/* Si el curso aún no tiene precio en dólares, se muestra en soles (nunca se convierte). */
export function precioDe(curso, moneda = 'PEN') {
  const usd = moneda === 'USD' && vendeEnUsd(curso)
  const mon = usd ? 'USD' : 'PEN'
  return { mon, precio: precioEn(curso, mon), antes: antesEn(curso, mon) }
}
/* "S/229" o "US$69" para la web */
export const precioWebMon = (n, mon = 'PEN') => { const t = Number(n || 0); return simbolo(mon) + (Number.isInteger(t) ? t : t.toFixed(2)) }
