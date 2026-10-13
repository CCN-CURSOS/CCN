/* IGV (18 %). Los precios de los cursos se guardan SIN IGV (precio base) y el sistema suma el IGV solo.
   - cursos.precio y cursos.precio_antes = precio base (sin IGV)
   - matriculas.precio = lo que paga el alumno (precio base + IGV); los pagos y saldos se calculan contra ese monto
   - La comisión de las vendedoras se calcula sobre el precio base (sin IGV). */
export const IGV_TASA = 0.18
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100

export const conIgv = (base) => r2(Number(base || 0) * (1 + IGV_TASA))     // 299 -> 352.82
export const igvDe = (base) => r2(Number(base || 0) * IGV_TASA)           // 299 -> 53.82
export const sinIgv = (total) => r2(Number(total || 0) / (1 + IGV_TASA))  // 352.82 -> 299

/* "S/352.82" o "S/531" (sin decimales si son .00) para mostrar en la web */
export const precioWeb = (base) => {
  const t = conIgv(base)
  return 'S/' + (Number.isInteger(t) ? t : t.toFixed(2))
}
