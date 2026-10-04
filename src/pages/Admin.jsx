import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  hasBackend, supabase, loadAll, save, remove, saveAjuste, esAdmin, fechaCorta, subirImagen, telefono, setNumero, COLORES, MAX_INICIO,
} from '../lib/data.js'

/* ================= piezas pequeñas ================= */
function Switch({ on, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      className={`swt ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i /></button>
  )
}

function Drawer({ titulo, onClose, children, pie }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="ovl" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="dr-head"><h2>{titulo}</h2><button className="x" onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="dr-body">{children}</div>
        <div className="dr-foot">{pie}</div>
      </aside>
    </div>
  )
}

function Confirmar({ texto, onSi, onNo }) {
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

function Imagen({ url, onChange, color }) {
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

/* ================= CURSOS ================= */
const CURSO_VACIO = {
  titulo: '', descripcion: '', color: 'g1', horas: 12, sesiones: 4, precio: 299, precio_antes: '',
  programas: '', temario: [], extra: '', orden: 0, activo: true, destacado: false, imagen_url: '',
}

function CursoForm({ inicial, total, enInicio, onSave, onClose }) {
  const [f, setF] = useState({ ...CURSO_VACIO, ...inicial, precio_antes: inicial.precio_antes ?? '', temario: [...(inicial.temario || [])] })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setTem = (i, v) => set('temario', f.temario.map((t, j) => (j === i ? v : t)))
  const mover = (i, d) => {
    const a = [...f.temario]; const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; set('temario', a)
  }
  const inicioLleno = enInicio >= MAX_INICIO && !inicial.destacado

  async function guardar() {
    if (!f.titulo.trim()) { setErr('Ponle un título al curso.'); return }
    setBusy(true)
    try {
      await onSave({
        ...f,
        titulo: f.titulo.trim(),
        horas: Number(f.horas) || 0, sesiones: Number(f.sesiones) || 0, precio: Number(f.precio) || 0,
        precio_antes: f.precio_antes === '' ? null : Number(f.precio_antes),
        orden: f.id ? f.orden : total + 1,
        temario: f.temario.map((t) => t.trim()).filter(Boolean),
      })
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <Drawer titulo={f.id ? 'Editar curso' : 'Curso nuevo'} onClose={onClose}
      pie={<>
        {err && <span className="err">{err}</span>}
        <button className="btn btn-line" onClick={onClose}>Cancelar</button>
        <button className="btn btn-teal" onClick={guardar} disabled={busy}>{busy ? 'Guardando…' : 'Guardar curso'}</button>
      </>}>
      <section className="fs">
        <h3>Imagen</h3>
        <Imagen url={f.imagen_url} color={f.color} onChange={(u) => set('imagen_url', u)} />
        <div className="colors">
          {Object.entries(COLORES).map(([k, v]) => (
            <button type="button" key={k} className={`col ${f.color === k ? 'sel' : ''}`} style={{ background: `var(--${k})` }}
              onClick={() => set('color', k)} aria-label={`Color ${v.nombre}`} title={v.nombre} />
          ))}
          <span className="note">Color de la tarjeta (se usa si no hay imagen)</span>
        </div>
      </section>

      <section className="fs">
        <h3>Lo básico</h3>
        <label>Título<input id="c-titulo" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ej: Excel para negocios" autoFocus /></label>
        <label>Descripción corta<textarea id="c-desc" value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Una o dos frases de lo que aprende el alumno" /></label>
      </section>

      <section className="fs">
        <h3>Precio y duración</h3>
        <div className="g2">
          <label>Precio (S/)<input id="c-precio" type="number" min="0" value={f.precio} onChange={(e) => set('precio', e.target.value)} /></label>
          <label>Precio anterior (opcional)<input id="c-antes" type="number" min="0" value={f.precio_antes} onChange={(e) => set('precio_antes', e.target.value)} placeholder="Para mostrarlo tachado" /></label>
          <label>Horas<input id="c-horas" type="number" min="1" value={f.horas} onChange={(e) => set('horas', e.target.value)} /></label>
          <label>Sesiones<input id="c-ses" type="number" min="1" value={f.sesiones} onChange={(e) => set('sesiones', e.target.value)} /></label>
        </div>
      </section>

      <section className="fs">
        <h3>Temario</h3>
        {f.temario.map((t, i) => (
          <div className="trow" key={i}>
            <span className="n">{i + 1}</span>
            <input value={t} onChange={(e) => setTem(i, e.target.value)} placeholder="Nombre del módulo" aria-label={`Módulo ${i + 1}`} />
            <button type="button" className="ib" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
            <button type="button" className="ib" onClick={() => mover(i, 1)} disabled={i === f.temario.length - 1} aria-label="Bajar">↓</button>
            <button type="button" className="ib red" onClick={() => set('temario', f.temario.filter((_, j) => j !== i))} aria-label="Quitar">×</button>
          </div>
        ))}
        <button type="button" className="btn btn-line sm" onClick={() => set('temario', [...f.temario, ''])}>+ Agregar módulo</button>
        <label style={{ marginTop: 12 }}>Programas que se usan<input id="c-prog" value={f.programas} onChange={(e) => set('programas', e.target.value)} placeholder="Ej: Excel, Canva" /></label>
        <label>Nivel extra CCN<input id="c-extra" value={f.extra} onChange={(e) => set('extra', e.target.value)} placeholder="Lo que otros cursos no enseñan" /></label>
      </section>

      <section className="fs">
        <h3>Dónde se muestra</h3>
        <div className="sline"><span>Visible en la web</span><Switch on={f.activo} onChange={(v) => set('activo', v)} label="Visible en la web" /></div>
        <div className="sline">
          <span>Mostrar en la página principal<small>{inicioLleno ? `Ya hay ${MAX_INICIO} en el inicio. Quita uno primero.` : `Máximo ${MAX_INICIO}. Ahora hay ${enInicio}.`}</small></span>
          <Switch on={f.destacado} onChange={(v) => set('destacado', v)} label="Mostrar en la página principal" disabled={inicioLleno} />
        </div>
      </section>
    </Drawer>
  )
}

function Cursos({ data, hacer, abrirGrupo }) {
  const [editando, setEditando] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const [precio, setPrecio] = useState({})
  const enInicio = data.cursos.filter((c) => c.destacado).length
  const proximo = (id) =>
    data.grupos.filter((g) => g.curso_id === id && g.estado !== 'cerrado' && g.activo).sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))[0]

  const mover = (i, d) => {
    const a = [...data.cursos]; const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    hacer(async () => { for (let k = 0; k < a.length; k++) if (a[k].orden !== k + 1) await save('cursos', { id: a[k].id, orden: k + 1 }) }, 'Orden guardado')
  }

  return (
    <>
      <Seccion titulo="Cursos" ayuda={`Aquí creas y editas tus cursos. En la página principal salen los marcados con ★ (${enInicio} de ${MAX_INICIO}); en "Todos los cursos" salen todos los visibles.`}>
        <button className="btn btn-teal" onClick={() => setEditando({})}>+ Nuevo curso</button>
      </Seccion>

      {data.cursos.length === 0 && <div className="vacio"><p>Aún no hay cursos.</p><button className="btn btn-teal" onClick={() => setEditando({})}>Crear el primero</button></div>}

      {data.cursos.length > 0 && (
        <div className="tbl">
          <div className="crow thead" aria-hidden="true">
            <span /><span>Curso</span><span>Precio</span><span>En inicio</span><span>Visible</span><span />
          </div>
          {data.cursos.map((c, i) => {
            const g = proximo(c.id)
            return (
              <div className={`crow ${c.activo ? '' : 'off'}`} key={c.id}>
                <div className="th" style={c.imagen_url ? { backgroundImage: `url("${c.imagen_url}")` } : { background: `var(--${c.color})` }} />
                <div className="nm">
                  <b>{c.titulo}</b>
                  <small>{c.horas} h · {c.sesiones} sesiones · {g ? `${g.inicio ? fechaCorta(g.inicio) : 'sin fecha'} (${g.estado})` : 'sin grupo abierto'}</small>
                </div>
                <label className="pr" data-l="Precio">S/
                  <input type="number" min="0" aria-label={`Precio de ${c.titulo}`}
                    value={precio[c.id] ?? c.precio}
                    onChange={(e) => setPrecio({ ...precio, [c.id]: e.target.value })}
                    onBlur={() => {
                      const v = Number(precio[c.id])
                      if (precio[c.id] !== undefined && v !== c.precio && v >= 0) hacer(() => save('cursos', { id: c.id, precio: v }), 'Precio guardado')
                      setPrecio((p) => { const n = { ...p }; delete n[c.id]; return n })
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
                </label>
                <div data-l="En inicio">
                  <button className="starb" aria-pressed={c.destacado} aria-label={c.destacado ? 'Quitar de la página principal' : 'Mostrar en la página principal'}
                    title={!c.destacado && enInicio >= MAX_INICIO ? `Ya hay ${MAX_INICIO} en el inicio` : ''}
                    disabled={!c.destacado && enInicio >= MAX_INICIO}
                    onClick={() => hacer(() => save('cursos', { id: c.id, destacado: !c.destacado }), c.destacado ? 'Quitado de la principal' : 'Ahora sale en la principal')}>
                    {c.destacado ? '★' : '☆'}
                  </button>
                </div>
                <div data-l="Visible"><Switch on={c.activo} label={`Visible: ${c.titulo}`} onChange={(v) => hacer(() => save('cursos', { id: c.id, activo: v }), v ? 'Curso visible' : 'Curso oculto')} /></div>
                <div className="acts2">
                  <button className="btn btn-teal sm" onClick={() => abrirGrupo(c.id)}>Abrir grupo</button>
                  <button className="btn btn-line sm" onClick={() => setEditando(c)}>Editar</button>
                  <button className="ib" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                  <button className="ib" onClick={() => mover(i, 1)} disabled={i === data.cursos.length - 1} aria-label="Bajar">↓</button>
                  <button className="ib red" onClick={() => setBorrando(c)} aria-label="Borrar">🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editando && (
        <CursoForm inicial={editando} total={data.cursos.length} enInicio={enInicio} onClose={() => setEditando(null)}
          onSave={async (row) => { await save('cursos', row); setEditando(null); await hacer(async () => {}, editando.id ? 'Curso guardado' : 'Curso creado') }} />
      )}
      {borrando && (
        <Confirmar texto={`¿Borrar "${borrando.titulo}" y todos sus grupos? No se puede deshacer.`}
          onNo={() => setBorrando(null)}
          onSi={() => { const c = borrando; setBorrando(null); hacer(() => remove('cursos', c.id), 'Curso borrado') }} />
      )}
    </>
  )
}

function Seccion({ titulo, ayuda, children }) {
  return (
    <div className="sechead">
      <div><h1>{titulo}</h1><p>{ayuda}</p></div>
      <div className="secact">{children}</div>
    </div>
  )
}

/* ================= GRUPOS ================= */
const DIAS = ['Lun.-Vie.', 'Sábados', 'Sáb.-Dom.', 'Lun.-Mié.', 'Mar.-Jue.', 'Domingos']
const GRUPO_VACIO = { curso_id: '', inicio: '', dias: '', horario: '', estado: 'abierto', inscritos: 0, minimo: 10, mostrar_inscritos: false, activo: true }
const partes = (h) => { const m = /(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/.exec(h || ''); return m ? [m[1], m[2]] : ['', ''] }

function GrupoForm({ inicial, cursos, onSave, onClose }) {
  const [f, setF] = useState({ ...GRUPO_VACIO, ...inicial, inicio: inicial.inicio || '' })
  const [[d, h], setHoras] = useState(partes(inicial.horario))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))

  async function guardar() {
    if (!f.curso_id) { setErr('Elige el curso.'); return }
    setBusy(true)
    try {
      await onSave({
        ...f, inicio: f.inicio || null,
        horario: d && h ? `${d} - ${h}` : (f.horario || ''),
        inscritos: Number(f.inscritos) || 0, minimo: Number(f.minimo) || 10,
      })
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <Drawer titulo={f.id ? 'Editar grupo' : 'Abrir grupo'} onClose={onClose}
      pie={<>
        {err && <span className="err">{err}</span>}
        <button className="btn btn-line" onClick={onClose}>Cancelar</button>
        <button className="btn btn-teal" onClick={guardar} disabled={busy}>{busy ? 'Guardando…' : f.id ? 'Guardar' : 'Publicar grupo'}</button>
      </>}>
      <section className="fs">
        <h3>¿Qué curso abre?</h3>
        <div className="pick">
          {cursos.map((c) => (
            <button type="button" key={c.id} className={f.curso_id === c.id ? 'sel' : ''} onClick={() => set('curso_id', c.id)}>
              <i style={{ background: `var(--${c.color})` }} />{c.titulo}
            </button>
          ))}
        </div>
      </section>
      <section className="fs">
        <h3>¿Cuándo?</h3>
        <label>Fecha de inicio<input id="g-inicio" type="date" value={f.inicio} onChange={(e) => set('inicio', e.target.value)} /></label>
        <div>
          <span className="lbl">Días</span>
          <div className="chips">
            {DIAS.map((x) => <button type="button" key={x} className={f.dias === x ? 'sel' : ''} onClick={() => set('dias', x)}>{x}</button>)}
          </div>
          <input id="g-dias" value={f.dias} onChange={(e) => set('dias', e.target.value)} placeholder="O escribe los días" aria-label="Días" />
        </div>
        <div className="g2">
          <label>Desde<input id="g-desde" type="time" value={d} onChange={(e) => setHoras([e.target.value, h])} /></label>
          <label>Hasta<input id="g-hasta" type="time" value={h} onChange={(e) => setHoras([d, e.target.value])} /></label>
        </div>
      </section>
      <section className="fs">
        <h3>Estado y cupos</h3>
        <div className="seg" role="radiogroup" aria-label="Estado">
          {[['abierto', 'Abierto'], ['lleno', 'Lleno'], ['cerrado', 'Cerrado']].map(([v, t]) => (
            <button type="button" role="radio" aria-checked={f.estado === v} key={v} className={f.estado === v ? 'sel' : ''} onClick={() => set('estado', v)}>{t}</button>
          ))}
        </div>
        <p className="note">Lleno muestra "Lista de espera". Cerrado lo oculta de la web.</p>
        <div className="g2">
          <div><span className="lbl">Inscritos</span>
            <div className="step">
              <button type="button" onClick={() => set('inscritos', Math.max(0, Number(f.inscritos) - 1))} aria-label="Menos">−</button>
              <b>{f.inscritos}</b>
              <button type="button" onClick={() => set('inscritos', Number(f.inscritos) + 1)} aria-label="Más">+</button>
            </div>
          </div>
          <label>Mínimo para abrir<input id="g-min" type="number" min="1" value={f.minimo} onChange={(e) => set('minimo', e.target.value)} /></label>
        </div>
        <div className="sline"><span>Mostrar "{f.inscritos} de {f.minimo}" en la web</span><Switch on={f.mostrar_inscritos} onChange={(v) => set('mostrar_inscritos', v)} label="Mostrar inscritos" /></div>
        <div className="sline"><span>Visible en la web</span><Switch on={f.activo} onChange={(v) => set('activo', v)} label="Visible" /></div>
      </section>
    </Drawer>
  )
}

function Grupos({ data, hacer, abrirGrupo, editarGrupo }) {
  const [borrando, setBorrando] = useState(null)
  const nombre = (id) => data.cursos.find((c) => c.id === id)
  const lista = [...data.grupos].sort((a, b) => (b.inicio || '9999').localeCompare(a.inicio || '9999'))
  return (
    <>
      <Seccion titulo="Horarios" ayuda="Cada grupo es una vez que abre un curso. Sale en la tarjeta del curso y en la tabla de horarios de la web.">
        <button className="btn btn-teal" onClick={() => abrirGrupo('')}>+ Abrir grupo</button>
      </Seccion>
      {lista.length === 0 && <div className="vacio"><p>Aún no hay grupos. Cuando abras uno, sale en la tarjeta del curso y en la tabla de horarios.</p><button className="btn btn-teal" onClick={() => abrirGrupo('')}>Abrir el primero</button></div>}
      <div className="lst">
        {lista.map((g) => {
          const c = nombre(g.curso_id)
          return (
            <div className="item" key={g.id}>
              <div className="tt">
                <span className="sw" style={{ background: c ? `var(--${c.color})` : 'var(--line)' }} />
                <div>
                  <b>{c?.titulo || 'Curso eliminado'}</b>
                  <small>{g.inicio ? fechaCorta(g.inicio) : 'Sin fecha'} · {g.dias || 'días por definir'} · {g.horario || 'horario por definir'}</small>
                </div>
              </div>
              <div className="btns">
                <div className="step sm" title="Inscritos">
                  <button onClick={() => hacer(() => save('grupos', { id: g.id, inscritos: Math.max(0, g.inscritos - 1) }), 'Inscritos actualizados')} aria-label="Menos">−</button>
                  <b>{g.inscritos}/{g.minimo}</b>
                  <button onClick={() => hacer(() => save('grupos', { id: g.id, inscritos: g.inscritos + 1 }), 'Inscritos actualizados')} aria-label="Más">+</button>
                </div>
                <select aria-label="Estado" value={g.estado} onChange={(e) => hacer(() => save('grupos', { id: g.id, estado: e.target.value }), 'Estado guardado')} className={`est ${g.estado}`}>
                  <option value="abierto">Abierto</option><option value="lleno">Lleno</option><option value="cerrado">Cerrado</option>
                </select>
                <button className="btn btn-line sm" onClick={() => editarGrupo(g)}>Editar</button>
                <button className="ib red" onClick={() => setBorrando(g)} aria-label="Borrar">🗑</button>
              </div>
            </div>
          )
        })}
      </div>
      {borrando && (
        <Confirmar texto="¿Borrar este grupo?" onNo={() => setBorrando(null)}
          onSi={() => { const g = borrando; setBorrando(null); hacer(() => remove('grupos', g.id), 'Grupo borrado') }} />
      )}
    </>
  )
}

/* ================= ENLACES (/links) ================= */
function EnlaceForm({ inicial, total, onSave, onClose }) {
  const [f, setF] = useState({ titulo: '', subtitulo: '', url: '', tipo: 'enlace', destacado: false, activo: true, ...inicial })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  async function guardar() {
    if (!f.titulo.trim()) { setErr('Ponle un título al botón.'); return }
    if (f.tipo === 'enlace' && !f.url.trim()) { setErr('Pega el enlace de destino.'); return }
    let url = f.url.trim()
    if (f.tipo === 'enlace' && !/^(https?:\/\/|\/)/i.test(url)) url = 'https://' + url
    setBusy(true)
    try { await onSave({ ...f, titulo: f.titulo.trim(), subtitulo: f.subtitulo.trim(), url: f.tipo === 'whatsapp' ? '' : url, orden: f.id ? f.orden : total + 1 }) }
    catch (e) { setErr(e.message); setBusy(false) }
  }
  return (
    <Drawer titulo={f.id ? 'Editar enlace' : 'Nuevo enlace'} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" disabled={busy} onClick={guardar}>{busy ? 'Guardando…' : 'Guardar'}</button></>}>
      <div className="fs">
        <label>Título del botón<input value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="INSTAGRAM" /></label>
        <label>Texto pequeño (opcional)<input value={f.subtitulo} onChange={(e) => set('subtitulo', e.target.value)} placeholder="@ccn.peru" /></label>
        <div className="seg two" role="radiogroup" aria-label="Tipo">
          <button type="button" className={f.tipo === 'enlace' ? 'sel' : ''} onClick={() => set('tipo', 'enlace')}>Enlace</button>
          <button type="button" className={f.tipo === 'whatsapp' ? 'sel' : ''} onClick={() => set('tipo', 'whatsapp')}>WhatsApp de CCN</button>
        </div>
        {f.tipo === 'enlace'
          ? <label>Hacia dónde va<input value={f.url} onChange={(e) => set('url', e.target.value)} placeholder="https://instagram.com/tuusuario  o  /cursos" /></label>
          : <p className="note">Abre un chat con el WhatsApp configurado en Ajustes.</p>}
        <label className="inl"><Switch on={f.destacado} label="Destacado" onChange={(v) => set('destacado', v)} /> Destacado (botón oscuro)</label>
        <label className="inl"><Switch on={f.activo} label="Visible" onChange={(v) => set('activo', v)} /> Visible en la página</label>
        {err && <p className="err">{err}</p>}
      </div>
    </Drawer>
  )
}

function Enlaces({ data, hacer }) {
  const [editando, setEditando] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const lista = [...(data.enlaces || [])].sort((a, b) => a.orden - b.orden)
  const mover = (i, d) => {
    const j = i + d
    if (j < 0 || j >= lista.length) return
    const a = lista[i], b = lista[j]
    hacer(async () => { await save('enlaces', { id: a.id, orden: b.orden }); await save('enlaces', { id: b.id, orden: a.orden }) }, 'Orden guardado')
  }
  return (
    <>
      <Seccion titulo="Enlaces" ayuda="Los botones de tu página /links (para poner en la biografía de Instagram, TikTok, etc.).">
        <a className="btn btn-line" href="/links" target="_blank" rel="noopener noreferrer">Ver página ↗</a>
        <button className="btn btn-teal" onClick={() => setEditando({})}>+ Nuevo enlace</button>
      </Seccion>
      {lista.length === 0 && <div className="vacio"><p>Aún no hay enlaces.</p><button className="btn btn-teal" onClick={() => setEditando({})}>Crear el primero</button></div>}
      <div className="lk-adm">
        {lista.map((e, i) => (
          <div className={`lk-row ${e.activo ? '' : 'off'}`} key={e.id}>
            <div className="nm">
              <b>{e.destacado && '★ '}{e.titulo}</b>
              <small>{e.tipo === 'whatsapp' ? 'WhatsApp de CCN' : e.url} · {e.clics || 0} clics</small>
            </div>
            <Switch on={e.activo} label={`Visible: ${e.titulo}`} onChange={(v) => hacer(() => save('enlaces', { id: e.id, activo: v }), v ? 'Enlace visible' : 'Enlace oculto')} />
            <button className="btn btn-line sm" onClick={() => setEditando(e)}>Editar</button>
            <button className="ib" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
            <button className="ib" onClick={() => mover(i, 1)} disabled={i === lista.length - 1} aria-label="Bajar">↓</button>
            <button className="ib red" onClick={() => setBorrando(e)} aria-label="Borrar">🗑</button>
          </div>
        ))}
      </div>
      {editando && (
        <EnlaceForm inicial={editando} total={lista.length} onClose={() => setEditando(null)}
          onSave={async (row) => { await save('enlaces', row); setEditando(null); await hacer(async () => {}, editando.id ? 'Enlace guardado' : 'Enlace creado') }} />
      )}
      {borrando && (
        <Confirmar texto={`¿Borrar "${borrando.titulo}"?`} onNo={() => setBorrando(null)}
          onSi={() => { const e = borrando; setBorrando(null); hacer(() => remove('enlaces', e.id), 'Enlace borrado') }} />
      )}
    </>
  )
}

/* ================= AJUSTES ================= */
function Ajustes({ data, hacer }) {
  const [num, setNum] = useState(data.ajustes?.whatsapp || '')
  useEffect(() => { setNum(data.ajustes?.whatsapp || '') }, [data.ajustes?.whatsapp])
  const limpio = num.replace(/\D/g, '')
  const valido = limpio.length >= 10
  return (
    <>
      <Seccion titulo="Ajustes" ayuda="Lo único que se cambia aquí es el WhatsApp al que llegan todos los mensajes de la web." />
      <div className="fs" style={{ maxWidth: 520 }}>
        <label>WhatsApp de CCN
          <input id="a-wa" inputMode="tel" value={num} onChange={(e) => setNum(e.target.value)} placeholder="51931330058" />
        </label>
        <p className="note">Con código de país y sin espacios. Ejemplo: 51931330058. Se verá como <b>{valido ? `+${limpio.length === 11 && limpio.startsWith('51') ? `51 ${limpio.slice(2, 5)} ${limpio.slice(5, 8)} ${limpio.slice(8)}` : limpio}` : '…'}</b>.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-teal" disabled={!valido}
            onClick={() => hacer(async () => { await saveAjuste('whatsapp', limpio); setNumero(limpio) }, 'WhatsApp guardado')}>Guardar</button>
          {valido && <a className="btn btn-line" href={`https://wa.me/${limpio}`} target="_blank" rel="noopener noreferrer">Probar el número</a>}
        </div>
      </div>
    </>
  )
}

/* ================= PANEL ================= */
function Panel({ email, onSalir }) {
  const [tab, setTab] = useState('cursos')
  const [data, setData] = useState({ cursos: [], grupos: [], enlaces: [], ajustes: {} })
  const [grupoForm, setGrupoForm] = useState(null)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const avisar = (texto, error) => {
    clearTimeout(timer.current)
    setToast({ texto, error })
    timer.current = setTimeout(() => setToast(null), 2600)
  }
  const recargar = () => loadAll().then(setData)
  useEffect(() => { recargar().catch((e) => avisar(e.message, true)) }, [])

  /* ejecuta un cambio, recarga y avisa */
  const hacer = async (fn, ok) => {
    try { await fn(); await recargar(); avisar(ok) } catch (e) { avisar(e.message || 'No se pudo guardar', true) }
  }
  const abrirGrupo = (cursoId) => setGrupoForm({ curso_id: cursoId })
  const abiertos = data.grupos.filter((g) => g.estado === 'abierto' && g.activo).length
  const items = [['cursos', 'Cursos', data.cursos.length], ['grupos', 'Horarios', abiertos], ['enlaces', 'Enlaces', (data.enlaces || []).length], ['ajustes', 'Ajustes', null]]

  return (
    <div className="shell">
      <aside className="side">
        <Link className="logo" to="/">CC<i>N</i></Link>
        <small className="sidetag">Panel de administración</small>
        <div className="snav" role="tablist" aria-label="Secciones">
          {items.map(([k, nombre, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {nombre}{n !== null && <em>{n}</em>}
            </button>
          ))}
        </div>
        <div className="sidefoot">
          {email && <span>{email}</span>}
          <Link to="/">Ver la web ↗</Link>
          {hasBackend && <button onClick={onSalir}>Salir</button>}
        </div>
      </aside>

      <main className="main">
        {!hasBackend && (
          <p className="banner">Modo demostración: lo que cambies se guarda solo en este navegador. Para usarlo de verdad, conecta Supabase (mira el README).</p>
        )}
        {tab === 'cursos' && <Cursos data={data} hacer={hacer} abrirGrupo={abrirGrupo} />}
        {tab === 'grupos' && <Grupos data={data} hacer={hacer} abrirGrupo={abrirGrupo} editarGrupo={setGrupoForm} />}
        {tab === 'enlaces' && <Enlaces data={data} hacer={hacer} />}
        {tab === 'ajustes' && <Ajustes data={data} hacer={hacer} />}
      </main>

      {grupoForm && (
        <GrupoForm inicial={grupoForm} cursos={data.cursos} onClose={() => setGrupoForm(null)}
          onSave={async (row) => { await save('grupos', row); setGrupoForm(null); await hacer(async () => {}, grupoForm.id ? 'Grupo guardado' : 'Grupo publicado'); setTab('grupos') }} />
      )}
      {toast && <div className={`toast ${toast.error ? 'bad' : ''}`} role="status">{toast.error ? '⚠ ' : '✓ '}{toast.texto}</div>}
    </div>
  )
}

/* ================= LOGIN ================= */
function Login({ onOk }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function entrar(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr('Correo o contraseña incorrectos.'); setBusy(false); return }
    onOk()
  }
  return (
    <div className="login">
      <form className="card-a" onSubmit={entrar}>
        <Link className="logo" to="/">CC<i>N</i></Link>
        <h2>Panel de administración</h2>
        <label>Correo<input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Contraseña<input id="pass" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-teal" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  )
}

export default function Admin() {
  const [estado, setEstado] = useState(hasBackend ? 'cargando' : 'ok')
  const [email, setEmail] = useState('')
  async function revisar() {
    if (!hasBackend) return
    const { data } = await supabase.auth.getSession()
    const mail = data.session?.user?.email
    if (!mail) { setEstado('login'); return }
    setEmail(mail)
    setEstado((await esAdmin(mail)) ? 'ok' : 'sinpermiso')
  }
  useEffect(() => { revisar() }, [])
  async function salir() { await supabase.auth.signOut(); setEstado('login'); setEmail('') }

  if (estado === 'cargando') return <div className="login"><p className="note">Cargando…</p></div>
  if (estado === 'login') return <Login onOk={revisar} />
  if (estado === 'sinpermiso') return (
    <div className="login"><div className="card-a">
      <h2>Sin permiso</h2>
      <p className="note">{email} no está en la lista de administradores.</p>
      <button className="btn btn-line" onClick={salir}>Salir</button>
    </div></div>
  )
  return <Panel email={email} onSalir={salir} />
}
