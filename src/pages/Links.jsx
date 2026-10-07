import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadEnlaces, hrefEnlace, contarClic } from '../lib/data.js'

const Flecha = () => (
  <svg className="lk-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

export default function Links() {
  const [items, setItems] = useState(null)
  useEffect(() => {
    document.title = 'CCN · Links'
    loadEnlaces().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <div className="lk">
      <main className="lk-in">
        <Link to="/" className="lk-logo-full" aria-label="Ir al inicio de CCN">
          <img src="/logo-completo-blanco.png" alt="CCN Centro de Capacitación & Negocios" />
        </Link>

        <nav className="lk-list" aria-label="Enlaces">
          {items === null && <><div className="lk-skel" /><div className="lk-skel" /></>}
          {items?.map((e) => {
            const href = hrefEnlace(e)
            const interno = href.startsWith('/')
            const cuerpo = (
              <>
                <span className="lk-txt">
                  <b>{e.titulo}</b>
                  {e.subtitulo && <small>{e.subtitulo}</small>}
                </span>
                <Flecha />
              </>
            )
            const cls = `lk-card ${e.destacado ? 'main' : ''}`
            return interno ? (
              <Link key={e.id} to={href} className={cls} onClick={() => contarClic(e.id)}>{cuerpo}</Link>
            ) : (
              <a key={e.id} href={href} className={cls} target="_blank" rel="noopener noreferrer" onClick={() => contarClic(e.id)}>{cuerpo}</a>
            )
          })}
          {items?.length === 0 && <p className="lk-vacio">Pronto habrá enlaces aquí.</p>}
        </nav>

        <Link to="/" className="lk-back">Ir a la web de CCN</Link>

        <div className="lk-foot">
          <span>© {new Date().getFullYear()} CCN</span>
          <span>Powered by <b>Bro Engineering</b></span>
        </div>
      </main>
    </div>
  )
}
