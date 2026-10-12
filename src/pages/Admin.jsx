import { useEffect, useMemo, useRef, useState } from 'react'
import AvanceVendedor from './AvanceVendedor'
import { PUESTOS, SUELDO_DEF, TARIFA_HORA_DEF, TRAMOS_DEF, tramosDe, metricasVendedor, metricasProfesor, nombreGrupoWa, gruposSinWhatsapp, AVISO_INSTALACION, PROGRAMAS, ESTADOS_INSTALACION, programaSugerido, errorHorarioInstalacion, choqueInstalacion, horaCorta, hora12 } from '../lib/ventas'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Layout.jsx'
import {
  hasBackend, supabase, loadAll, save, remove, saveAjuste, getRol, fechaCorta, subirImagen, telefono, setNumero, COLORES, MAX_INICIO, consultasCSV, interesadosCSV, marcarConsulta,
  subirComprobante, urlComprobante, crearInscripcion, agregarPago, estadoInscripcion, borrarInscripcion, armarInscripciones, inscritosCSV, guardarMiembro, quitarMiembro, ROLES, seguimientoInteresado, reasignarInteresado, recibeInteresados, guardarProspecto, borrarProspecto, guardarTrabajador, guardarWhatsapp, asignarGrupo, pagarTrabajador, guardarInstalacion, ESTADOS_PROSPECTO, ORIGENES,
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
          <label>Precio actual en S/ (con descuento)<input id="c-precio" type="number" min="0" value={f.precio} onChange={(e) => set('precio', e.target.value)} /></label>
          <label>Precio real en S/ (se muestra tachado, opcional)<input id="c-antes" type="number" min="0" value={f.precio_antes} onChange={(e) => set('precio_antes', e.target.value)} placeholder="Ej. 510 · déjalo vacío si no hay descuento" /></label>
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
          <div><span className="lbl">Inscritos</span><b style={{ fontSize: '1.3rem' }}>{f.inscritos}</b><p className="note">Se cuenta solo desde Inscritos.</p></div>
          <label>Mínimo para abrir<input id="g-min" type="number" min="1" value={f.minimo} onChange={(e) => set('minimo', e.target.value)} /></label>
        </div>
        <div className="sline"><span>Mostrar "{f.inscritos} de {f.minimo}" en la web</span><Switch on={f.mostrar_inscritos} onChange={(v) => set('mostrar_inscritos', v)} label="Mostrar inscritos" /></div>
        <div className="sline"><span>Visible en la web</span><Switch on={f.activo} onChange={(v) => set('activo', v)} label="Visible" /></div>
      </section>
    </Drawer>
  )
}

/* ================= INSTALACIONES (agenda de instalaciones remotas) ================= */
const sinT = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
function InstalacionForm({ data, inicial, onClose, onSave }) {
  const [q, setQ] = useState('')
  const [f, setF] = useState({ alumno_id: '', grupo_id: '', grupo_codigo: '', curso_titulo: '', programa: '', fecha: '', hora: '', nota: '', ...inicial })
  const [err, setErr] = useState('')
  const alum = new Map((data.alumnos || []).map((a) => [a.id, a]))
  const opciones = useMemo(() => (data.matriculas || []).filter((m) => m.estado === 'activa' && alum.get(m.alumno_id)).map((m) => {
    const a = alum.get(m.alumno_id)
    return { m, a, txt: sinT(`${a.codigo || ''} ${a.nombres} ${a.apellido_paterno} ${a.apellido_materno} ${a.documento} ${a.celular} ${m.grupo_codigo} ${m.curso_titulo}`) }
  }), [data.matriculas, data.alumnos])
  const res = q.trim().length >= 2 ? opciones.filter((o) => sinT(q).split(/\s+/).every((w) => o.txt.includes(w))).slice(0, 8) : []
  const al = f.alumno_id ? alum.get(f.alumno_id) : null
  const grupo = data.grupos.find((g) => String(g.id) === String(f.grupo_id))
  const limite = grupo?.inicio ? new Date(new Date(grupo.inicio + 'T00:00:00').getTime() - 3 * 864e5).toISOString().slice(0, 10) : ''
  const errHora = f.fecha && f.hora ? errorHorarioInstalacion(f.fecha, f.hora) : ''
  const choque = f.fecha && f.hora ? choqueInstalacion(data.instalaciones || [], f.fecha, f.hora, f.id) : null
  const tarde = limite && f.fecha && f.fecha > limite
  const elegir = (o) => { setF({ ...f, alumno_id: o.a.id, grupo_id: o.m.grupo_id, grupo_codigo: o.m.grupo_codigo, curso_titulo: o.m.curso_titulo, programa: f.programa || programaSugerido(o.m.curso_titulo) }); setQ('') }
  const guardar = () => {
    if (!f.alumno_id) return setErr('Busca y elige al alumno.')
    if (!f.programa) return setErr('Elige el programa a instalar.')
    const e = errorHorarioInstalacion(f.fecha, f.hora)
    if (e && !(f.id && f.estado !== 'agendada')) return setErr(e)
    if (choque) return setErr(`Ya hay una instalación a las ${hora12(choque.hora)} ese día.`)
    setErr(''); onSave(f)
  }
  return (
    <Drawer titulo={f.id ? 'Editar instalación' : 'Nueva instalación'} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={guardar}>Guardar</button></>}>
      <div className="fs">
        <p className="banner aviso-inst">🕖 <b>Horarios disponibles:</b> {AVISO_INSTALACION}</p>
        {al ? (
          <div className="alsel"><b>{al.nombres} {al.apellido_paterno} {al.apellido_materno}</b><small>{al.codigo || al.documento} · {f.grupo_codigo} · {f.curso_titulo}</small>
            {!f.id && <button type="button" className="link" onClick={() => setF({ ...f, alumno_id: '', grupo_id: '', grupo_codigo: '', curso_titulo: '' })}>Cambiar alumno</button>}</div>
        ) : (
          <>
            <label>Alumno (busca por código 2026-000-10-678, nombre, celular o código del grupo)
              <input id="in-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. 2026-003-10-678, Ana o G01" autoComplete="off" />
            </label>
            {q.trim().length >= 2 && res.length === 0 && <p className="note">No hay alumnos con esa búsqueda. Primero hay que inscribirlo en Inscritos.</p>}
            {res.length > 0 && <ul className="resbusq">{res.map((o) => <li key={o.m.id}><button type="button" onClick={() => elegir(o)}><b>{o.a.nombres} {o.a.apellido_paterno}</b><small>{o.a.codigo || o.a.documento} · {o.m.grupo_codigo} · {o.m.curso_titulo}</small></button></li>)}</ul>}
          </>
        )}
        <label>Programa a instalar
          <select id="in-prog" value={f.programa} onChange={(e) => setF({ ...f, programa: e.target.value })}>
            <option value="">Elegir…</option>{PROGRAMAS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <div className="g2">
          <label>Fecha<input id="in-fecha" type="date" value={f.fecha} onChange={(e) => { setErr(''); setF({ ...f, fecha: e.target.value }) }} /></label>
          <label>Hora de inicio<input id="in-hora" type="time" step="900" value={f.hora} onChange={(e) => { setErr(''); setF({ ...f, hora: e.target.value }) }} /></label>
        </div>
        {errHora && <p className="err-inst">⚠ {errHora}</p>}
        {choque && <p className="err-inst">⚠ Ya hay otra instalación a las {hora12(choque.hora)} ese día.</p>}
        {grupo?.inicio && <p className={tarde ? 'err-inst' : 'note'}>{tarde ? '⚠ ' : ''}El curso empieza el {fechaCorta(grupo.inicio)}. Lo ideal es dejar todo instalado hasta 3 días antes ({fechaCorta(limite)}).</p>}
        <label>Nota<input value={f.nota || ''} onChange={(e) => setF({ ...f, nota: e.target.value })} placeholder="Ej. Pidió AnyDesk, tiene Windows 11" /></label>
        {err && <p className="err-inst" role="alert">{err}</p>}
      </div>
    </Drawer>
  )
}

function Instalaciones({ data, hacer, gerente }) {
  const [form, setForm] = useState(null)
  const [ver, setVer] = useState('proximas')
  const [borrando, setBorrando] = useState(null)
  const hoy = new Date().toISOString().slice(0, 10)
  const alum = new Map((data.alumnos || []).map((a) => [a.id, a]))
  const todas = data.instalaciones || []
  const lista = todas.filter((x) => ver === 'todas' ? true : ver === 'proximas' ? x.estado === 'agendada' && x.fecha >= hoy : x.estado === ver)
  const ordenadas = [...lista].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
  const dia = (f) => new Date(f + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  const prox = todas.filter((x) => x.estado === 'agendada' && x.fecha >= hoy).length
  return (
    <>
      <Seccion titulo="Instalaciones" ayuda="Agenda de las instalaciones remotas de programas (Photoshop, Illustrator, Office). Se hacen después de la inscripción.">
        <button className="btn btn-teal" onClick={() => setForm({})}>+ Nueva instalación</button>
      </Seccion>
      <p className="banner aviso-inst">🕖 <b>Las instalaciones solo se programan en estos horarios:</b> {AVISO_INSTALACION}</p>
      {data.instalacionesError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. Mensaje: {data.instalacionesError}</p>}
      <div className="kpis">
        <div><b>{prox}</b><span>próximas agendadas</span></div>
        <div><b>{todas.filter((x) => x.estado === 'hecha').length}</b><span>hechas</span></div>
        <div><b>{todas.filter((x) => x.estado === 'agendada' && x.fecha < hoy).length}</b><span>vencidas sin marcar</span></div>
      </div>
      <div className="filtros">
        <label>Mostrar
          <select id="in-ver" value={ver} onChange={(e) => setVer(e.target.value)}>
            <option value="proximas">Próximas</option><option value="todas">Todas</option>{Object.entries(ESTADOS_INSTALACION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      {ordenadas.length === 0 && <div className="vacio"><p>{todas.length ? 'No hay instalaciones en este filtro.' : 'Aún no hay instalaciones. Agrega la primera.'}</p>{!todas.length && <button className="btn btn-teal" onClick={() => setForm({})}>+ Nueva instalación</button>}</div>}
      {ordenadas.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table insc">
            <thead><tr><th>Fecha</th><th>Hora</th><th>Alumno</th><th>Curso</th><th>Programa</th>{gerente && <th>Agendó</th>}<th>Estado</th><th>Nota</th><th /></tr></thead>
            <tbody>
              {ordenadas.map((x) => {
                const a = alum.get(x.alumno_id) || {}
                return (
                  <tr key={x.id} className={x.estado === 'agendada' && x.fecha < hoy ? 'nueva' : x.estado === 'cancelada' ? 'anulada' : ''}>
                    <td><b>{dia(x.fecha)}</b></td>
                    <td>{hora12(x.hora)}</td>
                    <td><b>{a.nombres} {a.apellido_paterno}</b>{a.codigo && <small className="paq"><span className="cod">{a.codigo}</span></small>}{a.celular && <small className="paq"><a href={wa(a.celular)} target="_blank" rel="noopener noreferrer">{a.celular}</a></small>}</td>
                    <td><span className="cod">{x.grupo_codigo}</span><small className="paq">{x.curso_titulo}</small></td>
                    <td>{x.programa}</td>
                    {gerente && <td>{(x.vendedor || '').split('@')[0]}</td>}
                    <td><select aria-label={`Estado de la instalación de ${a.nombres}`} value={x.estado} onChange={(e) => hacer(() => guardarInstalacion({ ...x, estado: e.target.value }), 'Estado guardado')}>{Object.entries(ESTADOS_INSTALACION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                    <td className="notas">{x.nota || '—'}</td>
                    <td className="acc">
                      <button className="btn btn-line sm" onClick={() => setForm(x)}>Editar</button>
                      <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar">🗑</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {form && <InstalacionForm data={data} inicial={form} onClose={() => setForm(null)} onSave={(f) => hacer(async () => { await guardarInstalacion(f); setForm(null) }, f.id ? 'Instalación actualizada' : 'Instalación agendada')} />}
      {borrando && <Confirmar texto="¿Borrar esta instalación?" onNo={() => setBorrando(null)} onSi={() => { const x = borrando; setBorrando(null); hacer(() => remove('instalaciones', x.id), 'Instalación borrada') }} />}
    </>
  )
}

/* ================= GRUPO DE WHATSAPP (lo registra ventas) ================= */
function WhatsappForm({ g, curso, actual, onClose, onSave }) {
  const sugerido = nombreGrupoWa(g, curso)
  const [f, setF] = useState({ nombre: actual?.nombre || sugerido, enlace: actual?.enlace || '' })
  return (
    <Drawer titulo={`WhatsApp · ${g.codigo}`} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={() => onSave(f)}>Guardar</button></>}>
      <div className="fs">
        <p className="note"><b>{curso?.titulo}</b> · {g.inicio ? fechaCorta(g.inicio) : 'sin fecha'} · {g.dias || 'días por definir'} · {g.horario || 'horario por definir'}</p>
        <label>Nombre del grupo en WhatsApp
          <input id="wa-nom" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
        </label>
        <p className="note">Formato: CÓDIGO-DÍAS-CURSO-HORA-FECHA. Puedes corregirlo antes de crear el grupo.{f.nombre !== sugerido && <> <button type="button" className="link" onClick={() => setF({ ...f, nombre: sugerido })}>Volver al sugerido</button></>}</p>
        <label>Enlace de invitación
          <input id="wa-link" value={f.enlace} onChange={(e) => setF({ ...f, enlace: e.target.value })} placeholder="https://chat.whatsapp.com/…" />
        </label>
        <p className="note">Crea el grupo en WhatsApp, copia el enlace de invitación y pégalo aquí. Solo lo ve el equipo.</p>
      </div>
    </Drawer>
  )
}

function Grupos({ data, hacer, abrirGrupo, editarGrupo, soloLeer }) {
  const [borrando, setBorrando] = useState(null)
  const nombre = (id) => data.cursos.find((c) => c.id === id)
  const lista = [...data.grupos].sort((a, b) => (b.inicio || '9999').localeCompare(a.inicio || '9999'))
  const [wa, setWa] = useState(null)
  const waDe = (g) => (data.gruposWa || []).find((w) => String(w.grupo_id) === String(g.id))
  const faltan = gruposSinWhatsapp(data)
  return (
    <>
      <Seccion titulo={soloLeer ? 'Grupos' : 'Horarios'} ayuda={soloLeer ? 'Los grupos abiertos con su código, fecha y cupos. Los inscritos se cuentan solos desde la sección Inscritos.' : 'Cada grupo es una vez que abre un curso. Sale en la tarjeta del curso y en la tabla de horarios de la web. Los inscritos se cuentan solos desde la sección Inscritos.'}>
        {!soloLeer && <button className="btn btn-teal" onClick={() => abrirGrupo('')}>+ Abrir grupo</button>}
      </Seccion>
      {faltan.length > 0 && (
        <div className="alertas">
          <p className="alerta">⚠ <b>{faltan.length} grupo{faltan.length === 1 ? '' : 's'} sin grupo de WhatsApp.</b> Hay que crearlo y registrarlo aquí apenas se abre el curso: {faltan.map((g) => g.codigo).join(', ')}.</p>
        </div>
      )}
      {data.gruposWaError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase (sección de WhatsApp). Mensaje: {data.gruposWaError}</p>}
      {lista.length === 0 && soloLeer && <div className="vacio"><p>Aún no hay grupos abiertos.</p></div>}
      {lista.length === 0 && !soloLeer && <div className="vacio"><p>Aún no hay grupos. Cuando abras uno, sale en la tarjeta del curso y en la tabla de horarios.</p><button className="btn btn-teal" onClick={() => abrirGrupo('')}>Abrir el primero</button></div>}
      <div className="lst">
        {lista.map((g) => {
          const c = nombre(g.curso_id)
          return (
            <div className="item" key={g.id}>
              <div className="tt">
                <span className="sw" style={{ background: c ? `var(--${c.color})` : 'var(--line)' }} />
                <div>
                  <b>{g.codigo && <span className="cod">{g.codigo}</span>}{c?.titulo || 'Curso eliminado'}</b>
                  <small>{g.inicio ? fechaCorta(g.inicio) : 'Sin fecha'} · {g.dias || 'días por definir'} · {g.horario || 'horario por definir'}</small>
                  {g.codigo && (waDe(g)
                    ? <small className="wa ok">✓ WhatsApp: <a href={waDe(g).enlace} target="_blank" rel="noopener noreferrer">{waDe(g).nombre}</a>{waDe(g).creado_por && <> · {waDe(g).creado_por.split('@')[0]}</>}</small>
                    : <small className="wa falta">⚠ Falta crear el grupo de WhatsApp</small>)}
                </div>
              </div>
              <div className="btns">
                {g.codigo && <button className={`btn sm ${waDe(g) ? 'btn-line' : 'btn-teal'}`} onClick={() => setWa(g)}>{waDe(g) ? 'WhatsApp' : '+ Registrar WhatsApp'}</button>}
                <span className="cupos" title="Se cuenta solo desde Inscritos"><b>{g.inscritos}</b>/{g.minimo} <small>mín.</small></span>
                {soloLeer ? <span className={`est ${g.estado}`}>{g.estado === 'abierto' ? 'Abierto' : g.estado === 'lleno' ? 'Lleno' : 'Cerrado'}</span> : <>
                <select aria-label="Estado" value={g.estado} onChange={(e) => hacer(() => save('grupos', { id: g.id, estado: e.target.value }), 'Estado guardado')} className={`est ${g.estado}`}>
                  <option value="abierto">Abierto</option><option value="lleno">Lleno</option><option value="cerrado">Cerrado</option>
                </select>
                <button className="btn btn-line sm" onClick={() => editarGrupo(g)}>Editar</button>
                <button className="ib red" onClick={() => setBorrando(g)} aria-label="Borrar">🗑</button></>}
              </div>
            </div>
          )
        })}
      </div>
      {wa && <WhatsappForm g={wa} curso={nombre(wa.curso_id)} actual={waDe(wa)} onClose={() => setWa(null)}
        onSave={(f) => hacer(async () => { await guardarWhatsapp({ grupo_id: wa.id, ...f }); setWa(null) }, 'Grupo de WhatsApp registrado')} />}
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

/* ================= CONSULTAS (formulario de la web) ================= */
function Consultas({ data, hacer, tabla = 'consultas', onInscribir, rolG = true }) {
  const esInt = tabla === 'interesados'
  const lista = data[tabla] || []
  const errTabla = esInt ? data.interesadosError : data.consultasError
  const [ver, setVer] = useState('todas')
  const [borrando, setBorrando] = useState(null)
  const nuevas = lista.filter((x) => x.estado === 'nuevo').length
  const mostrar = ver === 'nuevas' ? lista.filter((x) => x.estado === 'nuevo') : lista
  const bajar = () => {
    const blob = new Blob([(esInt ? interesadosCSV : consultasCSV)(lista)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${tabla}-ccn-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const cuando = (iso) => iso ? new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <>
      <Seccion titulo={esInt ? 'Interesados' : 'Consultas'} ayuda={esInt ? 'Aquí llegan las personas que se inscriben desde la página de cada curso (antes de seguir por WhatsApp). Solo las ve el equipo de CCN. Puedes descargarlas en Excel.' : 'Aquí llegan las solicitudes del formulario de la web. Solo las ve el equipo de CCN. Puedes descargarlas en Excel.'}>
        <button className="btn btn-line" onClick={() => setVer(ver === 'todas' ? 'nuevas' : 'todas')}>{ver === 'todas' ? `Ver solo nuevas (${nuevas})` : 'Ver todas'}</button>
        <button className="btn btn-teal" onClick={bajar} disabled={!lista.length}>Descargar Excel</button>
      </Seccion>
      {errTabla && hasBackend && (
        <p className="banner">Falta crear la tabla de {esInt ? 'interesados' : 'consultas'} en Supabase (paso del SQL). Mensaje: {errTabla}</p>
      )}
      {mostrar.length === 0 && !errTabla && <div className="vacio"><p>{lista.length ? (esInt ? 'No hay interesados nuevos.' : 'No hay solicitudes nuevas.') : (esInt ? 'Aún no se inscribe nadie.' : 'Aún no llega ninguna solicitud.')}</p></div>}
      {mostrar.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table">
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Documento</th><th>Celular</th><th>Email</th>{!esInt && <th>Modalidad</th>}<th>Curso</th><th>{esInt ? 'Contactado' : 'Atendida'}</th>{esInt && onInscribir && <th />}<th /></tr></thead>
            <tbody>
              {mostrar.map((x) => (
                <tr key={x.id} className={x.estado === 'nuevo' ? 'nueva' : ''}>
                  <td>{cuando(x.creado)}</td>
                  <td><b>{x.nombres} {x.apellido_paterno} {x.apellido_materno}</b></td>
                  <td>{x.tipo_doc} {x.documento}</td>
                  <td><a href={`https://wa.me/${String(x.celular).replace(/\D/g, '').replace(/^(\d{9})$/, '51$1')}`} target="_blank" rel="noopener noreferrer">{x.celular}</a></td>
                  <td>{x.email}</td>
                  {!esInt && <td>{x.modalidad}</td>}
                  <td>{esInt ? <>{x.curso}{x.lista_espera && <> <b>(lista de espera)</b></>}</> : (x.curso === 'Otro' ? `Otro: ${x.otro_tema}` : x.curso)}</td>
                  <td><Switch on={x.estado !== 'nuevo'} label={`Atendida: ${x.nombres}`} onChange={(v) => hacer(() => marcarConsulta(x.id, v ? 'atendida' : 'nuevo', tabla), v ? 'Marcado como atendido' : 'Marcado como nuevo')} /></td>
                  {esInt && onInscribir && <td><button className="btn btn-line sm" onClick={() => onInscribir(x)}>Inscribir</button></td>}
                  <td>{rolG && <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar">🗑</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {borrando && (
        <Confirmar texto={`¿Borrar el registro de ${borrando.nombres} ${borrando.apellido_paterno}?`} onNo={() => setBorrando(null)}
          onSi={() => { const x = borrando; setBorrando(null); hacer(() => remove(tabla, x.id), esInt ? 'Interesado borrado' : 'Solicitud borrada') }} />
      )}
    </>
  )
}

/* ================= INTERESADOS (vienen de la web; el vendedor los trabaja) ================= */
const wa = (n) => `https://wa.me/${String(n || '').replace(/\D/g, '').replace(/^(\d{9})$/, '51$1')}`
function FilaInteresado({ x, hacer, onInscribir, onProspecto, gerente, onBorrar, vendedoras }) {
  const [obs, setObs] = useState(x.observacion || '')
  useEffect(() => setObs(x.observacion || ''), [x.observacion])
  const cuando = (iso) => iso ? new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  const cont = x.estado !== 'nuevo'
  return (
    <tr className={cont ? '' : 'nueva'}>
      <td>{cuando(x.creado)}</td>
      <td><b>{x.nombres} {x.apellido_paterno} {x.apellido_materno}</b><small className="paq">{x.tipo_doc} {x.documento}{x.email && <> · {x.email}</>}</small></td>
      <td><a href={wa(x.celular)} target="_blank" rel="noopener noreferrer">{x.celular}</a></td>
      <td>{x.curso}{x.lista_espera && <small className="paq"><b>Lista de espera</b></small>}</td>
      {gerente && (
        <td>
          <select aria-label={`Derivado a, ${x.nombres}`} value={x.asignado_a || ''} onChange={(e) => hacer(() => reasignarInteresado(x.id, e.target.value), 'Reasignado')}>
            <option value="">Sin asignar</option>
            {vendedoras.map((v) => <option key={v} value={v}>{v.split('@')[0]}</option>)}
          </select>
          <small className="paq">{x.estado === 'nuevo' ? (x.asignado_a ? 'Derivado · pendiente' : 'Sin derivar') : `Atendido por ${(x.contactado_por || '').split('@')[0]}`}</small>
        </td>
      )}
      <td><Switch on={cont} label={`Contactado: ${x.nombres}`} onChange={(v) => hacer(() => seguimientoInteresado(x.id, { contactado: v }), v ? 'Marcado como contactado' : 'Marcado sin contactar')} />
        {cont && x.contactado_por && <small className="paq">{x.contactado_por.split('@')[0]} · {cuando(x.contactado_en)}</small>}</td>
      <td>
        <select aria-label={`¿Contestó? ${x.nombres}`} disabled={!cont} value={x.contesto === true ? 'si' : x.contesto === false ? 'no' : ''}
          onChange={(e) => hacer(() => seguimientoInteresado(x.id, { contesto: e.target.value === '' ? null : e.target.value === 'si' }), 'Guardado')}>
          <option value="">—</option><option value="si">Sí contestó</option><option value="no">No contestó</option>
        </select>
      </td>
      <td><input className="obs" aria-label={`Observación ${x.nombres}`} value={obs} placeholder="Observación…" disabled={!cont}
        onChange={(e) => setObs(e.target.value)} onBlur={() => obs !== (x.observacion || '') && hacer(() => seguimientoInteresado(x.id, { observacion: obs }), 'Observación guardada')} /></td>
      <td className="acc">
        <button className="btn btn-line sm" onClick={() => onInscribir(x)}>Inscribir</button>
        <button className="btn btn-line sm" onClick={() => onProspecto(x)}>→ Prospecto</button>
        {gerente && <button className="ib red" onClick={() => onBorrar(x)} aria-label="Borrar">🗑</button>}
      </td>
    </tr>
  )
}
function Interesados({ data, hacer, onInscribir, onProspecto, gerente }) {
  const [ver, setVer] = useState('todos')
  const [de, setDe] = useState('')
  const [borrando, setBorrando] = useState(null)
  const vendedoras = (data.equipo || []).filter((e) => e.rol === 'vendedora').map((e) => e.email)
  const lista = (data.interesados || []).filter((x) => !de || (de === '_' ? !x.asignado_a : x.asignado_a === de))
  const filtros = { todos: lista, sin: lista.filter((x) => x.estado === 'nuevo'), cont: lista.filter((x) => x.estado !== 'nuevo'), no: lista.filter((x) => x.estado !== 'nuevo' && x.contesto === false) }
  const mostrar = filtros[ver]
  const bajar = () => {
    const blob = new Blob([interesadosCSV(lista)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `interesados-ccn-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <>
      <Seccion titulo="Interesados" ayuda={gerente ? "Cada interesado de la web se deriva solo a una vendedora. Aquí ves a quién, si ya fue atendido y quién lo atendió. Puedes reasignarlo." : "Los interesados que la web te derivó. Márcalos cuando los contactes, anota si contestaron y qué pasó."}>
        <button className="btn btn-line" onClick={bajar} disabled={!lista.length}>Descargar Excel</button>
      </Seccion>
      {data.interesadosError && hasBackend && <p className="banner">Falta crear la tabla de interesados en Supabase. Mensaje: {data.interesadosError}</p>}
      <div className="kpis">
        <div><b>{lista.length}</b><span>interesados</span></div>
        <div><b>{filtros.sin.length}</b><span>sin contactar</span></div>
        <div><b>{filtros.cont.length}</b><span>contactados</span></div>
        <div><b>{filtros.no.length}</b><span>no contestaron</span></div>
      </div>
      <div className="filtros">
        <label>Mostrar
          <select id="i-ver" value={ver} onChange={(e) => setVer(e.target.value)}>
            <option value="todos">Todos</option><option value="sin">Sin contactar</option><option value="cont">Contactados</option><option value="no">No contestaron</option>
          </select>
        </label>
        {gerente && (
          <label>Derivado a
            <select id="i-de" value={de} onChange={(e) => setDe(e.target.value)}>
              <option value="">Todos</option><option value="_">Sin asignar</option>{vendedoras.map((v) => <option key={v} value={v}>{v.split('@')[0]}</option>)}
            </select>
          </label>
        )}
      </div>
      {mostrar.length === 0 && !data.interesadosError && <div className="vacio"><p>{lista.length ? 'No hay interesados en este filtro.' : 'Aún no se inscribe nadie desde la web.'}</p></div>}
      {mostrar.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table insc">
            <thead><tr><th>Fecha</th><th>Interesado</th><th>Celular</th><th>Curso</th>{gerente && <th>Derivado a</th>}<th>Contactado</th><th>¿Contestó?</th><th>Observación</th><th /></tr></thead>
            <tbody>{mostrar.map((x) => <FilaInteresado key={x.id} x={x} hacer={hacer} onInscribir={onInscribir} onProspecto={onProspecto} gerente={gerente} onBorrar={setBorrando} vendedoras={vendedoras} />)}</tbody>
          </table>
        </div>
      )}
      {borrando && (
        <Confirmar texto={`¿Borrar el registro de ${borrando.nombres} ${borrando.apellido_paterno}?`} onNo={() => setBorrando(null)}
          onSi={() => { const x = borrando; setBorrando(null); hacer(() => remove('interesados', x.id), 'Interesado borrado') }} />
      )}
    </>
  )
}

/* ================= PROSPECTOS (base propia del vendedor) ================= */
function Prospectos({ data, hacer, gerente, inicial, onCerrarInicial }) {
  const [form, setForm] = useState(inicial || null)
  const [ver, setVer] = useState('')
  const [q, setQ] = useState('')
  const [borrando, setBorrando] = useState(null)
  const lista = (data.prospectos || []).filter((p) => (!ver || p.estado === ver) && (!q.trim() || `${p.nombres} ${p.celular} ${p.curso}`.toLowerCase().includes(q.trim().toLowerCase())))
  const hoy = new Date().toISOString().slice(0, 10)
  const todos = data.prospectos || []
  const activos = todos.filter((p) => !['inscrito', 'perdido'].includes(p.estado))
  const vencidos = activos.filter((p) => p.seguimiento && p.seguimiento <= hoy)
  const cerrar = () => { setForm(null); onCerrarInicial && onCerrarInicial() }
  const cambiar = (p, cambios) => hacer(() => guardarProspecto({ ...p, ...cambios }), 'Guardado')
  return (
    <>
      <Seccion titulo="Prospectos" ayuda={gerente ? 'La base de prospectos de cada vendedor.' : 'Tu base de prospectos: gente que conseguiste por WhatsApp, redes o referidos.'}>
        <button className="btn btn-teal" onClick={() => setForm({ nombres: '', celular: '', curso: '', origen: 'WhatsApp', estado: 'nuevo', seguimiento: '', notas: '' })}>+ Nuevo prospecto</button>
      </Seccion>
      {data.prospectosError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. Mensaje: {data.prospectosError}</p>}
      <div className="kpis">
        <div><b>{todos.length}</b><span>prospectos</span></div>
        <div><b>{activos.length}</b><span>en seguimiento</span></div>
        <div><b>{vencidos.length}</b><span>seguimientos de hoy o vencidos</span></div>
        <div><b>{todos.filter((p) => p.estado === 'inscrito').length}</b><span>inscritos</span></div>
      </div>
      <div className="filtros">
        <label>Estado
          <select id="p-est" value={ver} onChange={(e) => setVer(e.target.value)}>
            <option value="">Todos</option>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="buscar">Buscar<input id="p-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, celular o curso" /></label>
      </div>
      {lista.length === 0 && <div className="vacio"><p>{todos.length ? 'No hay prospectos con ese filtro.' : 'Aún no hay prospectos. Agrega el primero.'}</p></div>}
      {lista.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table insc">
            <thead><tr><th>Prospecto</th>{gerente && <th>Vendedor</th>}<th>Curso</th><th>Origen</th><th>Estado</th><th>Seguimiento</th><th>Notas</th><th /></tr></thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className={p.seguimiento && p.seguimiento <= hoy && !['inscrito', 'perdido'].includes(p.estado) ? 'nueva' : ''}>
                  <td><b>{p.nombres}</b>{p.celular && <small className="paq"><a href={wa(p.celular)} target="_blank" rel="noopener noreferrer">{p.celular}</a></small>}</td>
                  {gerente && <td>{(p.vendedor || '').split('@')[0]}</td>}
                  <td>{p.curso || '—'}</td>
                  <td>{p.origen}</td>
                  <td><select aria-label={`Estado de ${p.nombres}`} value={p.estado} onChange={(e) => cambiar(p, { estado: e.target.value })}>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                  <td><input type="date" aria-label={`Seguimiento de ${p.nombres}`} value={p.seguimiento || ''} onChange={(e) => cambiar(p, { seguimiento: e.target.value })} /></td>
                  <td className="notas">{p.notas || '—'}</td>
                  <td className="acc">
                    <button className="btn btn-line sm" onClick={() => setForm(p)}>Editar</button>
                    <button className="ib red" onClick={() => setBorrando(p)} aria-label="Borrar">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form && (
        <Drawer titulo={form.id ? 'Editar prospecto' : 'Nuevo prospecto'} onClose={cerrar}
          pie={<><button className="btn btn-line" onClick={cerrar}>Cancelar</button>
            <button className="btn btn-teal" onClick={() => hacer(async () => { await guardarProspecto(form); cerrar() }, 'Prospecto guardado')}>Guardar</button></>}>
          <div className="fs">
            <label>Nombre<input id="pr-nom" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} /></label>
            <label>Celular<input id="pr-cel" inputMode="tel" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} /></label>
            <label>Curso de interés
              <select id="pr-cur" value={form.curso} onChange={(e) => setForm({ ...form, curso: e.target.value })}>
                <option value="">Sin definir</option>{data.cursos.map((c) => <option key={c.id} value={c.titulo}>{c.titulo}</option>)}
              </select>
            </label>
            <div className="g2">
              <label>Origen<select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })}>{ORIGENES.map((o) => <option key={o}>{o}</option>)}</select></label>
              <label>Estado<select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            </div>
            <label>Próximo seguimiento<input type="date" value={form.seguimiento || ''} onChange={(e) => setForm({ ...form, seguimiento: e.target.value })} /></label>
            <label>Notas<textarea rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></label>
          </div>
        </Drawer>
      )}
      {borrando && (
        <Confirmar texto={`¿Borrar a ${borrando.nombres}?`} onNo={() => setBorrando(null)}
          onSi={() => { const p = borrando; setBorrando(null); hacer(() => borrarProspecto(p.id), 'Prospecto borrado') }} />
      )}
    </>
  )
}

/* ================= INSCRITOS (alumnos, matrículas y pagos) ================= */
const soles = (n) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const METODOS = ['Yape', 'Plin', 'Transferencia', 'Efectivo', 'Tarjeta', 'Otro']
const hoyISO = () => new Date().toISOString().slice(0, 10)
const nombreMes = (m) => m ? new Date(m + '-01T00:00:00').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }) : ''
const ESTADO_TXT = { pagado: 'Pagado', adelanto: 'Adelanto', pendiente: 'Sin pago', anulada: 'Anulada' }

function SubirComprobante({ ruta, onChange }) {
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

function Lightbox({ ruta, onClose }) {
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

function InscripcionForm({ inicial, data, onSave, onClose }) {
  const grupos = data.grupos.filter((g) => g.estado !== 'cerrado' && g.activo !== false)
    .sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'))
  const cursoDe = (id) => data.cursos.find((c) => String(c.id) === String(id))
  const [al, setAl] = useState({ tipo_doc: 'DNI', documento: '', nombres: '', apellido_paterno: '', apellido_materno: '', email: '', celular: '', ...(inicial.alumno || {}) })
  const [sel, setSel] = useState(inicial.grupo_id ? [String(inicial.grupo_id)] : [])
  const [paquete, setPaquete] = useState('')
  const [precio, setPrecio] = useState('')
  const [precioManual, setPrecioManual] = useState(false)
  const [fecha, setFecha] = useState(hoyISO())
  const [pago, setPago] = useState({ monto: '', metodo: 'Yape', fecha: hoyISO(), comprobante_url: '' })
  const [nota, setNota] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [encontrado, setEncontrado] = useState(false)
  const [codBusca, setCodBusca] = useState('')
  const setA = (k, v) => setAl((x) => ({ ...x, [k]: v }))

  const elegidos = sel.map((id) => grupos.find((g) => String(g.id) === id)).filter(Boolean)
  const sugerido = elegidos.reduce((t, g) => t + Number(cursoDe(g.curso_id)?.precio || 0), 0)
  useEffect(() => { if (!precioManual) setPrecio(sugerido ? String(sugerido) : '') }, [sugerido, precioManual])

  function buscarAlumno(doc) {
    const x = data.alumnos.find((a) => a.tipo_doc === al.tipo_doc && a.documento === doc.trim())
    if (x) { setAl({ ...al, ...x, documento: x.documento }); setEncontrado(true) } else setEncontrado(false)
  }
  const alternar = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function guardar() {
    const doc = al.documento.trim()
    if (!/^\d{8}$/.test(doc) && al.tipo_doc === 'DNI') { setErr('El DNI tiene 8 números.'); return }
    if (al.tipo_doc === 'CE' && doc.length < 8) { setErr('Revisa el carné de extranjería.'); return }
    if (al.nombres.trim().length < 2 || al.apellido_paterno.trim().length < 2) { setErr('Faltan los nombres o el apellido paterno.'); return }
    if (!elegidos.length) { setErr('Elige al menos un curso (grupo).'); return }
    const total = Number(precio)
    if (!(total >= 0) || precio === '') { setErr('Pon el precio acordado.'); return }
    const monto = Number(pago.monto) || 0
    if (monto > total + 0.005) { setErr('El pago no puede ser mayor que el precio.'); return }
    if (monto > 0 && pago.metodo !== 'Efectivo' && !pago.comprobante_url) { setErr('Sube la foto del comprobante del pago.'); return }
    setBusy(true); setErr('')
    try {
      await onSave({
        alumno: al, precioTotal: total, fecha, nota,
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
        {encontrado ? <p className="note ok">✓ Este alumno ya estaba registrado{al.codigo ? <> (código <b>{al.codigo}</b>)</> : ''}: se cargaron sus datos.</p> : <p className="note">Si es un alumno nuevo, el sistema le asigna un código único al guardar.</p>}
        <label>Nombres<input id="i-nom" value={al.nombres} onChange={(e) => setA('nombres', e.target.value)} /></label>
        <div className="g2">
          <label>Apellido paterno<input id="i-ap" value={al.apellido_paterno} onChange={(e) => setA('apellido_paterno', e.target.value)} /></label>
          <label>Apellido materno<input id="i-am" value={al.apellido_materno} onChange={(e) => setA('apellido_materno', e.target.value)} /></label>
        </div>
        <div className="g2">
          <label>Celular<input id="i-cel" inputMode="tel" value={al.celular} onChange={(e) => setA('celular', e.target.value)} /></label>
          <label>Correo<input id="i-mail" type="email" value={al.email} onChange={(e) => setA('email', e.target.value)} /></label>
        </div>
      </section>

      <section className="fs">
        <h3>Curso(s) y precio</h3>
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
        {elegidos.length > 1 && (
          <label>Nombre del paquete<input id="i-paq" value={paquete} onChange={(e) => setPaquete(e.target.value)} placeholder="Ej.: Club Ofimática" /></label>
        )}
        <label>Precio acordado {elegidos.length > 1 ? 'por todo el paquete' : ''} (S/)
          <input id="i-precio" type="number" min="0" step="0.01" value={precio} onChange={(e) => { setPrecio(e.target.value); setPrecioManual(true) }} />
        </label>
        {sugerido > 0 && Number(precio) !== sugerido && <p className="note">Precio de lista: {soles(sugerido)}. {Number(precio) < sugerido ? 'Estás dando descuento.' : ''}</p>}
        <label>Fecha de inscripción<input id="i-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
      </section>

      <section className="fs">
        <h3>Pago 1 <small>(déjalo vacío si aún no paga)</small></h3>
        <div className="g2">
          <label>Monto (S/)<input id="p-monto" type="number" min="0" step="0.01" value={pago.monto} onChange={(e) => setPago({ ...pago, monto: e.target.value })} /></label>
          <label>Método<select id="p-met" value={pago.metodo} onChange={(e) => setPago({ ...pago, metodo: e.target.value })}>{METODOS.map((m) => <option key={m}>{m}</option>)}</select></label>
        </div>
        <label>Fecha del pago<input id="p-fecha" type="date" value={pago.fecha} onChange={(e) => setPago({ ...pago, fecha: e.target.value })} /></label>
        <span className="lbl">Comprobante {pago.metodo === 'Efectivo' ? '(opcional)' : ''}</span>
        <SubirComprobante ruta={pago.comprobante_url} onChange={(r) => setPago({ ...pago, comprobante_url: r })} />
      </section>

      <section className="fs">
        <label>Nota (opcional)<textarea id="i-nota" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: paga el saldo el 20 de nov" /></label>
      </section>
    </Drawer>
  )
}

function PagoForm({ insc, onSave, onClose }) {
  const [p, setP] = useState({ monto: insc.saldo ? String(insc.saldo) : '', metodo: 'Yape', fecha: hoyISO(), comprobante_url: '', nota: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const a = insc.alumno || {}
  async function guardar() {
    const monto = Number(p.monto)
    if (!(monto > 0)) { setErr('Pon el monto del pago.'); return }
    if (monto > insc.saldo + 0.005) { setErr(`El pago no puede pasar del saldo (${soles(insc.saldo)}).`); return }
    if (p.metodo !== 'Efectivo' && !p.comprobante_url) { setErr('Sube la foto del comprobante.'); return }
    setBusy(true); setErr('')
    try { await onSave({ matriculas: insc.activas, pago: { ...p, monto } }) } catch (e) { setErr(e.message || 'No se pudo guardar'); setBusy(false) }
  }
  return (
    <Drawer titulo={`Pago ${insc.pagosLista.length + 1}`} onClose={onClose}
      pie={<>{err && <span className="err">{err}</span>}<button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={guardar} disabled={busy}>{busy ? 'Guardando…' : 'Registrar pago'}</button></>}>
      <section className="fs">
        <h3>{a.nombres} {a.apellido_paterno}</h3>
        <p className="note">{insc.codigos.join(' + ')} · Precio {soles(insc.precio)} · Pagado {soles(insc.pagado)} · <b>Saldo {soles(insc.saldo)}</b></p>
        <div className="g2">
          <label>Monto (S/)<input id="pp-monto" type="number" min="0" step="0.01" value={p.monto} onChange={(e) => setP({ ...p, monto: e.target.value })} /></label>
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

function Inscritos({ data, hacer, rol, nuevaInscripcion, registrarPago }) {
  const todas = useMemo(() => armarInscripciones(data), [data])
  const [mes, setMes] = useState('')
  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState('')
  const [q, setQ] = useState('')
  const [foto, setFoto] = useState('')
  const [borrando, setBorrando] = useState(null)
  const gerente = rol === 'gerente'
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
  const cobrado = vivas.reduce((t, x) => t + x.pagado, 0)
  const porCobrar = vivas.reduce((t, x) => t + x.saldo, 0)
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
        <div><b>{soles(cobrado)}</b><span>cobrado</span></div>
        <div><b>{soles(porCobrar)}</b><span>por cobrar</span></div>
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
                    <td>{soles(x.precio)}</td>
                    <td className="pagos">
                      {x.pagosLista.length === 0 && <small>—</small>}
                      {x.pagosLista.map((p, i) => (
                        <span key={i} className="pg">
                          <b>P{p.numero}</b> {soles(p.monto)} <small>{p.metodo}</small>
                          {p.comprobante_url && <button type="button" className="link" onClick={() => setFoto(p.comprobante_url)} aria-label={`Ver comprobante del pago ${p.numero}`}>📎</button>}
                        </span>
                      ))}
                    </td>
                    <td>{x.saldo > 0 && x.estado !== 'anulada' ? soles(x.saldo) : '—'}</td>
                    <td><span className={`pill ${x.estado}`}>{ESTADO_TXT[x.estado]}</span></td>
                    <td className="acc">
                      {x.estado !== 'anulada' && x.saldo > 0 && <button className="btn btn-line sm" onClick={() => registrarPago(x)}>+ Pago</button>}
                      {gerente && (x.estado === 'anulada'
                        ? <button className="btn btn-line sm" onClick={() => hacer(() => estadoInscripcion(x.id, 'activa'), 'Inscripción reactivada')}>Reactivar</button>
                        : <button className="btn btn-line sm" onClick={() => hacer(() => estadoInscripcion(x.id, 'anulada'), 'Inscripción anulada')}>Anular</button>)}
                      {gerente && <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar">🗑</button>}
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

/* ================= AJUSTES ================= */
function Ajustes({ data, hacer }) {
  const [num, setNum] = useState(data.ajustes?.whatsapp || '')
  useEffect(() => { setNum(data.ajustes?.whatsapp || '') }, [data.ajustes?.whatsapp])
  const limpio = num.replace(/\D/g, '')
  const valido = limpio.length >= 10
  return (
    <>
      <Seccion titulo="Ajustes" ayuda="Lo único que se cambia aquí es el número de WhatsApp de CCN que usa la web." />
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

/* ================= GERENCIA: RESUMEN ================= */
function Resumen({ data }) {
  const todas = useMemo(() => armarInscripciones(data), [data])
  const [mes, setMes] = useState('')
  const meses = [...new Set(todas.map((x) => x.mes).filter(Boolean))].sort().reverse()
  const vivas = todas.filter((x) => x.estado !== 'anulada' && (!mes || x.mes === mes))
  const vendido = vivas.reduce((t, x) => t + x.precio, 0)
  const cobrado = vivas.reduce((t, x) => t + x.pagado, 0)
  const porCobrar = vivas.reduce((t, x) => t + x.saldo, 0)
  const cupos = vivas.reduce((t, x) => t + x.activas.length, 0)
  const cursoDe = (id) => data.cursos.find((c) => String(c.id) === String(id))
  const hoy = new Date().toISOString().slice(0, 10)
  const en21 = new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10)

  const filas = data.grupos.filter((g) => g.codigo).sort((a, b) => a.codigo.localeCompare(b.codigo)).map((g) => {
    const ms = data.matriculas.filter((m) => String(m.grupo_id) === String(g.id) && m.estado === 'activa' && (!mes || String(m.fecha_inscripcion || '').slice(0, 7) === mes))
    const ids = new Set(ms.map((m) => m.id))
    const pagado = data.pagos.filter((p) => ids.has(p.matricula_id)).reduce((t, p) => t + Number(p.monto), 0)
    const precio = ms.reduce((t, m) => t + Number(m.precio), 0)
    return { g, c: cursoDe(g.curso_id), n: g.inscritos || 0, vendido: precio, cobrado: pagado, saldo: Math.max(0, precio - pagado) }
  })
  const alertas = data.grupos.filter((g) => g.estado === 'abierto' && g.inicio && g.inicio >= hoy && g.inicio <= en21 && (g.inscritos || 0) < (g.minimo || 10))
  const llenos = data.grupos.filter((g) => g.estado === 'lleno')
  const sinWa = gruposSinWhatsapp(data)
  const nuevos = (data.interesados || []).filter((x) => x.estado === 'nuevo').length
  const intMes = (data.interesados || []).filter((x) => !mes || String(x.creado || '').slice(0, 7) === mes)
  const correos = [...new Set([...(data.equipo || []).filter((e) => e.rol === 'vendedora').map((e) => e.email), ...vivas.map((x) => x.vendedor).filter(Boolean)])]
  const porVendedor = correos.map((email) => {
    const mias = vivas.filter((x) => x.vendedor === email)
    return { email, prospectos: (data.prospectos || []).filter((p) => p.vendedor === email).length,
      derivados: intMes.filter((x) => x.asignado_a === email).length,
      contactados: intMes.filter((x) => x.asignado_a === email && x.estado !== 'nuevo').length,
      cupos: mias.reduce((t, x) => t + x.activas.length, 0), vendido: mias.reduce((t, x) => t + x.precio, 0), cobrado: mias.reduce((t, x) => t + x.pagado, 0) }
  })

  return (
    <>
      <Seccion titulo="Resumen" ayuda="Cómo van las ventas, los cobros y los cupos de cada grupo. Solo lo ve gerencia.">
        <label className="mesel">Mes
          <select id="r-mes" value={mes} onChange={(e) => setMes(e.target.value)}>
            <option value="">Todos</option>{meses.map((m) => <option key={m} value={m}>{nombreMes(m)}</option>)}
          </select>
        </label>
      </Seccion>
      <div className="kpis">
        <div><b>{cupos}</b><span>cupos vendidos</span></div>
        <div><b>{soles(vendido)}</b><span>vendido</span></div>
        <div><b>{soles(cobrado)}</b><span>cobrado</span></div>
        <div><b>{soles(porCobrar)}</b><span>por cobrar</span></div>
        <div><b>{nuevos}</b><span>prospectos nuevos</span></div>
      </div>
      <h2 className="subh">Interesados de la web</h2>
      <div className="kpis">
        <div><b>{intMes.length}</b><span>interesados</span></div>
        <div><b>{intMes.filter((x) => x.estado !== 'nuevo').length}</b><span>contactados</span></div>
        <div><b>{intMes.filter((x) => x.estado === 'nuevo').length}</b><span>sin contactar</span></div>
        <div><b>{intMes.filter((x) => !x.asignado_a).length}</b><span>sin derivar</span></div>
        <div><b>{intMes.filter((x) => x.contesto === true).length}</b><span>contestaron</span></div>
        <div><b>{intMes.filter((x) => x.estado !== 'nuevo' && x.contesto === false).length}</b><span>no contestaron</span></div>
      </div>
      {porVendedor.length > 0 && (
        <>
          <h2 className="subh">Por vendedor</h2>
          <div className="cons-wrap">
            <table className="cons-table insc" style={{ minWidth: 0 }}>
              <thead><tr><th>Vendedor</th><th>Interesados derivados</th><th>Atendidos</th><th>Pendientes</th><th>Prospectos</th><th>Cupos vendidos</th><th>Vendido</th><th>Cobrado</th></tr></thead>
              <tbody>{porVendedor.map((v) => (
                <tr key={v.email}><td><b>{v.email.split('@')[0]}</b></td><td>{v.derivados}</td><td>{v.contactados}</td><td>{v.derivados - v.contactados}</td><td>{v.prospectos}</td><td>{v.cupos}</td><td>{soles(v.vendido)}</td><td>{soles(v.cobrado)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
      {(alertas.length > 0 || llenos.length > 0 || sinWa.length > 0) && (
        <div className="alertas">
          {sinWa.map((g) => <p key={'w' + g.id} className="alerta">⚠ <b>{g.codigo}</b> {cursoDe(g.curso_id)?.titulo} aún no tiene grupo de WhatsApp.</p>)}
          {alertas.map((g) => <p key={g.id} className="alerta">⚠ <b>{g.codigo}</b> {cursoDe(g.curso_id)?.titulo} empieza el {fechaCorta(g.inicio)} con {g.inscritos || 0} de {g.minimo || 10} inscritos.</p>)}
          {llenos.map((g) => <p key={g.id} className="alerta ok">✓ <b>{g.codigo}</b> {cursoDe(g.curso_id)?.titulo} está lleno.</p>)}
        </div>
      )}
      <h2 className="subh">Por grupo</h2>
      {filas.length === 0 ? <div className="vacio"><p>Aún no hay grupos con código. Abre uno en el módulo Web.</p></div> : (
        <div className="cons-wrap">
          <table className="cons-table insc">
            <thead><tr><th>Código</th><th>Curso</th><th>Inicio</th><th>Cupos</th><th>Vendido</th><th>Cobrado</th><th>Por cobrar</th></tr></thead>
            <tbody>
              {filas.map(({ g, c, n, vendido: v, cobrado: co, saldo }) => (
                <tr key={g.id}>
                  <td><span className="cod">{g.codigo}</span></td>
                  <td><b>{c?.titulo || 'Curso'}</b></td>
                  <td>{g.inicio ? fechaCorta(g.inicio) : 'Sin fecha'}</td>
                  <td><div className="barra" title={`${n} de ${g.minimo || 10} mínimo`}><i style={{ width: `${Math.min(100, (n / (g.minimo || 10)) * 100)}%` }} /></div><small>{n}/{g.minimo || 10} mín. · máx. {g.maximo || 20}</small></td>
                  <td>{soles(v)}</td><td>{soles(co)}</td><td>{saldo > 0 ? soles(saldo) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

/* ================= GERENCIA: EQUIPO ================= */
function Equipo({ data, hacer, email }) {
  const [nuevo, setNuevo] = useState({ email: '', rol: 'vendedora' })
  const [quitando, setQuitando] = useState(null)
  return (
    <>
      <Seccion titulo="Equipo" ayuda="Quién entra al panel y qué módulos ve. Gerente: todo. Vendedora: solo Ventas." />
      {!hasBackend && <p className="banner">En modo demostración esto es solo de práctica.</p>}
      <div className="cons-wrap" style={{ maxWidth: 760 }}>
        <table className="cons-table" style={{ minWidth: 0 }}>
          <thead><tr><th>Correo</th><th>Rol</th><th>Recibe interesados</th><th /></tr></thead>
          <tbody>
            {(data.equipo || []).map((a) => (
              <tr key={a.email}>
                <td><b>{a.email}</b>{a.email === email && <small className="paq">Eres tú</small>}</td>
                <td>
                  <select aria-label={`Rol de ${a.email}`} value={a.rol || 'gerente'} disabled={a.email === email}
                    onChange={(e) => hacer(() => guardarMiembro({ email: a.email, rol: e.target.value }), 'Rol actualizado')}>
                    {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}
                  </select>
                </td>
                <td>{a.rol === 'vendedora' ? <Switch on={a.recibe_interesados !== false} label={`Recibe interesados: ${a.email}`} onChange={(v) => hacer(() => recibeInteresados(a.email, v), v ? 'Recibirá interesados' : 'Ya no recibirá interesados')} /> : '—'}</td>
                <td>{a.email !== email && <button className="ib red" onClick={() => setQuitando(a)} aria-label="Quitar">🗑</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="fs" style={{ maxWidth: 760, marginTop: 18 }}>
        <h3>Agregar a alguien</h3>
        <p className="note">Primero crea su usuario en Supabase &gt; Authentication &gt; Users (con Auto Confirm). Luego agrégalo aquí con su rol.</p>
        <div className="g2">
          <label>Correo<input id="eq-mail" type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} /></label>
          <label>Rol<select id="eq-rol" value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}</select></label>
        </div>
        <div><button className="btn btn-teal" onClick={() => hacer(async () => { await guardarMiembro({ email: nuevo.email, rol: nuevo.rol }); setNuevo({ email: '', rol: 'vendedora' }) }, 'Persona agregada')}>Agregar</button></div>
      </div>
      {quitando && (
        <Confirmar texto={`¿Quitar el acceso de ${quitando.email}?`} onNo={() => setQuitando(null)}
          onSi={() => { const a = quitando; setQuitando(null); hacer(() => quitarMiembro(a.email), 'Acceso quitado') }} />
      )}
    </>
  )
}

/* ================= GERENCIA: TRABAJADORES ================= */
function armarTrabajadores(data) {
  const filas = [...(data.trabajadores || [])]
  const conCorreo = new Set(filas.map((t) => t.email).filter(Boolean))
  ;(data.equipo || []).filter((e) => e.rol === 'vendedora' && !conCorreo.has(e.email)).forEach((e) =>
    filas.push({ id: null, nombre: e.email.split('@')[0], puesto: 'vendedor', cargo: 'Vendedora', email: e.email, sueldo_base: SUELDO_DEF, comision_tramos: null, activo: true, notas: '', virtual: true }))
  return filas
}

function TrabajadorForm({ inicial, equipo, cursos, onClose, onSave }) {
  const [f, setF] = useState({ ...inicial, comision_tramos: tramosDe(inicial), cursos: (inicial.cursos || []).map(String) })
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setT = (i, k, v) => set('comision_tramos', f.comision_tramos.map((t, j) => (j === i ? { ...t, [k]: v } : t)))
  const vend = f.puesto === 'vendedor'
  const alt = (id) => set('cursos', f.cursos.includes(String(id)) ? f.cursos.filter((x) => x !== String(id)) : [...f.cursos, String(id)])
  return (
    <Drawer titulo={inicial.id ? 'Editar datos' : (vend ? 'Nuevo vendedor' : 'Nuevo profesor')} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={() => onSave(f)}>Guardar</button></>}>
      <div className="fs">
        <label>Nombre completo<input id="tr-nom" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} /></label>
        <div className="g2">
          <label>DNI<input id="tr-doc" inputMode="numeric" value={f.documento || ''} onChange={(e) => set('documento', e.target.value)} /></label>
          <label>Celular<input id="tr-cel" inputMode="tel" value={f.celular || ''} onChange={(e) => set('celular', e.target.value)} /></label>
        </div>
        <label>Cargo<input value={f.cargo || ''} onChange={(e) => set('cargo', e.target.value)} placeholder={vend ? 'Ej. Vendedora' : 'Ej. Profesor de Excel'} /></label>
        {vend ? (
          <>
            <label>Correo de acceso al panel
              <select value={f.email || ''} onChange={(e) => set('email', e.target.value)}>
                <option value="">Sin acceso</option>{(equipo || []).filter((e) => e.rol === 'vendedora').map((e) => <option key={e.email} value={e.email}>{e.email}</option>)}
              </select>
            </label>
            <label>Sueldo base mensual (S/)<input id="tr-sue" type="number" min="0" value={f.sueldo_base} onChange={(e) => set('sueldo_base', e.target.value)} /></label>
            <div>
              <b>Comisión por cupos cerrados en el mes</b>
              <p className="note">Se aplica sobre el total vendido del mes. Cada fila: desde cuántos cupos, qué porcentaje.</p>
              {f.comision_tramos.map((t, i) => (
                <div className="g2" key={i}>
                  <label>Desde (cupos)<input type="number" min="0" value={t.desde} onChange={(e) => setT(i, 'desde', e.target.value)} /></label>
                  <label>Comisión (%)<input type="number" min="0" step="0.5" value={t.pct} onChange={(e) => setT(i, 'pct', e.target.value)} /></label>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <label>Tarifa por hora dictada (S/) — cada profesor tiene la suya<input id="tr-tar" type="number" min="0" step="0.5" value={f.tarifa_hora} onChange={(e) => set('tarifa_hora', e.target.value)} /></label>
            <p className="note">Es la tarifa que se copia a cada grupo que le asignes (después se puede ajustar grupo por grupo).</p>
            <div>
              <b>Cursos que dicta</b>
              <div className="chks">{(cursos || []).map((c) => <label key={c.id} className="chk"><input type="checkbox" checked={f.cursos.includes(String(c.id))} onChange={() => alt(c.id)} /> {c.titulo}</label>)}</div>
            </div>
          </>
        )}
        <label className="chk"><input type="checkbox" checked={f.activo !== false} onChange={(e) => set('activo', e.target.checked)} /> Activo</label>
        <label>Notas internas<textarea rows={3} value={f.notas || ''} onChange={(e) => set('notas', e.target.value)} /></label>
      </div>
    </Drawer>
  )
}

function PagoProfesorForm({ t, fila, onClose, onSave }) {
  const [f, setF] = useState({ monto: fila ? fila.saldo || '' : '', fecha: new Date().toISOString().slice(0, 10), metodo: 'Transferencia', nota: '' })
  return (
    <Drawer titulo={`Pago a ${t.nombre}`} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={() => onSave({ trabajador_id: t.id, asignacion_id: fila?.a?.id, ...f })}>Registrar pago</button></>}>
      <div className="fs">
        {fila && <p className="note"><b>{fila.g.codigo}</b> · a pagar {soles(fila.debe)} · ya pagado {soles(fila.pagado)} · saldo {soles(fila.saldo)}</p>}
        <label>Monto (S/)<input id="pp-monto" type="number" min="0" step="0.5" value={f.monto} onChange={(e) => setF({ ...f, monto: e.target.value })} /></label>
        <div className="g2">
          <label>Fecha<input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></label>
          <label>Método<select value={f.metodo} onChange={(e) => setF({ ...f, metodo: e.target.value })}>{['Transferencia', 'Yape', 'Plin', 'Efectivo'].map((m) => <option key={m}>{m}</option>)}</select></label>
        </div>
        <label>Nota<input value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} /></label>
      </div>
    </Drawer>
  )
}

/* Ficha de un profesor: cursos que dicta → grupos dictados, horas, pagado */
function FichaProfesor({ data, t, hacer }) {
  const m = useMemo(() => metricasProfesor(data, t), [data, t])
  const [pago, setPago] = useState(null)
  const tarifa = Number(t.tarifa_hora) || 0
  const cuando = (iso) => iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  const ajustar = (a, cambios) => hacer(() => save('asignaciones', { id: a.id, ...cambios }), 'Guardado')
  return (
    <>
      <div className="datos-prof">
        <span><small>DNI</small>{t.documento || '—'}</span>
        <span><small>Celular</small>{t.celular ? <a href={wa(t.celular)} target="_blank" rel="noopener noreferrer">{t.celular}</a> : '—'}</span>
        <span><small>Tarifa por hora</small>{soles(t.tarifa_hora)}</span>
        <span><small>Estado</small>{t.activo === false ? 'Inactivo' : 'Activo'}</span>
      </div>
      <div className="kpis">
        <div><b>{m.cursos.length}</b><span>cursos que dicta</span></div>
        <div><b>{m.nGrupos}</b><span>grupos dictados</span></div>
        <div><b>{m.horas} h</b><span>horas dictadas</span></div>
        <div><b>{soles(m.totalPagado)}</b><span>total pagado</span></div>
        <div><b>{soles(m.porPagar)}</b><span>por pagar</span></div>
      </div>
      {data.profesoresError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase (sección de profesores). Mensaje: {data.profesoresError}</p>}
      {m.cursos.length === 0 && <div className="vacio"><p>Aún no tiene cursos. Edita sus datos y marca los cursos que dicta.</p></div>}
      {m.cursos.map(({ curso, grupos, nGrupos, horas, debe, pagado }) => (
        <section className="curso-prof" key={curso.id}>
          <header>
            <span className="sw" style={{ background: `var(--${curso.color})` }} />
            <div><b>{curso.titulo}</b><small>{curso.horas} h por grupo</small></div>
            <div className="tot"><span><i>{nGrupos}</i> grupos</span><span><i>{horas} h</i> dictadas</span><span><i>{soles(pagado)}</i> pagado</span><span><i>{soles(Math.max(0, debe - pagado))}</i> por pagar</span></div>
          </header>
          {grupos.length === 0 ? <p className="note">Todavía no hay grupos de este curso.</p> : (
            <div className="cons-wrap">
              <table className="cons-table" style={{ minWidth: 0 }}>
                <thead><tr><th>Grupo</th><th>Inicio</th><th>Horas dictadas</th><th>Tarifa/h</th><th>A pagar</th><th>Pagado</th><th>Saldo</th><th /></tr></thead>
                <tbody>
                  {grupos.map(({ g, a, debe: d, pagado: pg, saldo }) => a ? (
                    <tr key={g.id}>
                      <td><span className="cod">{g.codigo || '—'}</span></td>
                      <td>{g.inicio ? cuando(g.inicio) : 'Sin fecha'}</td>
                      <td><input className="num" type="number" min="0" step="0.5" aria-label={`Horas dictadas ${g.codigo}`} defaultValue={a.horas_dictadas} onBlur={(e) => Number(e.target.value) !== Number(a.horas_dictadas) && ajustar(a, { horas_dictadas: Number(e.target.value) || 0 })} /> <small>de {a.horas} h</small>
                        {Number(a.horas_dictadas) < Number(a.horas) && <button className="link" onClick={() => ajustar(a, { horas_dictadas: a.horas })}>Terminado</button>}</td>
                      <td><input className="num" type="number" min="0" step="0.5" aria-label={`Tarifa ${g.codigo}`} defaultValue={a.tarifa_hora} onBlur={(e) => Number(e.target.value) !== Number(a.tarifa_hora) && ajustar(a, { tarifa_hora: Number(e.target.value) || 0 })} /></td>
                      <td>{soles(d)}</td><td>{soles(pg)}</td><td><b>{saldo > 0 ? soles(saldo) : '—'}</b></td>
                      <td className="acc">
                        {saldo > 0 && <button className="btn btn-line sm" onClick={() => setPago({ g, a, debe: d, pagado: pg, saldo })}>+ Pago</button>}
                        <button className="ib red" aria-label="Quitar del grupo" title="Quitar a este profesor del grupo" onClick={() => hacer(() => remove('asignaciones', a.id), 'Grupo desasignado')}>✕</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={g.id} className="sinasig">
                      <td><span className="cod">{g.codigo || '—'}</span></td>
                      <td>{g.inicio ? cuando(g.inicio) : 'Sin fecha'}</td>
                      <td colSpan={5}><small>Sin profesor asignado</small></td>
                      <td className="acc"><button className="btn btn-teal sm" onClick={() => hacer(async () => { if (!(tarifa > 0)) throw new Error('Primero define la tarifa por hora de este profesor (Editar datos).'); await asignarGrupo({ grupo_id: g.id, trabajador_id: t.id, horas: curso.horas, tarifa_hora: tarifa }) }, 'Grupo asignado')}>Asignar a {t.nombre.split(' ')[0]}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      <h3 className="subh">Pagos realizados</h3>
      {m.pagos.length === 0 ? <div className="vacio"><p>Aún no se le ha registrado ningún pago.</p></div> : (
        <ul className="hist">{m.pagos.map((p) => {
          const a = (data.asignaciones || []).find((x) => x.id === p.asignacion_id)
          const g = a && data.grupos.find((x) => String(x.id) === String(a.grupo_id))
          return <li key={p.id}><span aria-hidden="true">💵</span><div>{soles(p.monto)} · {p.metodo || 'sin método'}{g ? ` · ${g.codigo}` : ''}{p.nota ? ` — ${p.nota}` : ''}<small>{cuando(p.fecha)}</small></div></li>
        })}</ul>
      )}
      {pago && <PagoProfesorForm t={t} fila={pago} onClose={() => setPago(null)} onSave={(f) => hacer(async () => { await pagarTrabajador(f); setPago(null) }, 'Pago registrado')} />}
    </>
  )
}

function Trabajadores({ data, hacer }) {
  const [sel, setSel] = useState(null)
  const [tab, setTab] = useState('instructor')
  const [form, setForm] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const lista = armarTrabajadores(data)
  const mes = new Date().toISOString().slice(0, 7)
  const nuevo = (puesto) => setForm({ nombre: '', puesto, cargo: '', email: '', documento: '', celular: '', sueldo_base: puesto === 'vendedor' ? SUELDO_DEF : 0, tarifa_hora: 0, cursos: [], comision_tramos: null, activo: true, notas: '' })
  const guardar = (f) => hacer(async () => { await guardarTrabajador({ ...f, id: f.virtual ? undefined : f.id }); setForm(null); setSel(null) }, 'Guardado')
  const formEl = form && <TrabajadorForm inicial={form} equipo={data.equipo} cursos={data.cursos} onClose={() => setForm(null)} onSave={guardar} />

  const t = sel ? lista.find((x) => (x.id || x.email) === sel) : null
  if (t) {
    return (
      <>
        <button className="btn btn-line sm" onClick={() => setSel(null)}>← {PUESTOS[t.puesto] || 'Trabajadores'}</button>
        <Seccion titulo={t.nombre} ayuda={`${t.cargo || (t.puesto === 'instructor' ? 'Profesor' : 'Vendedor')}${t.puesto === 'vendedor' ? ` · sueldo base ${soles(t.sueldo_base)}` : ''}${t.activo === false ? ' · inactivo' : ''}`}>
          <button className="btn btn-teal" onClick={() => setForm(t)}>Editar datos</button>
          {!t.virtual && <button className="btn btn-line" onClick={() => setBorrando(t)}>Borrar</button>}
        </Seccion>
        {t.notas && <p className="note">{t.notas}</p>}
        {t.puesto === 'vendedor' && (t.email ? <AvanceVendedor data={data} email={t.email} trab={t} verPago /> : <div className="vacio"><p>Esta persona no tiene correo de acceso asignado. Edita sus datos para vincularla.</p></div>)}
        {t.puesto === 'instructor' && <FichaProfesor data={data} t={t} hacer={hacer} />}
        {formEl}
        {borrando && <Confirmar texto={`¿Borrar la ficha de ${borrando.nombre}?`} onNo={() => setBorrando(null)} onSi={() => { const x = borrando; setBorrando(null); setSel(null); hacer(() => remove('trabajadores', x.id), 'Ficha borrada') }} />}
      </>
    )
  }
  const del = lista.filter((x) => x.puesto === tab)
  return (
    <>
      <Seccion titulo="Trabajadores" ayuda="Tu equipo. Entra a la ficha de cada uno para ver su avance, lo que se le debe pagar y lo que ya se le pagó.">
        <button className="btn btn-teal" onClick={() => nuevo(tab)}>{tab === 'vendedor' ? '+ Nuevo vendedor' : '+ Nuevo profesor'}</button>
      </Seccion>
      <div className="tabs2" role="tablist" aria-label="Tipo de trabajador">
        {Object.entries(PUESTOS).map(([k, nombre]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{nombre} <em>{lista.filter((x) => x.puesto === k).length}</em></button>
        ))}
      </div>
      {data.trabajadoresError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. Mensaje: {data.trabajadoresError}</p>}
      {del.length === 0 && <div className="vacio"><p>{tab === 'vendedor' ? 'Aún no hay vendedores.' : 'Aún no hay profesores. Agrega el primero y marca los cursos que dicta.'}</p></div>}
      <div className="tcards">
        {del.map((x) => {
          const mv = x.puesto === 'vendedor' && x.email ? metricasVendedor(data, x.email, mes, x) : null
          const mp = x.puesto === 'instructor' && x.id ? metricasProfesor(data, x) : null
          return (
            <button key={x.id || x.email} className={`tcard ${x.activo === false ? 'off' : ''}`} onClick={() => setSel(x.id || x.email)}>
              <b>{x.nombre}</b><small>{x.cargo || PUESTOS[x.puesto]}{x.activo === false ? ' · inactivo' : ''}</small>
              {mv && <><span><i>{mv.cupos}</i> cupos · {soles(mv.vendido)} vendido</span><span>A pagar este mes: <i>{soles(mv.aPagar)}</i></span></>}
              {mp && <><span><i>{mp.cursos.length}</i> cursos · <i>{mp.nGrupos}</i> grupos · <i>{mp.horas} h</i></span><span>Pagado: <i>{soles(mp.totalPagado)}</i> · por pagar: <i>{soles(mp.porPagar)}</i></span></>}
            </button>
          )
        })}
      </div>
      {formEl}
    </>
  )
}

/* ================= VENTAS: MI AVANCE (vista de la vendedora) ================= */
function MiAvance({ data, email }) {
  const t = armarTrabajadores(data).find((x) => x.email === email) || { sueldo_base: SUELDO_DEF, comision_tramos: null }
  return (
    <>
      <Seccion titulo="Mi avance" ayuda="Cómo vas este mes: prospectos, interesados, ventas y cuánto llevas ganado." />
      {gruposSinWhatsapp(data).length > 0 && (
        <div className="alertas"><p className="alerta">⚠ <b>Pendiente:</b> crear el grupo de WhatsApp de {gruposSinWhatsapp(data).map((g) => g.codigo).join(', ')} y registrarlo en la sección Grupos.</p></div>
      )}
      <AvanceVendedor data={data} email={email} trab={t} verPago />
    </>
  )
}

/* ================= PANEL (módulos) ================= */
const MODULOS = {
  ventas: { nombre: 'Ventas', icono: '💼', secciones: [['mi', 'Mi avance'], ['interesados', 'Interesados'], ['prospectos', 'Prospectos'], ['inscritos', 'Inscritos'], ['consultas', 'Consultas'], ['grupos', 'Grupos'], ['instalaciones', 'Instalaciones']] },
  web: { nombre: 'Web', icono: '🖥️', secciones: [['cursos', 'Cursos'], ['grupos', 'Horarios'], ['enlaces', 'Enlaces'], ['ajustes', 'Ajustes']] },
  gerencia: { nombre: 'Gerencia', icono: '📊', secciones: [['resumen', 'Resumen'], ['trabajadores', 'Trabajadores'], ['equipo', 'Equipo']] },
}
const POR_ROL = { gerente: ['gerencia', 'ventas', 'web'], vendedora: ['ventas'] }
const ETIQUETA_ROL = { gerente: 'Gerente', vendedora: 'Vendedora' }

function Panel({ email, rol, onSalir }) {
  const gerente = rol === 'gerente'
  const modulos = POR_ROL[rol] || []
  const [modulo, setModulo] = useState(gerente ? 'gerencia' : (modulos[0] || 'ventas'))
  const [tab, setTab] = useState(gerente ? 'resumen' : 'mi')
  const [data, setData] = useState({ cursos: [], grupos: [], enlaces: [], consultas: [], interesados: [], alumnos: [], matriculas: [], pagos: [], historial: [], prospectos: [], trabajadores: [], instalaciones: [], gruposWa: [], asignaciones: [], pagos_trabajador: [], equipo: [], ajustes: {} })
  const [grupoForm, setGrupoForm] = useState(null)
  const [inscForm, setInscForm] = useState(null)
  const [pagoForm, setPagoForm] = useState(null)
  const [protoInicial, setProtoInicial] = useState(null)
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
  const ir = (m, t) => { setModulo(m); setTab(t || MODULOS[m].secciones.find(([k]) => k !== 'mi' || !gerente)[0]) }
  const abrirGrupo = (cursoId) => setGrupoForm({ curso_id: cursoId })
  const abiertos = data.grupos.filter((g) => g.estado === 'abierto' && g.activo).length
  const nInscritos = new Set(data.matriculas.filter((m) => m.estado === 'activa').map((m) => m.paquete_id)).size
  const nuevosInt = (data.interesados || []).filter((x) => x.estado === 'nuevo').length
  const nProsp = (data.prospectos || []).filter((x) => !['inscrito', 'perdido'].includes(x.estado)).length
  const nuevosCon = (data.consultas || []).filter((x) => x.estado === 'nuevo').length
  const cuenta = { prospectos: nProsp, inscritos: nInscritos, interesados: nuevosInt, consultas: nuevosCon, grupos: abiertos, cursos: data.cursos.length, enlaces: (data.enlaces || []).length, equipo: (data.equipo || []).length, trabajadores: armarTrabajadores(data).length, instalaciones: (data.instalaciones || []).filter((x) => x.estado === 'agendada' && x.fecha >= new Date().toISOString().slice(0, 10)).length }
  const nombreSec = (m, k, n) => n
  const verSecciones = MODULOS[modulo].secciones.filter(([k]) => k !== 'mi' || !gerente)

  /* Pasar un interesado a inscrito: carga sus datos y el grupo de su curso */
  const inscribirDesde = (x) => {
    const g = data.grupos.find((y) => String(y.curso_id) === String(x.curso_id) && y.estado !== 'cerrado') || null
    setInscForm({ grupo_id: g?.id || '', interesado: x, alumno: { tipo_doc: x.tipo_doc, documento: x.documento, nombres: x.nombres, apellido_paterno: x.apellido_paterno, apellido_materno: x.apellido_materno, email: x.email, celular: x.celular } })
  }

  return (
    <div className="shell">
      <aside className="side">
        <Link className="logo" to="/" aria-label="CCN"><Logo fijo="oscuro" /></Link>
        <small className="sidetag">{ETIQUETA_ROL[rol] || 'Panel'}</small>
        {modulos.length > 1 && (
          <div className="mods" role="tablist" aria-label="Módulos">
            {modulos.map((m) => (
              <button key={m} role="tab" aria-selected={modulo === m} onClick={() => ir(m)}><span aria-hidden="true">{MODULOS[m].icono}</span>{MODULOS[m].nombre}</button>
            ))}
          </div>
        )}
        <small className="sidetag modname">Módulo {MODULOS[modulo].nombre}</small>
        <div className="snav" role="tablist" aria-label="Secciones">
          {verSecciones.map(([k, nombre]) => {
            const n = cuenta[k]
            return (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {nombreSec(modulo, k, nombre)}{n !== undefined && <em>{n}</em>}
              </button>
            )
          })}
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
        {modulo === 'web' && tab === 'cursos' && <Cursos data={data} hacer={hacer} abrirGrupo={abrirGrupo} />}
        {tab === 'grupos' && <Grupos data={data} hacer={hacer} abrirGrupo={abrirGrupo} editarGrupo={setGrupoForm} soloLeer={modulo !== 'web'} />}
        {modulo === 'web' && tab === 'enlaces' && <Enlaces data={data} hacer={hacer} />}
        {modulo === 'web' && tab === 'ajustes' && <Ajustes data={data} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'consultas' && <Consultas data={data} hacer={hacer} rolG={gerente} />}
        {modulo === 'ventas' && tab === 'interesados' && <Interesados data={data} hacer={hacer} onInscribir={inscribirDesde} gerente={gerente}
          onProspecto={(x) => { setProtoInicial({ nombres: `${x.nombres} ${x.apellido_paterno}`.trim(), celular: x.celular, curso: x.curso, origen: 'Web', estado: 'contactado', seguimiento: '', notas: '' }); setTab('prospectos') }} />}
        {modulo === 'ventas' && tab === 'prospectos' && <Prospectos data={data} hacer={hacer} gerente={gerente} inicial={protoInicial} onCerrarInicial={() => setProtoInicial(null)} />}
        {modulo === 'ventas' && tab === 'inscritos' && <Inscritos data={data} hacer={hacer} rol={rol} nuevaInscripcion={() => setInscForm({})} registrarPago={setPagoForm} />}
        {modulo === 'ventas' && tab === 'instalaciones' && <Instalaciones data={data} hacer={hacer} gerente={gerente} />}
        {modulo === 'ventas' && tab === 'mi' && <MiAvance data={data} email={email} />}
        {modulo === 'gerencia' && tab === 'resumen' && <Resumen data={data} />}
        {modulo === 'gerencia' && tab === 'trabajadores' && <Trabajadores data={data} hacer={hacer} />}
        {modulo === 'gerencia' && tab === 'equipo' && <Equipo data={data} hacer={hacer} email={email} />}
      </main>

      {modulo === 'web' && grupoForm && (
        <GrupoForm inicial={grupoForm} cursos={data.cursos} onClose={() => setGrupoForm(null)}
          onSave={async (row) => { await save('grupos', row); setGrupoForm(null); await hacer(async () => {}, grupoForm.id ? 'Grupo guardado' : 'Grupo publicado'); setTab('grupos') }} />
      )}
      {inscForm && (
        <InscripcionForm inicial={inscForm} data={data} onClose={() => setInscForm(null)}
          onSave={async (datos) => {
            const codigo = await crearInscripcion(datos)
            if (inscForm.interesado && inscForm.interesado.estado === 'nuevo') await marcarConsulta(inscForm.interesado.id, 'atendida', 'interesados')
            setInscForm(null)
            await hacer(async () => {}, codigo ? `Inscripción registrada · alumno ${codigo}` : 'Inscripción registrada')
            ir('ventas', 'inscritos')
          }} />
      )}
      {pagoForm && (
        <PagoForm insc={pagoForm} onClose={() => setPagoForm(null)}
          onSave={async (datos) => { await agregarPago(datos); setPagoForm(null); await hacer(async () => {}, 'Pago registrado') }} />
      )}
      {toast && <div className={`toast ${toast.error ? 'bad' : ''}`} role="status">{toast.error ? '⚠ ' : '✓ '}{toast.texto}</div>}
    </div>
  )
}

/* ================= ACCESO (login) ================= */
function Acceso({ children }) {
  return (
    <div className="gate">
      <Link className="logo gate-logo" to="/" aria-label="Ir al inicio de CCN"><Logo completo /></Link>
      <div className="gate-card">{children}</div>
      <p className="gate-foot">Powered by <b>Bro Engineering</b></p>
    </div>
  )
}

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
    <Acceso>
      <form onSubmit={entrar}>
        <h1 className="gate-h">Hola de nuevo</h1>
        <p className="gate-sub">Entra a tu espacio CCN</p>
        <label className="gate-l"><span>Correo</span><input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="gate-l"><span>Contraseña</span><input id="pass" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required /></label>
        {err && <p className="err gate-err" role="alert">{err}</p>}
        <button className="btn btn-teal gate-btn" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </Acceso>
  )
}

export default function Admin() {
  const [estado, setEstado] = useState(hasBackend ? 'cargando' : 'ok')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('gerente')
  async function revisar() {
    if (!hasBackend) return
    const { data } = await supabase.auth.getSession()
    const mail = data.session?.user?.email
    if (!mail) { setEstado('login'); return }
    setEmail(mail)
    const r = await getRol(mail)
    setRol(r || 'gerente')
    setEstado(r ? 'ok' : 'sinpermiso')
  }
  useEffect(() => { revisar() }, [])
  async function salir() { await supabase.auth.signOut(); setEstado('login'); setEmail('') }

  if (estado === 'cargando') return <Acceso><p className="gate-sub" style={{ margin: 0 }}>Cargando…</p></Acceso>
  if (estado === 'login') return <Login onOk={revisar} />
  if (estado === 'sinpermiso') return (
    <Acceso>
      <h1 className="gate-h">Sin acceso</h1>
      <p className="gate-sub">{email} no tiene acceso a este espacio.</p>
      <button className="btn btn-line gate-btn" onClick={salir}>Salir</button>
    </Acceso>
  )
  return <Panel email={email} rol={rol} onSalir={salir} />
}
