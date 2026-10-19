import { useEffect, useState } from 'react'
import Icon from '../../components/Icons'
import { nombreGrupoWa, gruposSinWhatsapp } from '../../lib/ventas'
import { redondear, sinIgv } from '../../lib/igv'
import { soles } from '../../lib/formato.js'
import { ClasesDrawer } from '../Profesor'
import { hasBackend, save, remove, saveAjuste, fechaCorta, setNumero, COLORES, MAX_INICIO, guardarWhatsapp, fmtHorario } from '../../lib/data.js'
import { Confirmar, Drawer, Imagen, Seccion, Switch } from '../../components/ui.jsx'

/* ================= CURSOS ================= */
export const CURSO_VACIO = {
  titulo: '', descripcion: '', color: 'g1', horas: 12, sesiones: 4, precio: 229, precio_antes: '', precio_usd: '', precio_antes_usd: '',
  programas: '', temario: [], extra: '', orden: 0, activo: true, destacado: false, imagen_url: '',
}

export function CursoForm({ inicial, total, enInicio, onSave, onClose }) {
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

export function Cursos({ data, hacer, abrirGrupo }) {
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

/* ================= GRUPOS ================= */
export const DIAS = ['Lun.-Vie.', 'Sábados', 'Sáb.-Dom.', 'Lun.-Mié.', 'Mar.-Jue.', 'Domingos']

export const GRUPO_VACIO = { curso_id: '', inicio: '', dias: '', horario: '', estado: 'abierto', inscritos: 0, minimo: 5, mostrar_inscritos: false, activo: true }

export const partes = (h) => { const m = /(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/.exec(h || ''); return m ? [m[1], m[2]] : ['', ''] }

export function GrupoForm({ inicial, cursos, onSave, onClose }) {
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

/* ================= GRUPO DE WHATSAPP (lo registra ventas) ================= */
export function WhatsappForm({ g, curso, actual, onClose, onSave }) {
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

export function Grupos({ data, hacer, abrirGrupo, editarGrupo, soloLeer, sinBorrar }) {
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
export function EnlaceForm({ inicial, total, onSave, onClose }) {
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

export function Enlaces({ data, hacer }) {
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

/* ================= AJUSTES ================= */
export function Ajustes({ data, hacer }) {
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
