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
/* Club Ofimática (paquete de 3 cursos) cuenta como 1 solo cupo; lo demás, 1 por matrícula. */
export const esClub = (m) => /club\s*ofim/i.test(m.paquete || '')
export function pesosCupo(mats) {
  const visto = new Set(); const w = new Map()
  mats.forEach((m) => {
    if (esClub(m)) { const k = m.paquete_id || m.id; w.set(m.id, visto.has(k) ? 0 : 1); visto.add(k) } else w.set(m.id, 1)
  })
  return w
}
export const sumaCupos = (mats) => { const w = pesosCupo(mats); return mats.reduce((t, m) => t + (w.get(m.id) || 0), 0) }

export function calcularComision(cupos, vendido, tramos) {
  let actual = tramos[0] || { desde: 0, pct: 0 }
  for (const t of tramos) if (cupos >= t.desde) actual = t
  const sig = tramos.find((t) => t.desde > cupos) || null
  return { pct: actual.pct, monto: r2((vendido * actual.pct) / 100), siguiente: sig ? { pct: sig.pct, faltan: sig.desde - cupos, desde: sig.desde } : null }
}

export const BONO_CURSO = 50
/* Un curso se cierra en venta cuando el grupo llega a su capacidad máxima (20). Cada vendedora que vendió
   al menos un alumno a ese grupo recibe el bono, en el mes en que se llenó. */
export function bonosCursoCerrado(data, email, mes) {
  const out = []
  ;(data.grupos || []).forEach((g) => {
    const max = Number(g.maximo) || 20
    const ms = (data.matriculas || []).filter((m) => String(m.grupo_id) === String(g.id) && m.estado === 'activa')
      .sort((a, b) => String(a.fecha_inscripcion).localeCompare(String(b.fecha_inscripcion)) || String(a.creado).localeCompare(String(b.creado)))
    if (ms.length < max) return
    const cierre = String(ms[max - 1].fecha_inscripcion).slice(0, 7)
    if (cierre === mes && ms.some((m) => m.vendedor === email)) out.push({ grupo: g.codigo || g.id, monto: BONO_CURSO })
  })
  return out
}

export function metricasVendedor(data, email, mes, trab) {
  const tramos = tramosDe(trab)
  const sueldoBase = Number(trab?.sueldo_base ?? SUELDO_DEF)
  // Desde la fecha de inicio: antes no se paga; el mes de inicio se paga por los días trabajados.
  const ini = trab?.fecha_inicio ? String(trab.fecha_inicio).slice(0, 10) : ''
  const [ay, am] = mes.split('-').map(Number)
  const diasMes = new Date(ay, am, 0).getDate()
  const activo = !ini || ini.slice(0, 7) <= mes
  const parcial = !!ini && ini.slice(0, 7) === mes && Number(ini.slice(8, 10)) > 1
  const dias = parcial ? diasMes - Number(ini.slice(8, 10)) + 1 : diasMes
  const sueldo = !activo ? 0 : parcial ? r2((sueldoBase * dias) / diasMes) : sueldoBase
  const mats = (data.matriculas || []).filter((m) => m.vendedor === email && m.estado === 'activa' && mesDe(m.fecha_inscripcion) === mes)
  const ids = new Set(mats.map((m) => m.id))
  const vendido = suma(mats.map((m) => m.precio))
  const cobrado = suma((data.pagos || []).filter((p) => ids.has(p.matricula_id)).map((p) => p.monto))
  const prospectos = (data.prospectos || []).filter((p) => p.vendedor === email && mesDe(p.creado) === mes)
  const ints = (data.interesados || []).filter((x) => x.asignado_a === email && mesDe(x.asignado_en || x.creado) === mes)
  const contactados = ints.filter((x) => x.estado !== 'nuevo')
  const semana = (iso) => Math.min(4, Math.floor((Number(String(iso || '').slice(8, 10)) - 1) / 7))
  const sem = [0, 1, 2, 3, 4].map((i) => ({ label: `Sem ${i + 1}`, cupos: 0, prospectos: 0 }))
  const pesos = pesosCupo(mats)
  mats.forEach((m) => { sem[semana(m.fecha_inscripcion)].cupos += pesos.get(m.id) })
  prospectos.forEach((p) => { sem[semana(p.creado)].prospectos += 1 })
  const com = calcularComision(sumaCupos(mats), vendido, tramos)
  const bonos = bonosCursoCerrado(data, email, mes)
  const bono = bonos.reduce((t, b) => t + b.monto, 0)
  return {
    cupos: sumaCupos(mats), inscripciones: new Set(mats.map((m) => m.paquete_id)).size, vendido, cobrado,
    prospectos: prospectos.length, prospectosInscritos: prospectos.filter((p) => p.estado === 'inscrito').length,
    interesados: ints.length, contactados: contactados.length, contestaron: ints.filter((x) => x.contesto === true).length,
    sem, tramos, sueldo, sueldoBase, activo, parcial, dias, diasMes, comision: com, bonos, bono, aPagar: activo ? r2(sueldo + com.monto + bono) : 0,
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

/* ---------- Ficha por curso ---------- */
export function metricasCurso(data, cursoId) {
  const cid = String(cursoId)
  const grupos = (data.grupos || []).filter((g) => String(g.curso_id) === cid)
  const ints = (data.interesados || []).filter((x) => String(x.curso_id) === cid)
  const mats = (data.matriculas || []).filter((m) => String(m.curso_id) === cid)
  const activas = mats.filter((m) => m.estado === 'activa')
  const ids = new Set(activas.map((m) => m.id))
  const pagosPor = new Map()
  ;(data.pagos || []).forEach((p) => { pagosPor.set(p.matricula_id, r2((pagosPor.get(p.matricula_id) || 0) + Number(p.monto))) })
  const vendido = suma(activas.map((m) => m.precio))
  const cobrado = suma([...ids].map((id) => pagosPor.get(id) || 0))
  const alum = new Map((data.alumnos || []).map((a) => [a.id, a]))
  const filas = mats.map((m) => {
    const pagado = pagosPor.get(m.id) || 0
    const estado = m.estado !== 'activa' ? 'anulada' : pagado >= Number(m.precio) - 0.005 ? 'pagado' : pagado > 0 ? 'adelanto' : 'pendiente'
    return { m, a: alum.get(m.alumno_id) || {}, pagado, saldo: m.estado === 'activa' ? r2(Math.max(0, Number(m.precio) - pagado)) : 0, estado }
  }).sort((a, b) => String(b.m.fecha_inscripcion).localeCompare(String(a.m.fecha_inscripcion)))
  const hoy = new Date().toISOString().slice(0, 7)
  const serie = mesesAtras(hoy, 6).map((mes) => {
    const del = activas.filter((m) => String(m.fecha_inscripcion).slice(0, 7) === mes)
    return { mes, cupos: del.length, vendido: suma(del.map((m) => m.precio)) }
  })
  const historial = (data.historial || []).filter((h) => String(h.curso_id) === cid)
  return {
    grupos, ints, filas, historial, serie, vendido, cobrado, porCobrar: r2(Math.max(0, vendido - cobrado)),
    cupos: activas.length, contactados: ints.filter((x) => x.estado !== 'nuevo').length,
    abiertos: grupos.filter((g) => g.estado === 'abierto').length, ticket: activas.length ? r2(vendido / activas.length) : 0,
  }
}

/* ---------- Metas (hitos acumulados desde el inicio) ---------- */
export const METAS_DEF = [
  { fecha: '2026-10-26', cupos: 3, cursos: 1 },
  { fecha: '2026-11-06', cupos: 7, cursos: 1 },
  { fecha: '2026-11-13', cupos: 10, cursos: 2 },
]
export const metasDe = (trab) => (Array.isArray(trab?.metas) && trab.metas.length ? trab.metas : METAS_DEF).map((h) => ({ fecha: h.fecha, cupos: Number(h.cupos) || 0, cursos: Number(h.cursos) || 1 }))

export function progresoMetas(data, email, trab) {
  const hoy = new Date().toISOString().slice(0, 10)
  const ini = trab?.fecha_inicio ? String(trab.fecha_inicio).slice(0, 10) : ''
  const mats = (data.matriculas || []).filter((m) => m.vendedor === email && m.estado === 'activa' && (!ini || String(m.fecha_inscripcion).slice(0, 10) >= ini))
  const cupos = sumaCupos(mats)
  const cursos = new Set(mats.map((m) => String(m.curso_id))).size
  return metasDe(trab).sort((a, b) => a.fecha.localeCompare(b.fecha)).map((h) => {
    const cumplida = cupos >= h.cupos && cursos >= h.cursos
    const dias = Math.round((new Date(h.fecha + 'T00:00:00') - new Date(hoy + 'T00:00:00')) / 86400000)
    return { ...h, cumplida, vencida: !cumplida && dias < 0, dias, pct: Math.min(100, h.cupos ? (cupos / h.cupos) * 100 : 100), cupos_actual: cupos, cursos_actual: cursos }
  })
}

/* ---------- Lo que hizo el vendedor en un mes (para supervisar) ---------- */
export function actividadMes(data, email, mes) {
  const alum = new Map((data.alumnos || []).map((a) => [a.id, a]))
  const curso = new Map((data.cursos || []).map((c) => [String(c.id), c.titulo]))
  const nom = (a) => (a ? `${a.nombres || ''} ${a.apellido_paterno || ''}`.trim() : 'Alumno')
  const prospectos = (data.prospectos || []).filter((p) => p.vendedor === email && mesDe(p.creado) === mes)
    .map((p) => ({ t: p.creado, nombre: p.nombres, celular: p.celular, curso: p.curso, origen: p.origen, estado: p.estado, obs: p.notas, seguimiento: p.seguimiento }))
  const interesados = (data.interesados || []).filter((x) => x.asignado_a === email && mesDe(x.asignado_en || x.creado) === mes)
    .map((x) => ({ t: x.asignado_en || x.creado, nombre: `${x.nombres} ${x.apellido_paterno}`, celular: x.celular, curso: x.curso, atendido: x.estado !== 'nuevo', contesto: x.contesto, contactado_en: x.contactado_en, obs: x.observacion }))
  const mats = (data.matriculas || []).filter((m) => m.vendedor === email && m.estado === 'activa' && mesDe(m.fecha_inscripcion) === mes)
  const pagadoPor = new Map()
  ;(data.pagos || []).forEach((p) => pagadoPor.set(p.matricula_id, r2((pagadoPor.get(p.matricula_id) || 0) + Number(p.monto))))
  const ventas = mats.map((m) => {
    const a = alum.get(m.alumno_id)
    const pagado = pagadoPor.get(m.id) || 0
    return { t: m.creado || m.fecha_inscripcion, fecha: m.fecha_inscripcion, terminos: !!m.terminos_enviados, requisitos: !!m.requisitos_enviados, pideReq: !!programaSugerido(curso.get(String(m.curso_id)) || ''), alumno: nom(a), codigo: a?.codigo || '', curso: curso.get(String(m.curso_id)) || '', grupo: m.grupo_codigo, precio: Number(m.precio), pagado, saldo: r2(Math.max(0, Number(m.precio) - pagado)) }
  }).sort((a, b) => String(b.t).localeCompare(String(a.t)))
  const mid = new Map(mats.map((m) => [m.id, m]))
  const pagos = (data.pagos || []).filter((p) => mid.has(p.matricula_id)).map((p) => {
    const m = mid.get(p.matricula_id)
    return { t: p.creado || p.fecha, fecha: p.fecha, alumno: nom(alum.get(m.alumno_id)), grupo: m.grupo_codigo, numero: p.numero, monto: Number(p.monto), metodo: p.metodo, comprobante: !!p.comprobante_url }
  }).sort((a, b) => String(b.t).localeCompare(String(a.t)))
  return { prospectos, interesados, ventas, pagos }
}

/* ---------- Serie por día / semana / mes ---------- */
export function serieActividad(data, email, mes, vista) {
  const mats = (data.matriculas || []).filter((m) => m.vendedor === email && m.estado === 'activa')
  const mid = new Map(mats.map((m) => [m.id, m]))
  const pros = (data.prospectos || []).filter((p) => p.vendedor === email)
  const pagos = (data.pagos || []).filter((p) => mid.has(p.matricula_id))
  const [y, mm] = mes.split('-').map(Number)
  let claves, clave, etiqueta
  if (vista === 'dia') {
    const n = new Date(y, mm, 0).getDate()
    claves = Array.from({ length: n }, (_, i) => i + 1)
    clave = (iso) => (String(iso || '').slice(0, 7) === mes ? Number(String(iso).slice(8, 10)) : null)
    etiqueta = (k) => (k === 1 || k % 5 === 0 ? String(k) : '')
  } else if (vista === 'semana') {
    claves = [0, 1, 2, 3, 4]
    clave = (iso) => (String(iso || '').slice(0, 7) === mes ? Math.min(4, Math.floor((Number(String(iso).slice(8, 10)) - 1) / 7)) : null)
    etiqueta = (k) => `Sem ${k + 1}`
  } else {
    claves = mesesAtras(mes, 6)
    clave = (iso) => (claves.includes(String(iso || '').slice(0, 7)) ? String(iso).slice(0, 7) : null)
    etiqueta = (k) => new Date(k + '-01T00:00:00').toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
  }
  const filas = new Map(claves.map((k) => [k, { label: etiqueta(k), cupos: 0, prospectos: 0, vendido: 0, cobrado: 0 }]))
  const put = (iso, campo, v) => { const k = clave(iso); if (k !== null && filas.has(k)) filas.get(k)[campo] += v }
  const pesosS = pesosCupo(mats)
  mats.forEach((m) => { put(m.fecha_inscripcion, 'cupos', pesosS.get(m.id)); put(m.fecha_inscripcion, 'vendido', Number(m.precio)) })
  pros.forEach((p) => put(p.creado, 'prospectos', 1))
  pagos.forEach((p) => put(mid.get(p.matricula_id).fecha_inscripcion, 'cobrado', Number(p.monto)))
  return [...filas.values()]
}

/* ---------- Jornadas ---------- */
export const MINIMO_SEMANA_MIN = 24 * 60 // mínimo semanal (4 h × 6 días); puede trabajar más
export const SIN_SENAL_MIN = 15
export function lunesDe(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
export const jornadaSinSenal = (j, ahora = new Date()) => !j.fin && j.estado === 'abierta' && ahora - new Date(j.ultimo_pulso || j.inicio) > SIN_SENAL_MIN * 60000
export function minutosJornada(j, ahora = new Date()) {
  const ini = new Date(j.inicio).getTime()
  const fin = j.fin ? new Date(j.fin).getTime() : (jornadaSinSenal(j, ahora) ? new Date(j.ultimo_pulso || j.inicio).getTime() : ahora.getTime())
  return Math.max(0, Math.round((fin - ini) / 60000))
}
export function semanaHoras(data, email, lunes, ahora = new Date()) {
  const a = lunes.getTime(); const b = a + 7 * 86400000
  const jornadas = (data.jornadas || []).filter((j) => (!email || j.vendedor === email) && new Date(j.inicio).getTime() >= a && new Date(j.inicio).getTime() < b)
    .sort((x, y) => String(y.inicio).localeCompare(String(x.inicio)))
  const dias = [0, 0, 0, 0, 0, 0, 0]
  jornadas.forEach((j) => { dias[(new Date(j.inicio).getDay() + 6) % 7] += minutosJornada(j, ahora) })
  return { dias, total: dias.reduce((t, x) => t + x, 0), jornadas }
}
export const fmtHM = (min) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`
export function esLaptop() {
  if (typeof navigator === 'undefined') return true
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)) return false
  if (navigator.userAgentData?.mobile) return false
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches) return false
  return window.innerWidth >= 900
}

/* ---------- Recontactos de prospectos ---------- */
export function proximoRecontacto(p) {
  if (p.recontactar1 === 'si' && !p.contacto2_fecha && p.recontactar1_fecha) return { fecha: String(p.recontactar1_fecha).slice(0, 10), etapa: 1 }
  if (p.recontactar2 === 'si' && !p.recontacto2_hecho && p.recontactar2_fecha) return { fecha: String(p.recontactar2_fecha).slice(0, 10), etapa: 2 }
  return null
}
export function recontactoVencido(p, hoy = new Date().toISOString().slice(0, 10)) {
  if (['inscrito', 'perdido'].includes(p.estado)) return false
  const r = proximoRecontacto(p)
  return !!r && r.fecha < hoy
}

/* ---------- Reporte semanal (solo gerencia) ---------- */
export function reporteSemana(data, email, lunes, ahora = new Date()) {
  const a = lunes.getTime(); const b = a + 7 * 86400000
  const en = (iso) => { if (!iso) return false; const t = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso).getTime(); return t >= a && t < b }
  const hoy = ahora.toISOString().slice(0, 10)
  const mats = (data.matriculas || []).filter((m) => m.vendedor === email && m.estado === 'activa' && en(m.fecha_inscripcion))
  const paq = new Set(mats.map((m) => m.paquete_id || m.id))
  const vendido = r2(mats.reduce((t, m) => t + Number(m.precio || 0), 0))
  const pros = (data.prospectos || []).filter((p) => p.vendedor === email)
  const nuevosPros = pros.filter((p) => en(p.creado))
  const ints = (data.interesados || []).filter((x) => x.asignado_a === email && en(x.asignado_en || x.creado))
  const atendidos = ints.filter((x) => x.estado !== 'nuevo')
  const vencidos = pros.filter((p) => recontactoVencido(p, hoy))
  const progs = pros.filter((p) => { const r = proximoRecontacto(p); return r && en(r.fecha) })
  const pend = (data.pendientes || []).filter((x) => x.vendedor === email)
  const vencen = pend.filter((x) => en(x.fecha_limite))
  const hechosSem = pend.filter((x) => x.estado === 'realizado' && en(x.realizado_en))
  const abiertosVencidos = pend.filter((x) => x.estado === 'pendiente' && x.fecha_limite && x.fecha_limite < hoy)
  const horas = semanaHoras(data, email, lunes, ahora)
  return {
    inscritos: paq.size, matriculas: mats.length, vendido,
    prospectosNuevos: nuevosPros.length,
    interesados: ints.length, atendidos: atendidos.length, sinAtender: ints.length - atendidos.length,
    vencidos, programados: progs.length,
    pendientes: { vencenSemana: vencen.length, cumplidosDeEsos: vencen.filter((x) => x.estado === 'realizado').length, hechosSemana: hechosSem.length, abiertos: pend.filter((x) => x.estado === 'pendiente').length, vencidos: abiertosVencidos, asignadosSemana: pend.filter((x) => en(x.creado) && x.creado_por !== x.vendedor).length },
    horas,
  }
}

/* ---------- Alertas de venta: vacantes sin pagar y grupos de WhatsApp ---------- */
export function alertasVenta(data, email, ahora = new Date()) {
  const hoy = ahora.toISOString().slice(0, 10)
  const dif = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 86400000)
  const alum = new Map((data.alumnos || []).map((a) => [a.id, a]))
  const grupo = new Map((data.grupos || []).map((g) => [String(g.id), g]))
  const pagadoPor = new Map()
  ;(data.pagos || []).forEach((p) => pagadoPor.set(p.matricula_id, (pagadoPor.get(p.matricula_id) || 0) + Number(p.monto)))
  const porPaq = new Map()
  ;(data.matriculas || []).filter((m) => m.estado === 'activa' && (!email || m.vendedor === email)).forEach((m) => {
    const k = m.paquete_id || m.id; if (!porPaq.has(k)) porPaq.set(k, []); porPaq.get(k).push(m)
  })
  const vacantes = []
  porPaq.forEach((ms) => {
    const precio = ms.reduce((t, m) => t + Number(m.precio), 0)
    const pagado = ms.reduce((t, m) => t + (pagadoPor.get(m.id) || 0), 0)
    const saldo = Math.round((precio - pagado) * 100) / 100
    if (saldo <= 0.005) return
    const ini = ms.map((m) => grupo.get(String(m.grupo_id))?.inicio).filter(Boolean).sort()[0]
    if (!ini) return
    const d = dif(ini, hoy)  // días que faltan para empezar
    const a = alum.get(ms[0].alumno_id) || {}
    const base = { alumno: `${a.nombres || ''} ${a.apellido_paterno || ''}`.trim() || 'Alumno', celular: a.celular || '', saldo, inicio: ini, grupo: ms.map((m) => m.grupo_codigo).filter(Boolean).join(' + ') }
    if (d <= 0) vacantes.push({ ...base, nivel: 'retirar', txt: 'El curso ya empezó y no pagó: no se le dan accesos y se le retira del grupo de WhatsApp hasta que pague.' })
    else if (d === 1) vacantes.push({ ...base, nivel: 'hoy', txt: 'HOY vence su pago (un día antes del curso).' })
    else if (d <= 4) vacantes.push({ ...base, nivel: 'pronto', txt: `Debe pagar a más tardar el ${ini === hoy ? 'hoy' : new Date(new Date(ini + 'T12:00:00') - 86400000).toISOString().slice(0, 10)} (un día antes del curso).` })
  })
  const orden = { retirar: 0, hoy: 1, pronto: 2 }
  vacantes.sort((x, y) => orden[x.nivel] - orden[y.nivel])
  const waDe = (g) => (data.gruposWa || []).find((w) => String(w.grupo_id) === String(g.id))
  const gruposAdmin = (data.grupos || []).filter((g) => g.estado !== 'cerrado' && g.activo !== false && g.codigo && waDe(g) && !waDe(g).solo_admins && (!g.inicio || g.inicio >= hoy))
  return { vacantes, gruposAdmin }
}
