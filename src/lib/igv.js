/* IGV (18 %). REGLA (14 oct): el precio que se escribe es el PRECIO FINAL y ya incluye IGV. El sistema nunca lo suma.
   - cursos.precio y cursos.precio_antes = precio final con IGV (enteros, sin decimales)
   - matriculas.precio = lo que paga el alumno (precio final)
   - Base imponible e IGV se DERIVAN del final (para comprobantes/SUNAT): base = final / 1.18
   - La comisión de las vendedoras se calcula sobre la base (sin IGV). */
export const IGV_TASA = 0.18
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100

export const redondear = (n) => Math.round(Number(n || 0))                  // los precios siempre enteros
export const sinIgv = (final) => r2(Number(final || 0) / (1 + IGV_TASA))   // 229 -> 194.07 (base)
export const igvDe = (final) => r2(Number(final || 0) - sinIgv(final))     // 229 -> 34.93
export const conIgv = (final) => Number(final || 0)                         // compatibilidad: el precio ya es final

/* "S/229" para mostrar en la web */
export const precioWeb = (final) => {
  const t = Number(final || 0)
  return 'S/' + (Number.isInteger(t) ? t : t.toFixed(2))
}
