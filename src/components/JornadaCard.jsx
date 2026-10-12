import { useEffect, useMemo, useRef, useState } from 'react'
import { jornadaIniciar, jornadaPulso, jornadaCerrar } from '../lib/data.js'
import { MINIMO_SEMANA_MIN, lunesDe, minutosJornada, jornadaSinSenal, semanaHoras, fmtHM, esLaptop } from '../lib/ventas.js'

/* Reloj de jornada de la vendedora: Iniciar / Terminar. Solo desde laptop o PC. */
export default function JornadaCard({ data, email, hacer }) {
  const [ahora, setAhora] = useState(() => new Date())
  const [pulso, setPulso] = useState(null)
  const laptop = useMemo(() => esLaptop(), [])
  const mias = (data.jornadas || []).filter((j) => j.vendedor === email)
  const abierta = mias.find((j) => j.estado === 'abierta') || null
  const sem = semanaHoras(data, email, lunesDe(ahora), ahora)
  const hoyIni = new Date(ahora); hoyIni.setHours(0, 0, 0, 0)
  const hoy = mias.filter((j) => new Date(j.inicio) >= hoyIni).reduce((t, j) => t + minutosJornada(j, ahora), 0)
  const cumple = sem.total >= MINIMO_SEMANA_MIN
  const ref = useRef({})
  ref.current = { abierta, sem, hacer, pulso }

  // reloj en pantalla
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 15000); return () => clearInterval(t) }, [])

  // jornada que quedó abierta sin señal (cerraron la pestaña): se cierra hasta su último pulso
  useEffect(() => {
    if (abierta && jornadaSinSenal({ ...abierta, ultimo_pulso: pulso && pulso.id === abierta.id ? pulso.t : abierta.ultimo_pulso }, ahora)) {
      hacer(() => jornadaCerrar(abierta.id, 'interrumpida'), 'Tu jornada anterior se cerró: el panel estuvo sin señal más de 15 minutos')
    }
  }, [abierta?.id]) // eslint-disable-line

  // señal de vida cada minuto (si pasan 15 min sin señal, se cierra)
  useEffect(() => {
    if (!abierta) return undefined
    const t = setInterval(async () => {
      const { abierta: a } = ref.current
      if (!a) return
      try { await jornadaPulso(a.id); setPulso({ id: a.id, t: new Date().toISOString() }) } catch { /* sin conexión: el servidor la cierra por falta de señal */ }
    }, 60000)
    return () => clearInterval(t)
  }, [abierta?.id]) // eslint-disable-line

  const iniciar = () => {
    const ua = (navigator.userAgent.match(/(Windows|Mac OS X|Linux|CrOS)[^;)]*/) || ['PC'])[0]
    hacer(() => jornadaIniciar(`Laptop/PC · ${ua}`), 'Jornada iniciada')
  }
  const pct = Math.min(100, (sem.total / MINIMO_SEMANA_MIN) * 100)
  const enCurso = abierta ? minutosJornada({ ...abierta, ultimo_pulso: pulso && pulso.id === abierta.id ? pulso.t : abierta.ultimo_pulso }, ahora) : 0

  return (
    <section className={`jornada ${abierta ? 'on' : ''}`} aria-label="Jornada de trabajo">
      <div className="j-izq">
        <small>{abierta ? 'Jornada en curso' : 'Jornada de trabajo'}</small>
        <b className="j-tiempo">{abierta ? fmtHM(enCurso) : 'Sin iniciar'}</b>
        <span>Hoy: {fmtHM(hoy)} · Esta semana: {fmtHM(sem.total)} (mínimo 24 h){cumple ? ' · mínimo cumplido' : ''}</span>
        <div className="barra" aria-label="Avance del mínimo semanal"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="j-der">
        {abierta
          ? <button className="btn j-stop" onClick={() => hacer(() => jornadaCerrar(abierta.id, 'cerrada', 'manual'), 'Jornada terminada')}>Terminar jornada</button>
          : <button className="btn btn-teal j-go" disabled={!laptop} onClick={iniciar}>Iniciar jornada</button>}
        {!laptop && !abierta && <small className="j-aviso">Solo puedes iniciar desde una laptop o PC.</small>}
        {abierta && <small className="j-aviso">Mantén este panel abierto. Si pasa 15 min sin señal, la jornada se cierra.</small>}
      </div>
    </section>
  )
}
