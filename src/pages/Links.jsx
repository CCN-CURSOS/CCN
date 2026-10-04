import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadEnlaces, hrefEnlace, contarClic } from '../lib/data.js'

export default function Links() {
  const [items, setItems] = useState(null)
  useEffect(() => {
    document.title = 'CCN · Enlaces'
    loadEnlaces().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <div className="lk">
      <main className="lk-in">
        <div className="lk-logo" aria-label="CCN">CC<i>N</i></div>
        <p className="lk-tag">Centro de Capacitaciones y Negocios</p>
        <p className="lk-lema">APRENDE. APLICA. CRECE.</p>

        <nav className="lk-list" aria-label="Enlaces">
          {items === null && <div className="lk-skel" />}
          {items?.map((e) => {
            const href = hrefEnlace(e)
            const interno = href.startsWith('/')
            const cuerpo = (
              <>
                <b>{e.titulo}</b>
                {e.subtitulo && <span>{e.subtitulo}</span>}
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

        <div className="lk-foot">
          <span>© {new Date().getFullYear()} CCN</span>
          <span>Powered by Bro Engineering</span>
        </div>
      </main>
    </div>
  )
}
