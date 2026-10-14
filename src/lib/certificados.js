/* Certificados y constancias · PDF sobre la plantilla de CCN (A4 horizontal) con QR de verificación */

export const SITIO = 'https://ccnperuacademy.com'
export const urlVerificar = (codigo) => `${SITIO}/verificar?c=${encodeURIComponent(codigo)}`

export const TIPOS_CERT = {
  certificado: 'Certificado',
  constancia: 'Constancia de participación',
  certificado_club: 'Certificado del Club',
  constancia_club: 'Constancia del Club',
}
export const MIN_ASISTENCIA = 80      // % para la constancia y para el certificado
export const MIN_PARTICIPACION = 70   // % extra para el certificado

/* Club Ofimática: su constancia y su certificado propios + un certificado por cada programa (14 h cada uno, 6 clases por programa) */
export const esClub = (titulo) => /^club\b/i.test(String(titulo || '').trim())
export const PROGRAMAS_CLUB = [{ titulo: 'Word', horas: 14 }, { titulo: 'Excel', horas: 14 }, { titulo: 'PowerPoint', horas: 14 }]
export const CLASES_POR_PROGRAMA = 6

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export function fechaLargaISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : ''
}
export const hoyLima = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

/* Número del documento: CER-26-K7M2QX (sin letras que se confunden: 0/O, 1/I) */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function nuevoCodigo(tipo) {
  const pref = tipo.startsWith('constancia') ? 'CON' : 'CER'
  const buf = new Uint8Array(6)
  ;(globalThis.crypto || window.crypto).getRandomValues(buf)
  return `${pref}-${hoyLima().slice(2, 4)}-${Array.from(buf, (b) => ALFABETO[b % ALFABETO.length]).join('')}`
}

/* Qué dice cada documento */
function textos(d) {
  const cons = d.tipo.startsWith('constancia')
  const club = d.tipo.endsWith('_club')
  return {
    titulo: cons ? 'CONSTANCIA' : 'CERTIFICADO',
    verbo: cons ? `Por haber participado en ${club ? 'el programa' : 'el curso'} de:` : `Por haber culminado satisfactoriamente ${club ? 'el programa' : 'el curso'} de:`,
  }
}

/* "MARÍA FERNANDA quispe de la CRUZ" -> "María Fernanda Quispe de la Cruz" */
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'van', 'von', 'da', 'di'])
export function nombrePropio(txt) {
  return String(txt || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-PE').split(' ')
    .map((w, i) => (i > 0 && PARTICULAS.has(w) ? w : w.charAt(0).toLocaleUpperCase('es-PE') + w.slice(1))).join(' ')
}

/* Título con versalitas: primera letra grande y el resto en mayúscula más pequeña, centrado, ajustado a un ancho */
function tituloVersalitas(doc, texto, cx, y, anchoObjetivo) {
  const RATIO = 0.8
  const medir = (g) => Array.from(texto).reduce((w, ch, i) => { doc.setFontSize(i === 0 ? g : g * RATIO); return w + doc.getTextWidth(ch) + 0.9 }, 0)
  let g = 70
  while (g > 20 && medir(g) > anchoObjetivo) g -= 1
  const total = medir(g)
  let x = cx - total / 2
  Array.from(texto).forEach((ch, i) => { doc.setFontSize(i === 0 ? g : g * RATIO); doc.text(ch, x, y); x += doc.getTextWidth(ch) + 0.9 })
  return total
}

/* Dibuja el PDF. `jsPDF`, las fuentes y las imágenes (data URL / base64) vienen de fuera para poder probarlo también fuera del navegador.
   d = { tipo, nombre, curso, detalle, horas, emision, codigo, instructor:{nombre,firma}, direccion:{nombre,cargo,firma} } */
export function armarPdf(JsPDF, d, { plantilla, logo, qr, fuentes }) {
  const W = 297, H = 210, cx = W / 2
  const NAVY = [15, 37, 71], GRIS = [88, 99, 117], TEAL = [18, 140, 124]
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  doc.setProperties({ title: `${TIPOS_CERT[d.tipo]} · ${d.nombre}`, author: 'CCN – Centro de Capacitaciones y Negocios', subject: d.curso })
  let FUENTE = 'times'
  if (fuentes) {
    doc.addFileToVFS('pf-regular.ttf', fuentes.regular); doc.addFont('pf-regular.ttf', 'Playfair', 'normal')
    doc.addFileToVFS('pf-medium.ttf', fuentes.medium); doc.addFont('pf-medium.ttf', 'Playfair', 'bold')
    doc.addFileToVFS('pf-italic.ttf', fuentes.italic); doc.addFont('pf-italic.ttf', 'Playfair', 'italic')
    FUENTE = 'Playfair'
  }
  const fuente = (estilo, size, color = NAVY) => { doc.setFont(FUENTE, estilo); doc.setFontSize(size); doc.setTextColor(...color) }

  doc.addImage(plantilla, 'JPEG', 0, 0, W, H, undefined, 'FAST')
  if (logo) doc.addImage(logo, 'PNG', cx - 36, 10, 72, 32.6, undefined, 'FAST')

  const t = textos(d)
  // título con líneas finas a los lados
  fuente('bold', 50)
  const ancho = tituloVersalitas(doc, t.titulo, cx, 71, 150)
  doc.setDrawColor(...NAVY); doc.setLineWidth(0.2)
  const yl = 64, izq = cx - ancho / 2 - 7, der = cx + ancho / 2 + 7
  doc.line(Math.max(30, izq - 26), yl, izq, yl); doc.line(der, yl, Math.min(268, der + 26), yl)

  fuente('normal', 13.5, GRIS); doc.text('Se otorga a:', cx, 86, { align: 'center' })

  // nombre
  const nombre = nombrePropio(d.nombre)
  let fs = 30
  fuente('italic', fs)
  while (fs > 18) { doc.setFontSize(fs); if (doc.getTextWidth(nombre) <= 190) break; fs -= 1 }
  doc.text(nombre, cx, 102, { align: 'center' })
  doc.setLineWidth(0.25); doc.line(52, 106.5, 245, 106.5)

  fuente('normal', 13.5, GRIS); doc.text(t.verbo, cx, 120, { align: 'center' })

  // curso (hasta 2 líneas)
  fuente('bold', 22)
  let cs = 22, lineas = []
  while (cs >= 15) { doc.setFontSize(cs); lineas = doc.splitTextToSize(String(d.curso || ''), 180); if (lineas.length <= 2) break; cs -= 1 }
  const n2 = Math.min(lineas.length, 2)
  let y = n2 === 2 ? 131 : 134
  lineas.slice(0, 2).forEach((l, i) => doc.text(l, cx, y + i * 8.5, { align: 'center' }))
  y += (n2 - 1) * 8.5
  doc.line(64, y + 4, 233, y + 4)
  if (d.detalle) { fuente('italic', 12, GRIS); doc.text(d.detalle, cx, y + 11, { align: 'center' }); y += 6 }

  fuente('normal', 13, GRIS)
  if (d.horas) { doc.text(`Con una duración de ${String(d.horas).replace('.', ',')} horas académicas`, cx, y + 15, { align: 'center' }); y += 7.5 }
  doc.text(`Lima, Perú · ${fechaLargaISO(d.emision)}`, cx, y + 15, { align: 'center' })

  // firmas: instructor (izquierda) y dirección (derecha)
  const firma = (img, x) => {
    if (!img) return
    try {
      const p = doc.getImageProperties(img)
      let h = Math.min(16, 50 * p.height / p.width), w = h * p.width / p.height
      if (w > 50) { w = 50; h = w * p.height / p.width }
      doc.addImage(img, 'PNG', x - w / 2, 184 - h, w, h, undefined, 'FAST')
    } catch (e) { /* firma ilegible: se deja el espacio en blanco */ }
  }
  const bloque = (x, img, nombreF, rol) => {
    firma(img, x)
    doc.setDrawColor(...NAVY); doc.setLineWidth(0.25); doc.line(x - 28, 185.5, x + 28, 185.5)
    if (nombreF) { fuente('bold', 10.5); doc.text(nombrePropio(nombreF), x, 190.6, { align: 'center', maxWidth: 60 }) }
    fuente('normal', 9, GRIS); doc.text(rol, x, nombreF ? 195 : 191, { align: 'center' })
  }
  bloque(cx - 38, d.instructor?.firma, d.instructor?.nombre, 'Instructor(a)')
  bloque(cx + 38, d.direccion?.firma, d.direccion?.nombre, d.direccion?.cargo || 'Dirección Académica')

  // tarjeta de verificación (abajo a la derecha): QR + número del documento
  doc.setFillColor(255, 255, 255); doc.setDrawColor(190, 200, 215); doc.setLineWidth(0.2)
  doc.roundedRect(233, 177, 58, 25, 2, 2, 'FD')
  if (qr) doc.addImage(qr, 'PNG', 235.5, 179.5, 20, 20)
  fuente('normal', 7, GRIS); doc.text('N.º', 258, 185)
  fuente('bold', 8.5); doc.text(String(d.codigo || ''), 258, 189.6)
  fuente('normal', 6.5, GRIS); doc.text('Escanea para verificar', 258, 194)
  fuente('normal', 5.5, GRIS); doc.text('ccnperuacademy.com/verificar', 258, 197.5)
  return doc
}

const aDataUrl = async (url) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error('No se pudo cargar la imagen ' + url)
  const b = await r.blob()
  return new Promise((ok, mal) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = mal; f.readAsDataURL(b) })
}

const aBase64 = async (url) => (await aDataUrl(url)).split(',')[1]
let _fuentes = null
const cargarFuentes = () => (_fuentes ||= Promise.all(['regular', 'medium', 'italic'].map((k) => aBase64(`/certificados/fonts/pf-${k}.ttf`)))
  .then(([regular, medium, italic]) => ({ regular, medium, italic })).catch(() => { _fuentes = null; return null }))

/* Genera el PDF en el navegador y devuelve un Blob. d = { tipo, nombre, curso, detalle?, horas, emision, codigo, instructor?, direccion? } */
export async function generarPdf(d) {
  const [{ jsPDF }, QR] = await Promise.all([import('jspdf'), import('qrcode')])
  const [plantilla, logo, fuentes] = await Promise.all([aDataUrl('/certificados/plantilla.jpg'), aDataUrl('/logo-completo.png').catch(() => null), cargarFuentes()])
  const qr = await QR.toDataURL(urlVerificar(d.codigo), { margin: 1, width: 400, errorCorrectionLevel: 'M', color: { dark: '#0F2547', light: '#FFFFFF' } })
  return armarPdf(jsPDF, d, { plantilla, logo, qr, fuentes }).output('blob')
}

/* Foto o escaneo de una firma -> PNG con fondo transparente, recortado y de tamaño liviano (data URL) */
export function procesarFirma(file) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('No se pudo leer la imagen. Usa un PNG o JPG.')) }
    img.onload = () => {
      URL.revokeObjectURL(url)
      const k = Math.min(1, 900 / img.width)
      const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k))
      const c = document.createElement('canvas'); c.width = w; c.height = h
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h)
      const px = g.getImageData(0, 0, w, h), a = px.data
      let x0 = w, y0 = h, x1 = 0, y1 = 0
      for (let i = 0; i < a.length; i += 4) {
        const lum = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]
        const trans = a[i + 3] < 250                               // ya viene con transparencia
        // el papel claro se vuelve transparente; la tinta queda (más oscura = más opaca)
        const alfa = trans ? a[i + 3] : lum > 205 ? 0 : lum > 150 ? Math.round(255 * (205 - lum) / 55) : 255
        a[i] = 15; a[i + 1] = 37; a[i + 2] = 71; a[i + 3] = alfa      // tinta en azul marino CCN
        if (alfa > 40) { const p = i / 4, x = p % w, y = (p - x) / w; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      }
      if (x1 <= x0 || y1 <= y0) { mal(new Error('No se ve ninguna firma en la imagen. Prueba con una foto más clara.')); return }
      g.putImageData(px, 0, 0)
      const m = 6, cw = x1 - x0 + 1 + m * 2, ch = y1 - y0 + 1 + m * 2
      const o = document.createElement('canvas'); o.width = cw; o.height = ch
      o.getContext('2d').drawImage(c, x0 - m, y0 - m, cw, ch, 0, 0, cw, ch)
      ok(o.toDataURL('image/png'))
    }
    img.src = url
  })
}

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
export const nombreArchivo = (d) => `${(d.tipo.startsWith('constancia') ? 'Constancia' : 'Certificado')}-${String(d.curso).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}-${String(d.nombre).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}.pdf`

/* ¿Qué documentos le corresponden a una matrícula? (sin tocar la base: solo describe) */
export function documentosDe({ curso_titulo, horas }) {
  if (esClub(curso_titulo)) {
    return [
      { clave: 'club-constancia', tipo: 'constancia_club', curso: curso_titulo, horas, detalle: 'Word · Excel · PowerPoint', req: 'asistencia' },
      { clave: 'club-certificado', tipo: 'certificado_club', curso: curso_titulo, horas, detalle: 'Word · Excel · PowerPoint', req: 'completo' },
      ...PROGRAMAS_CLUB.map((p, i) => ({ clave: `club-${p.titulo}`, tipo: 'certificado', curso: p.titulo, horas: p.horas, bloque: i, req: 'completo' })),
    ]
  }
  return [
    { clave: 'constancia', tipo: 'constancia', curso: curso_titulo, horas, req: 'asistencia' },
    { clave: 'certificado', tipo: 'certificado', curso: curso_titulo, horas, req: 'completo' },
  ]
}
