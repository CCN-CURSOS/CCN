import { useEffect, useRef, useState } from 'react'
import { subirImagen } from '../lib/data.js'

/* ================= piezas pequeñas ================= */
export function Switch({ on, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      className={`swt ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i /></button>
  )
}

export function Drawer({ titulo, onClose, children, pie, ancho }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="ovl" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={`drawer ${ancho ? 'ancho' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="dr-head"><h2>{titulo}</h2><button className="x" onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="dr-body">{children}</div>
        {pie && <div className="dr-foot">{pie}</div>}
      </aside>
    </div>
  )
}

export function Confirmar({ texto, onSi, onNo }) {
  return (
    <div className="ovl center" onMouseDown={(e) => e.target === e.currentTarget && onNo()}>
      <div className="dlg" role="alertdialog">
        <p>{texto}</p>
        <div className="row">
          <button className="btn btn-line" onClick={onNo}>Cancelar</button>
          <button className="btn btn-danger" onClick={onSi}>Sí, borrar</button>
        </div>
      </div>
    </div>
  )
}

export function Imagen({ url, onChange, color }) {
  const [sub, setSub] = useState(false)
  const [over, setOver] = useState(false)
  const [err, setErr] = useState('')
  const ref = useRef(null)
  async function subir(file) {
    if (!file) return
    setSub(true); setErr('')
    try { onChange(await subirImagen(file)) } catch (e) { setErr(e.message) }
    setSub(false)
  }
  return (
    <div>
      <div className={`drop ${over ? 'over' : ''}`}
        style={url ? { backgroundImage: `linear-gradient(180deg,rgba(8,16,40,.1),rgba(8,16,40,.5)), url("${url}")` } : { background: `var(--${color})` }}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); subir(e.dataTransfer.files?.[0]) }}
        role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}>
        <span>{sub ? 'Subiendo…' : url ? 'Cambiar imagen' : 'Arrastra una imagen aquí o haz clic'}</span>
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { subir(e.target.files?.[0]); e.target.value = '' }} />
      {url && <button type="button" className="link" onClick={() => onChange('')}>Quitar imagen (usar color)</button>}
      {err && <p className="err">{err}</p>}
      <p className="note">Mejor horizontal, de 1000 px o más. Se reduce sola.</p>
    </div>
  )
}

export function Seccion({ titulo, ayuda, children }) {
  return (
    <div className="sechead">
      <div><h1>{titulo}</h1><p>{ayuda}</p></div>
      <div className="secact">{children}</div>
    </div>
  )
}
