import { useEffect, useMemo, useRef, useState } from 'react'
import AvanceVendedor from './AvanceVendedor'
import JornadaCard from '../components/JornadaCard'
import Icon from '../components/Icons'
import { Barras, Embudo } from '../components/Charts'
import { lunesDe, semanaHoras, minutosJornada, jornadaSinSenal, fmtHM, MINIMO_SEMANA_MIN, metasDe, PUESTOS, SUELDO_DEF, BONO_PASAJES_DEF, descuentosVendedora, TARIFA_HORA_DEF, TRAMOS_DEF, tramosDe, metricasVendedor, metricasProfesor, nombreGrupoWa, gruposSinWhatsapp, metricasCurso, AVISO_INSTALACION, PROGRAMAS, ESTADOS_INSTALACION, programaSugerido, errorHorarioInstalacion, choqueInstalacion, horaCorta, hora12, proximoRecontacto, recontactoVencido, reporteSemana, alertasVenta } from '../lib/ventas'
import { TIPOS_DOC, VARIABLES_DOC, renderDoc, plantillaDe, fechaLarga } from '../lib/docs'
import { redondear, sinIgv } from '../lib/igv'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Layout.jsx'
import PanelProfesor, { ClasesDrawer } from './Profesor'
import Certificados from './Certificados'
import { Cronograma } from './Academico.jsx'
import { pdfTerminos } from '../lib/bienvenida.js'
import { fmtMoneda, simbolo, precioEn, vendeEnUsd, descuentoMaxPct, precioMinimoLibre, sumaPorMoneda } from '../lib/moneda.js'
import { generarNotaPago } from '../lib/notaPago.js'
import { variables as variablesManual, presentacion as presentacionManual, oferta as ofertaManual, cierre as cierreManual, faqs as faqsManual, seguimientos as seguimientosManual, cierres as cierresManual, casos as casosManual, PASOS as PASOS_MANUAL, REGLAS as REGLAS_MANUAL, NO_DECIR as NO_DECIR_MANUAL } from '../lib/manual.js'
import {
  hasBackend, supabase, loadAll, save, remove, CATEGORIAS_ACCESO, saveAjuste, getRol, fechaCorta, subirImagen, telefono, setNumero, COLORES, MAX_INICIO, consultasCSV, interesadosCSV, marcarConsulta,
  subirComprobante, urlComprobante, crearInscripcion, agregarPago, estadoInscripcion, borrarInscripcion, enviarBienvenidaCorreo, armarInscripciones, inscritosCSV, guardarMiembro, ponerCoordina, getCoordina, quitarMiembro, ROLES, seguimientoInteresado, reasignarInteresado, recibeInteresados, guardarProspecto, consultaAProspecto, asesoraNombre, grupoParaOferta, guionesVenta, borrarProspecto, guardarTrabajador, guardarWhatsapp, asignarGrupo, pagarTrabajador, guardarInstalacion, ESTADOS_PROSPECTO, TIPOS_PROSPECTO, ORIGENES, guardarPendiente, marcarPendiente, borrarPendiente, guardarNota, borrarNota, guardarPlantilla, enviarDocumentos, firmarDocumento, borrarDocumento, guardarQueja, atenderQueja, numeroGerencia, fmtHorario
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
  titulo: '', descripcion: '', color: 'g1', horas: 12, sesiones: 4, precio: 229, precio_antes: '', precio_usd: '', precio_antes_usd: '',
  programas: '', temario: [], extra: '', orden: 0, activo: true, destacado: false, imagen_url: '',
}

function CursoForm({ inicial, total, enInicio, onSave, onClose }) {
  const [f, setF] = useState({ ...CURSO_VACIO, ...inicial, precio_antes: inicial.precio_antes ?? '', precio_usd: inicial.precio_usd ?? '', precio_antes_usd: inicial.precio_antes_usd ?? '', temario: [...(inicial.temario || [])] })
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
        horas: Number(f.horas) || 0, sesiones: Number(f.sesiones) || 0, precio: redondear(f.precio),
        precio_antes: f.precio_antes === '' ? null : redondear(f.precio_antes),
        precio_usd: f.precio_usd === '' || f.precio_usd == null ? null : Math.round(Number(f.precio_usd) * 100) / 100,
        precio_antes_usd: f.precio_antes_usd === '' || f.precio_antes_usd == null ? null : Math.round(Number(f.precio_antes_usd) * 100) / 100,
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
          <label>Precio FINAL en S/ (ya incluye IGV)<input id="c-precio" type="number" min="0" step="1" value={f.precio} onChange={(e) => set('precio', e.target.value)} onBlur={(e) => set('precio', e.target.value === '' ? '' : String(redondear(e.target.value)))} /><small>Es lo que ve y paga el alumno. No se le suma nada más. Se redondea al entero más cercano.</small></label>
          <label>Precio tachado en S/ (final, opcional)<input id="c-antes" type="number" min="0" step="1" value={f.precio_antes} onChange={(e) => set('precio_antes', e.target.value)} onBlur={(e) => set('precio_antes', e.target.value === '' ? '' : String(redondear(e.target.value)))} placeholder="Ej. 573 · déjalo vacío si no hay descuento" /></label>
          <label>Precio FINAL en US$ (dólares)<input id="c-usd" type="number" min="0" step="0.01" value={f.precio_usd} onChange={(e) => set('precio_usd', e.target.value)} placeholder="Ej. 69 · vacío = aún no se vende en dólares" /><small>Sin tipo de cambio: es el precio estándar en dólares.</small></label>
          <label>Precio tachado en US$ (opcional)<input id="c-antes-usd" type="number" min="0" step="0.01" value={f.precio_antes_usd} onChange={(e) => set('precio_antes_usd', e.target.value)} placeholder="Déjalo vacío si no hay" /></label>
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
            <button type="button" className="ib" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir"><Icon n="up" /></button>
            <button type="button" className="ib" onClick={() => mover(i, 1)} disabled={i === f.temario.length - 1} aria-label="Bajar"><Icon n="down" /></button>
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
                <label className="pr" data-l="Precio final" title={`Incluye IGV · base ${soles(sinIgv(precio[c.id] ?? c.precio))}`}>S/
                  <input type="number" min="0" aria-label={`Precio de ${c.titulo}`}
                    value={precio[c.id] ?? c.precio}
                    onChange={(e) => setPrecio({ ...precio, [c.id]: e.target.value })}
                    onBlur={() => {
                      const v = redondear(precio[c.id])
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
                    <Icon n="star" size={17} fill={Boolean(c.destacado)} />
                  </button>
                </div>
                <div data-l="Visible"><Switch on={c.activo} label={`Visible: ${c.titulo}`} onChange={(v) => hacer(() => save('cursos', { id: c.id, activo: v }), v ? 'Curso visible' : 'Curso oculto')} /></div>
                <div className="acts2">
                  <button className="btn btn-teal sm" onClick={() => abrirGrupo(c.id)}>Abrir grupo</button>
                  <button className="btn btn-line sm" onClick={() => setEditando(c)}>Editar</button>
                  <button className="ib" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir"><Icon n="up" /></button>
                  <button className="ib" onClick={() => mover(i, 1)} disabled={i === data.cursos.length - 1} aria-label="Bajar"><Icon n="down" /></button>
                  <button className="ib red" onClick={() => setBorrando(c)} aria-label="Borrar"><Icon n="trash" /></button>
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
const GRUPO_VACIO = { curso_id: '', inicio: '', dias: '', horario: '', estado: 'abierto', inscritos: 0, minimo: 5, mostrar_inscritos: false, activo: true }
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
        inscritos: Number(f.inscritos) || 0, minimo: Number(f.minimo) || 5,
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
        <p className="banner aviso-inst"><b>Horarios disponibles:</b> {AVISO_INSTALACION}</p>
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
        {errHora && <p className="err-inst">{errHora}</p>}
        {choque && <p className="err-inst">Ya hay otra instalación a las {hora12(choque.hora)} ese día.</p>}
        {grupo?.inicio && <p className={tarde ? 'err-inst' : 'note'}>El curso empieza el {fechaCorta(grupo.inicio)}. Lo ideal es dejar todo instalado hasta 3 días antes ({fechaCorta(limite)}).</p>}
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
      <Seccion titulo="Instalaciones" ayuda="Agenda de las instalaciones remotas por AnyDesk de programas (Photoshop, Illustrator, Office). Se hacen después de la inscripción.">
        <button className="btn btn-teal" onClick={() => setForm({})}>+ Nueva instalación</button>
      </Seccion>
      <p className="banner aviso-inst"><b>Las instalaciones solo se programan en estos horarios:</b> {AVISO_INSTALACION}</p>
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
                      <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar"><Icon n="trash" /></button>
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
  const [f, setF] = useState({ nombre: actual?.nombre || sugerido, enlace: actual?.enlace || '', solo_admins: !!actual?.solo_admins })
  return (
    <Drawer titulo={`WhatsApp · ${g.codigo}`} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={() => onSave(f)}>Guardar</button></>}>
      <div className="fs">
        <p className="note"><b>{curso?.titulo}</b> · {g.inicio ? fechaCorta(g.inicio) : 'sin fecha'} · {g.dias || 'días por definir'} · {g.horario ? fmtHorario(g.horario) : 'horario por definir'}</p>
        <label>Nombre del grupo en WhatsApp
          <input id="wa-nom" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
        </label>
        <p className="note">Formato: G##-DÍAS-CURSO-DD.MM (ej. G05-M/J-NOTION-24.11). Puedes corregirlo antes de crear el grupo.{f.nombre !== sugerido && <> <button type="button" className="link" onClick={() => setF({ ...f, nombre: sugerido })}>Volver al sugerido</button></>}</p>
        <label>Enlace de invitación
          <input id="wa-link" value={f.enlace} onChange={(e) => setF({ ...f, enlace: e.target.value })} placeholder="https://chat.whatsapp.com/…" />
        </label>
        <p className="note">Crea el grupo en WhatsApp, copia el enlace de invitación y pégalo aquí. Solo lo ve el equipo.</p>
        <label className="chk"><input id="wa-admin" type="checkbox" checked={f.solo_admins} onChange={(e) => setF({ ...f, solo_admins: e.target.checked })} /><span>Ya configuré el grupo en WhatsApp: solo los administradores pueden escribir hasta que empiece el curso.</span></label>
      </div>
    </Drawer>
  )
}

function Grupos({ data, hacer, abrirGrupo, editarGrupo, soloLeer, sinBorrar }) {
  const [borrando, setBorrando] = useState(null)
  const nombre = (id) => data.cursos.find((c) => c.id === id)
  const lista = [...data.grupos].sort((a, b) => (b.inicio || '9999').localeCompare(a.inicio || '9999'))
  const [wa, setWa] = useState(null)
  const [clasesG, setClasesG] = useState(null)
  const waDe = (g) => (data.gruposWa || []).find((w) => String(w.grupo_id) === String(g.id))
  const faltan = gruposSinWhatsapp(data)
  return (
    <>
      <Seccion titulo={soloLeer ? 'Grupos' : 'Horarios'} ayuda={soloLeer ? 'Los grupos abiertos con su código, fecha y cupos. Los inscritos se cuentan solos desde la sección Inscritos.' : 'Cada grupo es una vez que abre un curso. Sale en la tarjeta del curso y en la tabla de horarios de la web. Los inscritos se cuentan solos desde la sección Inscritos.'}>
        {!soloLeer && <button className="btn btn-teal" onClick={() => abrirGrupo('')}>+ Abrir grupo</button>}
      </Seccion>
      {faltan.length > 0 && (
        <div className="alertas">
          <p className="alerta"><b>{faltan.length} grupo{faltan.length === 1 ? '' : 's'} sin grupo de WhatsApp.</b> Hay que crearlo y registrarlo aquí apenas se abre el curso: {faltan.map((g) => g.codigo).join(', ')}.</p>
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
                  <small>{g.inicio ? fechaCorta(g.inicio) : 'Sin fecha'} · {g.dias || 'días por definir'} · {g.horario ? fmtHorario(g.horario) : 'horario por definir'}</small>
                  {g.codigo && (waDe(g)
                    ? <small className="wa ok">WhatsApp: <a href={waDe(g).enlace} target="_blank" rel="noopener noreferrer">{waDe(g).nombre}</a>{waDe(g).creado_por && <> · {waDe(g).creado_por.split('@')[0]}</>} · {waDe(g).solo_admins ? '🔒 solo admins' : '⚠️ falta dejarlo en solo admins'}</small>
                    : <small className="wa falta">Falta crear el grupo de WhatsApp</small>)}
                </div>
              </div>
              <div className="btns">
                {!soloLeer && <button className="btn btn-line sm" onClick={() => setClasesG(g)} title="Calendario de clases y asistencia">Clases</button>}
                {g.codigo && <button className={`btn sm ${waDe(g) ? 'btn-line' : 'btn-teal'}`} onClick={() => setWa(g)}>{waDe(g) ? 'WhatsApp' : '+ Registrar WhatsApp'}</button>}
                <span className="cupos" title="Se cuenta solo desde Inscritos"><b>{g.inscritos}</b>/{g.minimo} <small>mín.</small></span>
                {soloLeer ? <span className={`est ${g.estado}`}>{g.estado === 'abierto' ? 'Abierto' : g.estado === 'lleno' ? 'Lleno' : 'Cerrado'}</span> : <>
                <select aria-label="Estado" value={g.estado} onChange={(e) => hacer(() => save('grupos', { id: g.id, estado: e.target.value }), 'Estado guardado')} className={`est ${g.estado}`}>
                  <option value="abierto">Abierto</option><option value="lleno">Lleno</option><option value="cerrado">Cerrado</option>
                </select>
                <button className="btn btn-line sm" onClick={() => editarGrupo(g)}>Editar</button>
                {!sinBorrar && <button className="ib red" onClick={() => setBorrando(g)} aria-label="Borrar"><Icon n="trash" /></button>}</>}
              </div>
            </div>
          )
        })}
      </div>
      {clasesG && <ClasesDrawer g={clasesG} curso={nombre(clasesG.curso_id)} lectura={sinBorrar} onClose={() => setClasesG(null)} avisar={(t) => hacer(async () => {}, t)} />}
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
              <b>{e.destacado && <Icon n="star" size={13} fill />} {e.titulo}</b>
              <small>{e.tipo === 'whatsapp' ? 'WhatsApp de CCN' : e.url} · {e.clics || 0} clics</small>
            </div>
            <Switch on={e.activo} label={`Visible: ${e.titulo}`} onChange={(v) => hacer(() => save('enlaces', { id: e.id, activo: v }), v ? 'Enlace visible' : 'Enlace oculto')} />
            <button className="btn btn-line sm" onClick={() => setEditando(e)}>Editar</button>
            <button className="ib" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir"><Icon n="up" /></button>
            <button className="ib" onClick={() => mover(i, 1)} disabled={i === lista.length - 1} aria-label="Bajar"><Icon n="down" /></button>
            <button className="ib red" onClick={() => setBorrando(e)} aria-label="Borrar"><Icon n="trash" /></button>
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
                  <td><Switch on={x.estado !== 'nuevo'} label={`Atendida: ${x.nombres}`} onChange={(v) => hacer(async () => { await marcarConsulta(x.id, v ? 'atendida' : 'nuevo', tabla); if (v && !esInt) await consultaAProspecto(x, data.prospectos || []) }, v ? (esInt ? 'Marcado como atendido' : 'Atendida ✅ y pasada a Prospectos') : 'Marcado como nuevo')} /></td>
                  {esInt && onInscribir && <td><button className="btn btn-line sm" onClick={() => onInscribir(x)}>Inscribir</button></td>}
                  <td>{rolG && <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar"><Icon n="trash" /></button>}</td>
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
          <small className="paq">{x.estado === 'nuevo' ? (x.asignado_a ? 'Pendiente' : 'Sin derivar') : 'Atendido'}</small>
        </td>
      )}
      <td><Switch on={cont} label={`Contactado: ${x.nombres}`} onChange={(v) => hacer(() => seguimientoInteresado(x.id, { contactado: v }), v ? 'Marcado como contactado' : 'Marcado sin contactar')} />
        {cont && x.contactado_por && <small className="paq">{x.contactado_por.split('@')[0]}, {cuando(x.contactado_en)}</small>}</td>
      <td>
        <select aria-label={`¿Contestó? ${x.nombres}`} disabled={!cont} value={x.contesto === true ? 'si' : x.contesto === false ? 'no' : ''}
          onChange={(e) => hacer(() => seguimientoInteresado(x.id, { contesto: e.target.value === '' ? null : e.target.value === 'si' }), 'Guardado')}>
          <option value="">—</option><option value="si">Sí</option><option value="no">No</option>
        </select>
      </td>
      <td><input className="obs" aria-label={`Observación ${x.nombres}`} value={obs} placeholder="Observación…" disabled={!cont}
        onChange={(e) => setObs(e.target.value)} onBlur={() => obs !== (x.observacion || '') && hacer(() => seguimientoInteresado(x.id, { observacion: obs }), 'Observación guardada')} /></td>
      <td className="acc">
        <button className="btn btn-line sm" onClick={() => onInscribir(x)}>Inscribir</button>
        <button className="btn btn-line sm" onClick={() => onProspecto(x)}>A prospectos</button>
        {gerente && <button className="ib red" onClick={() => onBorrar(x)} aria-label="Borrar"><Icon n="trash" /></button>}
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

/* ================= MANUAL DE VENTAS (speeches y respuestas, se arma solo con cada curso) ================= */
function ManualVentas({ data, email }) {
  const [tab, setTab] = useState('guia')
  const [cursoId, setCursoId] = useState('')
  const [asesora, setAsesora] = useState(asesoraNombre(email, data.trabajadores))
  const [nombre, setNombre] = useState('')
  const [q, setQ] = useState('')
  const [grupoFaq, setGrupoFaq] = useState('Todas')
  const [copiado, setCopiado] = useState('')
  const curso = data.cursos.find((c) => c.id === cursoId) || null
  const grupo = curso ? grupoParaOferta(data.grupos, curso.id) : null
  const v = useMemo(() => variablesManual({ asesora, nombre: nombre.trim().split(/\s+/)[0], curso, grupo, cursos: data.cursos, descMax: descuentoMaxPct(data.ajustes) }), [asesora, nombre, curso, grupo, data.cursos, data.ajustes])
  const copiar = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopiado(k); setTimeout(() => setCopiado(''), 1800) } catch { window.prompt('Copia el mensaje:', t) } }
  const Msg = ({ k, titulo, texto, nota, aviso }) => (
    <section className="guion-b" key={k}>
      <h4>{titulo}</h4>
      {aviso && <span className="pill warn">⚠️ Por confirmar con gerencia</span>}
      <pre>{texto}</pre>
      {nota && <small>{nota}</small>}
      <div className="btns"><button className="btn btn-line sm" onClick={() => copiar(k, texto)}>{copiado === k ? '✓ Copiado' : 'Copiar'}</button></div>
    </section>
  )
  const lista = faqsManual(v)
  const grupos = ['Todas', ...Array.from(new Set(lista.map((f) => f.g)))]
  const nq = q.trim().toLowerCase()
  const filtradas = lista.filter((f) => (grupoFaq === 'Todas' || f.g === grupoFaq) && (!nq || (f.q + ' ' + f.a).toLowerCase().includes(nq)))
  const TABS = [['guia', 'Guía rápida'], ['pres', 'Presentación'], ['faq', 'Preguntas frecuentes'], ['seg', 'Seguimiento'], ['cierre', 'Cierre y pago'], ['casos', 'Casos especiales']]
  return (
    <>
      <Seccion titulo="Manual de ventas" ayuda="Speeches listos para copiar. Se completan solos con el precio, la fecha, el horario y los cupos reales del curso que elijas." />
      <div className="fs" style={{ marginBottom: 12 }}>
        <div className="manual-fila">
          <label>Curso
            <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
              <option value="">Elegir curso…</option>{data.cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
            </select>
          </label>
          <label>Mi nombre (asesora)
            <input value={asesora} onChange={(e) => setAsesora(e.target.value)} />
          </label>
          <label>Nombre del cliente (opcional)
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. María" />
          </label>
        </div>
        {curso && !grupo && <p className="note">⚠️ Este curso no tiene un grupo abierto con fecha. Los mensajes dirán “fecha por confirmar”. Revisa en Grupos.</p>}
        {curso && grupo && <p className="note">Grupo usado: inicia el {v.fecha}{v.dias ? `, ${v.dias}` : ''}{v.horario ? ` de ${v.horario}` : ''} · quedan {v.cupos} cupos.</p>}
      </div>
      <div className="tabs2">{TABS.map(([k, n]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{n}</button>)}</div>

      {tab === 'guia' && (
        <div className="fs">
          <h4>Los 8 pasos de una venta</h4>
          <ol className="manual-pasos">{PASOS_MANUAL.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ol>
          <h4>Reglas de oro</h4>
          <ul className="manual-reglas">{REGLAS_MANUAL.map((r) => <li key={r}>{r}</li>)}</ul>
          <h4>Evita decir…</h4>
          <div className="manual-nodecir">{NO_DECIR_MANUAL.map(([a, b]) => <p key={a}><b>✖ {a}</b><span>{b}</span></p>)}</div>
        </div>
      )}

      {tab === 'pres' && (!curso
        ? <p className="note">Elige un curso arriba para armar el mensaje de presentación y la oferta.</p>
        : <>
          <p className="note">Orden: envía el flyer del curso → mensaje de presentación → temario en PDF → oferta → cierre.</p>
          <Msg k="p" titulo="1 · Presentación del curso" texto={presentacionManual(v, curso)} nota="Antes de este mensaje, envía el flyer del curso." />
          <Msg k="o" titulo="2 · Fecha y precio" texto={ofertaManual(v, curso)} />
          <Msg k="c" titulo="3 · Cierre con cupos reales" texto={cierreManual(v)} nota="El número de cupos sale del grupo real (máximo menos inscritos)." />
        </>)}

      {tab === 'faq' && (
        <>
          <div className="fs">
            <input placeholder="Buscar una pregunta… (ej. caro, certificado, Mac)" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="chips">{grupos.map((g) => <button key={g} className={grupoFaq === g ? 'sel' : ''} onClick={() => setGrupoFaq(g)}>{g}</button>)}</div>
            {!curso && <p className="note">Elige un curso arriba para que las respuestas se completen con su precio, fecha y horario. Lo que falte aparece entre [corchetes].</p>}
          </div>
          {filtradas.length === 0 && <p className="note">No encontré esa pregunta. Si te la hacen, avisa a gerencia para sumarla al manual.</p>}
          {filtradas.map((f, i) => <Msg key={f.q} k={`f${i}`} titulo={f.q} texto={f.a} nota={f.tip ? `💡 ${f.tip}` : ''} aviso={f.pendiente} />)}
        </>
      )}

      {tab === 'seg' && <>
        <p className="note">Máximo 3 intentos. Después del tercero, marca el prospecto como perdido.</p>
        {seguimientosManual(v).map((s) => <Msg key={s.id} k={s.id} titulo={s.t} texto={s.a} nota={s.nota} />)}
      </>}
      {tab === 'cierre' && cierresManual(v).map((s) => <Msg key={s.id} k={s.id} titulo={s.t} texto={s.a} nota={s.nota} />)}
      {tab === 'casos' && casosManual(v).map((s) => <Msg key={s.id} k={s.id} titulo={s.t} texto={s.a} nota={s.nota} aviso={s.pendiente} />)}
    </>
  )
}

/* ================= PROSPECTOS (base propia del vendedor) ================= */
function GuionVenta({ p, data, email, onClose }) {
  const [cursoId, setCursoId] = useState((data.cursos.find((c) => c.titulo === p.curso) || {}).id || '')
  const [copiado, setCopiado] = useState('')
  const curso = data.cursos.find((c) => c.id === cursoId) || null
  const grupo = curso ? grupoParaOferta(data.grupos, curso.id) : null
  const g = guionesVenta({ asesora: asesoraNombre(email, data.trabajadores), nombre: String(p.nombres || '').trim().split(/\s+/)[0], curso, grupo })
  const copiar = async (k, t) => { try { await navigator.clipboard.writeText(t); setCopiado(k); setTimeout(() => setCopiado(''), 1800) } catch { window.prompt('Copia el mensaje:', t) } }
  const abrir = (t) => window.open(`${wa(p.celular)}?text=${encodeURIComponent(t)}`, '_blank', 'noopener')
  const bloque = (k, titulo, t, nota) => t ? (
    <section className="guion-b" key={k}>
      <h4>{titulo}</h4>
      <pre>{t}</pre>
      {nota && <small>{nota}</small>}
      <div className="btns">
        <button className="btn btn-line sm" onClick={() => copiar(k, t)}>{copiado === k ? '✓ Copiado' : 'Copiar'}</button>
        {p.celular && <button className="btn btn-teal sm" onClick={() => abrir(t)}>Abrir en WhatsApp</button>}
      </div>
    </section>
  ) : null
  return (
    <Drawer titulo={`Guion · ${p.nombres}`} onClose={onClose} pie={<button className="btn btn-line" onClick={onClose}>Cerrar</button>}>
      <div className="fs">
        <p className="note">Orden: 1) saludo → 2) cuando responda, sube sus datos → 3) envía el flyer del curso y este mensaje → 4) el temario en PDF → 5) el cierre.</p>
        {bloque('s', '1 · Saludo', g.saludo)}
        <label>Curso de interés
          <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
            <option value="">Elegir curso…</option>{data.cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </label>
        {!curso && <p className="note">Elige el curso para armar el mensaje con su precio, fecha y cupos.</p>}
        {bloque('o', '3 · Fecha y precio (después del flyer)', g.oferta, 'Antes de este mensaje envía la imagen (flyer) del curso.')}
        {curso && !grupo && <p className="note">⚠️ Este curso no tiene un grupo abierto con fecha. Revisa en Grupos.</p>}
        {bloque('c', '5 · Cierre (después del temario en PDF)', g.cierre, g.cupos != null ? `Los cupos salen del grupo real (máximo menos inscritos).` : '')}
      </div>
    </Drawer>
  )
}

function Prospectos({ data, hacer, gerente, inicial, onCerrarInicial, email }) {
  const [guion, setGuion] = useState(null)
  const [rapido, setRapido] = useState({ nombres: '', celular: '', curso: '' })
  const dig9 = (t) => String(t || '').replace(/\D/g, '').slice(-9)
  const agregarRapido = () => hacer(async () => {
    const dup = dig9(rapido.celular) && (data.prospectos || []).find((x) => dig9(x.celular) === dig9(rapido.celular))
    if (dup) throw new Error(`Ya existe un prospecto con ese celular: ${dup.nombres}.`)
    await guardarProspecto({ nombres: rapido.nombres, celular: rapido.celular, curso: rapido.curso, origen: 'WhatsApp', estado: 'nuevo', tipo: 'medio' })
    setRapido({ nombres: '', celular: '', curso: '' })
  }, 'Prospecto agregado ⚡')
  const [form, setForm] = useState(inicial || null)
  const [ver, setVer] = useState('')
  const [fTipo, setFTipo] = useState('')
  const [fCurso, setFCurso] = useState('')
  const [fOrigen, setFOrigen] = useState('')
  const [fVend, setFVend] = useState('')
  const [fVenc, setFVenc] = useState(false)
  const [orden, setOrden] = useState('reciente')
  const [q, setQ] = useState('')
  const [borrando, setBorrando] = useState(null)
  const hoy = new Date().toISOString().slice(0, 10)
  const todos = data.prospectos || []
  const venc = (p) => { const r = proximoRecontacto(p); const f = r ? r.fecha : p.seguimiento; return !!f && f <= hoy && !['inscrito', 'perdido'].includes(p.estado) }
  const rank = { alto: 0, medio: 1, bajo: 2 }
  const hayFiltro = ver || fTipo || fCurso || fOrigen || fVend || fVenc || q.trim()
  const lista = todos.filter((p) => (!ver || p.estado === ver) && (!fTipo || (p.tipo || 'medio') === fTipo) && (!fCurso || p.curso === fCurso) && (!fOrigen || p.origen === fOrigen) && (!fVend || p.vendedor === fVend) && (!fVenc || venc(p)) && (!q.trim() || `${p.nombres} ${p.celular} ${p.curso} ${p.notas}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => orden === 'tipo' ? (rank[a.tipo || 'medio'] - rank[b.tipo || 'medio']) || String(b.creado).localeCompare(String(a.creado)) : orden === 'nombre' ? String(a.nombres).localeCompare(String(b.nombres)) : String(b.creado).localeCompare(String(a.creado)))
  const vendedoresP = [...new Set(todos.map((p) => p.vendedor).filter(Boolean))]
  const limpiar = () => { setVer(''); setFTipo(''); setFCurso(''); setFOrigen(''); setFVend(''); setFVenc(false); setQ('') }
  const activos = todos.filter((p) => !['inscrito', 'perdido'].includes(p.estado))
  const vencidos = activos.filter((p) => { const r = proximoRecontacto(p); return r ? r.fecha <= hoy : (p.seguimiento && p.seguimiento <= hoy) })
  const cerrar = () => { setForm(null); onCerrarInicial && onCerrarInicial() }
  const cambiar = (p, cambios) => hacer(() => guardarProspecto({ ...p, ...cambios }), 'Guardado')
  return (
    <>
      <Seccion titulo="Prospectos" ayuda={gerente ? 'La base de prospectos de cada vendedor.' : 'Tu base de prospectos: gente que conseguiste por WhatsApp, redes o referidos.'}>
        <button className="btn btn-teal" onClick={() => setForm({ nombres: '', celular: '', curso: '', origen: 'WhatsApp', estado: 'nuevo', tipo: 'medio', seguimiento: '', notas: '', recontactar1: '', recontactar2: '' })}>+ Nuevo prospecto</button>
      </Seccion>
      {data.prospectosError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. Mensaje: {data.prospectosError}</p>}
      <form className="rapido" onSubmit={(e) => { e.preventDefault(); agregarRapido() }}>
        <b>⚡ Registro rápido</b>
        <input aria-label="Nombre" placeholder="Nombre" value={rapido.nombres} onChange={(e) => setRapido({ ...rapido, nombres: e.target.value })} />
        <input aria-label="Celular" inputMode="tel" placeholder="Celular" value={rapido.celular} onChange={(e) => setRapido({ ...rapido, celular: e.target.value })} />
        <select aria-label="Curso" value={rapido.curso} onChange={(e) => setRapido({ ...rapido, curso: e.target.value })}>
          <option value="">Curso (opcional)</option>{data.cursos.map((c) => <option key={c.id} value={c.titulo}>{c.titulo}</option>)}
        </select>
        <button className="btn btn-teal sm" type="submit" disabled={rapido.nombres.trim().length < 2}>Agregar</button>
      </form>
      <div className="kpis">
        <div><b>{todos.length}</b><span>prospectos</span></div>
        <div><b>{activos.length}</b><span>en seguimiento</span></div>
        <div><b>{vencidos.length}</b><span>seguimientos de hoy o vencidos</span></div>
        <div><b>{activos.filter((p) => p.tipo === 'alto').length}</b><span>de tipo alto en seguimiento</span></div>
        <div><b>{todos.filter((p) => p.estado === 'inscrito').length}</b><span>inscritos</span></div>
      </div>
      <div className="filtros">
        <label>Tipo
          <select id="p-tipo" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
            <option value="">Todos</option>{Object.entries(TIPOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Estado
          <select id="p-est" value={ver} onChange={(e) => setVer(e.target.value)}>
            <option value="">Todos</option>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Curso
          <select id="p-cur" value={fCurso} onChange={(e) => setFCurso(e.target.value)}>
            <option value="">Todos</option>{[...new Set(todos.map((p) => p.curso).filter(Boolean))].sort().map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Origen
          <select id="p-ori" value={fOrigen} onChange={(e) => setFOrigen(e.target.value)}>
            <option value="">Todos</option>{ORIGENES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        {gerente && <label>Vendedor
          <select id="p-ven" value={fVend} onChange={(e) => setFVend(e.target.value)}>
            <option value="">Todos</option>{vendedoresP.map((v) => <option key={v} value={v}>{v.split('@')[0]}</option>)}
          </select>
        </label>}
        <label>Ordenar por
          <select id="p-ord" value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="reciente">Más recientes</option><option value="tipo">Tipo (alto primero)</option><option value="nombre">Nombre (A-Z)</option>
          </select>
        </label>
        <label className="chk"><input type="checkbox" checked={fVenc} onChange={(e) => setFVenc(e.target.checked)} /> Solo seguimientos de hoy o vencidos</label>
        <label className="buscar">Buscar<input id="p-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, celular, curso o notas" /></label>
        {hayFiltro && <button className="btn btn-line sm" onClick={limpiar}>Limpiar filtros</button>}
      </div>
      {hayFiltro && <p className="muted-s">Mostrando {lista.length} de {todos.length} prospectos.</p>}
      {lista.length === 0 && <div className="vacio"><p>{todos.length ? 'No hay prospectos con ese filtro.' : 'Aún no hay prospectos. Agrega el primero.'}</p></div>}
      {lista.length > 0 && (
        <div className="cons-wrap">
          <table className="cons-table insc">
            <thead><tr><th>Prospecto</th>{gerente && <th>Vendedor</th>}<th>Tipo</th><th>Curso</th><th>Origen</th><th>Estado</th><th>Seguimiento</th><th>Notas</th><th /></tr></thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className={(() => { const r = proximoRecontacto(p); const f = r ? r.fecha : p.seguimiento; return f && f <= hoy && !['inscrito', 'perdido'].includes(p.estado) ? 'nueva' : '' })()}>
                  <td><b>{p.nombres}</b>{p.celular && <small className="paq"><a href={wa(p.celular)} target="_blank" rel="noopener noreferrer">{p.celular}</a></small>}</td>
                  {gerente && <td>{(p.vendedor || '').split('@')[0]}</td>}
                  <td><select aria-label={`Tipo de ${p.nombres}`} className={`tipo-${p.tipo || 'medio'}`} value={p.tipo || 'medio'} onChange={(e) => cambiar(p, { tipo: e.target.value })}>{Object.entries(TIPOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                  <td>{p.curso || '—'}</td>
                  <td>{p.origen}</td>
                  <td><select aria-label={`Estado de ${p.nombres}`} value={p.estado} onChange={(e) => cambiar(p, { estado: e.target.value })}>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                  <td>{(() => { const r = proximoRecontacto(p); const f = r ? r.fecha : p.seguimiento; return f ? <span className={recontactoVencido(p) ? 'vencido' : ''}>{fechaCorta(f)}{r ? ` · contacto ${r.etapa + 1}` : ''}{recontactoVencido(p) ? ' ⚠️' : ''}</span> : <small>{p.recontactar1 === 'no' || p.recontactar2 === 'no' ? 'No recontactar' : '—'}</small> })()}</td>
                  <td className="notas">{p.notas || '—'}</td>
                  <td className="acc">
                    <button className="btn btn-teal sm" onClick={() => setGuion(p)}>Guion</button>
                    <button className="btn btn-line sm" onClick={() => setForm(p)}>Editar</button>
                    <button className="ib red" onClick={() => setBorrando(p)} aria-label="Borrar"><Icon n="trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {guion && <GuionVenta p={guion} data={data} email={email} onClose={() => setGuion(null)} />}
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
            <label>Tipo de prospecto<select value={form.tipo || 'medio'} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{Object.entries(TIPOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <div className="g2">
              <label>Origen<select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })}>{ORIGENES.map((o) => <option key={o}>{o}</option>)}</select></label>
              <label>Estado<select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{Object.entries(ESTADOS_PROSPECTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            </div>
            <label>Notas generales<textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></label>
            {[1, 2].map((n) => {
              const f = (k) => `${k}${n}`
              const rc = form['recontactar' + n] || ''
              return (
                <fieldset key={n} className="contacto">
                  <legend>Contacto {n}{n === 1 ? ' · primera interacción' : ''}</legend>
                  <label>Fecha<input type="date" value={form['contacto' + n + '_fecha'] || ''} onChange={(e) => setForm({ ...form, ['contacto' + n + '_fecha']: e.target.value })} /></label>
                  <label>¿En qué quedó con el cliente?<textarea rows={2} value={form['contacto' + n + '_obs'] || ''} onChange={(e) => setForm({ ...form, ['contacto' + n + '_obs']: e.target.value })} /></label>
                  <div className="g2">
                    <label>¿Volver a contactar?
                      <select value={rc} onChange={(e) => setForm({ ...form, ['recontactar' + n]: e.target.value })}>
                        <option value="">Elegir…</option><option value="si">Sí</option><option value="no">No</option>
                      </select>
                    </label>
                    {rc === 'si' && <label>Volver a contactar el<input type="date" value={form['recontactar' + n + '_fecha'] || ''} onChange={(e) => setForm({ ...form, ['recontactar' + n + '_fecha']: e.target.value })} /></label>}
                  </div>
                  {n === 2 && rc === 'si' && <label className="chk"><input type="checkbox" checked={!!form.recontacto2_hecho} onChange={(e) => setForm({ ...form, recontacto2_hecho: e.target.checked })} /> Ya lo volví a contactar</label>}
                </fieldset>
              )
            })}
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


/* ================= AGENDA (pendientes, notas, calendario) ================= */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']
function PendienteForm({ inicial, onClose, onSave }) {
  const [f, setF] = useState(inicial)
  return (
    <Drawer titulo={f.id ? 'Editar pendiente' : (f.vendedor ? 'Asignar pendiente' : 'Nuevo pendiente')} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" onClick={() => onSave(f)}>Guardar</button></>}>
      <div className="fs">
        <label>¿Qué hay que hacer?<input id="pd-tit" value={f.titulo} maxLength={160} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
        <label>Detalle (opcional)<textarea rows={3} value={f.detalle || ''} onChange={(e) => setF({ ...f, detalle: e.target.value })} /></label>
        <label>Fecha límite (opcional)<input id="pd-fec" type="date" value={f.fecha_limite || ''} onChange={(e) => setF({ ...f, fecha_limite: e.target.value })} /></label>
      </div>
    </Drawer>
  )
}

function ListaPendientes({ lista, email, hacer, gerente, onEditar }) {
  const hoy = hoyISO()
  const [borrando, setBorrando] = useState(null)
  if (!lista.length) return <div className="vacio"><p>Nada por aquí.</p></div>
  return (
    <>
      <ul className="pend">
        {lista.map((x) => {
          const hecho = x.estado === 'realizado'
          const asignado = x.creado_por && x.creado_por !== x.vendedor
          const vencido = !hecho && x.fecha_limite && x.fecha_limite < hoy
          const puedeEditar = !hecho && (gerente || !asignado)
          return (
            <li key={x.id} className={`${hecho ? 'hecho' : ''} ${vencido ? 'vencido' : ''}`}>
              <input type="checkbox" checked={hecho} disabled={hecho} aria-label={`Marcar como realizado: ${x.titulo}`}
                onChange={() => hacer(() => marcarPendiente(x.id), 'Pendiente realizado ✅')} />
              <div>
                <b>{x.titulo}</b>
                {x.detalle && <small>{x.detalle}</small>}
                <small>
                  {asignado && <span className="tag">Asignado por gerencia</span>}
                  {x.fecha_limite && <span> · Para el {fechaCorta(x.fecha_limite)}{vencido ? ' ⚠️ vencido' : ''}</span>}
                  {hecho && x.realizado_en && <span> · Hecho el {fechaCorta(x.realizado_en)}</span>}
                </small>
              </div>
              {puedeEditar && (
                <span className="acc">
                  <button className="btn btn-line sm" onClick={() => onEditar(x)}>Editar</button>
                  <button className="ib red" onClick={() => setBorrando(x)} aria-label="Borrar"><Icon n="trash" /></button>
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {borrando && <Confirmar texto={`¿Borrar «${borrando.titulo}»?`} onNo={() => setBorrando(null)} onSi={() => { const x = borrando; setBorrando(null); hacer(() => borrarPendiente(x.id), 'Pendiente borrado') }} />}
    </>
  )
}

function Calendario({ data, email }) {
  const hoy = hoyISO()
  const [mes, setMes] = useState(hoy.slice(0, 7))
  const [dia, setDia] = useState(hoy)
  const [y, m] = mes.split('-').map(Number)
  const primero = new Date(y, m - 1, 1)
  const offset = (primero.getDay() + 6) % 7
  const nd = new Date(y, m, 0).getDate()
  const eventos = {}
  const add = (f, e) => { if (!f) return; const k = String(f).slice(0, 10); (eventos[k] = eventos[k] || []).push(e) }
  ;(data.prospectos || []).filter((p) => !p.vendedor || p.vendedor === email).forEach((p) => {
    if (['inscrito', 'perdido'].includes(p.estado)) return
    const r = proximoRecontacto(p); if (r) add(r.fecha, { tipo: 'rc', txt: `Volver a contactar a ${p.nombres}`, sub: `Contacto ${r.etapa + 1}${p.celular ? ' · ' + p.celular : ''}`, venc: r.fecha < hoy })
  })
  ;(data.pendientes || []).filter((x) => x.vendedor === email && x.estado === 'pendiente').forEach((x) => add(x.fecha_limite, { tipo: 'pd', txt: x.titulo, sub: 'Pendiente', venc: x.fecha_limite < hoy }))
  ;(data.instalaciones || []).filter((x) => x.estado === 'agendada').forEach((x) => add(x.fecha, { tipo: 'in', txt: `Instalación${x.programa ? ': ' + x.programa : ''}`, sub: horaCorta ? horaCorta(x.hora) : x.hora }))
  const cambiar = (d) => { const f = new Date(y, m - 1 + d, 1); setMes(f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0')) }
  const celdas = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= nd; d++) celdas.push(`${mes}-${String(d).padStart(2, '0')}`)
  const sel = eventos[dia] || []
  return (
    <div className="calendario">
      <div className="cal-head">
        <button className="btn btn-line sm" onClick={() => cambiar(-1)} aria-label="Mes anterior">‹</button>
        <b>{MESES[m - 1]} {y}</b>
        <button className="btn btn-line sm" onClick={() => cambiar(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="cal-grid">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
        {celdas.map((f, i) => f === null ? <span key={'v' + i} /> : (
          <button key={f} className={`cal-d ${f === hoy ? 'hoy' : ''} ${f === dia ? 'sel' : ''}`} onClick={() => setDia(f)} aria-label={`${Number(f.slice(8))} de ${MESES[m - 1]}`}>
            {Number(f.slice(8))}
            {eventos[f] && <i className={eventos[f].some((e) => e.venc) ? 'venc' : ''}>{eventos[f].length}</i>}
          </button>
        ))}
      </div>
      <h3 className="cal-tit">{fechaCorta(dia)}</h3>
      {!sel.length && <p className="note">Nada agendado este día.</p>}
      <ul className="cal-ev">
        {sel.map((e, i) => <li key={i} className={`${e.tipo} ${e.venc ? 'venc' : ''}`}><b>{e.txt}</b><small>{e.sub}{e.venc ? ' · ⚠️ vencido' : ''}</small></li>)}
      </ul>
    </div>
  )
}

function Agenda({ data, email, hacer }) {
  const [sub, setSub] = useState('pendientes')
  const [form, setForm] = useState(null)
  const [nota, setNota] = useState(null)
  const [borrandoN, setBorrandoN] = useState(null)
  const mios = (data.pendientes || []).filter((x) => x.vendedor === email)
  const abiertos = mios.filter((x) => x.estado === 'pendiente').sort((a, b) => (a.fecha_limite || '9999').localeCompare(b.fecha_limite || '9999'))
  const hechos = mios.filter((x) => x.estado === 'realizado').sort((a, b) => String(b.realizado_en).localeCompare(String(a.realizado_en)))
  const notas = (data.notas_agenda || []).filter((x) => !x.vendedor || x.vendedor === email)
  const vencidos = (data.prospectos || []).filter((p) => (!p.vendedor || p.vendedor === email) && recontactoVencido(p))
  const wspFalta = gruposSinWhatsapp(data).map((g) => ({ g, nombre: nombreGrupoWa(g, (data.cursos || []).find((c) => String(c.id) === String(g.curso_id))) }))
  return (
    <>
      <Seccion titulo="Mi agenda" ayuda="Tus pendientes, notas y el calendario con los clientes a los que tienes que volver a contactar.">
        {sub === 'pendientes' && <button className="btn btn-teal" onClick={() => setForm({ titulo: '', detalle: '', fecha_limite: '' })}>+ Nuevo pendiente</button>}
        {sub === 'notas' && <button className="btn btn-teal" onClick={() => setNota({ titulo: '', texto: '' })}>+ Nueva nota</button>}
      </Seccion>
      {data.pendientesError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. Mensaje: {data.pendientesError}</p>}
      {vencidos.length > 0 && <div className="alertas"><p className="alerta"><b>Se te pasó volver a contactar a:</b> {vencidos.map((p) => p.nombres).join(', ')}. Cada cliente sin respuesta es una venta que se puede perder.</p></div>}
      <div className="tabs2" role="tablist">
        {[['pendientes', `Pendientes (${abiertos.length + wspFalta.length})`], ['realizados', `Realizados (${hechos.length})`], ['notas', 'Notas'], ['calendario', 'Calendario']].map(([k, n]) => (
          <button key={k} role="tab" aria-selected={sub === k} onClick={() => setSub(k)}>{n}</button>
        ))}
      </div>
      {sub === 'pendientes' && wspFalta.length > 0 && (
        <ul className="pend">
          {wspFalta.map(({ g, nombre }) => (
            <li key={'wsp' + g.id} className="vencido">
              <span aria-hidden="true">💬</span>
              <div>
                <b>Crear el grupo de WhatsApp de {g.codigo}</b>
                <small>Nombre: {nombre} · {g.inicio ? `inicia el ${fechaCorta(g.inicio)}` : 'sin fecha de inicio'}. Se quita solo cuando lo registras en Grupos.</small>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sub === 'pendientes' && <ListaPendientes lista={abiertos} email={email} hacer={hacer} onEditar={(x) => setForm(x)} />}
      {sub === 'realizados' && <><p className="note">Los pendientes realizados quedan como registro: ya no se pueden editar ni borrar.</p><ListaPendientes lista={hechos} email={email} hacer={hacer} onEditar={() => {}} /></>}
      {sub === 'calendario' && <Calendario data={data} email={email} />}
      {sub === 'notas' && (
        <div className="notas-grid">
          {!notas.length && <div className="vacio"><p>Aún no tienes notas.</p></div>}
          {notas.map((n) => (
            <article key={n.id} className="nota">
              <b>{n.titulo || 'Sin título'}</b>
              <p>{n.texto}</p>
              <span className="acc">
                <button className="btn btn-line sm" onClick={() => setNota(n)}>Editar</button>
                <button className="ib red" onClick={() => setBorrandoN(n)} aria-label="Borrar"><Icon n="trash" /></button>
              </span>
            </article>
          ))}
        </div>
      )}
      {form && <PendienteForm inicial={form} onClose={() => setForm(null)} onSave={(f) => hacer(async () => { await guardarPendiente(f); setForm(null) }, 'Pendiente guardado')} />}
      {nota && (
        <Drawer titulo={nota.id ? 'Editar nota' : 'Nueva nota'} onClose={() => setNota(null)}
          pie={<><button className="btn btn-line" onClick={() => setNota(null)}>Cancelar</button><button className="btn btn-teal" onClick={() => hacer(async () => { await guardarNota(nota); setNota(null) }, 'Nota guardada')}>Guardar</button></>}>
          <div className="fs">
            <label>Título<input id="nt-tit" value={nota.titulo} onChange={(e) => setNota({ ...nota, titulo: e.target.value })} /></label>
            <label>Nota<textarea id="nt-txt" rows={8} value={nota.texto} onChange={(e) => setNota({ ...nota, texto: e.target.value })} /></label>
          </div>
        </Drawer>
      )}
      {borrandoN && <Confirmar texto={`¿Borrar la nota «${borrandoN.titulo || 'sin título'}»?`} onNo={() => setBorrandoN(null)} onSi={() => { const x = borrandoN; setBorrandoN(null); hacer(() => borrarNota(x.id), 'Nota borrada') }} />}
    </>
  )
}


/* Gerente: reporte semanal automático de una vendedora */
function ReporteSemanal({ data, email }) {
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const r = reporteSemana(data, email, lunes)
  const mover = (n) => { const x = new Date(lunes); x.setDate(x.getDate() + 7 * n); setLunes(x) }
  const dom = new Date(lunes); dom.setDate(dom.getDate() + 6)
  const rango = `${lunes.getDate()} ${MESES[lunes.getMonth()].slice(0, 3)} – ${dom.getDate()} ${MESES[dom.getMonth()].slice(0, 3)} ${dom.getFullYear()}`
  const ok = r.horas.total >= MINIMO_SEMANA_MIN
  const fila = (txt, val, mal) => <li className={mal ? 'mal' : ''}><span>{txt}</span><b>{val}</b></li>
  return (
    <section className="reporte">
      <div className="sec-h"><h3>Reporte semanal</h3>
        <span className="rep-nav"><button className="btn btn-line sm" onClick={() => mover(-1)} aria-label="Semana anterior">‹</button><b>{rango}</b><button className="btn btn-line sm" onClick={() => mover(1)} aria-label="Semana siguiente">›</button></span>
      </div>
      <div className="rep-grid">
        <div><h4>Ventas</h4><ul>
          {fila('Inscritos (alumnos)', r.inscritos)}
          {fila('Cupos / matrículas', r.matriculas)}
          {fila('Total vendido', dosMon({ PEN: r.vendido, USD: r.vendidoUSD || 0 }))}
        </ul></div>
        <div><h4>Atención</h4><ul>
          {fila('Prospectos nuevos', r.prospectosNuevos)}
          {fila('Interesados recibidos', r.interesados)}
          {fila('Atendidos', r.atendidos)}
          {fila('Sin atender', r.sinAtender, r.sinAtender > 0)}
        </ul></div>
        <div><h4>Volver a contactar</h4><ul>
          {fila('Programados esta semana', r.programados)}
          {fila('Se le pasaron (a hoy)', r.vencidos.length, r.vencidos.length > 0)}
        </ul>
          {r.vencidos.length > 0 && <small className="rep-det">{r.vencidos.map((p) => p.nombres).join(', ')}</small>}
        </div>
        <div><h4>Pendientes</h4><ul>
          {fila('Vencían esta semana', `${r.pendientes.cumplidosDeEsos} de ${r.pendientes.vencenSemana} cumplidos`, r.pendientes.cumplidosDeEsos < r.pendientes.vencenSemana)}
          {fila('Realizados en la semana', r.pendientes.hechosSemana)}
          {fila('Asignados por gerencia', r.pendientes.asignadosSemana)}
          {fila('Abiertos ahora', r.pendientes.abiertos)}
          {fila('Vencidos sin hacer', r.pendientes.vencidos.length, r.pendientes.vencidos.length > 0)}
        </ul></div>
        <div><h4>Horas</h4><ul>
          {fila('Trabajadas', `${fmtHM(r.horas.total)} / mín. 24 h`, !ok)}
          {fila('Días con jornada', r.horas.dias.filter((d) => d > 0).length)}
        </ul>
          <small className="rep-det">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => `${d} ${fmtHM(r.horas.dias[i])}`).join(' · ')}</small>
        </div>
      </div>
    </section>
  )
}

/* Gerente: pendientes de una vendedora (asignar y ver cumplimiento) */
function PendientesDe({ data, email, hacer }) {
  const [form, setForm] = useState(null)
  const mios = (data.pendientes || []).filter((x) => x.vendedor === email)
  const abiertos = mios.filter((x) => x.estado === 'pendiente')
  const hechos = mios.filter((x) => x.estado === 'realizado')
  return (
    <section className="avance-sec">
      <div className="sec-h"><h3>Pendientes de la vendedora</h3><button className="btn btn-teal sm" onClick={() => setForm({ titulo: '', detalle: '', fecha_limite: '', vendedor: email })}>+ Asignar pendiente</button></div>
      <p className="note">{abiertos.length} por hacer · {hechos.length} realizados</p>
      <ListaPendientes lista={[...abiertos, ...hechos]} email={email} hacer={hacer} gerente onEditar={(x) => setForm(x)} />
      {form && <PendienteForm inicial={form} onClose={() => setForm(null)} onSave={(f) => hacer(async () => { await guardarPendiente(f); setForm(null) }, 'Pendiente guardado')} />}
    </section>
  )
}


/* ================= CONTRATOS Y FIRMA ================= */
function VerDoc({ doc, onClose }) {
  return (
    <Drawer titulo={doc.titulo} onClose={onClose} pie={<button className="btn btn-line" onClick={onClose}>Cerrar</button>}>
      <pre className="doc-txt">{doc.contenido}</pre>
      {doc.estado === 'firmado'
        ? <p className="firma-ok">✅ Firmado por <b>{doc.firmado_nombre}</b> el {fechaCorta(doc.firmado_en)} · {new Date(doc.firmado_en).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}<small>Huella: {doc.huella}</small></p>
        : <p className="note">Enviado, aún sin firmar.</p>}
    </Drawer>
  )
}

function EnviarContrato({ t, data, onClose, hacer }) {
  const hoy = new Date()
  const ini0 = t.fecha_inicio && t.fecha_inicio > hoyISO() ? t.fecha_inicio : new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
  const fin0 = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10)
  const firmoConf = (data.documentos || []).some((d) => d.vendedor === t.email && d.tipo === 'confidencialidad' && d.estado === 'firmado')
  const [f, setF] = useState({ inicio: ini0, fin: fin0, contrato: true, confidencialidad: !firmoConf })
  const faltan = [!t.documento && 'DNI', !t.email && 'correo de acceso', !t.fecha_inicio && 'fecha de inicio', !(Number(t.sueldo_base) > 0) && 'sueldo'].filter(Boolean)
  const vars = { nombre: t.nombre, documento: t.documento, email: t.email, sueldo: soles(t.sueldo_base), bono: soles(t.bono_pasajes), fecha_inicio: fechaLarga(f.inicio), fecha_fin: fechaLarga(f.fin), mes: nombreMes(f.inicio.slice(0, 7)), fecha_envio: fechaLarga(hoyISO()) }
  const tipos = ['contrato', 'confidencialidad'].filter((k) => f[k])
  const enviar = () => hacer(async () => {
    if (!f.inicio || !f.fin || f.fin < f.inicio) throw new Error('Revisa las fechas: la de fin no puede ser antes que la de inicio.')
    await enviarDocumentos(tipos.map((k) => { const pl = plantillaDe(data, k); return { vendedor: t.email, tipo: k, titulo: renderDoc(pl.titulo, vars), contenido: renderDoc(pl.contenido, vars), fecha_inicio: f.inicio, fecha_fin: f.fin } }))
    onClose()
  }, 'Enviado a ' + t.nombre)
  return (
    <Drawer titulo={`Enviar contrato a ${t.nombre}`} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" disabled={!tipos.length || faltan.length > 0} onClick={enviar}>Enviar</button></>}>
      <div className="fs">
        <div className="g2">
          <label>Desde<input id="ec-ini" type="date" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></label>
          <label>Hasta<input id="ec-fin" type="date" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></label>
        </div>
        <label className="chk"><input type="checkbox" checked={f.contrato} onChange={(e) => setF({ ...f, contrato: e.target.checked })} /> Contrato del periodo</label>
        <label className="chk"><input type="checkbox" checked={f.confidencialidad} onChange={(e) => setF({ ...f, confidencialidad: e.target.checked })} /> Acuerdo de confidencialidad{firmoConf ? ' (ya lo firmó)' : ''}</label>
        {faltan.length > 0
          ? <p className="alerta rojo"><b>Aún no se puede enviar.</b> Faltan en su ficha: {faltan.join(', ')}. Mientras tanto puedes leer cómo quedará el contrato.</p>
          : <p className="note ok">Datos completos. Lee la vista previa y, si todo está bien, pulsa Enviar.</p>}
        <p className="note">Los textos salen de las plantillas de <b>Gerencia → Contratos</b> (ahí puedes editarlos). Aquí solo cambias las fechas.</p>
        <h3>Vista previa</h3>
        {tipos.map((k) => <div key={k}><b>{TIPOS_DOC[k]}</b><pre className="doc-txt">{renderDoc(plantillaDe(data, k).contenido, vars)}</pre></div>)}
      </div>
    </Drawer>
  )
}

function DocumentosDe({ data, t, hacer }) {
  const [ver, setVer] = useState(null)
  const [env, setEnv] = useState(false)
  const [borrando, setBorrando] = useState(null)
  const docs = (data.documentos || []).filter((d) => d.vendedor === t.email)
  return (
    <section className="reporte">
      <div className="sec-h"><h3>Contratos y firmas</h3><button className="btn btn-teal sm" onClick={() => setEnv(true)}>Vista previa y enviar</button></div>
      {data.documentosError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. {data.documentosError}</p>}
      {!docs.length && <p className="note">Aún no le has enviado documentos.</p>}
      <ul className="pend">
        {docs.map((d) => (
          <li key={d.id}>
            <span>{d.estado === 'firmado' ? '✅' : '⏳'}</span>
            <div><b>{d.titulo}</b><small>{d.fecha_inicio ? `${fechaCorta(d.fecha_inicio)} → ${d.fecha_fin ? fechaCorta(d.fecha_fin) : '…'} · ` : ''}{d.estado === 'firmado' ? `Firmado el ${fechaCorta(d.firmado_en)}` : 'Pendiente de firma'}</small></div>
            <span className="acc"><button className="btn btn-line sm" onClick={() => setVer(d)}>Ver</button>{d.estado === 'enviado' && <button className="ib red" onClick={() => setBorrando(d)} aria-label="Borrar"><Icon n="trash" /></button>}</span>
          </li>
        ))}
      </ul>
      {env && <EnviarContrato t={t} data={data} hacer={hacer} onClose={() => setEnv(false)} />}
      {ver && <VerDoc doc={ver} onClose={() => setVer(null)} />}
      {borrando && <Confirmar texto={`¿Borrar «${borrando.titulo}»? Aún no está firmado.`} onNo={() => setBorrando(null)} onSi={() => { const x = borrando; setBorrando(null); hacer(() => borrarDocumento(x.id), 'Borrado') }} />}
    </section>
  )
}

function Contratos({ data, hacer }) {
  const [ed, setEd] = useState(null)
  const [ver, setVer] = useState(null)
  const docs = data.documentos || []
  const nombreDe = (email) => armarTrabajadores(data).find((t) => t.email === email)?.nombre || email
  return (
    <>
      <Seccion titulo="Contratos" ayuda="Edita los textos base. Se envían desde la ficha de cada trabajador (botón «Vista previa y enviar»)." />
      <div className="plant-grid">
        {['contrato', 'confidencialidad', 'plan'].map((k) => {
          const pl = plantillaDe(data, k)
          return (
            <article key={k} className="plant">
              <h4>{TIPOS_DOC[k]}</h4>
              <p>{pl.titulo}</p>
              <small>{k === 'plan' ? 'Lo lee cada vendedora en «Plan de trabajo»' : 'Se firma desde «Firmar»'}{(data.plantillas || []).some((x) => x.tipo === k) ? ' · editada' : ' · texto base'}</small>
              <button className="btn btn-teal sm" onClick={() => setEd({ tipo: k, titulo: pl.titulo, contenido: pl.contenido })}>Editar texto</button>
            </article>
          )
        })}
      </div>
      <p className="note">Son borradores: hazlos revisar por tu contador o abogado antes de usarlos. Variables disponibles: {VARIABLES_DOC.join('  ')}</p>
      <h3>Trabajadores</h3>
      <div className="cons-wrap"><table className="cons-table">
        <thead><tr><th>Nombre</th><th>Puesto</th><th>Sueldo</th><th>Contrato</th><th>Confidencialidad</th></tr></thead>
        <tbody>{armarTrabajadores(data).filter((t) => t.puesto === 'vendedor').map((t) => {
          const ult = (tipo) => docs.filter((d) => d.vendedor === t.email && d.tipo === tipo)[0]
          const est = (d) => !d ? <span className="est-doc sin">Sin enviar</span> : d.estado === 'firmado' ? <button className="link" onClick={() => setVer(d)}>✅ Firmó el {fechaCorta(d.firmado_en)}</button> : <button className="link" onClick={() => setVer(d)}>⏳ Enviado, sin firmar</button>
          return <tr key={t.id || t.email}><td><b>{t.nombre}</b></td><td>{t.cargo || 'Vendedora'}</td><td>{soles(t.sueldo_base)}</td><td>{est(ult('contrato'))}{ult('contrato')?.fecha_inicio && <small className="paq">{nombreMes(ult('contrato').fecha_inicio.slice(0, 7))}</small>}</td><td>{est(ult('confidencialidad'))}</td></tr>
        })}</tbody>
      </table></div>
      <p className="note">Para enviar un contrato entra a la ficha del trabajador (Gerencia → Trabajadores) y pulsa «Vista previa y enviar».</p>
      <h3>Historial de documentos enviados</h3>
      {!docs.length && <div className="vacio"><p>Aún no se envió ningún documento.</p></div>}
      {docs.length > 0 && (
        <div className="cons-wrap"><table className="cons-table">
          <thead><tr><th>Trabajador</th><th>Documento</th><th>Periodo</th><th>Estado</th><th /></tr></thead>
          <tbody>{docs.map((d) => (
            <tr key={d.id}><td>{nombreDe(d.vendedor)}</td><td>{TIPOS_DOC[d.tipo]}</td><td>{d.fecha_inicio ? `${fechaCorta(d.fecha_inicio)} → ${d.fecha_fin ? fechaCorta(d.fecha_fin) : '…'}` : '—'}</td>
              <td>{d.estado === 'firmado' ? `✅ Firmado ${fechaCorta(d.firmado_en)}` : '⏳ Sin firmar'}</td>
              <td className="acc"><button className="btn btn-line sm" onClick={() => setVer(d)}>Ver</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
      {ed && (
        <Drawer titulo={`Editar: ${TIPOS_DOC[ed.tipo]}`} onClose={() => setEd(null)}
          pie={<><button className="btn btn-line" onClick={() => setEd(null)}>Cancelar</button><button className="btn btn-teal" onClick={() => hacer(async () => { await guardarPlantilla(ed.tipo, ed); setEd(null) }, 'Plantilla guardada')}>Guardar</button></>}>
          <div className="fs">
            <label>Título<input id="pl-tit" value={ed.titulo} onChange={(e) => setEd({ ...ed, titulo: e.target.value })} /></label>
            <label>Texto<textarea id="pl-txt" rows={22} className="doc-edit" value={ed.contenido} onChange={(e) => setEd({ ...ed, contenido: e.target.value })} /></label>
            <p className="note">Variables: {VARIABLES_DOC.join('  ')}. Lo que edites aplica a los documentos que envíes desde ahora; los ya enviados no cambian.</p>
          </div>
        </Drawer>
      )}
      {ver && <VerDoc doc={ver} onClose={() => setVer(null)} />}
    </>
  )
}

/* Vendedora: firmar documentos */
function Firmar({ data, email, hacer }) {
  const mios = (data.documentos || []).filter((d) => d.vendedor === email)
  const pend = mios.filter((d) => d.estado === 'enviado')
  const firmados = mios.filter((d) => d.estado === 'firmado')
  const [ver, setVer] = useState(null)
  return (
    <>
      <Seccion titulo="Firmar" ayuda="Aquí te llegan tu contrato y tu acuerdo de confidencialidad. Léelos completos y fírmalos." />
      {data.documentosError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. {data.documentosError}</p>}
      {!pend.length && <div className="vacio"><p>No tienes documentos por firmar 🎉</p></div>}
      {pend.map((d) => <FirmaCard key={d.id} d={d} hacer={hacer} />)}
      {firmados.length > 0 && <>
        <h3>Ya firmados</h3>
        <ul className="pend">{firmados.map((d) => (
          <li key={d.id}><span>✅</span><div><b>{d.titulo}</b><small>Firmado el {fechaCorta(d.firmado_en)}</small></div><span className="acc"><button className="btn btn-line sm" onClick={() => setVer(d)}>Ver</button></span></li>
        ))}</ul>
      </>}
      {ver && <VerDoc doc={ver} onClose={() => setVer(null)} />}
    </>
  )
}
function FirmaCard({ d, hacer }) {
  const [ok, setOk] = useState(false)
  const [nombre, setNombre] = useState('')
  return (
    <article className="firma-card">
      <h3>{d.titulo}</h3>
      {d.fecha_inicio && <small>Periodo: {fechaCorta(d.fecha_inicio)} → {d.fecha_fin ? fechaCorta(d.fecha_fin) : '…'}</small>}
      <pre className="doc-txt">{d.contenido}</pre>
      <label className="chk"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> He leído el documento completo y acepto sus términos.</label>
      <label>Escribe tu nombre completo para firmar<input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombres y apellidos" /></label>
      <button className="btn btn-teal" disabled={!ok || nombre.trim().length < 5} onClick={() => hacer(() => firmarDocumento(d.id, nombre), 'Documento firmado ✅')}>Firmar</button>
      <small>Quedan registrados tu nombre, la fecha y hora, y una huella digital del texto.</small>
    </article>
  )
}

/* Vendedora: plan de trabajo y funciones */
function PlanTrabajo({ data, email }) {
  const t = armarTrabajadores(data).find((x) => x.email === email) || { nombre: email }
  const pl = plantillaDe(data, 'plan')
  const vars = { nombre: t.nombre, documento: t.documento, email, sueldo: soles(t.sueldo_base), bono: soles(t.bono_pasajes), fecha_inicio: t.fecha_inicio ? fechaLarga(t.fecha_inicio) : '', mes: '', fecha_envio: '' }
  return (
    <>
      <Seccion titulo="Plan de trabajo" ayuda="Tus funciones y reglas. Léelo cada vez que tengas dudas." />
      <pre className="doc-txt plan">{renderDoc(pl.contenido, vars)}</pre>
    </>
  )
}


/* ================= ALERTAS DE VENTA ================= */
function AlertasVenta({ data, email, gerente }) {
  const { vacantes, gruposAdmin } = alertasVenta(data, gerente ? '' : email)
  if (!vacantes.length && !gruposAdmin.length) return null
  const etiqueta = { retirar: '🚫 Retirar', hoy: '⏰ Hoy', pronto: '📅 Pronto' }
  return (
    <div className="alertas">
      {vacantes.map((v, i) => (
        <p key={i} className={`alerta ${v.nivel === 'retirar' ? 'rojo' : ''}`}>
          <b>{etiqueta[v.nivel]} · {v.alumno}</b> debe {fmtMoneda(v.saldo, v.moneda)} ({v.grupo || 'curso'} empieza {fechaCorta(v.inicio)}). {v.txt}
          {v.celular && <> <a href={wa(v.celular)} target="_blank" rel="noopener noreferrer">Escribirle</a></>}
        </p>
      ))}
      {gruposAdmin.length > 0 && <p className="alerta"><b>🔒 Falta dejar en «solo admins»</b> el grupo de WhatsApp de: {gruposAdmin.map((g) => g.codigo).join(', ')}. Nadie debe escribir hasta antes del curso.</p>}
    </div>
  )
}

/* ================= QUEJAS Y RECLAMOS ================= */
const TIPO_QUEJA = { queja: 'Queja', reclamo: 'Reclamo', problema: 'Problema de alumno' }
function Quejas({ data, hacer, gerente, email }) {
  const [form, setForm] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [atender, setAtender] = useState(null)
  const lista = (data.quejas || []).filter((q) => gerente || q.vendedor === email)
  const msg = (q) => `🚨 ${TIPO_QUEJA[q.tipo] || 'Queja'} — aviso inmediato\nAlumno: ${q.alumno || 'sin nombre'}${q.celular ? ' (' + q.celular + ')' : ''}\n${q.detalle}\nReporta: ${(q.vendedor || email || '').split('@')[0]}`
  const linkAviso = (q) => `https://wa.me/${String(numeroGerencia()).replace(/\D/g, '')}?text=${encodeURIComponent(msg(q))}`
  return (
    <>
      <Seccion titulo="Quejas y reclamos" ayuda={gerente ? 'Lo que reporta tu equipo. Atiéndelo y márcalo como atendido.' : 'Si un alumno se queja o reclama, regístralo aquí Y avisa de inmediato a gerencia. Si es un problema de un alumno, consulta siempre con gerencia cómo solucionarlo.'}>
        {!gerente && <button className="btn btn-teal" onClick={() => setForm({ tipo: 'queja', alumno: '', celular: '', detalle: '' })}>+ Reportar</button>}
      </Seccion>
      {data.quejasError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. {data.quejasError}</p>}
      {!lista.length && <div className="vacio"><p>No hay quejas ni reclamos registrados.</p></div>}
      <ul className="pend">
        {lista.map((q) => (
          <li key={q.id} className={q.estado === 'nueva' ? 'vencido' : 'hecho'}>
            <span>{q.estado === 'nueva' ? '🚨' : '✅'}</span>
            <div>
              <b>{TIPO_QUEJA[q.tipo]} · {q.alumno || 'sin nombre'}</b>
              <small>{q.detalle}</small>
              <small>{gerente && <>Reporta {(q.vendedor || '').split('@')[0]} · </>}{fechaCorta(q.creado)}{q.celular && <> · <a href={wa(q.celular)} target="_blank" rel="noopener noreferrer">{q.celular}</a></>}</small>
              {q.nota_gerencia && <small><b>Gerencia:</b> {q.nota_gerencia}</small>}
            </div>
            <span className="acc">
              {!gerente && q.estado === 'nueva' && <a className="btn btn-line sm" href={linkAviso(q)} target="_blank" rel="noopener noreferrer">Avisar a gerencia</a>}
              {gerente && q.estado === 'nueva' && <button className="btn btn-teal sm" onClick={() => setAtender({ id: q.id, nota: '' })}>Atendido</button>}
            </span>
          </li>
        ))}
      </ul>
      {form && (
        <Drawer titulo="Reportar queja o reclamo" onClose={() => setForm(null)}
          pie={<><button className="btn btn-line" onClick={() => setForm(null)}>Cancelar</button><button className="btn btn-teal" onClick={() => hacer(async () => { const r = await guardarQueja(form); setForm(null); setAviso(r) }, 'Registrado. Ahora avisa a gerencia 👇')}>Registrar</button></>}>
          <div className="fs">
            <label>Tipo<select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{Object.entries(TIPO_QUEJA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Alumno<input id="q-al" value={form.alumno} onChange={(e) => setForm({ ...form, alumno: e.target.value })} /></label>
            <label>Celular<input value={form.celular} inputMode="tel" onChange={(e) => setForm({ ...form, celular: e.target.value })} /></label>
            <label>¿Qué pasó?<textarea id="q-det" rows={5} value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} /></label>
            <p className="note">Al registrar te saldrá el botón para avisar a gerencia por WhatsApp. El aviso es obligatorio e inmediato.</p>
          </div>
        </Drawer>
      )}
      {aviso && (
        <Drawer titulo="Avisa ahora a gerencia" onClose={() => setAviso(null)} pie={<button className="btn btn-line" onClick={() => setAviso(null)}>Ya avisé</button>}>
          <p className="alerta rojo"><b>Falta un paso:</b> la queja ya quedó registrada, pero gerencia debe enterarse <b>de inmediato</b>.</p>
          <a className="btn btn-teal" href={linkAviso(aviso)} target="_blank" rel="noopener noreferrer">Avisar por WhatsApp a gerencia</a>
        </Drawer>
      )}
      {atender && (
        <Drawer titulo="Marcar como atendido" onClose={() => setAtender(null)}
          pie={<><button className="btn btn-line" onClick={() => setAtender(null)}>Cancelar</button><button className="btn btn-teal" onClick={() => hacer(async () => { await atenderQueja(atender.id, atender.nota); setAtender(null) }, 'Marcado como atendido')}>Guardar</button></>}>
          <label>Nota (qué se hizo / qué debe hacer la vendedora)<textarea rows={4} value={atender.nota} onChange={(e) => setAtender({ ...atender, nota: e.target.value })} /></label>
        </Drawer>
      )}
    </>
  )
}

/* ================= INSCRITOS (alumnos, matrículas y pagos) ================= */
const soles = (n) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
/* Soles y dólares nunca se suman: si hay dólares se muestran aparte, sin tipo de cambio */
const dosMon = (t) => (t.USD > 0 ? (t.PEN > 0 ? `${soles(t.PEN)} + ${fmtMoneda(t.USD, 'USD')}` : fmtMoneda(t.USD, 'USD')) : soles(t.PEN))
const METODOS = ['Yape', 'Plin', 'Transferencia', 'PayPal', 'Efectivo', 'Tarjeta', 'Otro']
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

function InscripcionForm({ inicial, data, onSave, onClose, gerente }) {
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

function PagoForm({ insc, onSave, onClose }) {
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

function Inscritos({ data, hacer, rol, nuevaInscripcion, registrarPago }) {
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

/* ================= AJUSTES ================= */
function Ajustes({ data, hacer }) {
  const [num, setNum] = useState(data.ajustes?.whatsapp || '')
  useEffect(() => { setNum(data.ajustes?.whatsapp || '') }, [data.ajustes?.whatsapp])
  const [pct, setPct] = useState(data.ajustes?.descuento_max_pct ?? '')
  useEffect(() => { setPct(data.ajustes?.descuento_max_pct ?? '') }, [data.ajustes?.descuento_max_pct])
  const pctNum = Number(pct)
  const pctValido = pct === '' || (pctNum >= 0 && pctNum <= 50)
  const limpio = num.replace(/\D/g, '')
  const valido = limpio.length >= 10
  return (
    <>
      <Seccion titulo="Ajustes" ayuda="El número de WhatsApp de CCN que usa la web y el descuento libre de las vendedoras." />
      <div className="fs" style={{ maxWidth: 520 }}>
        <label>Descuento libre de las vendedoras (% máximo)
          <input id="a-desc" type="number" min="0" max="50" step="1" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="Ej. 10 · vacío o 0 = no hay descuento libre" />
        </label>
        <p className="note">Es el último recurso para cerrar una venta: la vendedora siempre ofrece primero el precio de la página. Hasta este porcentaje no necesita autorización; si pasa, el sistema le pide la autorización de gerencia. Aplica igual en soles y en dólares.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <button className="btn btn-teal" disabled={!pctValido}
            onClick={() => hacer(async () => { await saveAjuste('descuento_max_pct', pct === '' ? '0' : String(pctNum)) }, 'Descuento libre guardado')}>Guardar descuento</button>
        </div>
        {!pctValido && <p className="note err">Pon un número entre 0 y 50.</p>}
      </div>
      <div className="fs" style={{ maxWidth: 520 }}>
        <label>WhatsApp de CCN
          <input id="a-wa" inputMode="tel" value={num} onChange={(e) => setNum(e.target.value)} placeholder="51944485759" />
        </label>
        <p className="note">Con código de país y sin espacios. Ejemplo: 51944485759. Se verá como <b>{valido ? `+${limpio.length === 11 && limpio.startsWith('51') ? `51 ${limpio.slice(2, 5)} ${limpio.slice(5, 8)} ${limpio.slice(8)}` : limpio}` : '…'}</b>.</p>
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
  const vendido = sumaPorMoneda(vivas, (x) => x.precio, (x) => x.moneda)
  const cobrado = sumaPorMoneda(vivas, (x) => x.pagado, (x) => x.moneda)
  const porCobrar = sumaPorMoneda(vivas, (x) => x.saldo, (x) => x.moneda)
  const cupos = vivas.reduce((t, x) => t + x.activas.length, 0)
  const cursoDe = (id) => data.cursos.find((c) => String(c.id) === String(id))
  const hoy = new Date().toISOString().slice(0, 10)
  const en21 = new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10)

  const filas = data.grupos.filter((g) => g.codigo).sort((a, b) => a.codigo.localeCompare(b.codigo)).map((g) => {
    const ms = data.matriculas.filter((m) => String(m.grupo_id) === String(g.id) && m.estado === 'activa' && (!mes || String(m.fecha_inscripcion || '').slice(0, 7) === mes))
    const monDe = new Map(ms.map((m) => [m.id, m.moneda === 'USD' ? 'USD' : 'PEN']))
    const pagado = sumaPorMoneda(data.pagos.filter((p) => monDe.has(p.matricula_id)), (p) => p.monto, (p) => monDe.get(p.matricula_id))
    const precio = sumaPorMoneda(ms, (m) => m.precio, (m) => (m.moneda === 'USD' ? 'USD' : 'PEN'))
    const saldo = { PEN: Math.max(0, precio.PEN - pagado.PEN), USD: Math.max(0, precio.USD - pagado.USD) }
    return { g, c: cursoDe(g.curso_id), n: g.inscritos || 0, vendido: precio, cobrado: pagado, saldo }
  })
  const alertas = data.grupos.filter((g) => g.estado === 'abierto' && g.inicio && g.inicio >= hoy && g.inicio <= en21 && (g.inscritos || 0) < (g.minimo || 5))
  const llenos = data.grupos.filter((g) => g.estado === 'lleno')
  const nuevos = (data.interesados || []).filter((x) => x.estado === 'nuevo').length
  const intMes = (data.interesados || []).filter((x) => !mes || String(x.creado || '').slice(0, 7) === mes)
  const correos = [...new Set([...(data.equipo || []).filter((e) => e.rol === 'vendedora').map((e) => e.email), ...vivas.map((x) => x.vendedor).filter(Boolean)])]
  const porVendedor = correos.map((email) => {
    const mias = vivas.filter((x) => x.vendedor === email)
    return { email, prospectos: (data.prospectos || []).filter((p) => p.vendedor === email).length,
      derivados: intMes.filter((x) => x.asignado_a === email).length,
      contactados: intMes.filter((x) => x.asignado_a === email && x.estado !== 'nuevo').length,
      cupos: mias.reduce((t, x) => t + x.activas.length, 0), vendido: sumaPorMoneda(mias, (x) => x.precio, (x) => x.moneda), cobrado: sumaPorMoneda(mias, (x) => x.pagado, (x) => x.moneda) }
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
        <div><b>{dosMon(vendido)}</b><span>vendido</span></div>
        <div><b>{dosMon(cobrado)}</b><span>cobrado</span></div>
        <div><b>{dosMon(porCobrar)}</b><span>por cobrar</span></div>
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
                <tr key={v.email}><td><b>{v.email.split('@')[0]}</b></td><td>{v.derivados}</td><td>{v.contactados}</td><td>{v.derivados - v.contactados}</td><td>{v.prospectos}</td><td>{v.cupos}</td><td>{dosMon(v.vendido)}</td><td>{dosMon(v.cobrado)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
      {(alertas.length > 0 || llenos.length > 0) && (
        <div className="alertas">
          {alertas.map((g) => <p key={g.id} className="alerta"><b>{g.codigo}</b> {cursoDe(g.curso_id)?.titulo} empieza el {fechaCorta(g.inicio)} con {g.inscritos || 0} de {g.minimo || 5} inscritos.</p>)}
          {llenos.map((g) => <p key={g.id} className="alerta ok"><b>{g.codigo}</b> {cursoDe(g.curso_id)?.titulo} está lleno.</p>)}
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
                  <td><div className="barra" title={`${n} de ${g.minimo || 5} mínimo`}><i style={{ width: `${Math.min(100, (n / (g.minimo || 5)) * 100)}%` }} /></div><small>{n}/{g.minimo || 5} mín. · máx. {g.maximo || 20}</small></td>
                  <td>{dosMon(v)}</td><td>{dosMon(co)}</td><td>{saldo.PEN > 0 || saldo.USD > 0 ? dosMon(saldo) : '—'}</td>
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
      <Seccion titulo="Equipo" ayuda="Quién entra al panel y qué ve. Gerente: todo. Vendedora: solo Ventas (si hoy hace de asistente académico, actívale ese permiso en la última columna). Asistente académico: solo el módulo Académico (grupos, profesor, accesos, T1/T2 y certificados), sin pagos ni tarifas. Profesor: solo sus grupos (alumnos y asistencia). Al profesor también hay que ponerlo en Trabajadores (con el mismo correo) y asignarle su grupo." />
      {!hasBackend && <p className="banner">En modo demostración esto es solo de práctica.</p>}
      <div className="cons-wrap" style={{ maxWidth: 760 }}>
        <table className="cons-table" style={{ minWidth: 0 }}>
          <thead><tr><th>Correo</th><th>Rol</th><th>Recibe interesados</th><th>Hace de asistente académico</th><th /></tr></thead>
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
                <td>{a.rol === 'vendedora' ? <Switch on={!!a.coordina} label={`Hace de asistente académico: ${a.email}`} onChange={(v) => hacer(() => ponerCoordina(a.email, v), v ? 'Verá el módulo Académico' : 'Ya no verá el módulo Académico')} /> : (a.rol === 'gerente' || !a.rol ? 'Sí (todo)' : a.rol === 'asistente' ? 'Es su puesto' : '—')}</td>
                <td>{a.email !== email && <button className="ib red" onClick={() => setQuitando(a)} aria-label="Quitar"><Icon n="trash" /></button>}</td>
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

/* ================= GERENCIA: HORAS TRABAJADAS (jornadas) ================= */
const DIAS_ABR = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const CIERRE_TXT = { manual: 'Terminó ella', tope: 'Llegó al tope', sin_senal: 'Sin señal', gerente: 'Corregida' }
const aLocal = (iso) => { if (!iso) return ''; const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` }

function JornadaForm({ j, onClose, onSave }) {
  const [f, setF] = useState({ inicio: aLocal(j.inicio), fin: aLocal(j.fin || j.ultimo_pulso), nota: j.nota || '' })
  const mal = !f.inicio || !f.fin || new Date(f.fin) <= new Date(f.inicio)
  return (
    <Drawer titulo="Corregir jornada" onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" disabled={mal} onClick={() => onSave({ id: j.id, inicio: new Date(f.inicio).toISOString(), fin: new Date(f.fin).toISOString(), estado: 'cerrada', cierre: 'gerente', nota: f.nota })}>Guardar</button></>}>
      <div className="fs">
        <p className="note">{(j.vendedor || '').split('@')[0]} · solo tú puedes cambiar las horas.</p>
        <label>Inicio<input type="datetime-local" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></label>
        <label>Fin<input type="datetime-local" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></label>
        {mal && <p className="err">El fin debe ser después del inicio.</p>}
        <label>Motivo de la corrección<textarea rows={2} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} /></label>
      </div>
    </Drawer>
  )
}

function Horas({ data, hacer }) {
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const [edit, setEdit] = useState(null)
  const [borrar, setBorrar] = useState(null)
  const ahora = new Date()
  const correos = [...new Set([...(data.equipo || []).filter((e) => e.rol === 'vendedora').map((e) => e.email), ...(data.jornadas || []).map((j) => j.vendedor)])]
  const filas = correos.map((c) => ({ email: c, ...semanaHoras(data, c, lunes, ahora) }))
  const todas = semanaHoras(data, null, lunes, ahora).jornadas
  const mover = (n) => setLunes((l) => { const x = new Date(l); x.setDate(x.getDate() + n * 7); return x })
  const dom = new Date(lunes); dom.setDate(dom.getDate() + 6)
  const f = (d) => d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
  const esActual = lunesDe(new Date()).getTime() === lunes.getTime()
  const hora = (iso) => new Date(iso).toLocaleString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <>
      <Seccion titulo="Horas trabajadas" ayuda="Lo que registra cada vendedora con Iniciar y Terminar jornada. Mínimo: 24 horas por semana (4 h al día, lunes a sábado). Puede trabajar más.">
        <button className="btn btn-line" onClick={() => mover(-1)} aria-label="Semana anterior">‹ Anterior</button>
        <button className="btn btn-line" disabled={esActual} onClick={() => setLunes(lunesDe(new Date()))}>Esta semana</button>
        <button className="btn btn-line" disabled={esActual} onClick={() => mover(1)} aria-label="Semana siguiente">Siguiente ›</button>
      </Seccion>
      {data.jornadasError && <p className="banner">Falta activar esta sección: pega de nuevo supabase/crm.sql en Supabase (SQL Editor). Detalle: {data.jornadasError}</p>}
      <p className="note"><b>Semana del {f(lunes)} al {f(dom)}</b></p>
      {filas.length === 0 ? <div className="vacio"><p>Aún no hay vendedoras.</p></div> : (
        <div className="cons-wrap"><table className="cons-table insc">
          <thead><tr><th>Vendedora</th>{DIAS_ABR.map((d) => <th key={d}>{d}</th>)}<th>Total</th><th>Mínimo (24 h)</th><th>Ahora</th></tr></thead>
          <tbody>{filas.map((r) => {
            const abierta = r.jornadas.find((j) => j.estado === 'abierta' && !j.fin)
            const sin = abierta && jornadaSinSenal(abierta, ahora)
            return (
              <tr key={r.email}>
                <td><b>{r.email.split('@')[0]}</b></td>
                {r.dias.map((m, i) => <td key={i}>{m ? fmtHM(m).replace(' min', 'm').replace(' h ', 'h ') : '—'}</td>)}
                <td><b>{fmtHM(r.total)}</b></td>
                <td style={{ minWidth: 150 }}><div className="barra"><i style={{ width: `${Math.min(100, (r.total / MINIMO_SEMANA_MIN) * 100)}%` }} /></div><small>{Math.round((r.total / MINIMO_SEMANA_MIN) * 100)}% del mínimo{r.total >= MINIMO_SEMANA_MIN ? ' · cumplido' : ` · faltan ${fmtHM(MINIMO_SEMANA_MIN - r.total)}`}</small></td>
                <td>{abierta ? (sin ? <span className="wa falta">Sin señal</span> : <span className="pill pagado">En jornada</span>) : '—'}</td>
              </tr>
            )
          })}</tbody>
        </table></div>
      )}
      <h3 className="subh">Detalle de jornadas</h3>
      {todas.length === 0 ? <div className="vacio"><p>No hay jornadas esta semana.</p></div> : (
        <div className="cons-wrap"><table className="cons-table insc">
          <thead><tr><th>Vendedora</th><th>Inicio</th><th>Fin</th><th>Duración</th><th>Cierre</th><th>Equipo</th><th>Nota</th><th /></tr></thead>
          <tbody>{todas.map((j) => {
            const abierta = j.estado === 'abierta' && !j.fin
            return (
              <tr key={j.id}>
                <td><b>{(j.vendedor || '').split('@')[0]}</b></td>
                <td>{hora(j.inicio)}</td>
                <td>{abierta ? (jornadaSinSenal(j, ahora) ? 'Sin señal' : 'En curso') : hora(j.fin)}</td>
                <td>{fmtHM(minutosJornada(j, ahora))}</td>
                <td>{abierta ? '—' : (CIERRE_TXT[j.cierre] || j.cierre || '—')}</td>
                <td className="notas">{j.dispositivo || '—'}</td>
                <td className="notas">{j.nota || '—'}</td>
                <td className="acc"><button className="btn btn-line sm" onClick={() => setEdit(j)}>Corregir</button> <button className="ib red" aria-label="Borrar jornada" onClick={() => setBorrar(j)}><Icon n="trash" /></button></td>
              </tr>
            )
          })}</tbody>
        </table></div>
      )}
      <p className="note">Las 24 h son un mínimo: después puede seguir respondiendo WhatsApp y vendiendo (las ventas cuentan para su comisión). Las horas las registra el sistema, no ella. Una jornada sin señal por más de 15 minutos se cuenta solo hasta su último aviso. Esto es un registro, no una vigilancia: no sabemos qué hace en la laptop.</p>
      {edit && <JornadaForm j={edit} onClose={() => setEdit(null)} onSave={async (fila) => { await hacer(() => save('jornadas', fila), 'Jornada corregida'); setEdit(null) }} />}
      {borrar && <Confirmar texto="¿Borrar esta jornada? Sus horas dejarán de contar." onNo={() => setBorrar(null)} onSi={() => { const j = borrar; setBorrar(null); hacer(() => remove('jornadas', j.id), 'Jornada borrada') }} />}
    </>
  )
}

/* ================= GERENCIA: ACCESOS (solo gerente) ================= */
function AccesoForm({ inicial, onCerrar, onGuardar }) {
  const [f, setF] = useState(inicial || { servicio: '', categoria: CATEGORIAS_ACCESO[0], url: '', usuario: '', clave: '', notas: '' })
  const [ver, setVer] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <Drawer titulo={f.id ? 'Editar acceso' : 'Nuevo acceso'} onClose={onCerrar}
      pie={<><button className="btn btn-line" onClick={onCerrar}>Cancelar</button><button className="btn btn-teal" disabled={!f.servicio.trim()} onClick={() => onGuardar({ ...f, servicio: f.servicio.trim() })}>Guardar</button></>}>
      <div className="fs">
        <div className="g2">
          <label>Servicio<input id="ac-serv" value={f.servicio} onChange={set('servicio')} placeholder="Ej. Vercel" /></label>
          <label>Categoría<select value={f.categoria} onChange={set('categoria')}>{CATEGORIAS_ACCESO.map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        <label>Enlace de ingreso<input id="ac-url" value={f.url} onChange={set('url')} placeholder="https://…" /></label>
        <label>Usuario o correo<input id="ac-user" value={f.usuario} onChange={set('usuario')} autoComplete="off" /></label>
        <label>Contraseña<span className="fila-brochure"><input id="ac-clave" type={ver ? 'text' : 'password'} value={f.clave} onChange={set('clave')} autoComplete="new-password" /><button type="button" className="btn btn-line sm" onClick={() => setVer(!ver)}>{ver ? 'Ocultar' : 'Ver'}</button></span></label>
        <label>Notas (códigos de recuperación, quién más tiene acceso…)<textarea rows={3} value={f.notas} onChange={set('notas')} /></label>
      </div>
    </Drawer>
  )
}

function Accesos({ data, hacer }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('todas')
  const [form, setForm] = useState(null)
  const [visible, setVisible] = useState({})
  const [borrar, setBorrar] = useState(null)
  const lista = (data.accesos || []).filter((a) => (cat === 'todas' || a.categoria === cat) && `${a.servicio} ${a.usuario} ${a.notas}`.toLowerCase().includes(q.toLowerCase()))
  const copiar = async (txt, msg) => { try { await navigator.clipboard.writeText(txt); hacer(async () => {}, msg) } catch { hacer(async () => { throw new Error('No se pudo copiar') }) } }
  return (
    <>
      <Seccion titulo="Accesos" ayuda="Cuentas y contraseñas de CCN. Solo tú (gerente) puedes ver esta sección.">
        <button className="btn btn-teal" onClick={() => setForm({})}>+ Nuevo acceso</button>
      </Seccion>
      {data.accesosError && <p className="banner">Falta activar esta sección: pega de nuevo supabase/crm.sql en Supabase (SQL Editor). Detalle: {data.accesosError}</p>}
      <div className="filtros">
        <input aria-label="Buscar acceso" placeholder="Buscar servicio o usuario…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Categoría" value={cat} onChange={(e) => setCat(e.target.value)}><option value="todas">Todas las categorías</option>{CATEGORIAS_ACCESO.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      {lista.length === 0 ? <div className="vacio"><p>{(data.accesos || []).length ? 'Nada coincide con la búsqueda.' : 'Aún no guardas ningún acceso.'}</p></div> : (
        <div className="cons-wrap"><table className="cons-table insc">
          <thead><tr><th>Servicio</th><th>Usuario</th><th>Contraseña</th><th>Notas</th><th /></tr></thead>
          <tbody>{lista.map((a) => (
            <tr key={a.id}>
              <td><b>{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.servicio}</a> : a.servicio}</b><small className="paq">{a.categoria}</small></td>
              <td>{a.usuario ? <>{a.usuario} <button className="ib" aria-label={`Copiar usuario de ${a.servicio}`} onClick={() => copiar(a.usuario, 'Usuario copiado')}><Icon n="clip" /></button></> : '—'}</td>
              <td>{a.clave ? <><span className="cod">{visible[a.id] ? a.clave : '••••••••'}</span> <button className="btn btn-line sm" onClick={() => setVisible({ ...visible, [a.id]: !visible[a.id] })}>{visible[a.id] ? 'Ocultar' : 'Ver'}</button> <button className="ib" aria-label={`Copiar contraseña de ${a.servicio}`} onClick={() => copiar(a.clave, 'Contraseña copiada')}><Icon n="clip" /></button></> : '—'}</td>
              <td className="notas">{a.notas || '—'}</td>
              <td className="acc"><button className="btn btn-line sm" onClick={() => setForm(a)}>Editar</button> <button className="ib red" aria-label="Borrar" onClick={() => setBorrar(a)}><Icon n="trash" /></button></td>
            </tr>))}</tbody>
        </table></div>
      )}
      <p className="note">Consejo: activa la verificación en dos pasos en tu cuenta de gerente, porque quien entre con ella ve todo esto. Para cuentas bancarias, mejor usa un gestor de contraseñas.</p>
      {form && <AccesoForm inicial={form.id ? form : null} onCerrar={() => setForm(null)} onGuardar={async (f) => { await hacer(() => save('accesos', f), f.id ? 'Acceso actualizado' : 'Acceso guardado'); setForm(null) }} />}
      {borrar && <Confirmar texto={`¿Borrar el acceso de ${borrar.servicio}?`} onNo={() => setBorrar(null)} onSi={() => { const a = borrar; setBorrar(null); hacer(() => remove('accesos', a.id), 'Acceso borrado') }} />}
    </>
  )
}

/* ================= GERENCIA: FICHA POR CURSO ================= */
const TABS_CURSO = [['resumen', 'Resumen'], ['interesados', 'Interesados'], ['inscritos', 'Inscritos'], ['grupos', 'Grupos'], ['info', 'Información'], ['historial', 'Historial']]
const ESTADO_PAGO = { pagado: 'Pagado', adelanto: 'Adelanto', pendiente: 'Sin pago', anulada: 'Anulada' }

function FichaCurso({ data, curso, hacer, onVolver, abrirGrupo, editarGrupo, irWeb }) {
  const [tab, setTab] = useState('resumen')
  const [brochure, setBrochure] = useState(curso.brochure_url || '')
  const m = useMemo(() => metricasCurso(data, curso.id), [data, curso.id])
  const corto = (x) => new Date(x + '-01T00:00:00').toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
  const cuando = (iso) => iso ? new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
  const waDe = (g) => (data.gruposWa || []).find((w) => String(w.grupo_id) === String(g.id))
  const profeDe = (g) => { const a = (data.asignaciones || []).find((x) => String(x.grupo_id) === String(g.id)); return a ? (data.trabajadores || []).find((t) => t.id === a.trabajador_id) : null }
  const nGrupo = (id) => (data.grupos || []).find((g) => String(g.id) === String(id))?.codigo || ''
  const fecha = (f) => f ? new Date(String(f).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'

  return (
    <>
      <button className="btn btn-line sm" onClick={onVolver}><Icon n="back" size={13} /> Cursos</button>
      <Seccion titulo={curso.titulo} ayuda={`${curso.horas} h · ${curso.sesiones} sesiones · ${soles(curso.precio)}${curso.activo === false ? ' · oculto en la web' : ''}`}>
        <button className="btn btn-line" onClick={() => abrirGrupo(curso.id)}>+ Abrir grupo</button>
        <button className="btn btn-teal" onClick={irWeb}>Editar curso</button>
      </Seccion>
      <div className="tabs2" role="tablist" aria-label="Secciones del curso">
        {TABS_CURSO.map(([k, n]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{n}{k === 'interesados' ? <em>{m.ints.length}</em> : k === 'inscritos' ? <em>{m.cupos}</em> : k === 'grupos' ? <em>{m.grupos.length}</em> : null}</button>)}
      </div>

      {tab === 'resumen' && (
        <>
          <div className="kpis">
            <div><b>{m.abiertos}</b><span>grupos abiertos</span></div>
            <div><b>{m.ints.length}</b><span>interesados</span></div>
            <div><b>{m.cupos}</b><span>inscritos</span></div>
            <div><b>{dosMon({ PEN: m.vendido, USD: m.vendidoUSD })}</b><span>vendido</span></div>
            <div><b>{dosMon({ PEN: m.cobrado, USD: m.cobradoUSD })}</b><span>cobrado</span></div>
            <div><b>{dosMon({ PEN: m.porCobrar, USD: m.porCobrarUSD })}</b><span>por cobrar</span></div>
            <div><b>{soles(m.ticket)}</b><span>ticket promedio</span></div>
          </div>
          <div className="av-grid">
            <section><h3>Inscritos por mes</h3><Barras datos={m.serie.map((s) => ({ label: corto(s.mes), cupos: s.cupos }))} series={[{ key: 'cupos', nombre: 'Inscritos', color: 'var(--teal)' }]} /></section>
            <section><h3>Vendido por mes</h3><Barras datos={m.serie.map((s) => ({ label: corto(s.mes), vendido: s.vendido }))} formato={soles} series={[{ key: 'vendido', nombre: 'Vendido', color: 'var(--navy-2, #3a5a94)' }]} /></section>
            <section><h3>Interesado a inscrito</h3>
              <Embudo pasos={[{ label: 'Interesados', valor: m.ints.length, color: '#3a5a94' }, { label: 'Contactados', valor: m.contactados, color: '#2b8cc4' }, { label: 'Inscritos', valor: m.cupos, color: '#0f9e8b' }]} />
            </section>
            <section><h3>Cupos por grupo</h3>
              {m.grupos.length === 0 ? <p className="note">Aún no hay grupos.</p> : <Barras datos={m.grupos.map((g) => ({ label: g.codigo || '—', inscritos: g.inscritos || 0, minimo: g.minimo || 5 }))} series={[{ key: 'inscritos', nombre: 'Inscritos', color: 'var(--teal)' }, { key: 'minimo', nombre: 'Mínimo', color: '#B7C2D3' }]} />}
            </section>
          </div>
        </>
      )}

      {tab === 'interesados' && (m.ints.length === 0 ? <div className="vacio"><p>Nadie se ha inscrito por la web a este curso todavía.</p></div> : (
        <div className="cons-wrap"><table className="cons-table insc">
          <thead><tr><th>Fecha</th><th>Interesado</th><th>Celular</th><th>Derivado a</th><th>Estado</th><th>¿Contestó?</th><th>Observación</th></tr></thead>
          <tbody>{m.ints.map((x) => (
            <tr key={x.id}>
              <td>{cuando(x.creado).split(',')[0]}</td>
              <td><b>{x.nombres} {x.apellido_paterno}</b>{x.lista_espera && <small className="paq">Lista de espera</small>}</td>
              <td><a href={wa(x.celular)} target="_blank" rel="noopener noreferrer">{x.celular}</a></td>
              <td>{(x.asignado_a || '').split('@')[0] || 'Sin derivar'}</td>
              <td>{x.estado === 'nuevo' ? 'Pendiente' : `Atendido${x.contactado_por ? ' por ' + x.contactado_por.split('@')[0] : ''}`}</td>
              <td>{x.contesto === true ? 'Sí' : x.contesto === false ? 'No' : '—'}</td>
              <td className="notas">{x.observacion || '—'}</td>
            </tr>))}</tbody>
        </table></div>
      ))}

      {tab === 'inscritos' && (m.filas.length === 0 ? <div className="vacio"><p>Aún no hay inscritos en este curso.</p></div> : (
        <div className="cons-wrap"><table className="cons-table insc">
          <thead><tr><th>Fecha</th><th>Alumno</th><th>Grupo</th><th>Vendedor</th><th>Precio</th><th>Pagado</th><th>Saldo</th><th>Estado</th></tr></thead>
          <tbody>{m.filas.map(({ m: x, a, pagado, saldo, estado }) => (
            <tr key={x.id} className={estado === 'anulada' ? 'anulada' : ''}>
              <td>{fecha(x.fecha_inscripcion)}</td>
              <td><b>{a.nombres} {a.apellido_paterno}</b>{a.codigo && <small className="paq"><span className="cod">{a.codigo}</span></small>}</td>
              <td><span className="cod">{x.grupo_codigo || '—'}</span></td>
              <td>{(x.vendedor || x.creado_por || '').split('@')[0] || '—'}</td>
              <td>{fmtMoneda(x.precio, x.moneda)}</td><td>{fmtMoneda(pagado, x.moneda)}</td><td>{saldo > 0 ? fmtMoneda(saldo, x.moneda) : '—'}</td>
              <td><span className={`pill ${estado}`}>{ESTADO_PAGO[estado]}</span></td>
            </tr>))}</tbody>
        </table></div>
      ))}

      {tab === 'grupos' && (m.grupos.length === 0 ? <div className="vacio"><p>Este curso aún no tiene grupos.</p><button className="btn btn-teal" onClick={() => abrirGrupo(curso.id)}>Abrir el primero</button></div> : (
        <div className="cons-wrap"><table className="cons-table insc">
          <thead><tr><th>Grupo</th><th>Inicio</th><th>Días y horario</th><th>Cupos</th><th>Estado</th><th>WhatsApp</th><th>Profesor</th><th /></tr></thead>
          <tbody>{m.grupos.map((g) => { const w = waDe(g); const t = profeDe(g); return (
            <tr key={g.id}>
              <td><span className="cod">{g.codigo || '—'}</span></td>
              <td>{fecha(g.inicio)}</td>
              <td>{g.dias || '—'}<small className="paq">{fmtHorario(g.horario || '')}</small></td>
              <td><div className="barra" title={`${g.inscritos || 0} de ${g.minimo || 5} mínimo`}><i style={{ width: `${Math.min(100, ((g.inscritos || 0) / (g.minimo || 5)) * 100)}%` }} /></div><small>{g.inscritos || 0}/{g.minimo || 5} mín. · máx. {g.maximo || 20}</small></td>
              <td>{g.estado === 'abierto' ? 'Abierto' : g.estado === 'lleno' ? 'Lleno' : 'Cerrado'}</td>
              <td>{w ? <a href={w.enlace} target="_blank" rel="noopener noreferrer">{w.nombre}</a> : <span className="wa falta">Falta crear</span>}</td>
              <td>{t ? t.nombre : <small>Sin asignar</small>}</td>
              <td className="acc"><button className="btn btn-line sm" onClick={() => editarGrupo(g)}>Editar</button></td>
            </tr>) })}</tbody>
        </table></div>
      ))}

      {tab === 'info' && (
        <div className="info-curso">
          <section className="fs">
            <h3>Datos del curso</h3>
            <dl className="dl">
              <dt>Duración</dt><dd>{curso.horas} h en {curso.sesiones} sesiones</dd>
              <dt>Precio</dt><dd>{soles(curso.precio)}{curso.precio_antes ? <> <small>(antes {soles(curso.precio_antes)})</small></> : ''}</dd>
              <dt>Visible en la web</dt><dd>{curso.activo === false ? 'No' : 'Sí'}{curso.destacado ? ' · destacado en inicio' : ''}</dd>
              <dt>Programas</dt><dd>{curso.programas || '—'}</dd>
              <dt>Descripción</dt><dd>{curso.descripcion || '—'}</dd>
              {curso.extra && <><dt>Incluye también</dt><dd>{curso.extra}</dd></>}
            </dl>
          </section>
          <section className="fs">
            <h3>Temario</h3>
            {(curso.temario || []).length === 0 ? <p className="note">Aún no tiene temario. Se agrega en Editar curso.</p> : <ol className="temario">{curso.temario.map((t, i) => <li key={i}>{t}</li>)}</ol>}
          </section>
          <section className="fs">
            <h3>Brochure</h3>
            <p className="note">Pega el enlace del brochure en PDF (Drive, Canva, etc.). Es solo para uso interno del equipo.</p>
            <div className="fila-brochure">
              <input id="br-url" value={brochure} onChange={(e) => setBrochure(e.target.value)} placeholder="https://…" />
              <button className="btn btn-teal" onClick={() => hacer(() => save('cursos', { id: curso.id, brochure_url: brochure.trim() }), 'Brochure guardado')}>Guardar</button>
              {curso.brochure_url && <a className="btn btn-line" href={curso.brochure_url} target="_blank" rel="noopener noreferrer">Abrir</a>}
            </div>
          </section>
        </div>
      )}

      {tab === 'historial' && (m.historial.length === 0 ? <div className="vacio"><p>Aún no hay movimientos de este curso.</p></div> : (
        <ul className="hist">{m.historial.slice(0, 80).map((h) => (
          <li key={h.id}><span className="tag">{h.tipo}</span><div>{h.detalle}{h.grupo_id && nGrupo(h.grupo_id) ? ` · ${nGrupo(h.grupo_id)}` : ''}<small>{cuando(h.creado)}{h.usuario ? ` · ${h.usuario.split('@')[0]}` : ''}</small></div></li>
        ))}</ul>
      ))}
    </>
  )
}

function CursosGerencia({ data, hacer, abrirGrupo, editarGrupo, irWeb }) {
  const [sel, setSel] = useState(null)
  const curso = sel ? data.cursos.find((c) => String(c.id) === String(sel)) : null
  if (curso) return <FichaCurso data={data} curso={curso} hacer={hacer} onVolver={() => setSel(null)} abrirGrupo={abrirGrupo} editarGrupo={editarGrupo} irWeb={irWeb} />
  return (
    <>
      <Seccion titulo="Cursos" ayuda="Entra a cada curso para ver sus interesados, inscritos, grupos, gráficas, información e historial." />
      <div className="cons-wrap">
        <table className="cons-table insc selec">
          <thead><tr><th>Curso</th><th>Grupos abiertos</th><th>Interesados</th><th>Inscritos</th><th>Vendido</th><th>Cobrado</th><th>Por cobrar</th></tr></thead>
          <tbody>
            {data.cursos.map((c) => {
              const m = metricasCurso(data, c.id)
              return (
                <tr key={c.id} onClick={() => setSel(c.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(c.id)}>
                  <td><span className="sw-c" style={{ background: `var(--${c.color})` }} /><b>{c.titulo}</b><small className="paq">{c.horas} h · {soles(c.precio)}{c.activo === false ? ' · oculto' : ''}</small></td>
                  <td>{m.abiertos}</td><td>{m.ints.length}</td><td>{m.cupos}</td><td>{dosMon({ PEN: m.vendido, USD: m.vendidoUSD })}</td><td>{dosMon({ PEN: m.cobrado, USD: m.cobradoUSD })}</td><td>{m.porCobrar > 0 || m.porCobrarUSD > 0 ? dosMon({ PEN: m.porCobrar, USD: m.porCobrarUSD }) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
  const [f, setF] = useState({ ...inicial, comision_tramos: tramosDe(inicial), metas: metasDe(inicial), cursos: (inicial.cursos || []).map(String) })
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setT = (i, k, v) => set('comision_tramos', f.comision_tramos.map((t, j) => (j === i ? { ...t, [k]: v } : t)))
  const setM = (i, k, v) => set('metas', f.metas.map((h, j) => (j === i ? { ...h, [k]: v } : h)))
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
            <label>Inicio de contrato<input id="tr-ini" type="date" value={f.fecha_inicio || ''} onChange={(e) => set('fecha_inicio', e.target.value)} /><small>Desde este día se calcula su pago (y los descuentos). Antes de esta fecha el sistema no calcula nada.</small></label>
            <label>Sueldo base mensual (S/)<input id="tr-sue" type="number" min="0" value={f.sueldo_base} onChange={(e) => set('sueldo_base', e.target.value)} /></label>
            <label>Bono de pasajes mensual (S/)<input id="tr-bono" type="number" min="0" value={f.bono_pasajes ?? 0} onChange={(e) => set('bono_pasajes', e.target.value)} /><small>Si se aumenta el sueldo, se sube el sueldo base y este bono se mantiene.</small></label>
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
            <div>
              <b>Metas (hitos acumulados desde su inicio)</b>
              <p className="note">Cada fila: fecha límite, cupos acumulados que debe llevar y en cuántos cursos distintos. Se ven en su panel con barra de avance.</p>
              {f.metas.map((h, i) => (
                <div className="g3" key={i}>
                  <label>Fecha<input type="date" value={h.fecha} onChange={(e) => setM(i, 'fecha', e.target.value)} /></label>
                  <label>Cupos<input type="number" min="1" value={h.cupos} onChange={(e) => setM(i, 'cupos', e.target.value)} /></label>
                  <label>Cursos<input type="number" min="1" value={h.cursos} onChange={(e) => setM(i, 'cursos', e.target.value)} /></label>
                </div>
              ))}
              <button type="button" className="btn btn-line sm" onClick={() => set('metas', [...f.metas, { fecha: '', cupos: 1, cursos: 1 }])}>+ Agregar meta</button>
              {f.metas.length > 0 && <button type="button" className="btn btn-line sm" onClick={() => set('metas', f.metas.slice(0, -1))}>Quitar la última</button>}
            </div>
          </>
        ) : (
          <>
            <label>Correo de acceso al panel del profesor
              <input id="tr-mail" type="email" autoComplete="off" value={f.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="profesor@correo.com" />
              <small>Al guardar, el sistema le da el rol Profesor automáticamente. Falta un solo paso: crear su usuario en Supabase → Authentication → Users (con Auto Confirm) con este mismo correo.</small>
            </label>
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
                        <button className="ib red" aria-label="Quitar del grupo" title="Quitar a este profesor del grupo" onClick={() => hacer(() => remove('asignaciones', a.id), 'Grupo desasignado')}><Icon n="x" size={13} /></button>
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
          return <li key={p.id}><span className="tag">Pago</span><div>{soles(p.monto)} · {p.metodo || 'sin método'}{g ? ` · ${g.codigo}` : ''}{p.nota ? ` — ${p.nota}` : ''}<small>{cuando(p.fecha)}</small></div></li>
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
  const nuevo = (puesto) => setForm({ nombre: '', puesto, cargo: '', email: '', documento: '', celular: '', sueldo_base: puesto === 'vendedor' ? SUELDO_DEF : 0, bono_pasajes: puesto === 'vendedor' ? BONO_PASAJES_DEF : 0, fecha_inicio: '', tarifa_hora: 0, cursos: [], comision_tramos: null, activo: true, notas: '' })
  const guardar = (f) => hacer(async () => {
    const mail = String(f.email || '').trim().toLowerCase()
    if (f.puesto === 'instructor' && mail) {
      if (!/^\S+@\S+\.\S+$/.test(mail)) throw new Error('Escribe un correo válido para el profesor.')
      const ya = (data.equipo || []).find((e) => e.email === mail)
      if (ya && ya.rol !== 'profesor') throw new Error(`Ese correo ya tiene el rol «${ya.rol}» en el equipo. Usa otro correo para el profesor.`)
      const otro = (data.trabajadores || []).find((x) => String(x.email || '').toLowerCase() === mail && x.id !== f.id)
      if (otro) throw new Error(`Ese correo ya está en la ficha de ${otro.nombre}.`)
      await guardarTrabajador({ ...f, email: mail, id: f.virtual ? undefined : f.id })
      if (!ya) await guardarMiembro({ email: mail, rol: 'profesor' })
    } else {
      await guardarTrabajador({ ...f, id: f.virtual ? undefined : f.id })
    }
    setForm(null); setSel(null)
  }, 'Guardado')
  const formEl = form && <TrabajadorForm inicial={form} equipo={data.equipo} cursos={data.cursos} onClose={() => setForm(null)} onSave={guardar} />

  const t = sel ? lista.find((x) => (x.id || x.email) === sel) : null
  if (t) {
    return (
      <>
        <button className="btn btn-line sm" onClick={() => setSel(null)}><Icon n="back" size={13} /> {PUESTOS[t.puesto] || 'Trabajadores'}</button>
        <Seccion titulo={t.nombre} ayuda={`${t.cargo || (t.puesto === 'instructor' ? 'Profesor' : 'Vendedor')}${t.puesto === 'vendedor' ? ` · sueldo base ${soles(t.sueldo_base)} + bono ${soles(t.bono_pasajes)} · ${t.fecha_inicio ? `contrato desde el ${fechaCorta(t.fecha_inicio)}` : 'SIN fecha de inicio de contrato'}` : ''}${t.activo === false ? ' · inactivo' : ''}`}>
          <button className="btn btn-teal" onClick={() => setForm(t)}>Editar datos</button>
          {!t.virtual && <button className="btn btn-line" onClick={() => setBorrando(t)}>Borrar</button>}
        </Seccion>
        {t.notas && <p className="note">{t.notas}</p>}
        {t.puesto === 'vendedor' && (t.email ? <AvanceVendedor data={data} email={t.email} trab={t} verPago historial={false} /> : <div className="vacio"><p>Esta persona no tiene correo de acceso asignado. Edita sus datos para vincularla.</p></div>)}
        {t.puesto === 'vendedor' && t.email && <DescuentosDe data={data} t={t} hacer={hacer} />}
        {t.puesto === 'vendedor' && t.email && <ReporteSemanal data={data} email={t.email} />}
        {t.puesto === 'vendedor' && t.email && <DocumentosDe data={data} t={t} hacer={hacer} />}
        {t.puesto === 'vendedor' && t.email && <PendientesDe data={data} email={t.email} hacer={hacer} />}
        {t.puesto === 'instructor' && (() => {
          const rolOk = (data.equipo || []).some((e) => e.rol === 'profesor' && e.email === t.email)
          const nG = (data.asignaciones || []).filter((a) => a.trabajador_id === t.id).length
          return <p className={rolOk && nG ? 'note' : 'banner'}>Acceso al panel del profesor: {t.email ? <b>{t.email}</b> : <b>sin correo</b>} · {rolOk ? '✅ rol Profesor activo' : '⚠️ aún no tiene el rol (edita sus datos y escribe su correo)'} · {nG ? `${nG} grupo${nG === 1 ? '' : 's'} asignado${nG === 1 ? '' : 's'}` : '⚠️ ningún grupo asignado (se asigna en Académico → Cronograma y accesos)'}. Si no ve sus grupos al entrar, revisa que su usuario exista en Supabase → Authentication con ese mismo correo.</p>
        })()}
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
              {mv && <><span><i>{mv.cupos}</i> cupos · {soles(mv.vendido)} vendido</span><span>{!x.fecha_inicio ? <i>Falta el inicio de contrato</i> : x.fecha_inicio > hoyISO() ? <>Contrato inicia el <i>{fechaCorta(x.fecha_inicio)}</i></> : <>A pagar este mes: <i>{soles(Math.max(0, mv.aPagar - descuentosVendedora(data, x.email, mes, x).total))}</i></>}</span></>}
              {x.puesto === 'instructor' && <span style={{ fontSize: 12 }}>{(data.equipo || []).some((e) => e.rol === 'profesor' && e.email === x.email) ? '✅ Con acceso al panel' : (x.email ? '⚠️ Falta darle acceso (crear su usuario)' : '⚠️ Sin correo de acceso')}</span>}
              {mp && <><span><i>{mp.cursos.length}</i> cursos · <i>{mp.nGrupos}</i> grupos · <i>{mp.horas} h</i></span><span>Pagado: <i>{soles(mp.totalPagado)}</i> · por pagar: <i>{soles(mp.porPagar)}</i></span></>}
            </button>
          )
        })}
      </div>
      {formEl}
    </>
  )
}

/* ================= DESCUENTOS POR HORA (solo gerencia; la vendedora NO los ve) ================= */
function DescuentosDe({ data, t, hacer }) {
  const hoyMes = hoyISO().slice(0, 7)
  const iniMes = t.fecha_inicio ? String(t.fecha_inicio).slice(0, 7) : ''
  const meses = []
  if (iniMes && iniMes <= hoyMes) { let [y, mm] = iniMes.split('-').map(Number); while (`${y}-${String(mm).padStart(2, '0')}` <= hoyMes) { meses.push(`${y}-${String(mm).padStart(2, '0')}`); mm++; if (mm > 12) { mm = 1; y++ } } }
  const [mes, setMes] = useState(hoyMes)
  const [dia, setDia] = useState(hoyISO())
  const [otro, setOtro] = useState({ horas: '', motivo: '' })
  const d = descuentosVendedora(data, t.email, mes, t)
  const m = metricasVendedor(data, t.email, mes, t)
  const neto = Math.max(0, m.aPagar - d.total)
  const reg = (horas, motivo, fecha) => hacer(() => save('descuentos_trab', { vendedor: t.email, mes, fecha: fecha || null, horas, motivo }), 'Descuento registrado')
  return (
    <>
      <Seccion titulo="Descuentos por hora (solo gerencia)" ayuda="Lo que se descuenta por horas no trabajadas y por días presenciales no asistidos. La vendedora no ve esta sección. Solo cuenta desde el inicio de contrato.">
        {meses.length > 1 && <select aria-label="Mes" value={mes} onChange={(e) => setMes(e.target.value)}>{meses.map((x) => <option key={x} value={x}>{nombreMes(x)}</option>)}</select>}
      </Seccion>
      {!t.fecha_inicio ? <p className="banner">Registra el <b>inicio de contrato</b> en “Editar datos” para calcular su pago y sus descuentos.</p>
        : t.fecha_inicio > hoyISO() ? <p className="note">Su contrato empieza el {fechaCorta(t.fecha_inicio)}. Hasta entonces no se calcula pago ni descuentos.</p> : (
          <div className="cons-wrap">
            <table className="cons-table" style={{ minWidth: 420 }}>
              <tbody>
                <tr><td>Periodo evaluado</td><td>{d.empezo ? `${fechaCorta(d.desde)} → ${fechaCorta(d.hasta)} (${d.dias} días${mes === hoyMes ? ', hasta ayer' : ''})` : 'Aún no hay días para evaluar'}</td></tr>
                <tr><td>Horas mínimas del periodo</td><td>{fmtHM(d.minMin)}</td></tr>
                <tr><td>Horas trabajadas</td><td>{fmtHM(d.trabMin)}</td></tr>
                <tr><td>Horas faltantes</td><td><b>{fmtHM(d.faltanMin)}</b></td></tr>
                <tr><td>Valor de la hora</td><td>{soles(d.valorHora)} <small>(sueldo + bono ÷ 104 h)</small></td></tr>
                <tr><td>Descuento por horas faltantes</td><td>{soles(d.descHoras)}</td></tr>
                <tr><td>Ajustes registrados</td><td>{soles(d.descAjustes)}</td></tr>
                <tr><td><b>Total descuento</b></td><td><b>{soles(d.total)}</b></td></tr>
                <tr><td>Pago del mes antes del descuento</td><td>{soles(m.aPagar)}</td></tr>
                <tr><td><b>A pagar neto</b></td><td><b>{soles(neto)}</b></td></tr>
              </tbody>
            </table>
          </div>
        )}
      {t.fecha_inicio && t.fecha_inicio <= hoyISO() && (
        <>
          <h3 className="sub">Registrar un descuento</h3>
          <div className="fila-form" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
            <label>Día presencial no asistido<input type="date" value={dia} onChange={(e) => setDia(e.target.value)} /></label>
            <button className="btn btn-line" disabled={!dia} onClick={() => reg(4, `Día presencial no asistido (${fechaCorta(dia)})`, dia)}>+ Descontar 4 h</button>
          </div>
          <div className="fila-form" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end', marginTop: 10 }}>
            <label>Otras horas<input type="number" min="0.5" step="0.5" value={otro.horas} onChange={(e) => setOtro({ ...otro, horas: e.target.value })} style={{ width: 90 }} /></label>
            <label style={{ flex: 1, minWidth: 180 }}>Motivo<input value={otro.motivo} onChange={(e) => setOtro({ ...otro, motivo: e.target.value })} placeholder="Ej.: salió antes de lo acordado" /></label>
            <button className="btn btn-line" disabled={!(Number(otro.horas) > 0) || otro.motivo.trim().length < 3} onClick={() => { reg(Number(otro.horas), otro.motivo.trim(), null); setOtro({ horas: '', motivo: '' }) }}>+ Descontar</button>
          </div>
          {d.ajustes.length > 0 && (
            <ul className="lista-simple" style={{ marginTop: 12 }}>
              {d.ajustes.map((x) => (
                <li key={x.id}>{x.horas} h · {x.motivo || 'Sin motivo'} <small>({soles(Number(x.horas) * d.valorHora)}{x.registrado_por ? ` · ${String(x.registrado_por).split('@')[0]}` : ''})</small> <button type="button" className="link" onClick={() => hacer(() => remove('descuentos_trab', x.id), 'Descuento quitado')}>Quitar</button></li>
              ))}
            </ul>
          )}
          <p className="note">Las horas extra del mismo mes compensan las faltantes. Los feriados cuentan como 4 h. Las horas se toman de “Iniciar/Terminar jornada”.</p>
        </>
      )}
    </>
  )
}

/* ================= VENTAS: MI AVANCE (vista de la vendedora) ================= */
function MiAvance({ data, email, hacer }) {
  const t = armarTrabajadores(data).find((x) => x.email === email) || { sueldo_base: SUELDO_DEF, comision_tramos: null }
  return (
    <>
      <Seccion titulo="Mi avance" ayuda="Cómo vas este mes: prospectos, interesados, ventas y cuánto llevas ganado." />
      {gruposSinWhatsapp(data).length > 0 && (
        <div className="alertas"><p className="alerta"><b>Pendiente:</b> crear el grupo de WhatsApp de {gruposSinWhatsapp(data).map((g) => g.codigo).join(', ')} y registrarlo en la sección Grupos.</p></div>
      )}
      <AlertasVenta data={data} email={email} />
      <JornadaCard data={data} email={email} hacer={hacer} />
      <AvanceVendedor data={data} email={email} trab={t} verPago compacto />
    </>
  )
}

/* ================= PANEL (módulos) ================= */
const MODULOS = {
  ventas: { nombre: 'Ventas', icono: 'ventas', secciones: [['mi', 'Mi avance'], ['agenda', 'Agenda'], ['firmar', 'Firmar'], ['plan', 'Plan de trabajo'], ['interesados', 'Interesados'], ['prospectos', 'Prospectos'], ['manual', 'Manual de ventas'], ['inscritos', 'Inscritos'], ['quejas', 'Quejas y reclamos'], ['consultas', 'Consultas'], ['grupos', 'Grupos'], ['instalaciones', 'Instalaciones']] },
  web: { nombre: 'Web', icono: 'web', secciones: [['cursos', 'Cursos'], ['grupos', 'Horarios'], ['enlaces', 'Enlaces'], ['ajustes', 'Ajustes']] },
  gerencia: { nombre: 'Gerencia', icono: 'gerencia', secciones: [['resumen', 'Resumen'], ['fichas', 'Cursos'], ['trabajadores', 'Trabajadores'], ['contratos', 'Contratos'], ['horas', 'Horas trabajadas'], ['accesos', 'Accesos'], ['equipo', 'Equipo']] },
  academico: { nombre: 'Académico', icono: 'academico', secciones: [['grupos', 'Grupos'], ['cronograma', 'Cronograma y accesos'], ['certificados', 'Certificados']] },
}
const POR_ROL = { gerente: ['gerencia', 'ventas', 'web', 'academico'], vendedora: ['ventas'], asistente: ['academico'] }
const ETIQUETA_ROL = { gerente: 'Gerente', vendedora: 'Vendedora', asistente: 'Asistente académico' }

function Panel({ email, rol, coordina, onSalir }) {
  const gerente = rol === 'gerente'
  const modulos = [...(POR_ROL[rol] || []), ...(coordina && rol === 'vendedora' ? ['academico'] : [])]
  const [modulo, setModulo] = useState(gerente ? 'gerencia' : (modulos[0] || 'ventas'))
  const [tab, setTab] = useState(gerente ? 'resumen' : (modulos[0] === 'academico' ? 'grupos' : 'mi'))
  const [data, setData] = useState({ cursos: [], grupos: [], enlaces: [], consultas: [], interesados: [], alumnos: [], matriculas: [], pagos: [], historial: [], prospectos: [], pendientes: [], notas_agenda: [], plantillas: [], documentos: [], quejas: [], trabajadores: [], instalaciones: [], gruposWa: [], asignaciones: [], pagos_trabajador: [], equipo: [], ajustes: {} })
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
  const ir = (m, t) => { setModulo(m); setTab(t || MODULOS[m].secciones.find(([k]) => !['mi', 'agenda', 'firmar', 'plan'].includes(k) || !gerente)[0]) }
  const abrirGrupo = (cursoId) => setGrupoForm({ curso_id: cursoId })
  const abiertos = data.grupos.filter((g) => g.estado === 'abierto' && g.activo).length
  const nInscritos = new Set(data.matriculas.filter((m) => m.estado === 'activa').map((m) => m.paquete_id)).size
  const nuevosInt = (data.interesados || []).filter((x) => x.estado === 'nuevo').length
  const nProsp = (data.prospectos || []).filter((x) => !['inscrito', 'perdido'].includes(x.estado)).length
  const nuevosCon = (data.consultas || []).filter((x) => x.estado === 'nuevo').length
  const cuenta = { quejas: (data.quejas || []).filter((q) => q.estado === 'nueva').length, firmar: (data.documentos || []).filter((d) => d.vendedor === email && d.estado === 'enviado').length, agenda: (data.pendientes || []).filter((x) => x.vendedor === email && x.estado === 'pendiente').length + (data.prospectos || []).filter((p) => recontactoVencido(p)).length, prospectos: nProsp, inscritos: nInscritos, interesados: nuevosInt, consultas: nuevosCon, grupos: abiertos, certificados: (data.certificados || []).filter((c) => c.estado === 'vigente').length, cursos: data.cursos.length, enlaces: (data.enlaces || []).length, equipo: (data.equipo || []).length, trabajadores: armarTrabajadores(data).length, instalaciones: (data.instalaciones || []).filter((x) => x.estado === 'agendada' && x.fecha >= new Date().toISOString().slice(0, 10)).length }
  const nombreSec = (m, k, n) => n
  const verSecciones = MODULOS[modulo].secciones.filter(([k]) => !['mi', 'agenda', 'firmar', 'plan'].includes(k) || !gerente)

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
              <button key={m} role="tab" aria-selected={modulo === m} onClick={() => ir(m)}><Icon n={MODULOS[m].icono} size={16} />{MODULOS[m].nombre}</button>
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
        {tab === 'grupos' && <Grupos data={data} hacer={hacer} abrirGrupo={abrirGrupo} editarGrupo={setGrupoForm} soloLeer={modulo !== 'web' && modulo !== 'academico'} sinBorrar={!gerente} />}
        {modulo === 'web' && tab === 'enlaces' && <Enlaces data={data} hacer={hacer} />}
        {modulo === 'web' && tab === 'ajustes' && <Ajustes data={data} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'consultas' && <Consultas data={data} hacer={hacer} rolG={gerente} />}
        {modulo === 'ventas' && tab === 'interesados' && <Interesados data={data} hacer={hacer} onInscribir={inscribirDesde} gerente={gerente}
          onProspecto={(x) => { setProtoInicial({ nombres: `${x.nombres} ${x.apellido_paterno}`.trim(), celular: x.celular, curso: x.curso, origen: 'Web', estado: 'contactado', seguimiento: '', notas: '' }); setTab('prospectos') }} />}
        {modulo === 'ventas' && tab === 'prospectos' && <Prospectos data={data} hacer={hacer} gerente={gerente} inicial={protoInicial} onCerrarInicial={() => setProtoInicial(null)} email={email} />}
        {modulo === 'ventas' && tab === 'manual' && <ManualVentas data={data} email={email} />}
        {modulo === 'ventas' && tab === 'inscritos' && <Inscritos data={data} hacer={hacer} rol={rol} nuevaInscripcion={() => setInscForm({})} registrarPago={setPagoForm} />}
        {modulo === 'ventas' && tab === 'instalaciones' && <Instalaciones data={data} hacer={hacer} gerente={gerente} />}
        {modulo === 'ventas' && tab === 'quejas' && <Quejas data={data} hacer={hacer} gerente={gerente} email={email} />}
        {modulo === 'ventas' && tab === 'firmar' && !gerente && <Firmar data={data} email={email} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'plan' && !gerente && <PlanTrabajo data={data} email={email} />}
        {modulo === 'gerencia' && tab === 'contratos' && <Contratos data={data} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'agenda' && !gerente && <Agenda data={data} email={email} hacer={hacer} />}
        {modulo === 'ventas' && tab === 'mi' && <MiAvance data={data} email={email} hacer={hacer} />}
        {modulo === 'gerencia' && tab === 'resumen' && <Resumen data={data} />}
        {modulo === 'gerencia' && tab === 'fichas' && <CursosGerencia data={data} hacer={hacer} abrirGrupo={abrirGrupo} editarGrupo={setGrupoForm} irWeb={() => ir('web', 'cursos')} />}
        {modulo === 'gerencia' && tab === 'trabajadores' && <Trabajadores data={data} hacer={hacer} />}
        {modulo === 'academico' && tab === 'cronograma' && <Cronograma data={data} hacer={hacer} avisar={avisar} />}
        {modulo === 'academico' && tab === 'certificados' && <Certificados data={data} hacer={hacer} gerente={gerente} />}
        {modulo === 'gerencia' && tab === 'horas' && <Horas data={data} hacer={hacer} />}
        {modulo === 'gerencia' && tab === 'accesos' && <Accesos data={data} hacer={hacer} />}
        {modulo === 'gerencia' && tab === 'equipo' && <Equipo data={data} hacer={hacer} email={email} />}
      </main>

      {grupoForm && (
        <GrupoForm inicial={grupoForm} cursos={data.cursos} onClose={() => setGrupoForm(null)}
          onSave={async (row) => { await save('grupos', row); setGrupoForm(null); await hacer(async () => {}, grupoForm.id ? 'Grupo guardado' : 'Grupo publicado'); if (modulo === 'web') setTab('grupos') }} />
      )}
      {inscForm && (
        <InscripcionForm inicial={inscForm} data={data} gerente={gerente} onClose={() => setInscForm(null)}
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
      {toast && <div className={`toast ${toast.error ? 'bad' : ''}`} role="status">{toast.texto}</div>}
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
  const [estado, setEstado] = useState('cargando')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('gerente')
  const [coordina, setCoordina] = useState(false)
  async function revisar() {
    if (!hasBackend) { const r = await getRol('demo@ccn.pe'); setRol(r || 'gerente'); setCoordina(await getCoordina('demo@ccn.pe')); if (r === 'vendedora' || r === 'profesor') setEmail('demo@ccn.pe'); setEstado('ok'); return }
    const { data } = await supabase.auth.getSession()
    const mail = data.session?.user?.email
    if (!mail) { setEstado('login'); return }
    setEmail(mail)
    const r = await getRol(mail)
    setRol(r || 'gerente')
    setCoordina(r === 'vendedora' ? await getCoordina(mail) : false)
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
  if (rol === 'profesor') return <PanelProfesor email={email} onSalir={salir} />
  return <Panel email={email} rol={rol} coordina={coordina} onSalir={salir} />
}
