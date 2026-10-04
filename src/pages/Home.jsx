import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCatalog, wa, fechaCorta, COLORES, destacados } from '../lib/data.js'
import CourseCard from '../components/CourseCard.jsx'
import { Header, Footer } from '../components/Layout.jsx'

// Herramientas con las que se trabaja. Los logos son los archivos oficiales de cada marca,
// guardados en public/logos/ (ej. public/logos/notion.svg). Si el archivo no existe,
// se muestra solo el nombre.
const HERRAMIENTAS = [
  ['Notion', 'notion'],
  ['Supabase', 'supabase'],
  ['Claude', 'claude'],
  ['Gemini', 'gemini'],
  ['ChatGPT', 'chatgpt'],
  ['WhatsApp', 'whatsapp'],
]
const FORMATOS = ['svg', 'png']

function Herramienta({ nombre, archivo }) {
  const [i, setI] = useState(0)
  const hayLogo = i < FORMATOS.length
  return (
    <li className="herr-item">
      {hayLogo && (
        <span className="herr-logo">
          <img src={`/logos/${archivo}.${FORMATOS[i]}`} alt="" loading="lazy" onError={() => setI(i + 1)} />
        </span>
      )}
      <span className="herr-nombre">{nombre}</span>
    </li>
  )
}

const Big = ({ children }) => (
  <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

const WHY = [
  ['Clases en vivo con el instructor', <><rect x="6" y="9" width="36" height="25" rx="3" /><path d="M16 42h16M24 34v8" /><circle cx="24" cy="19" r="4" stroke="var(--teal)" /><path d="M17 29c1-4 4-5 7-5s6 1 7 5" stroke="var(--teal)" /></>],
  ['Proyecto real de tu propio negocio en cada curso', <><rect x="8" y="8" width="32" height="32" rx="3" /><path d="M15 18h18M15 25h18" stroke="var(--teal)" /><path d="M15 32h10" /></>],
  ['Nivel extra CCN: temas que otros cursos no enseñan', <path d="M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" stroke="var(--teal)" />],
  ['Reto de 7 días y ruta para seguir aprendiendo', <><path d="M8 36l10-10 8 8 14-18" stroke="var(--teal)" /><path d="M30 16h10v10" /></>],
  ['Certificado al terminar el curso', <><rect x="7" y="9" width="34" height="24" rx="2" /><path d="M14 17h20M14 23h12" stroke="var(--teal)" /><circle cx="33" cy="35" r="5" /><path d="M30 39l-2 6 5-3 5 3-2-6" /></>],
]

const FAQ = [
  ['¿Cómo me inscribo?', 'Escríbenos por WhatsApp con el curso que te interesa. Te confirmamos la fecha, el horario y cómo separar tu cupo.'],
  ['¿Cómo pago?', 'Aceptamos Yape, Plin y transferencia bancaria. Te enviamos los datos por WhatsApp.'],
  ['¿Las clases son en vivo?', 'Sí, son virtuales y en vivo con el instructor.'],
  ['¿Necesito experiencia previa?', 'No. Cada curso indica sus requisitos, que casi siempre se reducen a una laptop con internet.'],
  ['¿Cuándo abre el próximo grupo?', 'Cada curso abre cuando se completa el grupo. Escríbenos y te avisamos primero.'],
  ['¿Recibo certificado?', 'Sí, al terminar el curso y presentar tu proyecto.'],
]

export default function Home() {
  const [data, setData] = useState({ cursos: [], grupos: [] })
  const [error, setError] = useState('')
  const [f, setF] = useState({ n: '', c: '', k: 'Aún no decido', m: '' })

  useEffect(() => {
    loadCatalog().then(setData).catch(() => setError('No se pudo cargar el catálogo. Escríbenos por WhatsApp.'))
  }, [])

  const { cursos, grupos } = data
  const gruposDe = (id) => grupos.filter((g) => g.curso_id === id).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))
  const filas = cursos.flatMap((c) => {
    const gs = gruposDe(c.id)
    return gs.length ? gs.map((g) => ({ c, g })) : [{ c, g: null }]
  })
  const sendMsg = `Hola, soy ${f.n.trim() || '[mi nombre]'}. Me interesa: ${f.k}.${f.c.trim() ? ` Mi celular: ${f.c.trim()}.` : ''}${f.m.trim() ? ` ${f.m.trim()}` : ''}`

  return (
    <>
      <Header />

      <main id="top">
        <div className="hero"><div className="wrap hero-grid">
          <div>
            <h1>Aprende IA, web y ventas digitales. <em>Aplícalo en tu negocio.</em></h1>
            <p className="lead">Cursos online en vivo, con proyecto real.</p>
            <div className="cta-row">
              <a className="btn btn-wa" href={wa('Hola, quiero que me avisen cuando abra el próximo curso de CCN')} target="_blank" rel="noopener noreferrer">Avísame cuando abra</a>
              <a className="btn btn-line" href="#cursos">Ver los cursos</a>
            </div>
          </div>
          <div className="stack" aria-hidden="true">
            {destacados(cursos).slice(0, 3).map((c, i) => (
              <div key={c.id} className={`card c${i + 1}`} style={{ background: `var(--${c.color})` }}>
                <small>{c.horas} H · ONLINE</small><b>{c.titulo.toUpperCase()}</b>
              </div>
            ))}
          </div>
        </div></div>

        <section id="cursos"><div className="wrap">
          <div className="head"><span className="eyebrow">Catálogo</span><h2>Nuestros cursos, todos con proyecto real</h2><p>Cada curso abre cuando se completa el grupo. Te avisamos por WhatsApp apenas haya fecha.</p></div>
          {error && <p className="note">{error}</p>}
          <div className="grid">
            {destacados(cursos).map((c) => <CourseCard key={c.id} c={c} grupo={gruposDe(c.id)[0]} />)}
          </div>
          <div className="more-row"><Link className="btn btn-line" to="/cursos">Ver todos los cursos</Link></div>
        </div></section>

        <section className="how" id="como"><div className="wrap">
          <h2 className="uline">¿Por qué elegirnos?</h2>
          <div className="whys">
            {WHY.map(([txt, svg]) => <div className="why" key={txt}><Big>{svg}</Big><p>{txt}</p></div>)}
          </div>
        </div></section>

        <section className="sched" id="horarios"><div className="wrap">
          <div>
            <span className="eyebrow">Horarios</span>
            <h2>Elige el curso y organiza tu semana</h2>
            <p style={{ marginTop: 14 }}>Cuando abra cada grupo, la fecha y el horario aparecen aquí. Si necesitas otro horario, escríbenos y te avisamos del próximo inicio.</p>
            <a className="btn btn-wa" style={{ marginTop: 8 }} href={wa('Hola, quiero que me avisen los próximos horarios de CCN')} target="_blank" rel="noopener noreferrer">Reservar por WhatsApp</a>
          </div>
          <div className="tablebox"><table className="table">
            <thead><tr><th>Curso online</th><th>Días</th><th>Horario</th><th>Inicio</th><th>Tiempo</th></tr></thead>
            <tbody>
              {filas.map(({ c, g }, i) => (
                <tr key={c.id + i}>
                  <td><span className="dot" style={{ background: COLORES[c.color]?.hex }} />{c.titulo}</td>
                  <td>{g?.dias || <span className="soon">Por definir</span>}</td>
                  <td>{g?.horario || <span className="soon">Por definir</span>}</td>
                  <td>{g?.inicio ? fechaCorta(g.inicio) : <span className="soon">Próximamente</span>}</td>
                  <td>{c.horas} h</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div></section>

        <section id="preguntas"><div className="wrap">
          <div className="head"><span className="eyebrow">Preguntas frecuentes</span><h2>Lo que nos preguntan antes de inscribirse</h2></div>
          <div className="faq">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div></section>

        <section className="contact" id="contacto"><div className="wrap">
          <div className="head"><span className="eyebrow">Escríbenos</span><h2>Cuéntanos qué curso quieres</h2><p>Completa tus datos y se abre WhatsApp con el mensaje listo para enviar.</p></div>
          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <label>Nombre completo<input id="n" autoComplete="name" placeholder="Tu nombre" value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} /></label>
            <label>Celular<input id="c" inputMode="tel" autoComplete="tel" placeholder="9XX XXX XXX" value={f.c} onChange={(e) => setF({ ...f, c: e.target.value })} /></label>
            <label className="full">Curso
              <select id="k" value={f.k} onChange={(e) => setF({ ...f, k: e.target.value })}>
                <option>Aún no decido</option>
                {cursos.map((c) => <option key={c.id}>{c.titulo}</option>)}
              </select>
            </label>
            <label className="full">Mensaje<textarea id="m" placeholder="¿Algo que quieras preguntar?" value={f.m} onChange={(e) => setF({ ...f, m: e.target.value })} /></label>
            <div className="full"><a className="btn btn-wa" href={wa(sendMsg)} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a></div>
          </form>
        </div></section>

        <section className="herr" aria-label="Herramientas con las que trabajamos"><div className="wrap">
          <span className="eyebrow">Herramientas</span>
          <h3>Con las que trabajamos</h3>
          <ul className="herr-lista">
            {HERRAMIENTAS.map(([nombre, archivo]) => <Herramienta key={archivo} nombre={nombre} archivo={archivo} />)}
          </ul>
        </div></section>
      </main>

      <Footer />
    </>
  )
}
