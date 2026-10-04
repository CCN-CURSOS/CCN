import { useEffect, useState } from 'react'
import { loadCatalog, wa } from '../lib/data.js'
import CourseCard from '../components/CourseCard.jsx'
import { Header, Footer } from '../components/Layout.jsx'

export default function Cursos() {
  const [data, setData] = useState({ cursos: [], grupos: [] })
  const [error, setError] = useState('')
  useEffect(() => {
    loadCatalog().then(setData).catch(() => setError('No se pudo cargar el catálogo. Escríbenos por WhatsApp.'))
  }, [])
  const { cursos, grupos } = data
  const primero = (id) =>
    grupos.filter((g) => g.curso_id === id).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))[0]

  return (
    <>
      <Header />
      <main>
        <div className="pagehead"><div className="wrap">
          <div className="head">
            <span className="eyebrow">Catálogo completo</span>
            <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800 }}>Todos los cursos</h1>
            <p>Cada curso abre cuando se completa el grupo. Te avisamos por WhatsApp apenas haya fecha.</p>
          </div>
        </div></div>
        <section style={{ paddingTop: 24 }}><div className="wrap">
          {error && <p className="note">{error}</p>}
          <div className="grid">
            {cursos.map((c) => <CourseCard key={c.id} c={c} grupo={primero(c.id)} />)}
          </div>
        </div></section>
        <div className="strip"><div className="wrap">
          <h2>¿No encuentras lo que buscas?</h2>
          <a className="btn btn-wa" href={wa('Hola, quiero proponer un curso para CCN')} target="_blank" rel="noopener noreferrer">Cuéntanos qué curso quieres</a>
        </div></div>
      </main>
      <Footer />
    </>
  )
}
