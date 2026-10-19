/* Iconos lineales simples (SVG) para el panel. */
const P = {
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></>,
  clip: <path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" />,
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
  down: <path d="M12 5v14M5 12l7 7 7-7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M19 12H5M12 5l-7 7 7 7" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  ventas: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>,
  web: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  academico: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v6" /></>,
  gerencia: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
}
export default function Icon({ n, size = 15, fill = false }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n]}</svg>
  )
}

/* Flecha de los botones INSCRÍBETE */
export const Flecha = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
