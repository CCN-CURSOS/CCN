import { useState } from 'react'
import { Link } from 'react-router-dom'
import { wa, fechaCorta, COLORES } from '../lib/data.js'

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
  ['GitHub', 'github'],
  ['Vercel', 'vercel'],
  ['Meta', 'meta'],
  ['Google Sheets', 'sheets'],
]
const FORMATOS = ['svg', 'png']

function Herramienta({ nombre, archivo }) {
  const [i, setI] = useState(0)
  const hayLogo = i < FORMATOS.length
  return (
    <li className="herr-chip">
      {hayLogo && <img src={`/logos/${archivo}.${FORMATOS[i]}`} alt="" loading="lazy" onError={() => setI(i + 1)} />}
      <span>{nombre}</span>
    </li>
  )
}

// Estrella de 5 puntas (centro cx,cy; radio exterior ro, interior ri)
function estrella(cx, cy, ro, ri) {
  const pts = []
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? ro : ri
    const a = (-90 + k * 36) * (Math.PI / 180)
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

const Big = ({ children, ancho = 48 }) => (
  <svg viewBox={`0 0 ${ancho} 48`} width={ancho} height="48" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

const WHY = [
  ['Clases en vivo con el instructor', <><rect x="6" y="9" width="36" height="25" rx="3" /><path d="M16 42h16M24 34v8" /><circle cx="24" cy="19" r="4" stroke="var(--teal)" /><path d="M17 29c1-4 4-5 7-5s6 1 7 5" stroke="var(--teal)" /></>],
  ['Proyecto real de tu propio negocio en cada curso', <><rect x="8" y="8" width="32" height="32" rx="3" /><path d="M15 18h18M15 25h18" stroke="var(--teal)" /><path d="M15 32h10" /></>],
  ['Nivel extra CCN: temas que otros cursos no enseñan', <>{[0, 1, 2, 3, 4].map((i) => <path key={i} d={estrella(11 + i * 22, 24, 10, 4.2)} fill="var(--teal)" stroke="var(--teal)" strokeWidth="1" />)}</>, 110],
  ['Reto de 7 días y ruta para seguir aprendiendo', <><path d="M8 36l10-10 8 8 14-18" stroke="var(--teal)" /><path d="M30 16h10v10" /></>],
  ['Profesores capacitados que te guían paso a paso', <><circle cx="24" cy="15" r="7" /><path d="M10 40c1-8 7-12 14-12s13 4 14 12" stroke="var(--teal)" /></>],
  ['Más de la mitad de cada clase es práctica', <><path d="M10 14l-4 10 4 10M38 14l4 10-4 10" /><path d="M20 36l8-24" stroke="var(--teal)" /></>],
  ['Certificado al terminar el curso', <><rect x="7" y="9" width="34" height="24" rx="2" /><path d="M14 17h20M14 23h12" stroke="var(--teal)" /><circle cx="33" cy="35" r="5" /><path d="M30 39l-2 6 5-3 5 3-2-6" /></>],
]

const FAQ = [
  ['¿Cómo puedo inscribirme?', 'La inscripción se realiza únicamente por WhatsApp. Indícanos el curso de tu interés y te confirmaremos la fecha, el horario y el procedimiento para reservar tu cupo.'],
  ['¿Cuáles son los medios de pago?', 'Aceptamos Yape, Plin y transferencia bancaria. Te enviaremos los datos de pago por WhatsApp una vez confirmada tu inscripción.'],
  ['¿Las clases son en vivo?', 'Sí. Las sesiones se dictan de forma virtual y en vivo, junto al instructor, y quedan grabadas para que puedas repasarlas.'],
  ['¿Se requiere experiencia previa?', 'No. Cada curso detalla sus requisitos, que por lo general se limitan a una laptop con conexión a internet.'],
  ['¿Cuándo inicia el próximo grupo?', 'Cada curso inicia una vez completado el grupo. Escríbenos y te avisaremos con prioridad cuando haya fecha.'],
  ['¿Se entrega certificado?', 'Sí. Al finalizar el curso y presentar tu proyecto recibirás un certificado de CCN.'],
]

/* ---------- Secciones reutilizables (inicio y páginas propias del menú) ---------- */
export function SeccionComo() {
  return (
    <section className="how" id="como"><div className="wrap">
      <h2 className="uline">¿Por qué elegirnos?</h2>
      <div className="whys">
        {WHY.map(([txt, svg, ancho]) => <div className="why" key={txt}><Big ancho={ancho}>{svg}</Big><p>{txt}</p></div>)}
      </div>
    </div></section>
  )
}

export function SeccionHorarios({ cursos, grupos }) {
  const gruposDe = (id) => grupos.filter((g) => g.curso_id === id).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))
  const filas = cursos.flatMap((c) => {
    const gs = gruposDe(c.id)
    return gs.length ? gs.map((g) => ({ c, g })) : [{ c, g: null }]
  })
  return (
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
  )
}

export function SeccionPreguntas() {
  return (
    <section id="preguntas"><div className="wrap">
      <div className="head"><span className="eyebrow">Preguntas frecuentes</span><h2>Resolvemos tus dudas antes de inscribirte</h2></div>
      <div className="faq">
        {FAQ.map(([q, a], i) => <details key={q}><summary><span className="fq-n">{String(i + 1).padStart(2, '0')}</span><span className="fq-q">{q}</span><span className="fq-i" aria-hidden="true" /></summary><p>{a}</p></details>)}
      </div>
    </div></section>
  )
}

export function SeccionContacto({ cursos }) {
  const [f, setF] = useState({ n: '', c: '', k: 'Aún no decido', o: '', m: '' })
  const sendMsg = `Hola, soy ${f.n.trim() || '[mi nombre]'}. Me interesa: ${f.k === 'Otro' ? `otro tema${f.o.trim() ? ` (${f.o.trim()})` : ''}` : f.k}.${f.c.trim() ? ` Mi celular: ${f.c.trim()}.` : ''}${f.m.trim() ? ` ${f.m.trim()}` : ''}`
  return (
    <section className="contact" id="contacto"><div className="wrap">
      <div className="head"><span className="eyebrow">Contacto</span><h2>Solicita información</h2><p>Déjanos tus datos y se abrirá WhatsApp con tu mensaje listo para enviar.</p></div>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <label>Nombre completo<input id="n" autoComplete="name" placeholder="Tu nombre" value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} /></label>
        <label>Celular<input id="c" inputMode="tel" autoComplete="tel" placeholder="9XX XXX XXX" value={f.c} onChange={(e) => setF({ ...f, c: e.target.value })} /></label>
        <label className="full">Curso
          <select id="k" value={f.k} onChange={(e) => setF({ ...f, k: e.target.value })}>
            <option>Aún no decido</option>
            {cursos.map((c) => <option key={c.id}>{c.titulo}</option>)}
            <option>Otro</option>
          </select>
        </label>
        {f.k === 'Otro' && (
          <label className="full">¿Qué tema te interesa?<input id="o" placeholder="Cuéntanos qué te gustaría aprender" value={f.o} onChange={(e) => setF({ ...f, o: e.target.value })} /></label>
        )}
        <label className="full">Mensaje<textarea id="m" placeholder="¿Algo que quieras preguntar?" value={f.m} onChange={(e) => setF({ ...f, m: e.target.value })} /></label>
        <div className="full"><a className="btn btn-wa" href={wa(sendMsg)} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a></div>
      </form>
    </div></section>
  )
}

export function SeccionHerramientas() {
  return (
    <section className="herr" aria-label="Herramientas con las que trabajamos"><div className="wrap">
      <span className="eyebrow">Herramientas con las que trabajamos</span>
    </div>
      <div className="herr-marq">
        <div className="herr-track">
          {[0, 1, 2, 3].map((k) => (
            <ul className="herr-lista" key={k} aria-hidden={k > 0 ? 'true' : undefined}>
              {HERRAMIENTAS.map(([nombre, archivo]) => <Herramienta key={archivo} nombre={nombre} archivo={archivo} />)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Página "Cómo aprendes": modalidades, ruta del alumno y llamado final ---------- */
const MODALIDADES = [
  ['Online en vivo', 'Clases virtuales en vivo, junto al instructor, con ejercicios aplicados a tu propio negocio.',
    <><rect x="6" y="9" width="36" height="25" rx="3" /><path d="M16 42h16M24 34v8" /><path d="M20 17l9 5-9 5z" stroke="var(--teal)" /></>],
  ['Presenciales', 'Cursos en aula, con práctica guiada y contacto directo con el instructor y tus compañeros.',
    <><path d="M6 40V18l18-10 18 10v22" /><path d="M6 40h36" /><rect x="19" y="26" width="10" height="14" stroke="var(--teal)" /></>],
  ['Mentorías', 'Acompañamiento personalizado para aplicar lo aprendido en tu negocio y resolver tus dudas con un especialista.',
    <><circle cx="17" cy="17" r="6" /><circle cx="33" cy="19" r="5" stroke="var(--teal)" /><path d="M6 38c1-7 5-10 11-10s10 3 11 10M30 29c6 0 10 3 12 9" /></>],
]

export function SeccionModalidades() {
  return (
    <section className="mods" id="modalidades"><div className="wrap">
      <div className="head"><span className="eyebrow">Cómo aprendes</span><h2>Aprende de la forma que mejor te acomode</h2><p>Capacitaciones pensadas para que lo aprendido se use desde la primera semana.</p></div>
      <div className="mod-grid">
        {MODALIDADES.map(([t, p, svg]) => (
          <article className="mod" key={t}>
            <span className="mod-ico"><Big>{svg}</Big></span>
            <h3>{t}</h3>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </div></section>
  )
}

const RUTA = [
  ['Elige tu curso', 'Revisa el catálogo y escoge el tema que necesitas para tu negocio.'],
  ['Escríbenos por WhatsApp', 'La inscripción es solo por WhatsApp: te confirmamos fecha, horario y cómo reservar tu cupo.'],
  ['Se completa el grupo', 'Cada curso abre con un mínimo de 10 inscritos. Te avisamos apenas haya fecha.'],
  ['Aprende y aplica', 'Clases prácticas con tu propio proyecto y un reto de 7 días para seguir avanzando.'],
  ['Recibe tu certificado', 'Al terminar el curso y presentar tu proyecto, te entregamos tu certificado de CCN.'],
]

export function SeccionRuta() {
  return (
    <section className="ruta-sec" id="ruta"><div className="wrap">
      <div className="head"><span className="eyebrow">Tu camino</span><h2>Así empiezas con CCN</h2></div>
      <ol className="ruta">
        {RUTA.map(([t, p], i) => (
          <li key={t}><span className="ruta-n">{i + 1}</span><h3>{t}</h3><p>{p}</p></li>
        ))}
      </ol>
    </div></section>
  )
}

export function SeccionCta() {
  return (
    <section className="cta-sec"><div className="wrap">
      <div className="cta-band">
        <div><h2>¿Listo para empezar?</h2><p>Escríbenos y te contamos qué curso te conviene.</p></div>
        <div className="cta-btns">
          <a className="btn btn-wa" href={wa('Hola, quiero información sobre los cursos de CCN')} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>
          <Link className="btn btn-line" to="/cursos">Ver los cursos</Link>
        </div>
      </div>
    </div></section>
  )
}
