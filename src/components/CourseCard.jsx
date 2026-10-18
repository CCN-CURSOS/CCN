import { Link } from 'react-router-dom'
import { fechaCorta, fmtHorario } from '../lib/data.js'
import { precioDe, precioWebMon } from '../lib/moneda.js'
import { useMonedaWeb } from '../lib/monedaWeb.js'

const Flecha = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

export default function CourseCard({ c, grupo }) {
  const lleno = grupo?.estado === 'lleno'
  const { moneda } = useMonedaWeb()
  const pr = precioDe(c, moneda)
  const conImagen = Boolean(c.imagen_url)
  const fondo = conImagen
    ? { backgroundImage: `url("${c.imagen_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `var(--${c.color})` }
  return (
    <article className="course cc">
      <div className={`cover cc-cover ${conImagen ? 'con-imagen' : ''}`} style={fondo} role={conImagen ? 'img' : undefined} aria-label={conImagen ? c.titulo : undefined}>
        <span className="cc-badge">ONLINE</span>
        {!conImagen && <h3 className="cc-sobre">{c.titulo}</h3>}
      </div>
      <div className="cc-body">
        {conImagen && <h3 className="cc-titulo">{c.titulo}</h3>}
        <p className="cc-meta">
          {c.horas} h · {c.sesiones} sesiones
          {grupo?.inicio && <> · Inicio {fechaCorta(grupo.inicio)}</>}
        </p>
        {grupo && (grupo.dias || grupo.horario) && <p className="cc-meta">{fmtHorario([grupo.dias, grupo.horario].filter(Boolean).join(' · '))}</p>}
        <div className="cc-precio">
          <b>{precioWebMon(pr.precio, pr.mon)}</b>
          {pr.antes > pr.precio && <><span className="antes">{precioWebMon(pr.antes, pr.mon)}</span><span className="dsct">-{Math.round((1 - pr.precio / pr.antes) * 100)}%</span></>}
        </div>

        <div className="cc-pie">
          <Link className="cc-ins" to={`/cursos/${c.id}`}>
            {lleno ? 'LISTA DE ESPERA' : 'INSCRÍBETE'} <Flecha />
          </Link>
        </div>
      </div>
    </article>
  )
}
