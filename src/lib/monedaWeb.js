/* Moneda que ve el visitante de la web (soles o dólares). Se recuerda en su navegador. */
import { useSyncExternalStore } from 'react'

/* La web pública muestra SOLO soles (decisión 18-oct). Los dólares se manejan en el panel y el manual de ventas.
   Para reactivar el selector de moneda en la web: poner true y volver a mostrar <SelectorMoneda /> en Layout. */
export const MONEDA_WEB_ACTIVA = false
const KEY = 'ccn-moneda-v1'
const leer = () => { try { return MONEDA_WEB_ACTIVA && localStorage.getItem(KEY) === 'USD' ? 'USD' : 'PEN' } catch { return 'PEN' } }
let actual = leer()
const subs = new Set()
export function setMonedaWeb(m) {
  actual = MONEDA_WEB_ACTIVA && m === 'USD' ? 'USD' : 'PEN'
  try { localStorage.setItem(KEY, actual) } catch { /* sin almacenamiento: sigue en memoria */ }
  subs.forEach((f) => f())
}
export function useMonedaWeb() {
  const moneda = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => actual, () => 'PEN')
  return { moneda, setMoneda: setMonedaWeb }
}
