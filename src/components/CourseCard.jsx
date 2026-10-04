import { useState } from 'react'
import { wa, fechaCorta } from '../lib/data.js'

const Ico = ({ children }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

export default function CourseCard({ c, grupo }) {
  const [abierto, setAbierto] = useState(false)
  const lleno = grupo?.estado === 'lleno'
  const msg = grupo
    ? `Hola, quiero ${lleno ? 'entrar a la lista de espera de' : 'inscribirme en'} ${c.titulo}`
    : `Hola, quiero información del curso ${c.titulo}`
  const fondo = c.imagen_url
    ? { backgroundImage: `linear-gradient(180deg, rgba(8,16,40,.15) 0%, rgba(8,16,40,.78) 100%), url("${c.imagen_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `var(--${c.color})` }
  return (
    <article className="course">
      <div className="cover" style={fondo}>
        <span className="chip">CURSO ONLINE</span>
        <h3>{c.titulo}</h3>
      </div>
      <div className="body">
        <p>{c.descripcion}</p>
        <dl className="rows">
          <div><dt>Inicio:</dt><dd>{grupo?.inicio ? fechaCorta(grupo.inicio) : 'Próximamente'} <Ico><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Ico></dd></div>
          {grupo && (grupo.dias || grupo.horario) && (
            <div><dt>Horario:</dt><dd>{[grupo.dias, grupo.horario].filter(Boolean).join(' · ')}</dd></div>
          )}
          <div><dt>Duración:</dt><dd>{c.horas} h · {c.sesiones} sesiones <Ico><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Ico></dd></div>
          {grupo?.mostrar_inscritos && (
            <div><dt>Inscritos:</dt><dd>{grupo.inscritos} de {grupo.minimo}</dd></div>
          )}
          <div>
            <dt>Inversión:</dt>
            <dd>
              {c.precio_antes > c.precio && <span className="antes">Antes S/{c.precio_antes}</span>}
              <span className="inv">S/{c.precio}</span>
            </dd>
          </div>
        </dl>
        {abierto && (
          <div className="panel">
            <ul>
              {(c.temario?.length ? c.temario : ['Temario en preparación']).map((t, i) => <li key={i}>{t}</li>)}
              {c.extra && <li className="sep">Nivel extra CCN: {c.extra}</li>}
              {c.programas && <li className="sep">Programas: {c.programas}</li>}
            </ul>
          </div>
        )}
        <div className="two">
          <button className="btn btn-line" type="button" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
            {abierto ? 'Cerrar' : 'Saber más'}
          </button>
          <a className="btn btn-wa" href={wa(msg)} target="_blank" rel="noopener noreferrer">
            {lleno ? 'Lista de espera' : 'Quiero comprar'}
          </a>
        </div>
      </div>
    </article>
  )
}
