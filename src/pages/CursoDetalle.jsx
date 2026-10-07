import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadCatalog, wa, fechaCorta } from '../lib/data.js'
import CourseCard from '../components/CourseCard.jsx'
import { Header, Footer } from '../components/Layout.jsx'

const Flecha = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

const POR_QUE = [
  ['Clases en vivo', 'Aprendes con el instructor en tiempo real y resuelves tus dudas al instante.'],
  ['Proyecto real', 'En cada curso trabajas con tu propio negocio o idea, no con ejemplos de libro.'],
  ['Profesores capacitados', 'Te guían paso a paso y más de la mitad de cada clase es práctica.'],
  ['Certificado', 'Recibes un certificado al terminar el curso.'],
]

export default function CursoDetalle() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [barra, setBarra] = useState(false)
  const [alto, setAlto] = useState(76)

  useEffect(() => { loadCatalog().then(setData).catch(() => setData({ cursos: [], grupos: [], error: true })) }, [])
  useEffect(() => {
    const h = document.querySelector('header')
    if (h) setAlto(h.offsetHeight)
    const f = () => setBarra(window.scrollY > 520)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  const curso = data?.cursos.find((c) => String(c.id) === id)
  useEffect(() => { document.title = curso ? `${curso.titulo} · CCN` : 'Curso · CCN' }, [curso])

  if (!data) return <><Header /><main className="cd"><div className="wrap"><p className="note">Cargando…</p></div></main><Footer /></>
  if (!curso) return (
    <><Header /><main className="cd"><div className="wrap">
      <h1 className="cd-h1">No encontramos ese curso</h1>
      <p>Puede que ya no esté disponible. <Link to="/cursos">Ver todos los cursos</Link></p>
    </div></main><Footer /></>
  )

  const grupo = data.grupos.filter((g) => g.curso_id === curso.id).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))[0]
  const lleno = grupo?.estado === 'lleno'
  const msg = grupo
    ? `Hola, quiero ${lleno ? 'entrar a la lista de espera de' : 'inscribirme en'} ${curso.titulo}`
    : `Hola, quiero información del curso ${curso.titulo}`
  const cta = lleno ? 'LISTA DE ESPERA' : 'INSCRÍBETE'
  const conImagen = Boolean(curso.imagen_url)
  const fondo = conImagen
    ? { backgroundImage: `url("${curso.imagen_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `var(--${curso.color})` }
  const temario = curso.temario || []
  const programas = (curso.programas || '').split(',').map((s) => s.trim()).filter(Boolean)
  const otros = data.cursos.filter((c) => c.id !== curso.id).slice(0, 3)
  const primero = (cid) => data.grupos.filter((g) => g.curso_id === cid).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))[0]

  return (
    <>
      <Header />
      <div className={`cd-bar ${barra ? 'on' : ''}`} style={{ top: alto }} aria-hidden={!barra}>
        <div className="wrap cd-bar-in">
          <div><b>{curso.titulo}</b><span>S/{curso.precio}{curso.precio_antes > curso.precio && <s>S/{curso.precio_antes}</s>}</span></div>
          <a className="cd-btn" href={wa(msg)} target="_blank" rel="noopener noreferrer" tabIndex={barra ? 0 : -1}>{cta} <Flecha /></a>
        </div>
      </div>
      <main className="cd">
        <div className="wrap">
          <nav className="cd-mig" aria-label="Ruta"><Link to="/">Inicio</Link><span>›</span><Link to="/cursos">Cursos</Link><span>›</span><b>{curso.titulo}</b></nav>
          <div className="cd-grid">
            <div className="cd-main">
              <h1 className="cd-h1">{curso.titulo}</h1>
              <div className={`cd-portada ${conImagen ? 'con-imagen' : ''}`} style={fondo} role={conImagen ? 'img' : undefined} aria-label={conImagen ? curso.titulo : undefined}>
                <span className="cc-badge">ONLINE</span>
                {!conImagen && <h2>{curso.titulo}</h2>}
              </div>
              <ul className="cd-chips">
                <li>Clases en vivo</li><li>Certificado CCN</li><li>Proyecto real</li>
              </ul>

              {curso.descripcion && <><h2 className="cd-h2">Sobre el curso</h2><p className="cd-p">{curso.descripcion}</p></>}

              <h2 className="cd-h2">Detalle de las clases</h2>
              <p className="cd-p">Clases en vivo con el instructor, en tiempo real. Estudias desde donde estés, practicas durante la clase y resuelves tus dudas al instante. Más de la mitad de cada sesión es práctica y terminas con un proyecto real.</p>

              {temario.length > 0 && <>
                <h2 className="cd-h2">Malla curricular</h2>
                <ol className="cd-malla">
                  {temario.map((t, i) => <li key={i}><span>{String(i + 1).padStart(2, '0')}</span>{t}</li>)}
                </ol>
              </>}

              {curso.extra && <div className="cd-extra"><b>Nivel extra CCN</b><p>{curso.extra.charAt(0).toUpperCase() + curso.extra.slice(1)}.</p></div>}

              {programas.length > 0 && <>
                <h2 className="cd-h2">Programas que usarás</h2>
                <ul className="cd-prog">{programas.map((p) => <li key={p}>{p}</li>)}</ul>
              </>}

              <h2 className="cd-h2">¿Por qué elegir CCN?</h2>
              <div className="cd-por">
                {POR_QUE.map(([t, d]) => <div key={t}><b>{t}</b><p>{d}</p></div>)}
              </div>
            </div>

            <aside className="cd-side" style={{ top: alto + 96 }}>
              <div className="cd-box">
                <div className="cd-precio">
                  <b>S/{curso.precio}</b>
                  {curso.precio_antes > curso.precio && <><span className="antes">S/{curso.precio_antes}</span><span className="dsct">-{Math.round((1 - curso.precio / curso.precio_antes) * 100)}% DSCT.</span></>}
                </div>
                <dl>
                  {grupo?.inicio && <div><dt>Inicio</dt><dd>{fechaCorta(grupo.inicio)}</dd></div>}
                  {grupo && (grupo.dias || grupo.horario) && <div><dt>Horario</dt><dd>{[grupo.dias, grupo.horario].filter(Boolean).join(' · ')}</dd></div>}
                  <div><dt>Duración</dt><dd>{curso.horas} h · {curso.sesiones} sesiones</dd></div>
                  <div><dt>Modalidad</dt><dd>Online en vivo</dd></div>
                  {grupo?.mostrar_inscritos && <div><dt>Inscritos</dt><dd>{grupo.inscritos}</dd></div>}
                </dl>
                <h3 className="cd-inc">Qué incluye</h3>
                <ul className="cd-incl">
                  <li>Clases en vivo con el instructor</li>
                  <li>Más de la mitad de cada clase es práctica</li>
                  <li>Proyecto real de tu propio negocio</li>
                  {curso.extra && <li>Nivel extra CCN</li>}
                  <li>Reto de 7 días y ruta para seguir aprendiendo</li>
                  <li>Certificado al terminar el curso</li>
                </ul>
                <a className="cd-btn" href={wa(msg)} target="_blank" rel="noopener noreferrer">{cta} <Flecha /></a>
                <a className="cd-dudas" href={wa(`Hola, tengo una duda sobre el curso ${curso.titulo}`)} target="_blank" rel="noopener noreferrer">¿Tienes dudas? Escríbenos por WhatsApp</a>
                <p className="cd-nota">La inscripción se realiza por WhatsApp.</p>
              </div>
            </aside>
          </div>

          {otros.length > 0 && <section className="cd-mas">
            <h2 className="cd-h2">También podrías explorar</h2>
            <div className="grid">{otros.map((c) => <CourseCard key={c.id} c={c} grupo={primero(c.id)} />)}</div>
          </section>}
        </div>
      </main>
      <Footer />
    </>
  )
}
