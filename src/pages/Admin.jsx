import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Layout.jsx'
import PanelProfesor from './Profesor'
import { hasBackend, supabase, getRol, getCoordina } from '../lib/data.js'
import { Panel } from './admin/Panel.jsx'

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
