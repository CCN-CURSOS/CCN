import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../components/Icons'
import { programaSugerido } from '../../lib/ventas'
import { soles, nombreMes } from '../../lib/formato.js'
import { pdfTerminos } from '../../lib/bienvenida.js'
import { fmtMoneda, simbolo, precioEn, vendeEnUsd, descuentoMaxPct, precioMinimoLibre, sumaPorMoneda } from '../../lib/moneda.js'
import { generarNotaPago } from '../../lib/notaPago.js'
import { hasBackend, fechaCorta, subirComprobante, urlComprobante, estadoInscripcion, borrarInscripcion, enviarBienvenidaCorreo, armarInscripciones, inscritosCSV } from '../../lib/data.js'
import { AlertasVenta } from './Quejas.jsx'
import { Confirmar, Drawer, Seccion } from '../../components/ui.jsx'
import { hoyISO } from './util.js'

export const METODOS = ['Yape', 'Plin', 'Transferencia', 'PayPal', 'Efectivo', 'Tarjeta', 'Otro']

export const ESTADO_TXT = { pagado: 'Pagado', adelanto: 'Adelanto', pendiente: 'Sin pago', anulada: 'Anulada' }

export function SubirComprobante({ ruta, onChange }) {
  const [sub, setSub] = useState(false)
  const [err, setErr] = useState('')
  const [vista, setVista] = useState('')
  const ref = useRef(null)
  async function subir(file) {
    if (!file) return
    setSub(true); setErr('')
    try {
      const r = await subirComprobante(file)
      setVista(URL.createObjectURL(file))
      onChange(r)
    } catch (e) { setErr(e.message) }
    setSub(false)
  }
  return (
    <div>
      <div className="drop comp" role="button" tabIndex={0} onClick={() => ref.current?.click()} onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); subir(e.dataTransfer.files?.[0]) }}
        style={vista ? { backgroundImage: `linear-gradient(180deg,rgba(8,16,40,.15),rgba(8,16,40,.55)), url("${vista}")` } : undefined}>
        <span>{sub ? 'Subiendo…' : ruta ? 'Cambiar foto del comprobante' : 'Sube la foto del comprobante (clic o arrastra)'}</span>
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { subir(e.target.files?.[0]); e.target.value = '' }} />
      {ruta && <button type="button" className="link" onClick={() => { onChange(''); setVista('') }}>Quitar foto</button>}
      {err && <p className="err">{err}</p>}
    </div>
  )
}

export function Lightbox({ ruta, onClose }) {
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { urlComprobante(ruta).then(setUrl).catch((e) => setErr(e.message)) }, [ruta])
  return (
    <div className="ovl center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dlg foto">
        {err ? <p className="err">{err}</p> : url ? <img src={url} alt="Comprobante de pago" /> : <p>Cargando…</p>}
        <div className="row">
          {url && url.startsWith('http') && <a className="btn btn-line" href={url} target="_blank" rel="noopener noreferrer">Abrir en otra pestaña</a>}
          <button className="btn btn-teal" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export function InscripcionForm({ inicial, data, onSave, onClose, gerente }) {
  const grupos = data.grupos.filter((g) => g.estado !== 'cerrado' && g.activo !== false)
    .sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))
  const cursoDe = (id) => data.cursos.find((c) => String(c.id) === String(id))
  const [al, setAl] = useState({ tipo_doc: 'DNI', documento: '', nombres: '', apellido_paterno: '', apellido_materno: '', email: '', celular: '', ...(inicial.alumno || {}) })
  const [sel, setSel] = useState(inicial.grupo_id ? [String(inicial.grupo_id)] : [])
  const [paquete, setPaquete] = useState('')
  const [moneda, setMoneda] = useState('PEN')
  const [precio, setPrecio] = useState('')
  const [precioManual, setPrecioManual] = useState(false)
  const [fecha, setFecha] = useState(hoyISO())
  const [pago, setPago] = useState({ monto: '', metodo: 'Yape', fecha: hoyISO(), comprobante_url: '' })
  const [nota, setNota] = useState('')
  const [terminos, setTerminos] = useState(false)
  const [requisitos, setRequisitos] = useState(false)
  const [descAut, setDescAut] = useState(false)
  const [descMotivo, setDescMotivo] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [encontrado, setEncontrado] = useState(false)
  const [codBusca, setCodBusca] = useState('')
  const setA = (k, v) => setAl((x) => ({ ...x, [k]: v }))

  const elegidos = sel.map((id) => grupos.find((g) => String(g.id) === id)).filter(Boolean)
  const pideReq = elegidos.some((g) => programaSugerido(cursoDe(g.curso_id)?.titulo || ''))
  const sugerido = elegidos.reduce((t, g) => t + precioEn(cursoDe(g.curso_id), moneda), 0)   // precio de lista en la moneda elegida (en soles ya incluye IGV)
  const faltaUsd = moneda === 'USD' && elegidos.some((g) => !vendeEnUsd(cursoDe(g.curso_id)))
  const descMax = descuentoMaxPct(data.ajustes)               // tope de descuento libre (%), lo define gerencia en Web → Ajustes
  const minLibre = precioMinimoLibre(sugerido, descMax)
  useEffect(() => { if (!precioManual) setPrecio(sugerido ? String(sugerido) : '') }, [sugerido, precioManual])
  useEffect(() => {
    setPrecioManual(false)
    setPago((p) => ({ ...p, metodo: moneda === 'USD' ? 'PayPal' : (p.metodo === 'PayPal' ? 'Yape' : p.metodo) }))
  }, [moneda])

  function buscarAlumno(doc) {
    const x = data.alumnos.find((a) => a.tipo_doc === al.tipo_doc && a.documento === doc.trim())
    if (x) { setAl({ ...al, ...x, documento: x.documento }); setEncontrado(true) } else setEncontrado(false)
  }
  const esClubSel = paquete.trim().toLowerCase() === 'club ofimática'
  const hacerClub = () => {
    const buscar = (re) => grupos.find((g) => re.test(cursoDe(g.curso_id)?.titulo || ''))
    const gs = [buscar(/word/i), buscar(/excel/i), buscar(/power\s*point/i)]
    if (gs.some((g) => !g)) { setErr('Para el Club Ofimática tiene que haber un grupo abierto de Word, de Excel y de PowerPoint.'); return }
    const club = data.cursos.find((c) => /club/i.test(c.titulo || ''))
    const pClub = precioEn(club, moneda) || (moneda === 'PEN' ? 459 : 0)
    if (!pClub) { setErr('El Club Ofimática aún no tiene precio en dólares. Ponlo en Web → Cursos.'); return }
    setErr(''); setSel(gs.map((g) => String(g.id))); setPaquete('Club Ofimática'); setPrecio(String(pClub)); setPrecioManual(true)
  }
  const alternar = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function guardar() {
    const doc = al.documento.trim()
    if (!/^\d{8}$/.test(doc) && al.tipo_doc === 'DNI') { setErr('El DNI tiene 8 números.'); return }
    if (al.tipo_doc === 'CE' && doc.length < 8) { setErr('Revisa el carné de extranjería.'); return }
    if (al.nombres.trim().length < 2 || al.apellido_paterno.trim().length < 2) { setErr('Faltan los nombres o el apellido paterno.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((al.email || '').trim())) { setErr('El correo del alumno es obligatorio: ahí se envía su bienvenida con accesos. Revisa que esté bien escrito.'); return }
    if (!elegidos.length) { setErr('Elige al menos un curso (grupo).'); return }
    if (!terminos) { setErr('Marca que enviaste los Términos y condiciones al alumno.'); return }
    if (pideReq && !requisitos) { setErr('Marca que enviaste los requisitos mínimos de PC y que el alumno los cumple.'); return }
    const total = Number(precio)
    if (!(total >= 0) || precio === '') { setErr('Pon el precio acordado.'); return }
    if (faltaUsd) { setErr('Alguno de los cursos aún no tiene precio en dólares. Ponlo en Web → Cursos o cambia a soles.'); return }
    const conDescuento = sugerido > 0 && total < sugerido - 0.005 && !esClubSel
    const dentroTope = conDescuento && descMax > 0 && total >= minLibre - 0.005     // descuento libre: sin autorización de gerencia
    if (conDescuento && !dentroTope && !gerente && (!descAut || descMotivo.trim().length < 3)) { setErr(descMax > 0 ? `Pasa del descuento libre (${descMax} %): marca que gerencia lo autorizó y escribe quién y por qué.` : 'Estás dando descuento: marca que gerencia lo autorizó y escribe quién y por qué.'); return }
    const monto = Number(pago.monto) || 0
    if (monto > total + 0.005) { setErr('El pago no puede ser mayor que el precio.'); return }
    if (monto > 0 && pago.metodo !== 'Efectivo' && !pago.comprobante_url) { setErr('Sube la foto del comprobante del pago.'); return }
    setBusy(true); setErr('')
    try {
      await onSave({
        alumno: al, precioTotal: total, moneda, fecha, nota, terminos, descuentoAutorizado: conDescuento && !dentroTope ? (gerente || descAut) : false, descuentoMotivo: conDescuento ? (dentroTope && !descMotivo.trim() ? `Descuento libre dentro del tope (${descMax} %)` : descMotivo.trim()) : '', requisitos: pideReq ? requisitos : false,
        paquete: elegidos.length > 1 ? (paquete.trim() || 'Paquete') : '',
        grupos: elegidos.map((g) => ({ id: g.id, codigo: g.codigo || '', curso_id: g.curso_id, curso_titulo: cursoDe(g.curso_id)?.titulo || '' })),
        pago: monto > 0 ? { ...pago, monto } : null,
      })
    } catch (e) { setErr(e.message || 'No se pudo guardar'); setBusy(false) }
  }

  return (
    <Drawer titulo="Nueva inscripción" onClose={onClose}
      pie={<>
        {err && <span className="err">{err}</span>}
        <button className="btn btn-line" onClick={onClose}>Cancelar</button>
        <button className="btn btn-teal" onClick={guardar} disabled={busy}>{busy ? 'Guardando…' : 'Registrar inscripción'}</button>
      </>}>
      <section className="fs">
        <h3>Alumno</h3>
        <label>¿Ya es alumno? Escribe su código
          <input id="i-cod" placeholder="2026-000-10-678" value={codBusca} onChange={(e) => { setCodBusca(e.target.value); const x = data.alumnos.find((a) => (a.codigo || '').toLowerCase() === e.target.value.trim().toLowerCase()); if (x) { setAl({ ...al, ...x }); setEncontrado(true) } }} />
        </label>
        <div className="g2">
          <label>Documento
            <select id="i-tipo" value={al.tipo_doc} onChange={(e) => setA('tipo_doc', e.target.value)}><option>DNI</option><option>CE</option></select>
          </label>
          <label>N° de documento
            <input id="i-doc" inputMode="numeric" value={al.documento} onChange={(e) => { setA('documento', e.target.value.replace(/\D/g, '')); setEncontrado(false) }} onBlur={(e) => buscarAlumno(e.target.value)} maxLength={12} />
          </label>
        </div>
        {encontrado ? <p className="note ok">Este alumno ya estaba registrado{al.codigo ? <> (código <b>{al.codigo}</b>)</> : ''}: se cargaron sus datos.</p> : <p className="note">Si es un alumno nuevo, el sistema le asigna un código único al guardar.</p>}
        <label>Nombres<input id="i-nom" value={al.nombres} onChange={(e) => setA('nombres', e.target.value)} /></label>
        <div className="g2">
          <label>Apellido paterno<input id="i-ap" value={al.apellido_paterno} onChange={(e) => setA('apellido_paterno', e.target.value)} /></label>
          <label>Apellido materno<input id="i-am" value={al.apellido_materno} onChange={(e) => setA('apellido_materno', e.target.value)} /></label>
        </div>
        <div className="g2">
          <label>Celular<input id="i-cel" inputMode="tel" value={al.celular} onChange={(e) => setA('celular', e.target.value)} /></label>
          <label>Correo (obligatorio)<input id="i-mail" type="email" required value={al.email} onChange={(e) => setA('email', e.target.value)} placeholder="correo@ejemplo.com" /></label>
        </div>
      </section>

      <section className="fs">
        <h3>Curso(s) y precio</h3>
        <div className="chips" role="radiogroup" aria-label="Moneda de esta inscripción">
          <button type="button" className={moneda === 'PEN' ? 'sel' : ''} onClick={() => setMoneda('PEN')}>🇵🇪 Soles (S/)</button>
          <button type="button" className={moneda === 'USD' ? 'sel' : ''} onClick={() => setMoneda('USD')}>💵 Dólares (US$)</button>
        </div>
        <p className="note">Toda la inscripción va en una sola moneda (el precio y los pagos).</p>
        {faltaUsd && <p className="note">⚠️ Alguno de los cursos elegidos aún no tiene precio en dólares. Gerencia lo pone en Web → Cursos.</p>}
        {grupos.length === 0 && <p className="note">Aún no hay grupos abiertos. Pide a gerencia que abra uno en Horarios.</p>}
        <div className="pick">
          {grupos.map((g) => {
            const c = cursoDe(g.curso_id)
            return (
              <button type="button" key={g.id} className={sel.includes(String(g.id)) ? 'sel' : ''} onClick={() => alternar(String(g.id))}>
                <i style={{ background: c ? `var(--${c.color})` : 'var(--line)' }} />
                <span><b>{g.codigo && <span className="cod">{g.codigo}</span>}{c?.titulo || 'Curso'}</b><small>{g.inicio ? fechaCorta(g.inicio) : 'Sin fecha'} · {g.dias || '—'} · {g.inscritos}/{g.maximo || 20} inscritos</small></span>
              </button>
            )
          })}
        </div>
        <button type="button" className="btn btn-line sm" onClick={hacerClub}>🎓 Club Ofimática (Word + Excel + PowerPoint · {fmtMoneda(precioEn(data.cursos.find((c) => /club/i.test(c.titulo || '')), moneda) || (moneda === 'PEN' ? 459 : 0), moneda)} · cuenta como 1 cupo)</button>
        {elegidos.length > 1 && (
          <label>Nombre del paquete<input id="i-paq" value={paquete} onChange={(e) => setPaquete(e.target.value)} placeholder="Ej.: Club Ofimática" /></label>
        )}
        <label>Precio acordado {elegidos.length > 1 ? 'por todo el paquete' : ''} ({simbolo(moneda)}{moneda === 'PEN' ? ', IGV incluido' : ''})
          <input id="i-precio" type="number" min="0" step="0.01" value={precio} onChange={(e) => { setPrecio(e.target.value); setPrecioManual(true) }} />
        </label>
        {sugerido > 0 && Number(precio) !== sugerido && <p className="note">Precio de la página: {fmtMoneda(sugerido, moneda)}. {Number(precio) < sugerido && !esClubSel ? 'Estás dando descuento.' : ''}</p>}
        {sugerido > 0 && Number(precio) >= sugerido - 0.005 && descMax > 0 && !esClubSel && <p className="note">💡 Ofrece primero el precio de la página. El descuento es el último recurso para cerrar la venta: hasta {descMax} % (mínimo {fmtMoneda(minLibre, moneda)}), sin pedir autorización.</p>}
        {sugerido > 0 && Number(precio) < sugerido - 0.005 && !esClubSel && (
          <div className="fs descuento">
            {descMax > 0 && Number(precio) >= minLibre - 0.005
              ? <p className="note"><b>Descuento libre.</b> Está dentro del tope ({descMax} %): no necesitas autorización. Úsalo solo como último recurso para cerrar la venta.</p>
              : <p className="note"><b>Pasa del descuento libre.</b> {descMax > 0 ? `Lo máximo sin autorización es ${descMax} % (${fmtMoneda(minLibre, moneda)}). ` : 'Aún no hay un tope de descuento libre. '}Para este precio hace falta autorización previa de gerencia.</p>}
            {!(descMax > 0 && Number(precio) >= minLibre - 0.005) && !gerente && <label className="chk"><input id="i-desc" type="checkbox" checked={descAut} onChange={(e) => setDescAut(e.target.checked)} /> Gerencia autorizó este descuento antes de cerrar la venta</label>}
            <label>{gerente || (descMax > 0 && Number(precio) >= minLibre - 0.005) ? 'Nota (opcional)' : 'Quién lo autorizó y por qué'}<input id="i-descm" value={descMotivo} onChange={(e) => setDescMotivo(e.target.value)} placeholder="Ej.: pidió precio menor y cerró hoy" /></label>
          </div>
        )}
        <label>Fecha de inscripción<input id="i-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
      </section>

      <section className="fs">
        <h3>Pago 1 <small>(déjalo vacío si aún no paga)</small></h3>
        <div className="g2">
          <label>Monto ({simbolo(moneda)})<input id="p-monto" type="number" min="0" step="0.01" value={pago.monto} onChange={(e) => setPago({ ...pago, monto: e.target.value })} /></label>
          <label>Método<select id="p-met" value={pago.metodo} onChange={(e) => setPago({ ...pago, metodo: e.target.value })}>{METODOS.map((m) => <option key={m}>{m}</option>)}</select></label>
        </div>
        <label>Fecha del pago<input id="p-fecha" type="date" value={pago.fecha} onChange={(e) => setPago({ ...pago, fecha: e.target.value })} /></label>
        <span className="lbl">Comprobante {pago.metodo === 'Efectivo' ? '(opcional)' : ''}</span>
        <SubirComprobante ruta={pago.comprobante_url} onChange={(r) => setPago({ ...pago, comprobante_url: r })} />
      </section>

      <section className="fs">
        <h3>Antes de inscribir</h3>
        <label className="chk"><input id="i-term" type="checkbox" checked={terminos} onChange={(e) => setTerminos(e.target.checked)} /> Le envié al alumno los Términos y condiciones</label>
        {pideReq && <label className="chk"><input id="i-req" type="checkbox" checked={requisitos} onChange={(e) => setRequisitos(e.target.checked)} /> Le envié los requisitos mínimos de PC y confirmó que su equipo los cumple</label>}
      </section>
      <section className="fs">
        <label>Nota (opcional)<textarea id="i-nota" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: paga el saldo el 20 de nov" /></label>
      </section>
    </Drawer>
  )
}

export function PagoForm({ insc, onSave, onClose }) {
  const usd = insc.moneda === 'USD'
  const [p, setP] = useState({ monto: insc.saldo ? String(insc.saldo) : '', metodo: usd ? 'PayPal' : 'Yape', fecha: hoyISO(), comprobante_url: '', nota: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const a = insc.alumno || {}
  async function guardar() {
    const monto = Number(p.monto)
    if (!(monto > 0)) { setErr('Pon el monto del pago.'); return }
    if (monto > insc.saldo + 0.005) { setErr(`El pago no puede pasar del saldo (${fmtMoneda(insc.saldo, insc.moneda)}).`); return }
    if (p.metodo !== 'Efectivo' && !p.comprobante_url) { setErr('Sube la foto del comprobante.'); return }
    setBusy(true); setErr('')
    try { await onSave({ matriculas: insc.activas, pago: { ...p, monto } }) } catch (e) { setErr(e.message || 'No se pudo guardar'); setBusy(false) }
  }
  return (
    <Drawer titulo={`Pago ${insc.pagosLista.length + 1}`} onClose={onClose}
      pie={<>{err && <span className="err">{err}</span>}<button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={guardar} disabled={busy}>{busy ? 'Guardando…' : 'Registrar pago'}</button></>}>
      <section className="fs">
        <h3>{a.nombres} {a.apellido_paterno}</h3>
        <p className="note">{insc.codigos.join(' + ')} · Precio {fmtMoneda(insc.precio, insc.moneda)} · Pagado {fmtMoneda(insc.pagado, insc.moneda)} · <b>Saldo {fmtMoneda(insc.saldo, insc.moneda)}</b></p>
        <div className="g2">
          <label>Monto ({simbolo(insc.moneda)})<input id="pp-monto" type="number" min="0" step="0.01" value={p.monto} onChange={(e) => setP({ ...p, monto: e.target.value })} /></label>
          <label>Método<select id="pp-met" value={p.metodo} onChange={(e) => setP({ ...p, metodo: e.target.value })}>{METODOS.map((m) => <option key={m}>{m}</option>)}</select></label>
        </div>
        <label>Fecha del pago<input id="pp-fecha" type="date" value={p.fecha} onChange={(e) => setP({ ...p, fecha: e.target.value })} /></label>
        <span className="lbl">Comprobante {p.metodo === 'Efectivo' ? '(opcional)' : ''}</span>
        <SubirComprobante ruta={p.comprobante_url} onChange={(r) => setP({ ...p, comprobante_url: r })} />
        <label>Nota (opcional)<input id="pp-nota" value={p.nota} onChange={(e) => setP({ ...p, nota: e.target.value })} /></label>
      </section>
    </Drawer>
  )
}

export function Inscritos({ data, hacer, rol, nuevaInscripcion, registrarPago }) {
  const todas = useMemo(() => armarInscripciones(data), [data])
  const [mes, setMes] = useState('')
  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState('')
  const [q, setQ] = useState('')
  const [foto, setFoto] = useState('')
  const [borrando, setBorrando] = useState(null)
  const [enviando, setEnviando] = useState('')
  const gerente = rol === 'gerente'
  async function bienvenida(x) {
    const a = x.alumno || {}
    const reenvio = x.activas.length > 0 && x.activas.every((m) => m.bienvenida_en)
    if (!window.confirm(`¿${reenvio ? 'Reenviar' : 'Enviar'} el correo de bienvenida a ${a.nombres} (${a.email})?${x.saldo > 0 ? `\n\nOjo: aún debe ${fmtMoneda(x.saldo, x.moneda)}. El correo saldrá SIN el link de Zoom hasta que complete el pago.` : ''}`)) return
    setEnviando(x.id)
    await hacer(async () => { await enviarBienvenidaCorreo(x.id, await pdfTerminos()) }, 'Bienvenida enviada ✉️')
    setEnviando('')
  }
  const meses = [...new Set(todas.map((x) => x.mes).filter(Boolean))].sort().reverse()
  const grupos = [...data.grupos].filter((g) => g.codigo).sort((a, b) => a.codigo.localeCompare(b.codigo))
  const nombreCurso = (id) => data.cursos.find((c) => String(c.id) === String(id))?.titulo || ''
  const lista = todas.filter((x) => {
    if (mes && x.mes !== mes) return false
    if (codigo && !x.codigos.includes(codigo)) return false
    if (estado && x.estado !== estado) return false
    if (q.trim()) {
      const a = x.alumno || {}
      const t = `${a.codigo || ''} ${a.nombres} ${a.apellido_paterno} ${a.apellido_materno} ${a.documento} ${a.celular}`.toLowerCase()
      if (!t.includes(q.trim().toLowerCase())) return false
    }
    return true
  })
  const vivas = lista.filter((x) => x.estado !== 'anulada')
  const cobrado = sumaPorMoneda(vivas, (x) => x.pagado, (x) => x.moneda)
  const porCobrar = sumaPorMoneda(vivas, (x) => x.saldo, (x) => x.moneda)
  const dosMonedas = (t) => (t.USD > 0 ? `${soles(t.PEN)} · ${fmtMoneda(t.USD, 'USD')}` : soles(t.PEN))
  const bajar = () => {
    const blob = new Blob([inscritosCSV(lista)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `inscritos-ccn-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <>
      <Seccion titulo="Inscritos" ayuda="Cada alumno con su curso (por código), precio y pagos. Sube la foto de cada comprobante. Los inscritos de cada grupo se cuentan solos.">
        <button className="btn btn-line" onClick={bajar} disabled={!lista.length}>Descargar Excel</button>
        <button className="btn btn-teal" onClick={() => nuevaInscripcion()}>+ Nueva inscripción</button>
      </Seccion>
      <AlertasVenta data={data} email="" gerente />
      {data.crmError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase (SQL Editor). Mensaje: {data.crmError}</p>}

      <div className="filtros">
        <label>Mes
          <select id="f-mes" value={mes} onChange={(e) => setMes(e.target.value)}>
            <option value="">Todos</option>{meses.map((m) => <option key={m} value={m}>{nombreMes(m)}</option>)}
          </select>
        </label>
        <label>Curso / grupo
          <select id="f-cod" value={codigo} onChange={(e) => setCodigo(e.target.value)}>
            <option value="">Todos</option>{grupos.map((g) => <option key={g.id} value={g.codigo}>{g.codigo} · {nombreCurso(g.curso_id)}</option>)}
          </select>
        </label>
        <label>Pago
          <select id="f-est" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option><option value="pagado">Pagado</option><option value="adelanto">Adelanto</option><option value="pendiente">Sin pago</option><option value="anulada">Anuladas</option>
          </select>
        </label>
        <label className="buscar">Buscar<input id="f-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código, nombre o celular" /></label>
      </div>

      <div className="kpis">
        <div><b>{vivas.length}</b><span>inscripciones</span></div>
        <div><b>{dosMonedas(cobrado)}</b><span>cobrado</span></div>
        <div><b>{dosMonedas(porCobrar)}</b><span>por cobrar</span></div>
      </div>

      {lista.length === 0 && !data.crmError && (
        <div className="vacio"><p>{todas.length ? 'No hay inscripciones con esos filtros.' : 'Aún no hay inscritos. Registra al primero.'}</p>{!todas.length && <button className="btn btn-teal" onClick={() => nuevaInscripcion()}>+ Nueva inscripción</button>}</div>
      )}
      {lista.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table insc">
            <thead><tr><th>Fecha</th><th>Alumno</th>{gerente && <th>Vendedor</th>}<th>Cursos</th><th>Precio</th><th>Pagos</th><th>Saldo</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {lista.map((x) => {
                const a = x.alumno || {}
                return (
                  <tr key={x.id} className={x.estado === 'anulada' ? 'anulada' : ''}>
                    <td>{x.fecha ? new Date(x.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : ''}</td>
                    <td><b>{a.nombres} {a.apellido_paterno} {a.apellido_materno}</b>{x.paquete && <small className="paq">{x.paquete}</small>}
                      <small className="paq">{a.codigo ? <span className="cod">{a.codigo}</span> : `${a.tipo_doc} ${a.documento}`}{a.celular && <> · <a href={`https://wa.me/${String(a.celular).replace(/\D/g, '').replace(/^(\d{9})$/, '51$1')}`} target="_blank" rel="noopener noreferrer">{a.celular}</a></>}</small></td>
                    {gerente && <td>{(x.vendedor || '').split('@')[0] || '—'}</td>}
                    <td>{x.matriculas.map((m) => <span key={m.id} className="cod" title={m.curso_titulo}>{m.grupo_codigo || '—'}</span>)}</td>
                    <td>{fmtMoneda(x.precio, x.moneda)}</td>
                    <td className="pagos">
                      {x.pagosLista.length === 0 && <small>—</small>}
                      {x.pagosLista.map((p, i) => (
                        <span key={i} className="pg">
                          <b>P{p.numero}</b> {fmtMoneda(p.monto, x.moneda)} <small>{p.metodo}</small>
                          {p.comprobante_url && <button type="button" className="link" onClick={() => setFoto(p.comprobante_url)} aria-label={`Ver comprobante del pago ${p.numero}`}><Icon n="clip" size={14} /></button>}
                        </span>
                      ))}
                    </td>
                    <td>{x.saldo > 0 && x.estado !== 'anulada' ? fmtMoneda(x.saldo, x.moneda) : '—'}</td>
                    <td><span className={`pill ${x.estado}`}>{ESTADO_TXT[x.estado]}</span></td>
                    <td className="acc">
                      {x.estado !== 'anulada' && x.saldo > 0 && <button className="btn btn-line sm" onClick={() => registrarPago(x)}>+ Pago</button>}
                      {x.estado !== 'anulada' && x.pagado > 0 && (a.email || '').includes('@') && (
                        <button className="btn btn-line sm" disabled={enviando === x.id} onClick={() => bienvenida(x)} title={x.activas.every((m) => m.bienvenida_en) ? 'Ya se envió: reenviar' : 'Enviar correo de bienvenida'}>
                          {enviando === x.id ? 'Enviando…' : x.activas.length > 0 && x.activas.every((m) => m.bienvenida_en) ? '✉️ Reenviar' : '✉️ Bienvenida'}
                        </button>
                      )}
                      {x.estado !== 'anulada' && x.pagado > 0 && (x.moneda === 'USD'
                        ? <button className="btn btn-line sm" onClick={() => hacer(() => generarNotaPago(x), 'Nota de pago descargada 📄')} title="Genera un PDF con los pagos recibidos (no es boleta ni factura)">📄 Nota de pago</button>
                        : <>
                          <button className="btn btn-line sm" disabled title="Aún no disponible: falta conectar SUNAT">Boleta</button>
                          <button className="btn btn-line sm" disabled title="Aún no disponible: falta conectar SUNAT">Factura</button>
                        </>)}
                      {gerente && (x.estado === 'anulada'
                        ? <button className="btn btn-line sm" onClick={() => hacer(() => estadoInscripcion(x.id, 'activa'), 'Inscripción reactivada')}>Reactivar</button>
                        : <button className="btn btn-line sm" onClick={() => hacer(() => estadoInscripcion(x.id, 'anulada'), 'Inscripción anulada')}>Anular</button>)}
                      {gerente && <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar"><Icon n="trash" /></button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {foto && <Lightbox ruta={foto} onClose={() => setFoto('')} />}
      {borrando && (
        <Confirmar texto={`¿Borrar la inscripción de ${borrando.alumno?.nombres || 'este alumno'} y sus pagos? No se puede deshacer.`} onNo={() => setBorrando(null)}
          onSi={() => { const x = borrando; setBorrando(null); hacer(() => borrarInscripcion(x.id), 'Inscripción borrada') }} />
      )}
    </>
  )
}
