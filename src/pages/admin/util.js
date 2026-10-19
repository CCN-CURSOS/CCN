import { soles } from '../../lib/formato.js'
import { fmtMoneda } from '../../lib/moneda.js'

/* ================= INSCRITOS (alumnos, matrículas y pagos) ================= */
/* Soles y dólares nunca se suman: si hay dólares se muestran aparte, sin tipo de cambio */
export const dosMon = (t) => (t.USD > 0 ? (t.PEN > 0 ? `${soles(t.PEN)} + ${fmtMoneda(t.USD, 'USD')}` : fmtMoneda(t.USD, 'USD')) : soles(t.PEN))

export const hoyISO = () => new Date().toISOString().slice(0, 10)
