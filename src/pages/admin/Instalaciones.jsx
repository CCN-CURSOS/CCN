import { useMemo, useState } from 'react'
import Icon from '../../components/Icons'
import { AVISO_INSTALACION, PROGRAMAS, ESTADOS_INSTALACION, programaSugerido, errorHorarioInstalacion, choqueInstalacion, hora12 } from '../../lib/ventas'
import { waTel } from '../../lib/formato.js'
import { hasBackend, remove, fechaCorta, guardarInstalacion } from '../../lib/data.js'
import { Confirmar, Drawer, Seccion } from '../../components/ui.jsx'

/* ================= INSTALACIONES (agenda de instalaciones remotas) ================= */
export const sinT = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function InstalacionForm({ data, inicial, onClose, onSave }) {
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

export function Instalaciones({ data, hacer, gerente }) {
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
                    <td><b>{a.nombres} {a.apellido_paterno}</b>{a.codigo && <small className="paq"><span className="cod">{a.codigo}</span></small>}{a.celular && <small className="paq"><a href={waTel(a.celular)} target="_blank" rel="noopener noreferrer">{a.celular}</a></small>}</td>
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
