/* Funciones pequeñas de formato y redondeo compartidas por todo el sistema (una sola definición). */
export const r2 = (n) => Math.round(Number(n || 0) * 100) / 100
export const suma = (xs) => r2(xs.reduce((t, x) => t + Number(x || 0), 0))
export const soles = (n) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const nombreMes = (m) => m ? new Date(m + '-01T00:00:00').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }) : ''
/* Enlace de WhatsApp a un celular de cliente (9 dígitos peruanos -> agrega 51) */
export const waTel = (n) => `https://wa.me/${String(n || '').replace(/\D/g, '').replace(/^(\d{9})$/, '51$1')}`
/* Nombre a mostrar de un prospecto: el nombre es opcional (no todos lo dan), así que si falta se muestra el celular */
export const nombreProspecto = (p) => String((p && p.nombres) || '').trim() || String((p && p.celular) || '').trim() || 'Sin nombre'
