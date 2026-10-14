/* Carrito de cursos (solo en el navegador del visitante). Guarda los id de curso; los precios se leen siempre del catálogo. */
import { useSyncExternalStore } from 'react'

const KEY = 'ccn-carrito-v1'
const leer = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.map(String) : [] } catch { return [] }
}
let items = leer()
const subs = new Set()
const avisar = () => subs.forEach((f) => f())
function guardar(n) {
  items = n
  try { localStorage.setItem(KEY, JSON.stringify(n)) } catch { /* sin almacenamiento: sigue en memoria */ }
  avisar()
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === KEY) { items = leer(); avisar() } })
}

export const agregar = (id) => { id = String(id); if (!items.includes(id)) guardar([...items, id]) }
export const quitar = (id) => guardar(items.filter((x) => x !== String(id)))
export const vaciar = () => guardar([])
export const limpiarInvalidos = (validos) => { const v = new Set(validos.map(String)); const n = items.filter((x) => v.has(x)); if (n.length !== items.length) guardar(n) }

export function useCarrito() {
  const ids = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => items, () => [])
  return { ids, cantidad: ids.length, tiene: (id) => ids.includes(String(id)), agregar, quitar, vaciar }
}
