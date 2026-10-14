/* Capa de pago intercambiable.
   Hoy: "whatsapp" (el pedido se manda por WhatsApp y se confirma/cobra ahí).
   Mañana: agregar "izipay" (cobro con tarjeta/Yape) y "sunat" (boleta/factura electrónica) SIN tocar el carrito ni el checkout:
   solo se registra un proveedor nuevo en PROVEEDORES y se cambia PROVEEDOR_ACTIVO. */
import { wa, fechaCorta } from './data.js'
import { IGV_TASA, conIgv, igvDe } from './igv.js'

export const PROVEEDOR_ACTIVO = 'whatsapp'

const r2 = (n) => Math.round(Number(n || 0) * 100) / 100
export const soles = (n) => 'S/' + (Number.isInteger(r2(n)) ? r2(n) : r2(n).toFixed(2))

const codigoPedido = () => 'P-' + Date.now().toString(36).toUpperCase().slice(-6)

/* Arma el pedido a partir de los cursos del carrito. Precios base SIN IGV; el total lleva IGV. */
export function armarPedido({ cliente, cursos, grupoDe }) {
  const items = cursos.map((c) => {
    const g = grupoDe(c.id)
    return { curso_id: String(c.id), titulo: c.titulo, inicio: g?.inicio || '', base: r2(c.precio), igv: igvDe(c.precio), total: conIgv(c.precio) }
  })
  const subtotal = r2(items.reduce((s, i) => s + i.base, 0))
  const total = conIgv(subtotal)
  return {
    codigo: codigoPedido(), cliente, items,
    subtotal, igv: r2(total - subtotal), total, igv_tasa: IGV_TASA, moneda: 'PEN',
    // Reservado para SUNAT: tipo de comprobante y datos de facturación (boleta por defecto con el DNI/CE del alumno).
    comprobante: { tipo: 'boleta', documento: cliente.documento, tipo_doc: cliente.tipo_doc },
  }
}

const nombreCompleto = (c) => `${c.nombres} ${c.apellido_paterno} ${c.apellido_materno}`.replace(/\s+/g, ' ').trim()

export const PROVEEDORES = {
  whatsapp: {
    nombre: 'WhatsApp',
    boton: 'INSCRÍBETE',
    /* Devuelve { tipo: 'redirect', url } -> el checkout manda al visitante a esa dirección. */
    async iniciar(p) {
      const lineas = p.items.map((i) => `• ${i.titulo}${i.inicio ? ` (inicio ${fechaCorta(i.inicio)})` : ''} · ${soles(i.total)}`).join('\n')
      const msg = `Hola, quiero inscribirme en ${p.items.length > 1 ? 'estos cursos' : 'este curso'}:\n${lineas}\nTotal: ${soles(p.total)} (IGV incluido)\nPedido: ${p.codigo}\nMis datos: ${nombreCompleto(p.cliente)} · Celular: ${p.cliente.celular}`
      return { tipo: 'redirect', url: wa(msg) }
    },
  },
  // izipay: { nombre: 'Tarjeta / Yape', boton: 'PAGAR AHORA', async iniciar(p) { /* crear orden en el servidor y devolver { tipo:'redirect', url } o { tipo:'formulario', token } */ } },
}

export async function iniciarPago(pedido, proveedor = PROVEEDOR_ACTIVO) {
  const pv = PROVEEDORES[proveedor]
  if (!pv) throw new Error('Proveedor de pago no disponible')
  return pv.iniciar(pedido)
}
