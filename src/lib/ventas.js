/* Métricas del vendedor: todo se calcula con los datos que el panel ya tiene (sin tablas extra). */

export const TRAMOS_DEF = [{ desde: 0, pct: 3 }, { desde: 10, pct: 4 }, { desde: 15, pct: 5 }]
export const SUELDO_DEF = 600
export const PUESTOS = { instructor: 'Profesores', vendedor: 'Vendedores' }
export const TARIFA_HORA_DEF = 20 // S/400 por curso de 20 h

const mesDe = (iso) => String(iso || '').slice(0, 7)
const r2 = (n) => Math.round(n * 100) / 100
const suma = (a) => r2(a.reduce((t, x) => t + Number(x || 0), 0))

export function tramosDe(trab) {
  const t = Array.isArray(trab?.comision_tramos) && trab.comision_tramos.length ? trab.comision_tramos : TRAMOS_DEF
  return [...t].map((x) => ({ desde: Number(x.desde), pct: Number(x.pct) })).sort((a, b) => a.desde - b.desde)
}

/* La comisión es un % de lo vendido en el mes; el % depende de cuántos cupos (vacantes) cerró en el mes. */
export function calcularComision(cupos, vendido, tramos) {
  let actual = tramos[0] || { desde: 0, pct: 0 }
  for (const t of tramos) if (cupos >= t.desde) actual = t
  const sig = tramos.find((t) => t.desde > cupos) || null
  return { pct: actual.pct, monto: r2((vendido * actual.pct) / 100), siguiente: sig ? { pct: sig.pct, faltan: sig.desde - cupos, desde: sig.desde } : null }
}

export function metricasVendedor(data, email, mes, trab) {
  const tramos = tramosDe(trab)
  const sueldo = Number(trab?.sueldo_base ?? SUELDO_DEF)
  const mats = (data.matriculas || []).filter((m) => m.vendedor === email && m.estado === 'activa' && mesDe(m.fecha_inscripcion) === mes)
  const ids = new Set(mats.map((m) => m.id))
  const vendido = suma(mats.map((m) => m.precio))
  const cobrado = suma((data.pagos || []).filter((p) => ids.has(p.matricula_id)).map((p) => p.monto))
  const prospectos = (data.prospectos || []).filter((p) => p.vendedor === email && mesDe(p.creado) === mes)
  const ints = (data.interesados || []).filter((x) => x.asignado_a === email && mesDe(x.asignado_en || x.creado) === mes)
  const contactados = ints.filter((x) => x.estado !== 'nuevo')
  const semana = (iso) => Math.min(4, Math.floor((Number(String(iso || '').slice(8, 10)) - 1) / 7))
  const sem = [0, 1, 2, 3, 4].map((i) => ({ label: `Sem ${i + 1}`, cupos: 0, prospectos: 0 }))
  mats.forEach((m) => { sem[semana(m.fecha_inscripcion)].cupos += 1 })
  prospectos.forEach((p) => { sem[semana(p.creado)].prospectos += 1 })
  const com = calcularComision(mats.length, vendido, tramos)
  return {
    cupos: mats.length, inscripciones: new Set(mats.map((m) => m.paquete_id)).size, vendido, cobrado,
    prospectos: prospectos.length, prospectosInscritos: prospectos.filter((p) => p.estado === 'inscrito').length,
    interesados: ints.length, contactados: contactados.length, contestaron: ints.filter((x) => x.contesto === true).length,
    sem, tramos, sueldo, comision: com, aPagar: r2(sueldo + com.monto),
  }
}

export function mesesAtras(mes, n) {
  const [y, m] = mes.split('-').map(Number)
  return Array.from({ length: n }, (_, i) => { const d = new Date(y, m - 1 - (n - 1 - i), 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
}

export function serieVendedor(data, email, mes, trab, n = 6) {
  return mesesAtras(mes, n).map((m) => ({ mes: m, ...metricasVendedor(data, email, m, trab) }))
}

export function historialVendedor(data, email, limite = 40) {
  const ev = []
  const alum = new Map((data.alumnos || []).map((a) => [a.id, a]))
  const nom = (a) => (a ? `${a.nombres} ${a.apellido_paterno}`.trim() : 'Alumno')
  ;(data.interesados || []).filter((x) => x.asignado_a === email).forEach((x) => {
    ev.push({ t: x.asignado_en || x.creado, ico: 'Derivado', txt: `Te derivaron a ${x.nombres} ${x.apellido_paterno} (${x.curso})` })
    if (x.estado !== 'nuevo' && x.contactado_en) ev.push({ t: x.contactado_en, ico: 'Contacto', txt: `Contactaste a ${x.nombres} ${x.apellido_paterno}${x.contesto === true ? ' · contestó' : x.contesto === false ? ' · no contestó' : ''}${x.observacion ? ` — ${x.observacion}` : ''}` })
  })
  ;(data.prospectos || []).filter((p) => p.vendedor === email).forEach((p) => ev.push({ t: p.creado, ico: 'Prospecto', txt: `Nuevo prospecto: ${p.nombres}${p.curso ? ` (${p.curso})` : ''}` }))
  const mias = (data.matriculas || []).filter((m) => m.vendedor === email)
  const paq = new Map()
  mias.forEach((m) => { if (!paq.has(m.paquete_id)) paq.set(m.paquete_id, []); paq.get(m.paquete_id).push(m) })
  paq.forEach((ms) => ev.push({ t: ms[0].creado, ico: 'Inscripción', txt: `Inscribiste a ${nom(alum.get(ms[0].alumno_id))} en ${ms.map((m) => m.grupo_codigo).join(' + ')} · S/ ${suma(ms.map((m) => m.precio))}` }))
  const mid = new Map(mias.map((m) => [m.id, m]))
  const lotes = new Map()
  ;(data.pagos || []).forEach((p) => { const m = mid.get(p.matricula_id); if (!m) return; const k = p.lote || p.id; const x = lotes.get(k) || { t: p.creado, n: p.numero, monto: 0, a: alum.get(m.alumno_id) }; x.monto += Number(p.monto); lotes.set(k, x) })
  lotes.forEach((x) => ev.push({ t: x.t, ico: 'Pago', txt: `Pago ${x.n} de ${nom(x.a)}: S/ ${r2(x.monto)}` }))
  return ev.filter((e) => e.t).sort((a, b) => String(b.t).localeCompare(String(a.t))).slice(0, limite)
}

/* ---------- Nombre sugerido del grupo de WhatsApp: CÓDIGO-DÍAS-CURSO-HORA-FECHA (ej. G01-LJ-NOTION-1930-23NOV) ---------- */
const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
export function nombreGrupoWa(g, curso) {
  const dl = sinTildes(g.dias).toLowerCase()
  const mapa = [['lunes', 'L'], ['martes', 'M'], ['miercoles', 'X'], ['jueves', 'J'], ['viernes', 'V'], ['sabado', 'S'], ['domingo', 'D']]
  const orden = mapa.map(([n, l]) => ({ l, i: dl.indexOf(n) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i).map((x) => x.l).join('')
  const palabras = sinTildes(curso?.titulo).toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(' ').filter(Boolean)
  const nombre = palabras[0] === 'CREA' ? 'WEB' : palabras[0] === 'CLAUDE' ? 'CLAUDE' : (palabras[0] || '')
  const h = /(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\b/i.exec(sinTildes(g.horario).replace(/\./g, ''))
  let hora = ''
  if (h) { let hh = Number(h[1]); if ((h[3] || '').toLowerCase() === 'p' && hh < 12) hh += 12; hora = String(hh).padStart(2, '0') + (h[2] || '00') }
  const d = g.inicio ? new Date(g.inicio + 'T00:00:00') : null
  const fecha = d ? `${d.getDate()}${['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'][d.getMonth()]}` : ''
  return [g.codigo, orden, nombre, hora, fecha].filter(Boolean).join('-')
}
export const gruposSinWhatsapp = (data) => (data.grupos || []).filter((g) => g.codigo && g.estado !== 'cerrado' && !(data.gruposWa || []).some((w) => String(w.grupo_id) === String(g.id)))

/* ---------- Profesores: cursos, grupos dictados, horas y pagos ---------- */
export function metricasProfesor(data, t) {
  const asig = (data.asignaciones || []).filter((a) => a.trabajador_id === t.id)
  const asigPor = new Map((data.asignaciones || []).map((a) => [String(a.grupo_id), a]))
  const pagos = (data.pagos_trabajador || []).filter((p) => p.trabajador_id === t.id)
  const idsCursos = new Set((t.cursos || []).map(String))
  asig.forEach((a) => { const g = (data.grupos || []).find((x) => String(x.id) === String(a.grupo_id)); if (g) idsCursos.add(String(g.curso_id)) })
  const cursos = [...idsCursos].map((cid) => {
    const curso = (data.cursos || []).find((c) => String(c.id) === cid)
    if (!curso) return null
    const grupos = (data.grupos || []).filter((g) => String(g.curso_id) === cid).sort((a, b) => String(b.inicio || '').localeCompare(String(a.inicio || ''))).map((g) => {
      const a = asigPor.get(String(g.id))
      if (a && a.trabajador_id !== t.id) return null            // lo dicta otro profesor
      if (!a) return { g, a: null }
      const debe = r2(Number(a.horas_dictadas) * Number(a.tarifa_hora))
      const pagado = suma(pagos.filter((p) => p.asignacion_id === a.id).map((p) => p.monto))
      return { g, a, debe, pagado, saldo: r2(Math.max(0, debe - pagado)) }
    }).filter(Boolean)
    const mias = grupos.filter((x) => x.a)
    return { curso, grupos, nGrupos: mias.length, horas: suma(mias.map((x) => x.a.horas_dictadas)), debe: suma(mias.map((x) => x.debe)), pagado: suma(mias.map((x) => x.pagado)) }
  }).filter(Boolean)
  const totalPagado = suma(pagos.map((p) => p.monto))
  const debe = suma(cursos.map((c) => c.debe))
  return { cursos, nGrupos: asig.length, horas: suma(asig.map((a) => a.horas_dictadas)), debe, totalPagado, porPagar: r2(Math.max(0, debe - totalPagado)), pagos: pagos.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))) }
}

/* ---------- Instalaciones remotas: horarios disponibles del instalador (hora de inicio permitida, en horas) ---------- */
export const VENTANAS_INSTALACION = { 1: [19, 22], 2: [19, 22], 3: [19, 22], 4: [19, 22], 5: [19, 22], 6: [15, 22], 0: [8, 22] }
export const AVISO_INSTALACION = 'Lunes a viernes de 7:00 p. m. a 11:00 p. m. · Sábados de 3:00 p. m. a 11:00 p. m. · Domingos todo el día (8:00 a. m. a 11:00 p. m.). Cada instalación dura cerca de 1 hora.'
export const PROGRAMAS = ['Photoshop', 'Illustrator', 'Office (Word, Excel, PowerPoint)', 'Otro']
export const ESTADOS_INSTALACION = { agendada: 'Agendada', hecha: 'Hecha', reprogramada: 'Reprogramada', cancelada: 'Cancelada' }
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const hmm = (h) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'a. m.' : 'p. m.'}`

export function programaSugerido(titulo) {
  const t = sinTildes(titulo).toLowerCase()
  if (t.includes('photoshop')) return 'Photoshop'
  if (t.includes('illustrator')) return 'Illustrator'
  if (/(word|excel|powerpoint|ofimatica)/.test(t)) return 'Office (Word, Excel, PowerPoint)'
  return ''
}
/* Devuelve el mensaje de error, o '' si la fecha y hora están dentro del horario disponible. */
export function errorHorarioInstalacion(fecha, hora) {
  if (!fecha || !hora) return 'Elige la fecha y la hora.'
  const d = new Date(fecha + 'T00:00:00'); const dow = d.getDay()
  const [a, b] = VENTANAS_INSTALACION[dow]
  const [hh, mm] = hora.split(':').map(Number); const h = hh + mm / 60
  if (h < a || h > b) return `El ${DIAS[dow]} las instalaciones son de ${hmm(a)} a ${hmm(b + 1)} (empiezan como máximo a las ${hmm(b)}).`
  if (new Date(`${fecha}T${hora}`) < new Date()) return 'Esa fecha y hora ya pasaron.'
  return ''
}
export const horaCorta = (h) => String(h || '').slice(0, 5)
export function hora12(h) { const [hh, mm] = horaCorta(h).split(':').map(Number); return `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'a. m.' : 'p. m.'}` }
/* ¿Se cruza con otra instalación agendada (cada una ocupa 1 h)? */
export function choqueInstalacion(lista, fecha, hora, ignorarId) {
  const ini = (h) => { const [a, b] = horaCorta(h).split(':').map(Number); return a * 60 + b }
  return lista.find((x) => x.id !== ignorarId && x.estado === 'agendada' && x.fecha === fecha && Math.abs(ini(x.hora) - ini(hora)) < 60) || null
}
