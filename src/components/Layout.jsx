import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { wa, telefono } from '../lib/data.js'

export function ScrollToHash() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 30); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

/* Logo CCN: automático según tema. fijo="oscuro" => siempre versión blanca (fondos azul marino) */
export function Logo({ fijo, completo }) {
  const base = completo ? 'logo-completo' : 'logo'
  if (fijo === 'oscuro') return <img className="lg lg-oscuro-fijo" src={`/${base}-blanco.png`} alt="CCN" />
  return (
    <>
      <img className="lg lg-claro" src={`/${base}.png`} alt="CCN" />
      <img className="lg lg-oscuro" src={`/${base}-blanco.png`} alt="" aria-hidden="true" />
    </>
  )
}

export const hola = () => wa('Hola, quiero información sobre los cursos de CCN')

export function Header() {
  return (
    <header>
      <div className="wrap bar">
        <Link className="logo" to="/" aria-label="CCN Centro de Capacitaciones y Negocios"><Logo /></Link>
        <nav aria-label="Principal">
          <Link to="/cursos">Cursos</Link><Link to="/como-aprendes">Cómo aprendes</Link><Link to="/horarios">Horarios</Link><Link to="/preguntas">Preguntas</Link><Link to="/contacto">Escríbenos</Link><Link to="/links">Links</Link>
        </nav>
        <div className="bar-r">
          <a className="btn btn-wa" href={hola()} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <Link className="usr" to="/admin" aria-label="Ingresar al panel" title="Ingresar">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.600 8 7" /></svg>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <>
      <footer><div className="wrap">
        <div className="frow">
          <div className="fbrand"><Link className="logo" to="/" aria-label="CCN"><Logo fijo="oscuro" /></Link><span>Aprende. Aplica. Crece.</span></div>
          <div className="fcol"><small>Contacto</small><span>WhatsApp {telefono()}</span></div>
          <div className="fcol"><small>Pagos</small><span>Yape · Plin · Transferencia bancaria</span></div>
          <div className="fcol"><small>Con el respaldo de</small><span className="backers"><b>Fidtail Perú</b><b>Bro Engineering</b></span></div>
        </div>
        <p className="flinks"><Link to="/cursos">Cursos</Link><Link to="/como-aprendes">Cómo aprendes</Link><Link to="/horarios">Horarios</Link><Link to="/preguntas">Preguntas</Link><Link to="/contacto">Escríbenos</Link><Link to="/links">Links</Link><span>Términos y condiciones</span><span>Política de compras</span><span>Libro de reclamaciones</span></p>
        <p className="powered">Powered by <b>Bro Engineering</b></p>
      </div></footer>
      <a className="wa-float" href={hola()} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.3.6 4.4 1.7 6.3L3 29l7.4-2c1.8 1 3.8 1.5 5.6 1.5 7 0 12.6-5.6 12.6-12.5S23 3 16 3zm0 22.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.4 1.2 1.2-4.3-.3-.4a10.2 10.2 0 0 1-1.6-5.5C5.5 9.8 10.2 5.2 16 5.2s10.5 4.6 10.5 10.3S21.8 25.8 16 25.8zm5.8-7.6c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7l.5-.5c.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5l-1-2.300c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.100-1.100 2.600s1.100 3 1.300 3.200c.2.2 2.200 3.400 5.400 4.700 3.200 1.300 3.200.9 3.800.8.6-.1 1.900-.8 2.200-1.500.3-.7.3-1.400.2-1.500-.1-.2-.3-.2-.6-.4z" /></svg>
      </a>
    </>
  )
}
