import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadCatalog, crearInteresado, fechaCorta } from '../lib/data.js'
import { Header, Footer } from '../components/Layout.jsx'
import { FORM_VACIO, validar } from '../components/Secciones.jsx'
import { useCarrito, quitar, vaciar, limpiarInvalidos } from '../lib/carrito.js'
import { armarPedido, iniciarPago, soles, PROVEEDORES, PROVEEDOR_ACTIVO } from '../lib/pago.js'
import { sinIgv, igvDe } from '../lib/igv.js'

/* Cursos del carrito con su catálogo (sin los que ya no existen o están llenos: esos van por lista de espera) */
function useItems() {
  const { ids } = useCarrito()
  const [data, setData] = useState(null)
  useEffect(() => { loadCatalog().then(setData).catch(() => setData({ cursos: [], grupos: [] })) }, [])
  const grupoDe = (cid) => data?.grupos.filter((g) => g.curso_id === cid).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))[0]
  const cursos = useMemo(() => (data ? ids.map((id) => data.cursos.find((c) => String(c.id) === id)).filter((c) => c && grupoDe(c.id)?.estado !== 'lleno') : []), [data, ids]) // eslint-disable-line
  // El Club Ofimática ya incluye Word, Excel y PowerPoint: si lleva el Club, se quitan esos cursos sueltos para no pagar doble.
  const esClub = (c) => /^club/i.test(c.titulo || '')
  const incluidoEnClub = (c) => /^(word|excel|powerpoint)$/i.test((c.titulo || '').trim())
  const conClub = cursos.some(esClub)
  const sobran = conClub ? cursos.filter(incluidoEnClub) : []
  const cursosOk = conClub ? cursos.filter((c) => !incluidoEnClub(c)) : cursos
  useEffect(() => { if (data) limpiarInvalidos(cursosOk.map((c) => c.id)) }, [data, cursosOk.length]) // eslint-disable-line
  const subtotal = cursosOk.reduce((s, c) => s + Number(c.precio || 0), 0)
  return { data, cursos: cursosOk, conClub, grupoDe, subtotal: sinIgv(subtotal), total: subtotal, igv: igvDe(subtotal) }
}

function Resumen({ subtotal, total, igv, n }) {
  return (
    <div className="cart-sum">
      <h3>Resumen</h3>
      <dl>
        <div><dt>Subtotal ({n} {n === 1 ? 'curso' : 'cursos'})</dt><dd>{soles(subtotal)}</dd></div>
        <div><dt>IGV (18 %)</dt><dd>{soles(igv)}</dd></div>
        <div className="tot"><dt>Total</dt><dd>{soles(total)}</dd></div>
      </dl>
    </div>
  )
}

export function Carrito() {
  const { data, cursos, conClub, grupoDe, subtotal, total, igv } = useItems()
  useEffect(() => { document.title = 'Tu carrito · CCN' }, [])
  return (
    <>
      <Header />
      <main className="insc"><div className="wrap">
        <div className="head cform-head"><span className="eyebrow">Carrito</span><h1 className="insc-h1">Tu carrito</h1></div>
        {conClub && <p className="note">🎓 El Club Ofimática ya incluye Word, Excel y PowerPoint, así que no los cobramos por separado.</p>}
        {!data ? <p className="note">Cargando…</p> : cursos.length === 0 ? (
          <div className="cart-vacio"><p>Aún no agregaste cursos.</p><Link className="btn btn-wa" to="/cursos">Ver cursos</Link></div>
        ) : (
          <div className="cart-grid">
            <ul className="cart-list">
              {cursos.map((c) => {
                const g = grupoDe(c.id)
                return (
                  <li key={c.id} className="cart-item">
                    <span className="cart-dot" style={{ background: `var(--${c.color})` }} aria-hidden="true" />
                    <div className="cart-info">
                      <Link to={`/cursos/${c.id}`}><b>{c.titulo}</b></Link>
                      <small>{c.horas} h · {c.sesiones} sesiones · Online en vivo{g?.inicio ? ` · Inicio ${fechaCorta(g.inicio)}` : ''}{g && (g.dias || g.horario) ? ` · ${[g.dias, g.horario].filter(Boolean).join(' ')}` : ''}</small>
                    </div>
                    <div className="cart-precio"><b>{soles(c.precio)}</b><small>IGV incl.</small></div>
                    <button type="button" className="cart-x" onClick={() => quitar(c.id)} aria-label={`Quitar ${c.titulo}`}>Quitar</button>
                  </li>
                )
              })}
            </ul>
            <aside>
              <Resumen subtotal={subtotal} total={total} igv={igv} n={cursos.length} />
              <Link className="cbtn cart-cta" to="/checkout">INSCRÍBETE</Link>
              <Link className="cart-mas" to="/cursos">Seguir viendo cursos</Link>
            </aside>
          </div>
        )}
      </div></main>
      <Footer />
    </>
  )
}

export function Checkout() {
  const { data, cursos, grupoDe, subtotal, total, igv } = useItems()
  const nav = useNavigate()
  const [f, setF] = useState(FORM_VACIO)
  const [err, setErr] = useState({})
  const [estado, setEstado] = useState('') // '', 'enviando', 'ok', 'error'
  const [destino, setDestino] = useState('')
  const pv = PROVEEDORES[PROVEEDOR_ACTIVO]
  useEffect(() => { document.title = 'Finalizar inscripción · CCN' }, [])
  useEffect(() => { if (data && cursos.length === 0 && estado !== 'ok') nav('/carrito', { replace: true }) }, [data, cursos.length, estado, nav])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const campo = (k, etiqueta, props = {}) => (
    <label className={err[k] ? 'bad' : ''}>{etiqueta}
      <input id={`f-${k}`} value={f[k]} onChange={set(k)} aria-invalid={Boolean(err[k])} {...props} />
      {err[k] && <small className="ferr">{err[k]}</small>}
    </label>
  )

  async function enviar(e) {
    e.preventDefault()
    if (f.web) return
    const v = validar({ ...f, modalidad: 'Online en vivo', curso: 'carrito' })
    delete v.modalidad; delete v.curso
    setErr(v)
    if (Object.keys(v).length) { document.getElementById(`f-${Object.keys(v)[0]}`)?.focus(); return }
    setEstado('enviando')
    const cliente = {
      nombres: f.nombres.trim(), apellido_paterno: f.apellido_paterno.trim(), apellido_materno: f.apellido_materno.trim(),
      email: f.email.trim().toLowerCase(), tipo_doc: f.tipo_doc, documento: f.documento.trim().toUpperCase(),
      celular: f.celular.replace(/[\s-]/g, ''),
    }
    try {
      const pedido = armarPedido({ cliente, cursos, grupoDe })
      for (const c of cursos) { // un registro por curso: así entra al flujo de ventas de siempre (todos a la misma vendedora)
        await crearInteresado({ ...cliente, curso_id: c.id, curso: c.titulo, lista_espera: false, inicio: grupoDe(c.id)?.inicio || '', acepta_adicional: f.acepta_adicional, observacion: `Pedido ${pedido.codigo} · ${cursos.length} ${cursos.length === 1 ? 'curso' : 'cursos'} · total ${soles(pedido.total)}` })
      }
      const r = await iniciarPago(pedido)
      setDestino(r.url); setEstado('ok'); vaciar()
      setTimeout(() => { window.location.href = r.url }, 1800)
    } catch (x) { setEstado('error') }
  }

  if (!data) return <><Header /><main className="insc"><div className="wrap"><p className="note">Cargando…</p></div></main><Footer /></>
  return (
    <>
      <Header />
      <main className="insc"><div className="wrap">
        <nav className="cd-mig" aria-label="Ruta"><Link to="/">Inicio</Link><span>›</span><Link to="/carrito">Carrito</Link><span>›</span><b>Finalizar inscripción</b></nav>
        <div className="head cform-head">
          <span className="eyebrow">Inscripción</span>
          <h1 className="insc-h1">Finalizar inscripción</h1>
          <p>Completa tus datos una sola vez y te llevamos a WhatsApp para confirmar tu inscripción y el pago.</p>
        </div>
        {estado === 'ok' ? (
          <div className="cform cform-ok" role="status">
            <h3>¡Listo, {f.nombres.trim().split(' ')[0]}!</h3>
            <p>Recibimos tus datos. Te estamos llevando a WhatsApp para continuar con tu inscripción…</p>
            <a className="btn btn-wa" href={destino}>Continuar por WhatsApp</a>
          </div>
        ) : (
          <div className="cart-grid">
            <form className="cform" onSubmit={enviar} noValidate>
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
              {estado === 'error' && <p className="cfull ferr big" role="alert">No pudimos registrar tus datos. Inténtalo de nuevo o escríbenos directo por el botón de WhatsApp de arriba.</p>}
              <button className="cfull cbtn" type="submit" disabled={estado === 'enviando' || !f.acepta_datos} title={f.acepta_datos ? '' : 'Marca la primera autorización para poder enviar'}>{estado === 'enviando' ? 'ENVIANDO…' : pv.boton}</button>
            </form>
            <aside>
              <ul className="cart-mini">
                {cursos.map((c) => <li key={c.id}><span>{c.titulo}</span><b>{soles(c.precio)}</b></li>)}
              </ul>
              <Resumen subtotal={subtotal} total={total} igv={igv} n={cursos.length} />
              <Link className="cart-mas" to="/carrito">Editar carrito</Link>
            </aside>
          </div>
        )}
      </div></main>
      <Footer />
    </>
  )
}
