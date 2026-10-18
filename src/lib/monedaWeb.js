/* Moneda que ve el visitante de la web (soles o dólares). Se recuerda en su navegador. */
import { useSyncExternalStore } from 'react'

const KEY = 'ccn-moneda-v1'
const leer = () => { try { return localStorage.getItem(KEY) === 'USD' ? 'USD' : 'PEN' } catch { return 'PEN' } }
let actual = leer()
const subs = new Set()
export function setMonedaWeb(m) {
  actual = m === 'USD' ? 'USD' : 'PEN'
  try { localStorage.setItem(KEY, actual) } catch { /* sin almacenamiento: sigue en memoria */ }
  subs.forEach((f) => f())
}
export function useMonedaWeb() {
  const moneda = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => actual, () => 'PEN')
  return { moneda, setMoneda: setMonedaWeb }
}
