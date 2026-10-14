/* Cronograma de evaluaciones (T1 y T2) de un grupo, calculado con las fechas de sus clases.
   Reglas (acordadas con gerencia):
   · T1 se anuncia al cerrar la clase donde termina la primera mitad; plazo: 3 días después.
   · T2 (proyecto final) se anuncia en la penúltima clase; fecha límite: 48 h antes de la última clase.
   · La última clase es de repaso: el profesor revisa los trabajos que eligió y responde preguntas.
   · El certificado sale dentro de las 72 h siguientes a la última clase.
   Club Ofimática: cada programa (Word, Excel, PowerPoint) es un ciclo de 6 clases con su propio T1, T2 y cierre. */
import { PROGRAMAS_CLUB, CLASES_POR_PROGRAMA } from './certificados.js'

export const DIAS_T1 = 3
export const HORAS_T2 = 48
export const HORAS_CERTIFICADO = 72

const MS_DIA = 86400000
const TZ = 'America/Lima'
const dt = (iso) => new Date(iso)

export const fechaHora = (d) => {
  if (!d) return ''
  const x = d instanceof Date ? d : new Date(d)
  const f = new Intl.DateTimeFormat('es-PE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(x)
  return f.replace(/\s?([ap])\.\s?m\./gi, ' $1m').replace(/\./g, '').replace(/\s+/g, ' ')
}
export const soloFecha = (d) => {
  if (!d) return ''
  const x = d instanceof Date ? d : new Date(d)
  return new Intl.DateTimeFormat('es-PE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(x).replace(/\./g, '')
}
/* 'YYYY-MM-DD' (Lima) de un instante */
export const isoLima = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d instanceof Date ? d : new Date(d))
/* Fin del día (23:59 hora de Lima) de una fecha 'YYYY-MM-DD' */
export const finDelDia = (iso) => new Date(`${iso}T23:59:00-05:00`)

/* clases: [{numero, inicio, fin}] del grupo; entregables: los del curso (con etapa y programa); cfg: filas de grupo_evaluaciones.
   Devuelve una fila por evaluación: { e, etapa, programa, anuncio, limite, cierre, manual, enlace, n } */
export function cronogramaGrupo(clases, entregables, cfg = []) {
  const cl = [...(clases || [])].sort((a, b) => a.numero - b.numero)
  const out = []
  const lista = [...(entregables || [])].filter((e) => e.activo !== false).sort((a, b) => a.orden - b.orden)
  for (const e of lista) {
    let trozo = cl
    if (e.programa) {
      const i = PROGRAMAS_CLUB.findIndex((p) => p.titulo === e.programa)
      trozo = i >= 0 ? cl.slice(i * CLASES_POR_PROGRAMA, (i + 1) * CLASES_POR_PROGRAMA) : cl
    }
    const m = trozo.length
    const c = (cfg || []).find((x) => String(x.entregable_id) === String(e.id))
    const fila = { e, etapa: e.etapa || 'T2', programa: e.programa || '', n: m, enlace: c?.enlace || '', manual: !!c?.fecha_limite, anuncio: null, limite: null, cierre: null }
    if (m >= 2) {
      const ultima = trozo[m - 1]
      fila.cierre = ultima
      if (fila.etapa === 'T1') {
        const k = Math.ceil(m / 2)
        fila.anuncio = trozo[k - 1]
        fila.limite = new Date(dt(fila.anuncio.fin).getTime() + DIAS_T1 * MS_DIA)
      } else {
        fila.anuncio = trozo[m - 2]
        fila.limite = new Date(dt(ultima.inicio).getTime() - HORAS_T2 * 3600000)
      }
      if (c?.fecha_limite) fila.limite = finDelDia(String(c.fecha_limite).slice(0, 10))
    }
    out.push(fila)
  }
  return out
}

/* Texto listo para pegar en el WhatsApp del profesor */
export function textoCronograma({ curso, codigo, horario, instructor, filas }) {
  const L = [`📅 *Cronograma de evaluaciones*`, `*${curso}* · grupo ${codigo}${horario ? ` · ${horario}` : ''}`]
  if (instructor) L.push(`Profesor(a): ${instructor}`)
  L.push('')
  for (const f of filas) {
    const nom = `${f.etapa}${f.programa ? ` ${f.programa}` : ''}: ${f.e.titulo}`
    L.push(`*${nom}*`)
    if (f.anuncio) L.push(`• Se anuncia: clase ${f.anuncio.numero} (${fechaHora(f.anuncio.inicio)})`)
    if (f.limite) L.push(`• Fecha límite de entrega: ${fechaHora(f.limite)}`)
    if (f.etapa === 'T2' && f.cierre) L.push(`• Última clase (repaso de trabajos y preguntas): ${fechaHora(f.cierre.inicio)}`)
    if (f.enlace) L.push(`• Entrega aquí: ${f.enlace}`)
    L.push('')
  }
  L.push(`🎓 Los certificados salen dentro de las ${HORAS_CERTIFICADO} h después de la última clase.`)
  return L.join('\n')
}

/* PDF del cronograma para entregar al profesor: calendario de clases + T1/T2 con fechas exactas */
export async function pdfCronograma({ curso, codigo, horario, instructor, clases, filas, zoom }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 16
  let y = 0
  doc.setFillColor(15, 37, 71); doc.rect(0, 0, W, 30, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17)
  doc.text('Cronograma del grupo', M, 14)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text('CCN - Centro de Capacitaciones y Negocios', M, 21)
  doc.setFillColor(31, 191, 168); doc.rect(0, 30, W, 1.6, 'F')
  y = 42
  doc.setTextColor(15, 37, 71); doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  const tit = doc.splitTextToSize(`${codigo ? codigo + ' - ' : ''}${curso}`, W - 2 * M)
  doc.text(tit, M, y); y += tit.length * 6 + 1
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 60, 60)
  if (horario) { doc.text(horario, M, y); y += 5 }
  if (instructor) { doc.text(`Profesor(a): ${instructor}`, M, y); y += 5 }
  if (zoom) { doc.text(`Zoom: ${zoom}`, M, y); y += 5 }
  y += 4
  const seccion = (t) => {
    if (y > 262) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(15, 37, 71); doc.text(t, M, y)
    doc.setDrawColor(31, 191, 168); doc.setLineWidth(0.6); doc.line(M, y + 1.5, M + 24, y + 1.5); y += 8
  }
  const fila = (a, b, neg) => {
    if (y > 278) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', neg ? 'bold' : 'normal'); doc.setFontSize(9.5); doc.setTextColor(40, 40, 40)
    doc.text(a, M, y)
    const t = doc.splitTextToSize(b, W - 2 * M - 34)
    doc.text(t, M + 34, y); y += Math.max(t.length, 1) * 4.8 + 1.2
  }
  seccion('Clases')
  const ult = clases[clases.length - 1]
  clases.forEach((c) => fila(`Clase ${c.numero}${c === ult ? ' (repaso)' : ''}`, fechaHora(c.inicio) + ` - ${horaFin(c.fin)}`))
  y += 3
  seccion('Evaluaciones y entregas')
  filas.forEach((f) => {
    fila(`${f.etapa}${f.programa ? ' ' + f.programa : ''}`, f.e.titulo, true)
    if (f.anuncio) fila('  Se anuncia', `Clase ${f.anuncio.numero} (${fechaHora(f.anuncio.inicio)})`)
    if (f.limite) fila('  Fecha limite', fechaHora(f.limite))
    if (f.etapa === 'T2' && f.cierre) fila('  Ultima clase', `Repaso de trabajos y preguntas: ${fechaHora(f.cierre.inicio)}`)
    if (f.enlace) fila('  Entrega en', f.enlace)
    y += 1.5
  })
  if (!filas.length) fila('', 'Este curso aun no tiene evaluaciones definidas.')
  y += 3
  if (y > 262) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(90, 90, 90)
  const nota = doc.splitTextToSize(`En la ultima clase se revisan con los alumnos los trabajos que el profesor elija y se responden preguntas. Los certificados salen dentro de las ${HORAS_CERTIFICADO} h despues de la ultima clase. Hora de Lima.`, W - 2 * M)
  doc.text(nota, M, y)
  doc.save(`cronograma-${(codigo || curso).toString().replace(/[^A-Za-z0-9._-]+/g, '-')}.pdf`)
}
const horaFin = (ts) => new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(ts)).replace(/[  ]/g, ' ').replace(/\s?([ap])\.\s?m\./gi, ' $1m')
