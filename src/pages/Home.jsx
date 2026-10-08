import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCatalog, destacados } from '../lib/data.js'
import CourseCard from '../components/CourseCard.jsx'
import { Header, Footer } from '../components/Layout.jsx'
import { SeccionComo, SeccionPreguntas, SeccionContacto, SeccionHerramientas } from '../components/Secciones.jsx'

export default function Home() {
  const [data, setData] = useState({ cursos: [], grupos: [] })
  const [error, setError] = useState('')
  const [foto, setFoto] = useState(false)

  // Si existe /hero.jpg en public/, el inicio usa la foto grande; si no, las tarjetas de siempre.
  useEffect(() => {
    const img = new Image()
    img.onload = () => setFoto(true)
    img.src = '/hero.jpg'
  }, [])

  useEffect(() => {
    loadCatalog().then(setData).catch(() => setError('No se pudo cargar el catálogo. Escríbenos por WhatsApp.'))
  }, [])

  const { cursos, grupos } = data
  const gruposDe = (id) => grupos.filter((g) => g.curso_id === id).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))

  return (
    <>
      <Header />

      <main id="top">
        <div className={`hero ${foto ? 'hero-foto' : ''}`}><div className="wrap hero-grid">
          <div>
            <h1>Aprende IA, web, ventas digitales <em>y más.</em></h1>
            <p className="lead">Capacitaciones, cursos online y presenciales.</p>
            <div className="cta-row">
              <Link className="btn btn-line" to="/cursos">Ver los cursos</Link>
            </div>
          </div>
          {!foto && <div className="stack" aria-hidden="true">
            {destacados(cursos).slice(0, 3).map((c, i) => (
              <div key={c.id} className={`card c${i + 1}`} style={{ background: `var(--${c.color})` }}>
                <small>{c.horas} H · ONLINE</small><b>{c.titulo.toUpperCase()}</b>
              </div>
            ))}
          </div>}
        </div></div>

        <section id="cursos"><div className="wrap">
          <div className="head"><span className="eyebrow">Catálogo</span><h2>Elige el curso que necesitas</h2></div>
          {error && <p className="note">{error}</p>}
          <div className="grid">
            {destacados(cursos).map((c) => <CourseCard key={c.id} c={c} grupo={gruposDe(c.id)[0]} />)}
          </div>
          <Link className="more-box" to="/cursos">
            <span>Ver todos los cursos</span>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div></section>

        <SeccionComo cursos={cursos} grupos={grupos} />
        <SeccionPreguntas />
        <SeccionContacto cursos={cursos} />
        <SeccionHerramientas />
      </main>

      <Footer />
    </>
  )
}
