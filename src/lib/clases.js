/* Clases y asistencia · funciones puras (sin Supabase) */

export const LIMA = 'America/Lima'
export const MARGEN_ANTES_MIN = 10                      // la asistencia se abre 10 min antes de la clase (igual que en la base de datos)

/* Letras de los días (igual que en los códigos de grupo): L M X J V S D */
export const DIAS_SEMANA = [['L', 1, 'Lun'], ['M', 2, 'Mar'], ['X', 3, 'Mié'], ['J', 4, 'Jue'], ['V', 5, 'Vie'], ['S', 6, 'Sáb'], ['D', 0, 'Dom']]
const NUM = Object.fromEntries(DIAS_SEMANA.map(([l, n]) => [l, n]))

/* Feriados fijos del Perú (mes-día). Las clases no se programan en estas fechas; se pueden cambiar a mano. */
export const FERIADOS = ['01-01', '05-01', '06-29', '07-28', '07-29', '08-30', '10-08', '11-01', '12-08', '12-25']

/* "Lun.-Mié." -> ['L','X'] · "Mar.-Jue." -> ['M','J'] · "Lun.-Vie." -> L a V · "Sábados" -> ['S'] · "Sáb.-Dom." -> ['S','D'] */
export function diasDeTexto(txt) {
  const t = String(txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const orden = [['lun', 'L'], ['mar', 'M'], ['mie', 'X'], ['jue', 'J'], ['vie', 'V'], ['sab', 'S'], ['dom', 'D']]
  const hallados = []
  const re = /(lun|mar|mie|jue|vie|sab|dom)/g
  let m
  while ((m = re.exec(t))) { const l = orden.find(([k]) => k === m[1])[1]; if (!hallados.includes(l)) hallados.push(l) }
  if (/lun\D*-\D*vie/.test(t)) return ['L', 'M', 'X', 'J', 'V']        // rango de lunes a viernes
  return hallados
}

/* "19:00 - 21:30" -> ['19:00','21:30'] */
export function horaDeTexto(horario) {
  const m = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(String(horario || ''))
  const p = (h) => (h.length === 4 ? '0' + h : h)
  return m ? [p(m[1]), p(m[2])] : ['', '']
}

/* Fechas (YYYY-MM-DD) de las próximas n clases a partir de la fecha de inicio, saltando feriados */
export function generarFechas({ inicio, dias, n, feriados = FERIADOS }) {
  const lista = []
  if (!inicio || !dias?.length || !(n > 0)) return lista
  const nums = new Set(dias.map((d) => NUM[d]))
  const cur = new Date(String(inicio).slice(0, 10) + 'T12:00:00Z')
  for (let i = 0; i < 800 && lista.length < n; i++) {
    const iso = cur.toISOString().slice(0, 10)
    if (nums.has(cur.getUTCDay()) && !feriados.includes(iso.slice(5))) lista.push(iso)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return lista
}

/* Fecha + hora de Lima -> marca de tiempo con zona (Lima no tiene horario de verano: UTC-5) */
export const aTs = (fecha, hora) => `${fecha}T${hora}:00-05:00`

const fmtFecha = new Intl.DateTimeFormat('es-PE', { timeZone: LIMA, weekday: 'short', day: '2-digit', month: 'short' })
const fmtHora = new Intl.DateTimeFormat('es-PE', { timeZone: LIMA, hour: '2-digit', minute: '2-digit', hour12: true })
export const fechaClase = (ts) => fmtFecha.format(new Date(ts)).replace('.', '')
export const horaClase = (ts) => fmtHora.format(new Date(ts)).replace(/[\u202f\u00a0]/g, ' ').replace(/^0/, '')
export function fechaISOLima(ts) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: LIMA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts))
  return p
}
export function horaHHMM(ts) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: LIMA, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts))
  return p.replace('24:', '00:')
}
export const horasDeClase = (c) => Math.round(((new Date(c.fin) - new Date(c.inicio)) / 3600000) * 100) / 100

/* 'futura' (aún no se abre) · 'abierta' (se puede tomar asistencia) · 'cerrada' */
export function ventana(clase, ahora = new Date()) {
  const t = ahora.getTime()
  const ini = new Date(clase.inicio).getTime()
  const fin = new Date(clase.fin).getTime()
  if (t < ini - MARGEN_ANTES_MIN * 60000) return 'futura'
  if (t <= fin) return 'abierta'
  return 'cerrada'
}

/* Solo dos estados: Asistió o Faltó. (Una falta justificada se corrige a "Asistió" con sustento; "Tarde" no existe.)
   Los valores 'tarde' y 'justificada' solo quedan en el historial antiguo; se muestran con su etiqueta vieja. */
export const ESTADOS_ASIS = [['presente', 'Asistió'], ['falta', 'Faltó']]
export const ETIQ_ASIS = { ...Object.fromEntries(ESTADOS_ASIS), tarde: 'Asistió (tarde)', justificada: 'Asistió (justificada)' }

/* Resumen por alumno. "Clase dictada" = clase cerrada con asistencia guardada.
   Asistió = estado 'presente' (por seguridad también cuentan los valores antiguos 'tarde' y 'justificada'). */
export function resumenAlumno(clases, asistencias, alumnoId, ahora = new Date()) {
  const dictadas = clases.filter((c) => ventana(c, ahora) === 'cerrada' && asistencias.some((a) => a.clase_id === c.id))
  const mias = asistencias.filter((a) => a.alumno_id === alumnoId && dictadas.some((c) => c.id === a.clase_id))
  const asistio = mias.filter((a) => a.estado !== 'falta').length
  const n = dictadas.length
  return {
    dictadas: n, asistio, falta: mias.filter((a) => a.estado === 'falta').length,
    participo: mias.filter((a) => a.participo).length,
    pct: n ? Math.round((asistio / n) * 100) : null,
    pctPart: n ? Math.round((mias.filter((a) => a.participo).length / n) * 100) : null,
  }
}
