import { useState } from 'react'
import { Link } from 'react-router-dom'
import { wa, fechaCorta, COLORES, crearConsulta } from '../lib/data.js'

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
  ['AutoCAD', 'autocad'],
  ['Figma', 'figma'],
  ['Google Analytics', 'googleanalytics'],
  ['Google Ads', 'googleads'],
  ['Python', 'python'],
  ['n8n', 'n8n'],
  ['Zoom', 'zoom'],
  ['SketchUp', 'sketchup'],
  ['Canva', 'canva'],
  ['VS Code', 'vscode'],
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
  ['¿Cuándo inicia el próximo grupo?', 'Las fechas y los horarios de cada curso se publican en la web. Escríbenos y te informaremos las próximas fechas disponibles.'],
  ['¿Se entrega certificado?', 'Sí. Al finalizar el curso y presentar tu proyecto recibirás un certificado de CCN.'],
]

/* ---------- Secciones reutilizables (inicio y páginas propias del menú) ---------- */
export function SeccionComo({ cursos = [], grupos = [] }) {
  // Cifras reales: salen del catálogo y de los grupos del panel, nunca se escriben a mano.
  const horas = cursos.reduce((t, c) => t + (Number(c.horas) || 0), 0)
  const inscritos = grupos.reduce((t, g) => t + (Number(g.inscritos) || 0), 0)
  const cifras = [
    ['+' + Math.floor(HERRAMIENTAS.length / 10) * 10, 'programas y herramientas'],
    ['+100', 'estudiantes formados por nuestros profesores'],
    horas > 0 && [String(horas), 'horas de formación en el catálogo'],
    inscritos >= 50 && ['+' + Math.floor(inscritos / 10) * 10, 'inscritos en CCN'],
  ].filter(Boolean)
  return (
    <section className="how" id="como"><div className="wrap">
      <h2 className="uline">¿Por qué elegirnos?</h2>
      <div className="whys">
        {WHY.map(([txt, svg, ancho]) => <div className="why" key={txt}><Big ancho={ancho}>{svg}</Big><p>{txt}</p></div>)}
      </div>
      <ul className="cifras">
        {cifras.map(([n, t]) => <li key={t}><b>{n}</b><span>{t}</span></li>)}
      </ul>
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
        <p style={{ marginTop: 14 }}>La fecha y el horario de cada curso aparecen aquí. Si necesitas otro horario, escríbenos y te informamos las próximas fechas.</p>
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

const FORM_VACIO = { nombres: '', apellido_paterno: '', apellido_materno: '', email: '', tipo_doc: 'DNI', documento: '', celular: '', modalidad: '', curso: '', otro_tema: '', acepta_datos: false, acepta_adicional: false, web: '' }

function validar(f) {
  const e = {}
  const t = (v) => v.trim()
  if (t(f.nombres).length < 2) e.nombres = 'Ingresa tus nombres'
  if (t(f.apellido_paterno).length < 2) e.apellido_paterno = 'Ingresa tu apellido paterno'
  if (t(f.apellido_materno).length < 2) e.apellido_materno = 'Ingresa tu apellido materno'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t(f.email))) e.email = 'Ingresa un correo válido'
  const doc = t(f.documento)
  if (f.tipo_doc === 'DNI' ? !/^\d{8}$/.test(doc) : !/^[A-Za-z0-9]{9,12}$/.test(doc)) e.documento = f.tipo_doc === 'DNI' ? 'El DNI tiene 8 dígitos' : 'Ingresa tu carné (9 a 12 caracteres)'
  if (!/^\+?\d{9,15}$/.test(f.celular.replace(/[\s-]/g, ''))) e.celular = 'Ingresa un celular válido'
  if (!f.modalidad) e.modalidad = 'Selecciona una modalidad'
  if (!f.curso) e.curso = 'Selecciona un curso'
  if (f.curso === 'Otro' && t(f.otro_tema).length < 3) e.otro_tema = 'Cuéntanos qué tema te interesa'
  if (!f.acepta_datos) e.acepta_datos = 'Debes autorizar el tratamiento de tus datos'
  return e
}

export function SeccionContacto({ cursos }) {
  const [f, setF] = useState(FORM_VACIO)
  const [err, setErr] = useState({})
  const [estado, setEstado] = useState('') // '', 'enviando', 'ok', 'error'
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const campo = (k, etiqueta, props = {}) => (
    <label className={err[k] ? 'bad' : ''}>{etiqueta}
      <input id={`f-${k}`} value={f[k]} onChange={set(k)} aria-invalid={Boolean(err[k])} {...props} />
      {err[k] && <small className="ferr">{err[k]}</small>}
    </label>
  )
  async function enviar(e) {
    e.preventDefault()
    if (f.web) return // trampa para robots
    const v = validar(f)
    setErr(v)
    if (Object.keys(v).length) { document.getElementById(`f-${Object.keys(v)[0]}`)?.focus(); return }
    setEstado('enviando')
    try {
      await crearConsulta({ ...f, nombres: f.nombres.trim(), apellido_paterno: f.apellido_paterno.trim(), apellido_materno: f.apellido_materno.trim(), email: f.email.trim().toLowerCase(), documento: f.documento.trim().toUpperCase(), celular: f.celular.replace(/[\s-]/g, ''), otro_tema: f.curso === 'Otro' ? f.otro_tema.trim() : '' })
      setEstado('ok')
    } catch (x) { setEstado('error') }
  }
  return (
    <section className="contact" id="contacto"><div className="wrap">
      <div className="head cform-head"><span className="eyebrow">Contacto</span><h2>Solicita información</h2><p>Completa el formulario y un asesor educativo de CCN se comunicará contigo.</p></div>
      {estado === 'ok' ? (
        <div className="cform cform-ok" role="status">
          <h3>¡Gracias, {f.nombres.trim().split(' ')[0]}!</h3>
          <p>Recibimos tu solicitud. Un asesor educativo de CCN se comunicará contigo muy pronto.</p>
          <button type="button" className="btn btn-line" onClick={() => { setF(FORM_VACIO); setErr({}); setEstado('') }}>Enviar otra solicitud</button>
        </div>
      ) : (
        <form className="cform" onSubmit={enviar} noValidate>
          {campo('nombres', 'Nombres*', { autoComplete: 'given-name', placeholder: 'Nombres' })}
          {campo('apellido_paterno', 'Apellido paterno*', { autoComplete: 'family-name', placeholder: 'Apellido paterno' })}
          {campo('apellido_materno', 'Apellido materno*', { placeholder: 'Apellido materno' })}
          {campo('email', 'Email*', { type: 'email', autoComplete: 'email', placeholder: 'Email' })}
          <label className={err.documento ? 'bad' : ''}>Documento*
            <span className="docgrp">
              <select aria-label="Tipo de documento" value={f.tipo_doc} onChange={(e) => setF({ ...f, tipo_doc: e.target.value, documento: '' })}>
                <option value="DNI">DNI</option>
                <option value="CE">Carné de extranjería</option>
              </select>
              <input id="f-documento" value={f.documento} onChange={set('documento')} inputMode={f.tipo_doc === 'DNI' ? 'numeric' : 'text'} maxLength={f.tipo_doc === 'DNI' ? 8 : 12} placeholder={f.tipo_doc === 'DNI' ? 'N° de DNI' : 'N° de carné'} aria-invalid={Boolean(err.documento)} />
            </span>
            {err.documento && <small className="ferr">{err.documento}</small>}
          </label>
          {campo('celular', 'Celular*', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: 'Celular' })}
          <label className={err.modalidad ? 'bad' : ''}>Modalidad*
            <select id="f-modalidad" value={f.modalidad} onChange={set('modalidad')} aria-invalid={Boolean(err.modalidad)}>
              <option value="">Selecciona</option>
              <option>Online en vivo</option>
              <option>Presencial</option>
              <option>Aún no decido</option>
            </select>
            {err.modalidad && <small className="ferr">{err.modalidad}</small>}
          </label>
          <label className={err.curso ? 'bad' : ''}>Curso*
            <select id="f-curso" value={f.curso} onChange={set('curso')} aria-invalid={Boolean(err.curso)}>
              <option value="">Selecciona</option>
              {cursos.map((c) => <option key={c.id}>{c.titulo}</option>)}
              <option>Otro</option>
            </select>
            {err.curso && <small className="ferr">{err.curso}</small>}
          </label>
          {f.curso === 'Otro' && <div className="cfull">{campo('otro_tema', '¿Qué tema te interesa?*', { placeholder: 'Cuéntanos qué te gustaría aprender' })}</div>}
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="web" value={f.web} onChange={set('web')} />
          <div className="cfull cchecks">
            <label className={`chk ${err.acepta_datos ? 'bad' : ''}`}><input type="checkbox" id="f-acepta_datos" checked={f.acepta_datos} onChange={set('acepta_datos')} />
              <span>Autorizo el tratamiento de mis datos personales para atender mi solicitud, según los <Link to="/terminos">términos y condiciones</Link> y la <Link to="/privacidad">política de privacidad</Link>.*</span></label>
            {err.acepta_datos && <small className="ferr">{err.acepta_datos}</small>}
            <label className="chk"><input type="checkbox" checked={f.acepta_adicional} onChange={set('acepta_adicional')} />
              <span>Autorizo el tratamiento de mis datos para recibir información sobre otros cursos y novedades de CCN.</span></label>
          </div>
          {estado === 'error' && <p className="cfull ferr big" role="alert">No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por <a href={wa('Hola, quiero información sobre los cursos de CCN')} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>}
          <button className="cfull cbtn" type="submit" disabled={estado === 'enviando' || !f.acepta_datos} title={f.acepta_datos ? '' : 'Marca la primera autorización para poder enviar'}>{estado === 'enviando' ? 'ENVIANDO…' : 'ENVIAR'}</button>
        </form>
      )}
    </div></section>
  )
}

export function SeccionHerramientas() {
  return (
    <section className="herr" aria-label="Programas y herramientas que aprenderás en CCN"><div className="wrap">
      <span className="eyebrow">Programas y herramientas que aprenderás en CCN</span>
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
