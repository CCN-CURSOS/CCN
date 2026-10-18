/* Nota de pago (PDF) para inscripciones en dólares.
   OJO: es un documento interno de CCN. NO es una boleta ni una factura electrónica (SUNAT). */
import { fmtMoneda } from './moneda.js'

const fecha = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—')

export async function generarNotaPago(x) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 20
  const mon = x.moneda === 'USD' ? 'USD' : 'PEN'
  const a = x.alumno || {}
  let y = 24

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(15, 37, 71)
  doc.text('CCN – Centro de Capacitaciones & Negocios', M, y); y += 7
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110, 122, 144)
  doc.text('FIDTAIL PERU S.A.C. · RUC 20608933019 · ccnperuacademy.com', M, y); y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(31, 191, 168)
  doc.text('NOTA DE PAGO', M, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(15, 37, 71)
  doc.text(`Fecha de emisión: ${fecha(new Date().toISOString())}`, W - M, y, { align: 'right' }); y += 10

  const fila = (k, v) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(110, 122, 144); doc.text(k, M, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 37, 71); doc.text(String(v || '—'), M + 42, y); y += 6.5
  }
  fila('Alumno', [a.nombres, a.apellido_paterno, a.apellido_materno].filter(Boolean).join(' '))
  fila('Código de alumno', a.codigo)
  fila('Documento', `${a.tipo_doc || ''} ${a.documento || ''}`.trim())
  fila('Correo', a.email)
  y += 4

  doc.setDrawColor(227, 232, 240); doc.line(M, y, W - M, y); y += 7
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 37, 71); doc.text('Detalle', M, y); y += 7
  ;(x.matriculas || []).filter((m) => m.estado === 'activa').forEach((m) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text(`${m.curso_titulo}${m.grupo_codigo ? ` · ${m.grupo_codigo}` : ''}`, M, y)
    doc.text(fmtMoneda(m.precio, mon), W - M, y, { align: 'right' }); y += 6.5
  })
  y += 2; doc.line(M, y, W - M, y); y += 7

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Pagos recibidos', M, y); y += 7
  if (!x.pagosLista.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text('Aún no hay pagos registrados.', M, y); y += 6.5 }
  x.pagosLista.forEach((p) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text(`Pago ${p.numero} · ${fecha(p.fecha)} · ${p.metodo}`, M, y)
    doc.text(fmtMoneda(p.monto, mon), W - M, y, { align: 'right' }); y += 6.5
  })
  y += 2; doc.line(M, y, W - M, y); y += 8

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text('Precio total', M, y); doc.text(fmtMoneda(x.precio, mon), W - M, y, { align: 'right' }); y += 6.5
  doc.text('Total pagado', M, y); doc.text(fmtMoneda(x.pagado, mon), W - M, y, { align: 'right' }); y += 6.5
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text('Saldo', M, y); doc.text(fmtMoneda(x.saldo, mon), W - M, y, { align: 'right' }); y += 14

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(110, 122, 144)
  const aviso = doc.splitTextToSize('Esta nota de pago confirma los pagos registrados por CCN para la inscripción indicada. Es un documento interno y no reemplaza una boleta ni una factura electrónica.', W - M * 2)
  doc.text(aviso, M, y)
  doc.text('Aprende. Aplica. Crece.', W / 2, 288, { align: 'center' })

  const nombre = `nota-de-pago-${(a.codigo || a.documento || 'alumno').toString().replace(/[^\w-]+/g, '')}.pdf`
  doc.save(nombre)
}
