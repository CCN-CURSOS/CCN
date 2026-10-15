/* PDF de Términos y condiciones que se adjunta al correo de bienvenida. */
import { TERMINOS } from './terminos.js'

export async function pdfTerminos() {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 20, ANCHO = W - M * 2
  let y = 26
  const pie = () => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110, 122, 144)
    doc.text('CCN – Centro de Capacitaciones & Negocios · FIDTAIL PERU S.A.C. (RUC 20608933019) · ccnperuacademy.com', W / 2, 288, { align: 'center' })
  }
  doc.setFillColor(15, 37, 71); doc.rect(0, 0, W, 14, 'F')
  doc.setFillColor(31, 191, 168); doc.rect(0, 14, W, 1.6, 'F')
  doc.setTextColor(15, 37, 71); doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
  doc.text('Términos y condiciones', M, y); y += 8
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 72, 94)
  const intro = doc.splitTextToSize('CCN – Centro de Capacitaciones & Negocios es una marca de FIDTAIL PERU S.A.C. (RUC 20608933019). Al inscribirte en un curso de CCN aceptas las siguientes condiciones.', ANCHO)
  doc.text(intro, M, y); y += intro.length * 5 + 5
  TERMINOS.forEach((t, i) => {
    const lineas = doc.splitTextToSize(t, ANCHO - 10)
    const alto = lineas.length * 4.9 + 4
    if (y + alto > 280) { pie(); doc.addPage(); doc.setFillColor(31, 191, 168); doc.rect(0, 0, W, 1.6, 'F'); y = 20 }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(31, 191, 168)
    doc.text(String(i + 1).padStart(2, '0'), M, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 37, 71)
    doc.text(lineas, M + 10, y)
    y += alto
  })
  pie()
  return doc.output('blob')
}
