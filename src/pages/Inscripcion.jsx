import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadCatalog, crearInteresado, wa, fechaCorta } from '../lib/data.js'
import { Header, Footer } from '../components/Layout.jsx'
import { FORM_VACIO, validar } from '../components/Secciones.jsx'

export default function Inscripcion() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [f, setF] = useState(FORM_VACIO)
  const [err, setErr] = useState({})
  const [estado, setEstado] = useState('') // '', 'enviando', 'ok', 'error'

  useEffect(() => { loadCatalog().then(setData).catch(() => setData({ cursos: [], grupos: [] })) }, [])
  const curso = data?.cursos.find((c) => String(c.id) === id)
  const grupo = curso && data.grupos.filter((g) => g.curso_id === curso.id).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))[0]
  const lleno = grupo?.estado === 'lleno'
  useEffect(() => { document.title = curso ? `Inscripción · ${curso.titulo} · CCN` : 'Inscripción · CCN' }, [curso])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const campo = (k, etiqueta, props = {}) => (
    <label className={err[k] ? 'bad' : ''}>{etiqueta}
      <input id={`f-${k}`} value={f[k]} onChange={set(k)} aria-invalid={Boolean(err[k])} {...props} />
      {err[k] && <small className="ferr">{err[k]}</small>}
    </label>
  )

  // Mensaje de WhatsApp: solo lo principal (nombre, celular y curso). El resto queda en el panel admin.
  const mensaje = () => {
    const nombre = `${f.nombres.trim()} ${f.apellido_paterno.trim()} ${f.apellido_materno.trim()}`.replace(/\s+/g, ' ')
    return `Hola, ${lleno ? 'quiero entrar a la lista de espera de' : 'quiero inscribirme en'} el curso ${curso.titulo}${grupo?.inicio ? ` (inicio ${fechaCorta(grupo.inicio)})` : ''}.\nMis datos: ${nombre} · Celular: ${f.celular.replace(/[\s-]/g, '')}`
  }

  async function enviar(e) {
    e.preventDefault()
    if (f.web) return
    const v = validar({ ...f, modalidad: 'Online en vivo', curso: curso.titulo })
    delete v.modalidad; delete v.curso
    setErr(v)
    if (Object.keys(v).length) { document.getElementById(`f-${Object.keys(v)[0]}`)?.focus(); return }
    setEstado('enviando')
    try {
      await crearInteresado({
        curso_id: curso.id, curso: curso.titulo, lista_espera: lleno, inicio: grupo?.inicio || '',
        nombres: f.nombres.trim(), apellido_paterno: f.apellido_paterno.trim(), apellido_materno: f.apellido_materno.trim(),
        email: f.email.trim().toLowerCase(), tipo_doc: f.tipo_doc, documento: f.documento.trim().toUpperCase(),
        celular: f.celular.replace(/[\s-]/g, ''), acepta_adicional: f.acepta_adicional,
      })
      setEstado('ok')
      setTimeout(() => { window.location.href = wa(mensaje()) }, 1800)
    } catch (x) { setEstado('error') }
  }

  if (!data) return <><Header /><main className="insc"><div className="wrap"><p className="note">Cargando…</p></div></main><Footer /></>
  if (!curso) return (
    <><Header /><main className="insc"><div className="wrap">
      <h1 className="insc-h1">No encontramos ese curso</h1>
      <p><Link to="/cursos">Ver todos los cursos</Link></p>
    </div></main><Footer /></>
  )

  return (
    <>
      <Header />
      <main className="insc"><div className="wrap">
        <nav className="cd-mig" aria-label="Ruta"><Link to="/">Inicio</Link><span>›</span><Link to="/cursos">Cursos</Link><span>›</span><Link to={`/cursos/${curso.id}`}>{curso.titulo}</Link><span>›</span><b>Inscripción</b></nav>
        <div className="head cform-head">
          <span className="eyebrow">{lleno ? 'Lista de espera' : 'Inscripción'}</span>
          <h1 className="insc-h1">{curso.titulo}</h1>
          <p>Completa tus datos y te llevamos a WhatsApp para confirmar tu {lleno ? 'lugar en la lista de espera' : 'cupo'}.</p>
        </div>
        {estado === 'ok' ? (
          <div className="cform cform-ok" role="status">
            <h3>¡Listo, {f.nombres.trim().split(' ')[0]}!</h3>
            <p>Recibimos tus datos. Te estamos llevando a WhatsApp para continuar con tu {lleno ? 'lista de espera' : 'inscripción'}…</p>
            <a className="btn btn-wa" href={wa(mensaje())}>Continuar por WhatsApp</a>
          </div>
        ) : (
          <form className="cform" onSubmit={enviar} noValidate>
            <div className="cfull insc-curso"><span>Curso</span><b>{curso.titulo}</b><small>{curso.horas} h · {curso.sesiones} sesiones · Online en vivo{grupo?.inicio ? ` · Inicio ${fechaCorta(grupo.inicio)}` : ''}</small></div>
            {campo('nombres', 'Nombres*', { autoComplete: 'given-name', placeholder: 'Nombres' })}
            {campo('apellido_paterno', 'Apellido paterno*', { autoComplete: 'family-name', placeholder: 'Apellido paterno' })}
            {campo('apellido_materno', 'Apellido materno*', { placeholder: 'Apellido materno' })}
            {campo('email', 'Email*', { type: 'email', autoComplete: 'email', placeholder: 'Email' })}
            <label className={err.documento ? 'bad' : ''}>Documento*
              <span className="docgrp">
                <select aria-label="Tipo de documento" value={f.tipo_doc} onChange={(e) => setF({ ...f, tipo_doc: e.target.value, documento: '' })}>
                  <option value="DNI">DNI</option>
                  <option value="CE">C.E.</option>
                </select>
                <input id="f-documento" value={f.documento} onChange={set('documento')} inputMode={f.tipo_doc === 'DNI' ? 'numeric' : 'text'} maxLength={f.tipo_doc === 'DNI' ? 8 : 12} placeholder={f.tipo_doc === 'DNI' ? 'N° de DNI' : 'N° de C.E.'} aria-invalid={Boolean(err.documento)} />
              </span>
              {err.documento && <small className="ferr">{err.documento}</small>}
            </label>
            {campo('celular', 'Celular*', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: 'Celular' })}
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="web" value={f.web} onChange={set('web')} />
            <div className="cfull cchecks">
              <label className={`chk ${err.acepta_datos ? 'bad' : ''}`}><input type="checkbox" id="f-acepta_datos" checked={f.acepta_datos} onChange={set('acepta_datos')} />
                <span>Autorizo el tratamiento de mis datos personales para atender mi inscripción, según los <Link to="/terminos">términos y condiciones</Link> y la <Link to="/privacidad">política de privacidad</Link>.*</span></label>
              {err.acepta_datos && <small className="ferr">{err.acepta_datos}</small>}
              <label className="chk"><input type="checkbox" checked={f.acepta_adicional} onChange={set('acepta_adicional')} />
                <span>Autorizo el tratamiento de mis datos para recibir información sobre otros cursos y novedades de CCN.</span></label>
            </div>
            {estado === 'error' && <p className="cfull ferr big" role="alert">No pudimos registrar tus datos. Inténtalo de nuevo o escríbenos directo por <a href={wa(`Hola, quiero inscribirme en el curso ${curso.titulo}`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>}
            <button className="cfull cbtn" type="submit" disabled={estado === 'enviando' || !f.acepta_datos} title={f.acepta_datos ? '' : 'Marca la primera autorización para poder enviar'}>{estado === 'enviando' ? 'ENVIANDO…' : 'ENVIAR E IR A WHATSAPP'}</button>
          </form>
        )}
      </div></main>
      <Footer />
    </>
  )
}
