import { useMemo, useState } from 'react'
import Icon from '../../components/Icons'
import { Barras, Embudo } from '../../components/Charts'
import { lunesDe, semanaHoras, minutosJornada, jornadaSinSenal, fmtHM, MINIMO_SEMANA_MIN, metricasCurso } from '../../lib/ventas'
import { soles, nombreMes, waTel } from '../../lib/formato.js'
import { fmtMoneda, sumaPorMoneda } from '../../lib/moneda.js'
import { hasBackend, save, remove, CATEGORIAS_ACCESO, fechaCorta, armarInscripciones, guardarMiembro, ponerCoordina, quitarMiembro, ROLES, recibeInteresados, fmtHorario } from '../../lib/data.js'
import { Confirmar, Drawer, Seccion, Switch } from '../../components/ui.jsx'
import { dosMon } from './util.js'

/* ================= GERENCIA: RESUMEN ================= */
export function Resumen({ data }) {
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
export function Equipo({ data, hacer, email }) {
  const [nuevo, setNuevo] = useState({ email: '', rol: 'vendedora' })
  const [quitando, setQuitando] = useState(null)
  return (
    <>
      <Seccion titulo="Equipo" ayuda="Quién entra al panel y qué ve. Gerente: todo. Vendedora: solo Ventas (si hoy hace de asistente académico, actívale ese permiso en la última columna). Asistente académico: solo el módulo Académico (grupos, profesor, accesos, trabajo final y certificados), sin pagos ni tarifas. Profesor: solo sus grupos (alumnos y asistencia). Al profesor también hay que ponerlo en Trabajadores (con el mismo correo) y asignarle su grupo." />
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
export const DIAS_ABR = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const CIERRE_TXT = { manual: 'Terminó ella', tope: 'Llegó al tope', sin_senal: 'Sin señal', gerente: 'Corregida' }

export const aLocal = (iso) => { if (!iso) return ''; const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` }

export function JornadaForm({ j, onClose, onSave }) {
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

export function Horas({ data, hacer }) {
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
export function AccesoForm({ inicial, onCerrar, onGuardar }) {
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

export function Accesos({ data, hacer }) {
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
export const TABS_CURSO = [['resumen', 'Resumen'], ['interesados', 'Interesados'], ['inscritos', 'Inscritos'], ['grupos', 'Grupos'], ['info', 'Información'], ['historial', 'Historial']]

export const ESTADO_PAGO = { pagado: 'Pagado', adelanto: 'Adelanto', pendiente: 'Sin pago', anulada: 'Anulada' }

export function FichaCurso({ data, curso, hacer, onVolver, abrirGrupo, editarGrupo, irWeb }) {
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
              <td><a href={waTel(x.celular)} target="_blank" rel="noopener noreferrer">{x.celular}</a></td>
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

export function CursosGerencia({ data, hacer, abrirGrupo, editarGrupo, irWeb }) {
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
