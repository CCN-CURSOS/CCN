import { createClient } from '@supabase/supabase-js'
import { monedaDe, simbolo } from './moneda.js'

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const WA_ENV = import.meta.env.VITE_WHATSAPP || '51944485759'
let numero = WA_ENV
export const setNumero = (n) => { if (n) numero = String(n).replace(/\D/g, '') || WA_ENV }
export const getNumero = () => numero
export const hasBackend = Boolean(SUPA_URL && SUPA_KEY)
export const supabase = hasBackend ? createClient(SUPA_URL, SUPA_KEY) : null

export const telefono = () => {
  const d = numero.replace(/\D/g, '')
  return d.length === 11 && d.startsWith('51') ? `+51 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}` : `+${d}`
}

/* Los que van en la página principal: los marcados como "En inicio" (máximo 5) */
export const MAX_INICIO = 3
export function destacados(cursos) {
  const marcados = cursos.filter((c) => c.destacado)
  return (marcados.length ? marcados : cursos).slice(0, MAX_INICIO)
}

/* Reduce la foto antes de guardarla (más rápida la web, menos peso) */
export function reducirImagen(file, ancho = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const k = Math.min(1, ancho / img.width)
      const cv = document.createElement('canvas')
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k)
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
      URL.revokeObjectURL(url)
      cv.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.82)
    }
    img.onerror = () => reject(new Error('Ese archivo no parece una imagen'))
    img.src = url
  })
}

export async function subirImagen(file) {
  const blob = await reducirImagen(file)
  if (!hasBackend) {
    return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })
  }
  const nombre = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('cursos').upload(nombre, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('cursos').getPublicUrl(nombre).data.publicUrl
}

export const wa = (text) => `https://wa.me/${numero}?text=${encodeURIComponent(text)}`

export const COLORES = {
  g1: { nombre: 'Violeta', hex: '#7C3AED' },
  g2: { nombre: 'Azul', hex: '#2563EB' },
  g3: { nombre: 'Magenta', hex: '#C026D3' },
  g4: { nombre: 'Turquesa', hex: '#0EA5A4' },
  g5: { nombre: 'Lila', hex: '#6366F1' },
  g6: { nombre: 'Rosa', hex: '#DB2777' },
  g7: { nombre: 'Verde agua', hex: '#10B981' },
  g8: { nombre: 'Índigo', hex: '#4338CA' },
  g9: { nombre: 'Naranja', hex: '#F97316' },
  g10: { nombre: 'Esmeralda', hex: '#059669' },
  g11: { nombre: 'Marino', hex: '#1E3A8A' },
  g12: { nombre: 'Grafito', hex: '#111827' },
  g13: { nombre: 'Ámbar', hex: '#FF9A00' },
  g14: { nombre: 'Terracota', hex: '#D97757' },
}

/* ---------- Datos de ejemplo (modo demostración, sin Supabase) ---------- */
const SEED_CURSOS = [
  { id: 'c1', titulo: 'IA aplicada a negocios', color: 'g1', horas: 12, sesiones: 4, precio: 359, orden: 1, activo: true, destacado: true, imagen_url: '', precio_antes: null,
    descripcion: 'Usa la IA para vender, atender y organizar tu negocio. Terminas con un asistente propio.',
    programas: 'ChatGPT, Claude, Gemini, Canva, Google Sheets',
    temario: ['Presentación de las herramientas', 'IA para vender y comunicar', 'IA para organizar tu negocio', 'Tu asistente propio', 'Proyecto y presentación'],
    extra: 'automatización, medir el ahorro y privacidad' },
  { id: 'c2', titulo: 'Crea y publica tu primera página web', color: 'g2', horas: 24, sesiones: 8, precio: 359, orden: 2, activo: true, destacado: true, imagen_url: '', precio_antes: null,
    descripcion: 'Construyes tu página desde cero y la publicas con dominio propio y botón de WhatsApp.',
    programas: 'VS Code, GitHub, Vercel, Chrome',
    temario: ['Cómo funciona la web', 'HTML: la estructura', 'CSS: el estilo', 'Diseño de una landing que convierte', 'JavaScript básico', 'Publicar en internet', 'Aparecer en Google y medir visitas', 'Proyecto y presentación'],
    extra: 'Git, rendimiento, seguridad y cómo cotizar una web' },
  { id: 'c5', titulo: 'Notion para tu negocio', color: 'g5', horas: 12, sesiones: 4, precio: 229, orden: 3, activo: true, destacado: true, imagen_url: '', precio_antes: null,
    descripcion: 'Ordenas clientes, tareas y ventas en un solo espacio de trabajo listo para usar.',
    programas: 'Notion (plan gratuito)', temario: [], extra: '' },
]

const SEED_ENLACES = [
  { id: 'e1', titulo: 'VER LOS CURSOS', subtitulo: 'Online · desde S/229', url: '/cursos', tipo: 'enlace', destacado: true, orden: 1, activo: true, clics: 0 },
  { id: 'e2', titulo: 'ESCRÍBENOS POR WHATSAPP', subtitulo: 'Inscripciones y consultas', url: '', tipo: 'whatsapp', destacado: false, orden: 2, activo: true, clics: 0 },
  { id: 'e3', titulo: 'INSTAGRAM', subtitulo: 'Pon aquí tu @usuario', url: 'https://instagram.com/', tipo: 'enlace', destacado: false, orden: 3, activo: false, clics: 0 },
  { id: 'e4', titulo: 'TIKTOK', subtitulo: 'Pon aquí tu @usuario', url: 'https://tiktok.com/', tipo: 'enlace', destacado: false, orden: 4, activo: false, clics: 0 },
]

const LS = 'ccn-demo-v1'
/* Código único de alumno: AÑO-CORRELATIVO-MES-ÚLTIMOS 3 DEL DNI (ej. 2026-000-10-678). En Supabase lo pone la base de datos; aquí imita lo mismo. */
export function demoCodigoAlumno(db, documento) {
  const d = new Date(); const anio = String(d.getFullYear()); const mes = String(d.getMonth() + 1).padStart(2, '0')
  const usados = db.alumnos.map((a) => String(a.codigo || '').split('-')).filter((x) => x[0] === anio && x[2] === mes).map((x) => Number(x[1]))
  const n = usados.length ? Math.max(...usados) + 1 : 0
  return `${anio}-${String(n).padStart(3, '0')}-${mes}-${String(documento || '').replace(/\D/g, '').padStart(3, '0').slice(-3)}`
}
export const DEMO_USER = 'demo@ccn.pe'
const demoRead = () => {
  try {
    const raw = localStorage.getItem(LS)
    if (raw) { const d = JSON.parse(raw); if (!d.enlaces) d.enlaces = SEED_ENLACES; if (!d.consultas) d.consultas = []; if (!d.interesados) d.interesados = []; for (const k of ['alumnos', 'matriculas', 'pagos', 'historial', 'prospectos', 'trabajadores', 'gruposWa', 'asignaciones', 'pagos_trabajador', 'instalaciones', 'accesos', 'jornadas', 'pendientes', 'notas_agenda', 'plantillas', 'documentos', 'quejas', 'clases', 'asistencias', 'descuentos_trab', 'certificados', 'firmas', 'entregables', 'entregas', 'grupo_evaluaciones', 'grupo_accesos', 'grupo_material', 'alumno_notas']) if (!d[k]) d[k] = []; if (!d.equipo) d.equipo = [{ email: 'demo@ccn.pe', rol: 'gerente' }]; return d }
  } catch (e) { /* sin almacenamiento */ }
  return { cursos: SEED_CURSOS, grupos: [], enlaces: SEED_ENLACES, consultas: [], interesados: [], alumnos: [], matriculas: [], pagos: [], historial: [], prospectos: [], trabajadores: [], gruposWa: [], asignaciones: [], pagos_trabajador: [], instalaciones: [], accesos: [], jornadas: [], pendientes: [], notas_agenda: [], plantillas: [], documentos: [], quejas: [], clases: [], asistencias: [], descuentos_trab: [], certificados: [], firmas: [], entregables: [], entregas: [], grupo_evaluaciones: [], grupo_accesos: [], grupo_material: [], alumno_notas: [], equipo: [{ email: 'demo@ccn.pe', rol: 'gerente' }], ajustes: { whatsapp: WA_ENV } }
}
const demoWrite = (db) => { try { localStorage.setItem(LS, JSON.stringify(db)) } catch (e) { /* ignorar */ } }
const uid = () => 'd' + Math.random().toString(36).slice(2, 10)

/* ---------- Lectura pública ---------- */
export async function loadCatalog() {
  if (!hasBackend) {
    const db = demoRead()
    setNumero(db.ajustes?.whatsapp)
    return {
      cursos: db.cursos.filter((c) => c.activo).sort((a, b) => a.orden - b.orden),
      grupos: db.grupos.filter((g) => g.activo && g.estado !== 'cerrado'),
    }
  }
  const [c, g, a] = await Promise.all([
    supabase.from('cursos').select('*').eq('activo', true).order('orden'),
    supabase.from('grupos').select('*').eq('activo', true).neq('estado', 'cerrado').order('inicio'),
    supabase.from('ajustes').select('*').eq('clave', 'whatsapp').maybeSingle(),
  ])
  if (c.error) throw c.error
  if (g.error) throw g.error
  setNumero(a.data?.valor)
  return { cursos: c.data, grupos: g.data }
}

/* ---------- Página de enlaces (/links) ---------- */
export async function loadEnlaces() {
  if (!hasBackend) {
    const db = demoRead()
    setNumero(db.ajustes?.whatsapp)
    return db.enlaces.filter((e) => e.activo).sort((a, b) => a.orden - b.orden)
  }
  const [e, a] = await Promise.all([
    supabase.from('enlaces').select('*').eq('activo', true).order('orden'),
    supabase.from('ajustes').select('*').eq('clave', 'whatsapp').maybeSingle(),
  ])
  if (e.error) throw e.error
  setNumero(a.data?.valor)
  return e.data
}

export function hrefEnlace(e) {
  if (e.tipo === 'whatsapp') return wa('Hola, vengo desde el enlace de CCN y quiero información.')
  return e.url
}

export async function contarClic(id) {
  try {
    if (!hasBackend) {
      const db = demoRead(); const x = db.enlaces.find((y) => y.id === id)
      if (x) { x.clics = (x.clics || 0) + 1; demoWrite(db) }
      return
    }
    await supabase.rpc('clic_enlace', { enlace_id: id })
  } catch (e) { /* no frenar al visitante */ }
}

/* ---------- Panel admin ---------- */
export async function loadAll() {
  if (!hasBackend) {
    const db = demoRead()
    return { ...db, ajustes: db.ajustes || { whatsapp: WA_ENV }, instructoresDisp: (db.trabajadores || []).filter((t) => t.activo !== false && t.puesto === 'instructor')
      .map((t) => ({ id: t.id, nombre: t.nombre, email: t.email, acceso: (db.equipo || []).some((e) => e.rol === 'profesor' && e.email === t.email) })), clasesConAsistencia: [...new Set((db.asistencias || []).map((x) => x.clase_id))] }
  }
  const [c, g, a, en, co, it, al, ma, pa, hi, eq, pr, tr, gw, asg, pt, ins, acc, jor, pen, nta, pla, doc, que, des, cer, fir, ent, cla, gev, ist, gac, asi, dsp] = await Promise.all([
    supabase.from('cursos').select('*').order('orden'),
    supabase.from('grupos').select('*').order('inicio', { ascending: false }),
    supabase.from('ajustes').select('*'),
    supabase.from('enlaces').select('*').order('orden'),
    supabase.from('consultas').select('*').order('creado', { ascending: false }),
    supabase.from('interesados').select('*').order('creado', { ascending: false }),
    supabase.from('alumnos').select('*').order('creado', { ascending: false }),
    supabase.from('matriculas').select('*').order('creado', { ascending: false }),
    supabase.from('pagos').select('*').order('creado', { ascending: false }),
    supabase.from('historial').select('*').order('creado', { ascending: false }).limit(1000),
    supabase.from('admins').select('*'),
    supabase.from('prospectos').select('*').order('creado', { ascending: false }),
    supabase.from('trabajadores').select('*').order('nombre'),
    supabase.from('grupos_whatsapp').select('*'),
    supabase.from('asignaciones').select('*'),
    supabase.from('pagos_trabajador').select('*').order('fecha', { ascending: false }),
    supabase.from('instalaciones').select('*').order('fecha').order('hora'),
    supabase.from('accesos').select('*').order('servicio'),
    supabase.from('jornadas').select('*').order('inicio', { ascending: false }).limit(1500),
    supabase.from('pendientes').select('*').order('creado', { ascending: false }),
    supabase.from('notas_agenda').select('*').order('actualizado', { ascending: false }),
    supabase.from('plantillas_doc').select('*'),
    supabase.from('documentos_trab').select('*').order('creado', { ascending: false }),
    supabase.from('quejas').select('*').order('creado', { ascending: false }),
    supabase.from('descuentos_trab').select('*').order('creado', { ascending: false }),
    supabase.from('certificados').select('*').order('creado', { ascending: false }).limit(3000),
    supabase.from('firmas').select('*'),
    supabase.from('entregables').select('*').order('curso_id').order('orden'),
    supabase.from('clases').select('id, grupo_id, numero, inicio, fin, reabierta_hasta, reabierta_por, reabierta_motivo').order('grupo_id').order('numero').limit(5000),
    supabase.from('grupo_evaluaciones').select('*'),
    supabase.rpc('instructores_de_grupos'),
    supabase.from('grupo_accesos').select('*'),
    supabase.from('asistencias').select('clase_id').limit(30000),
    supabase.rpc('instructores_disponibles'),
  ])
  if (c.error) throw c.error
  if (g.error) throw g.error
  const ajustes = Object.fromEntries((a.data || []).map((x) => [x.clave, x.valor]))
  const crmError = [al, ma, pa].find((x) => x.error)?.error?.message || ''
  // Si alguna tabla aún no existe en Supabase (falta pegar su SQL), el panel sigue funcionando sin esa sección.
  return {
    cursos: c.data, grupos: g.data, enlaces: en.data || [],
    consultas: co.error ? [] : (co.data || []), consultasError: co.error ? co.error.message : '',
    interesados: it.error ? [] : (it.data || []), interesadosError: it.error ? it.error.message : '',
    alumnos: al.error ? [] : (al.data || []), matriculas: ma.error ? [] : (ma.data || []), pagos: pa.error ? [] : (pa.data || []),
    historial: hi.error ? [] : (hi.data || []), equipo: eq.error ? [] : (eq.data || []), prospectos: pr.error ? [] : (pr.data || []), prospectosError: pr.error ? pr.error.message : '', trabajadores: tr.error ? [] : (tr.data || []), trabajadoresError: tr.error ? tr.error.message : '', gruposWa: gw.error ? [] : (gw.data || []), gruposWaError: gw.error ? gw.error.message : '', asignaciones: asg.error ? [] : (asg.data || []), pagos_trabajador: pt.error ? [] : (pt.data || []), profesoresError: asg.error ? asg.error.message : '', instalaciones: ins.error ? [] : (ins.data || []), instalacionesError: ins.error ? ins.error.message : '', accesos: acc.error ? [] : (acc.data || []), accesosError: acc.error ? acc.error.message : '', jornadas: jor.error ? [] : (jor.data || []), jornadasError: jor.error ? jor.error.message : '', pendientes: pen.error ? [] : (pen.data || []), pendientesError: pen.error ? pen.error.message : '', notas_agenda: nta.error ? [] : (nta.data || []), notasError: nta.error ? nta.error.message : '', plantillas: pla.error ? [] : (pla.data || []), documentos: doc.error ? [] : (doc.data || []), documentosError: doc.error ? doc.error.message : '', quejas: que.error ? [] : (que.data || []), quejasError: que.error ? que.error.message : '', descuentos_trab: des.error ? [] : (des.data || []), certificados: cer.error ? [] : (cer.data || []), certificadosError: cer.error ? cer.error.message : '', firmas: fir.error ? [] : (fir.data || []), entregables: ent.error ? [] : (ent.data || []), entregablesError: ent.error ? ent.error.message : '', crmError,
    clases: cla.error ? [] : (cla.data || []), grupo_evaluaciones: gev.error ? [] : (gev.data || []), instructores: ist.error ? [] : (ist.data || []), grupo_accesos: gac.error ? [] : (gac.data || []), instructoresDisp: dsp.error ? [] : (dsp.data || []),
    clasesConAsistencia: asi.error ? null : [...new Set((asi.data || []).map((x) => x.clase_id))],
    ajustes: { whatsapp: WA_ENV, ...ajustes },
  }
}

/* ---------- Solicitudes de información (formulario de la web) ---------- */
export async function crearConsulta(c) {
  const fila = {
    nombres: c.nombres, apellido_paterno: c.apellido_paterno, apellido_materno: c.apellido_materno,
    email: c.email, tipo_doc: c.tipo_doc, documento: c.documento, celular: c.celular,
    modalidad: c.modalidad, curso: c.curso, otro_tema: c.otro_tema || '',
    acepta_datos: true, acepta_adicional: Boolean(c.acepta_adicional), estado: 'nuevo',
  }
  if (!hasBackend) {
    const db = demoRead()
    db.consultas.unshift({ ...fila, id: uid(), creado: new Date().toISOString() })
    demoWrite(db)
    return
  }
  const { error } = await supabase.from('consultas').insert(fila)
  if (error) throw error
}

export async function marcarConsulta(id, estado, tabla = 'consultas') {
  if (!hasBackend) {
    const db = demoRead(); const x = db[tabla].find((y) => y.id === id)
    if (x) { x.estado = estado; demoWrite(db) }
    return
  }
  const { error } = await supabase.from(tabla).update({ estado }).eq('id', id)
  if (error) throw error
}

/* Excel: archivo CSV con tildes correctas (se abre directo en Excel) */
export function consultasCSV(lista) {
  const cab = ['Fecha', 'Hora', 'Nombres', 'Apellido paterno', 'Apellido materno', 'Email', 'Tipo de documento', 'N° de documento', 'Celular', 'Modalidad', 'Curso', 'Otro tema', 'Acepta información adicional', 'Estado']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const filas = lista.map((x) => {
    const d = x.creado ? new Date(x.creado) : null
    return [
      d ? d.toLocaleDateString('es-PE') : '', d ? d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '',
      x.nombres, x.apellido_paterno, x.apellido_materno, x.email, x.tipo_doc, x.documento, x.celular,
      x.modalidad, x.curso, x.otro_tema, x.acepta_adicional ? 'Sí' : 'No', x.estado,
    ]
  })
  return '﻿sep=,\r\n' + [cab, ...filas].map((f) => f.map(esc).join(',')).join('\r\n')
}

/* ---------- Interesados (formulario de inscripción de cada curso) ---------- */
/* Demo: reparte al que lleva más tiempo sin recibir (igual que el automático de Supabase) */
function demoElegirVendedora(db, email) {
  const prev = email && db.interesados.find((i) => String(i.email).toLowerCase() === String(email).toLowerCase() && i.asignado_a && Date.now() - (Date.parse(i.creado) || 0) < 30 * 60000)
  if (prev && (db.equipo || []).some((e) => e.email === prev.asignado_a && e.rol === 'vendedora' && e.recibe_interesados !== false)) return prev.asignado_a
  const v = (db.equipo || []).filter((e) => e.rol === 'vendedora' && e.recibe_interesados !== false)
  const ult = (m) => Math.max(0, ...db.interesados.filter((i) => i.asignado_a === m).map((i) => Date.parse(i.asignado_en) || 0))
  return v.sort((a, b) => ult(a.email) - ult(b.email) || a.email.localeCompare(b.email))[0]?.email || null
}
export async function crearInteresado(c) {
  const fila = {
    curso_id: String(c.curso_id), curso: c.curso, lista_espera: Boolean(c.lista_espera), inicio: c.inicio || '',
    nombres: c.nombres, apellido_paterno: c.apellido_paterno, apellido_materno: c.apellido_materno,
    email: c.email, tipo_doc: c.tipo_doc, documento: c.documento, celular: c.celular,
    acepta_datos: true, acepta_adicional: Boolean(c.acepta_adicional), estado: 'nuevo',
  }
  if (c.observacion) fila.observacion = String(c.observacion).slice(0, 300)
  if (c.moneda === 'USD') fila.moneda = 'USD'    // solo se manda si es en dólares (así los pedidos en soles no dependen de la columna nueva)
  if (!hasBackend) {
    const db = demoRead()
    const quien = demoElegirVendedora(db, fila.email)
    db.interesados.unshift({ ...fila, id: uid(), creado: new Date().toISOString(), asignado_a: quien, asignado_en: quien ? new Date().toISOString() : null })
    demoWrite(db)
    return
  }
  const { error } = await supabase.from('interesados').insert(fila)
  if (error) throw error
}

export function interesadosCSV(lista) {
  const cab = ['Fecha', 'Hora', 'Curso', 'Lista de espera', 'Nombres', 'Apellido paterno', 'Apellido materno', 'Email', 'Tipo de documento', 'N° de documento', 'Celular', 'Acepta información adicional', 'Estado']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const filas = lista.map((x) => {
    const d = x.creado ? new Date(x.creado) : null
    return [
      d ? d.toLocaleDateString('es-PE') : '', d ? d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '',
      x.curso, x.lista_espera ? 'Sí' : 'No', x.nombres, x.apellido_paterno, x.apellido_materno, x.email, x.tipo_doc, x.documento, x.celular,
      x.acepta_adicional ? 'Sí' : 'No', x.estado === 'nuevo' ? 'Nuevo' : 'Contactado',
    ]
  })
  return '\ufeffsep=,\r\n' + [cab, ...filas].map((f) => f.map(esc).join(',')).join('\r\n')
}

export async function saveAjuste(clave, valor) {
  if (!hasBackend) {
    const db = demoRead()
    db.ajustes = { ...(db.ajustes || {}), [clave]: valor }
    demoWrite(db)
    return
  }
  const { error } = await supabase.from('ajustes').upsert({ clave, valor })
  if (error) throw error
}

export async function save(tabla, row) {
  const limpio = { ...row }
  if (!hasBackend) {
    const db = demoRead()
    const lista = db[tabla]
    if (limpio.id) {
      const i = lista.findIndex((x) => x.id === limpio.id)
      lista[i] = { ...lista[i], ...limpio }
    } else {
      if (tabla === 'grupos' && !limpio.codigo) limpio.codigo = demoCodigo(db)
      lista.push({ ...limpio, id: uid() })
    }
    demoWrite(db)
    return
  }
  if (!limpio.id) delete limpio.id
  if (limpio.id) {
    // Edición parcial (p. ej. solo "activo"): UPDATE directo, porque un upsert con campos faltantes rompe las columnas obligatorias.
    const { id, ...campos } = limpio
    const r = await supabase.from(tabla).update(campos).eq('id', id).select('id')
    if (r.error) throw r.error
    if (r.data && r.data.length) return
  }
  const { error } = await supabase.from(tabla).upsert(limpio)
  if (error) throw error
}

export async function remove(tabla, id) {
  if (!hasBackend) {
    const db = demoRead()
    db[tabla] = db[tabla].filter((x) => x.id !== id)
    if (tabla === 'trabajadores') { db.asignaciones = (db.asignaciones || []).filter((x) => x.trabajador_id !== id); db.pagos_trabajador = (db.pagos_trabajador || []).filter((x) => x.trabajador_id !== id) }
    if (tabla === 'asignaciones') db.pagos_trabajador = (db.pagos_trabajador || []).map((x) => (x.asignacion_id === id ? { ...x, asignacion_id: null } : x))
    if (tabla === 'cursos') db.grupos = db.grupos.filter((g) => g.curso_id !== id)
    if (tabla === 'alumnos') { const ms = db.matriculas.filter((m) => m.alumno_id === id).map((m) => m.id); db.matriculas = db.matriculas.filter((m) => m.alumno_id !== id); db.pagos = db.pagos.filter((p) => !ms.includes(p.matricula_id)); demoSync(db) }
    demoWrite(db)
    return
  }
  const { error } = await supabase.from(tabla).delete().eq('id', id)
  if (error) throw error
}

/* Rol de quien entra: 'gerente' (todo), 'vendedora' (prospectos, inscritos y pagos) o null (sin acceso) */
export async function getRol(email) {
  if (!hasBackend) return (demoRead().equipo || []).find((x) => x.email === DEMO_USER)?.rol || 'gerente'
  const { data, error } = await supabase.from('admins').select('rol').eq('email', email).maybeSingle()
  if (!error) return data ? (data.rol || 'gerente') : null
  // Si la columna "rol" aún no existe (falta pegar crm.sql), quien está en admins sigue siendo gerente.
  const r = await supabase.from('admins').select('email').eq('email', email).maybeSingle()
  return !r.error && r.data ? 'gerente' : null
}
export async function esAdmin(email) { return Boolean(await getRol(email)) }

export const fechaCorta = (iso) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long' }) : ''

/* =====================================================================
   CRM: alumnos, matrículas, pagos y comprobantes
   ===================================================================== */
import { r2, suma } from './formato.js'

/* Reparte un monto entre n partes (la última lleva el resto, para que sume exacto) */
export function repartir(total, pesos) {
  const n = pesos.length
  const base = pesos.reduce((t, p) => t + Number(p || 0), 0)
  const out = []
  let acum = 0
  pesos.forEach((p, i) => {
    if (i === n - 1) out.push(r2(total - acum))
    else { const v = r2(base > 0 ? total * (Number(p) / base) : total / n); out.push(v); acum += v }
  })
  return out
}

const demoCodigo = (db) => {
  const nums = db.grupos.map((g) => parseInt(String(g.codigo || '').replace(/\D/g, ''), 10)).filter(Boolean)
  return 'G' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, '0')
}
function demoSync(db) {
  db.grupos.forEach((g) => {
    const n = db.matriculas.filter((m) => m.grupo_id === g.id && m.estado === 'activa').length
    g.inscritos = n
    const mx = g.maximo || 20
    if (g.estado !== 'cerrado') g.estado = n >= mx ? 'lleno' : (g.estado === 'lleno' ? 'abierto' : g.estado)
  })
}
const demoLog = (db, grupo_id, curso_id, tipo, detalle) =>
  db.historial.unshift({ id: uid(), creado: new Date().toISOString(), grupo_id: String(grupo_id || ''), curso_id: String(curso_id || ''), tipo, detalle, usuario: 'demo' })

export async function subirComprobante(file) {
  const blob = await reducirImagen(file, 1400)
  if (!hasBackend) return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })
  const d = new Date()
  const ruta = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('comprobantes').upload(ruta, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return ruta
}

export async function urlComprobante(ruta) {
  if (!ruta) return ''
  if (ruta.startsWith('data:')) return ruta
  if (!hasBackend) return ''
  const { data, error } = await supabase.storage.from('comprobantes').createSignedUrl(ruta, 3600)
  if (error) throw error
  return data.signedUrl
}

/* Crea (o actualiza) al alumno, lo matricula en 1 o más grupos y registra su primer pago */
export async function crearInscripcion({ alumno, grupos, precioTotal, pago, paquete = '', nota = '', fecha, terminos = false, requisitos = false, descuentoAutorizado = false, descuentoMotivo = '', moneda = 'PEN' }) {
  moneda = moneda === 'USD' ? 'USD' : 'PEN'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(alumno.email || '').trim())) throw new Error('El correo del alumno es obligatorio.')
  const hoy = fecha || new Date().toISOString().slice(0, 10)
  const precios = repartir(precioTotal, grupos.map(() => 1))
  const paqueteId = crypto.randomUUID()
  const aFila = { tipo_doc: alumno.tipo_doc, documento: alumno.documento.trim(), nombres: alumno.nombres.trim(), apellido_paterno: alumno.apellido_paterno.trim(), apellido_materno: (alumno.apellido_materno || '').trim(), email: (alumno.email || '').trim(), celular: (alumno.celular || '').trim() }

  if (!hasBackend) {
    const db = demoRead()
    let al = db.alumnos.find((x) => x.tipo_doc === aFila.tipo_doc && x.documento === aFila.documento)
    if (al) Object.assign(al, aFila)
    else { al = { ...aFila, id: uid(), creado: new Date().toISOString(), notas: '', codigo: demoCodigoAlumno(db, aFila.documento) }; db.alumnos.unshift(al) }
    for (const g of grupos) {
      if (db.matriculas.some((m) => m.alumno_id === al.id && m.grupo_id === g.id && m.estado === 'activa')) throw new Error(`Este alumno ya está inscrito en ${g.codigo || 'ese grupo'}.`)
    }
    const nuevas = grupos.map((g, i) => ({ id: uid(), creado: new Date().toISOString(), paquete_id: paqueteId, paquete, alumno_id: al.id, grupo_id: g.id, grupo_codigo: g.codigo || '', curso_id: g.curso_id, curso_titulo: g.curso_titulo, precio: precios[i], moneda, fecha_inscripcion: hoy, estado: 'activa', nota, terminos_enviados: !!terminos, requisitos_enviados: !!requisitos, descuento_autorizado: !!descuentoAutorizado, descuento_motivo: descuentoMotivo || '', vendedor: DEMO_USER }))
    db.matriculas.unshift(...nuevas)
    if (pago && Number(pago.monto) > 0) {
      const partes = repartir(Number(pago.monto), precios)
      const lote = crypto.randomUUID()
      nuevas.forEach((m, i) => { if (partes[i] > 0) db.pagos.unshift({ id: uid(), creado: new Date().toISOString(), matricula_id: m.id, numero: 1, monto: partes[i], moneda, fecha: pago.fecha || hoy, metodo: pago.metodo, comprobante_url: pago.comprobante_url || '', lote, nota: '' }) })
    }
    nuevas.forEach((m) => demoLog(db, m.grupo_id, m.curso_id, 'inscripcion', `Inscrito: ${al.nombres} ${al.apellido_paterno} en ${m.grupo_codigo} (${simbolo(moneda)} ${m.precio})`))
    demoSync(db); demoWrite(db)
    return al.codigo
  }

  // 1) alumno
  const { data: ex, error: e0 } = await supabase.from('alumnos').select('id, codigo').eq('tipo_doc', aFila.tipo_doc).eq('documento', aFila.documento).maybeSingle()
  if (e0) throw e0
  let alumnoId = ex?.id
  let alumnoCodigo = ex?.codigo || ''
  if (alumnoId) {
    const { error } = await supabase.from('alumnos').update(aFila).eq('id', alumnoId)
    if (error) throw error
    const { data: ya } = await supabase.from('matriculas').select('grupo_codigo').eq('alumno_id', alumnoId).eq('estado', 'activa').in('grupo_id', grupos.map((g) => String(g.id)))
    if (ya?.length) throw new Error(`Este alumno ya está inscrito en ${ya.map((x) => x.grupo_codigo).join(', ')}.`)
  } else {
    const { data, error } = await supabase.from('alumnos').insert(aFila).select('id, codigo').single()
    if (error) throw error
    alumnoId = data.id; alumnoCodigo = data.codigo
  }
  // 2) matrículas
  const filas = grupos.map((g, i) => ({ paquete_id: paqueteId, paquete, alumno_id: alumnoId, grupo_id: String(g.id), grupo_codigo: g.codigo || '', curso_id: String(g.curso_id), curso_titulo: g.curso_titulo, precio: precios[i], moneda, fecha_inscripcion: hoy, nota, terminos_enviados: !!terminos, requisitos_enviados: !!requisitos, descuento_autorizado: !!descuentoAutorizado, descuento_motivo: descuentoMotivo || '' }))
  const { data: mats, error: e2 } = await supabase.from('matriculas').insert(filas).select('id, precio')
  if (e2) throw e2
  // 3) primer pago (repartido entre las matrículas del paquete)
  if (pago && Number(pago.monto) > 0) {
    const partes = repartir(Number(pago.monto), mats.map((m) => m.precio))
    const lote = crypto.randomUUID()
    const pf = mats.map((m, i) => ({ matricula_id: m.id, numero: 1, monto: partes[i], moneda, fecha: pago.fecha || hoy, metodo: pago.metodo, comprobante_url: pago.comprobante_url || '', lote })).filter((x) => x.monto > 0)
    const { error } = await supabase.from('pagos').insert(pf)
    if (error) throw error
  }
  return alumnoCodigo
}

/* Agrega Pago 2, Pago 3… a una inscripción (todas las matrículas de un paquete) */
export async function agregarPago({ matriculas, pago }) {
  const partes = repartir(Number(pago.monto), matriculas.map((m) => m.precio))
  const lote = crypto.randomUUID()
  if (!hasBackend) {
    const db = demoRead()
    matriculas.forEach((m, i) => {
      const num = Math.max(0, ...db.pagos.filter((p) => p.matricula_id === m.id).map((p) => p.numero)) + 1
      if (partes[i] > 0) db.pagos.unshift({ id: uid(), creado: new Date().toISOString(), matricula_id: m.id, numero: num, monto: partes[i], moneda: monedaDe(m), fecha: pago.fecha, metodo: pago.metodo, comprobante_url: pago.comprobante_url || '', lote, nota: pago.nota || '' })
      demoLog(db, m.grupo_id, m.curso_id, 'pago', `Pago ${num}: ${simbolo(monedaDe(m))} ${partes[i]} (${pago.metodo}) en ${m.grupo_codigo}`)
    })
    demoWrite(db)
    return
  }
  const ids = matriculas.map((m) => m.id)
  const { data: prev, error: e0 } = await supabase.from('pagos').select('matricula_id, numero').in('matricula_id', ids)
  if (e0) throw e0
  const filas = matriculas.map((m, i) => ({
    matricula_id: m.id, numero: Math.max(0, ...(prev || []).filter((p) => p.matricula_id === m.id).map((p) => p.numero)) + 1,
    monto: partes[i], moneda: monedaDe(m), fecha: pago.fecha, metodo: pago.metodo, comprobante_url: pago.comprobante_url || '', lote, nota: pago.nota || '',
  })).filter((x) => x.monto > 0)
  const { error } = await supabase.from('pagos').insert(filas)
  if (error) throw error
}

/* Anular / reactivar / borrar una inscripción completa (todas sus matrículas) */
export async function estadoInscripcion(paqueteId, estado) {
  if (!hasBackend) {
    const db = demoRead(); db.matriculas.filter((m) => m.paquete_id === paqueteId).forEach((m) => { m.estado = estado; demoLog(db, m.grupo_id, m.curso_id, 'matricula', `Matrícula ${estado} en ${m.grupo_codigo}`) })
    demoSync(db); demoWrite(db); return
  }
  const { error } = await supabase.from('matriculas').update({ estado }).eq('paquete_id', paqueteId)
  if (error) throw error
}
export async function borrarInscripcion(paqueteId) {
  if (!hasBackend) {
    const db = demoRead(); const ids = db.matriculas.filter((m) => m.paquete_id === paqueteId).map((m) => m.id)
    db.matriculas = db.matriculas.filter((m) => m.paquete_id !== paqueteId); db.pagos = db.pagos.filter((p) => !ids.includes(p.matricula_id))
    demoSync(db); demoWrite(db); return
  }
  const { error } = await supabase.from('matriculas').delete().eq('paquete_id', paqueteId)
  if (error) throw error
}

/* Une alumno + matrículas + pagos en filas fáciles de leer (una por inscripción) */
export function armarInscripciones({ alumnos = [], matriculas = [], pagos = [] }) {
  const alum = new Map(alumnos.map((a) => [a.id, a]))
  const pagosPor = new Map()
  pagos.forEach((p) => { if (!pagosPor.has(p.matricula_id)) pagosPor.set(p.matricula_id, []); pagosPor.get(p.matricula_id).push(p) })
  const porPaq = new Map()
  matriculas.forEach((m) => {
    if (!porPaq.has(m.paquete_id)) porPaq.set(m.paquete_id, { id: m.paquete_id, alumno: alum.get(m.alumno_id) || null, matriculas: [], creado: m.creado, fecha: m.fecha_inscripcion, paquete: m.paquete, vendedor: m.vendedor || m.creado_por || '' })
    porPaq.get(m.paquete_id).matriculas.push(m)
  })
  return [...porPaq.values()].map((x) => {
    const activas = x.matriculas.filter((m) => m.estado === 'activa')
    const pg = x.matriculas.flatMap((m) => pagosPor.get(m.id) || [])
    const precio = suma(activas.map((m) => m.precio))
    const pagado = suma(pg.filter((p) => activas.some((m) => m.id === p.matricula_id)).map((p) => p.monto))
    const lotes = new Map()
    pg.forEach((p) => {
      const k = p.lote || p.id
      if (!lotes.has(k)) lotes.set(k, { numero: p.numero, monto: 0, fecha: p.fecha, metodo: p.metodo, comprobante_url: p.comprobante_url, nota: p.nota })
      lotes.get(k).monto = r2(lotes.get(k).monto + Number(p.monto))
    })
    const lista = [...lotes.values()].sort((a, b) => a.numero - b.numero || String(a.fecha).localeCompare(String(b.fecha)))
    const anulada = activas.length === 0
    const estado = anulada ? 'anulada' : pagado >= precio - 0.005 ? 'pagado' : pagado > 0 ? 'adelanto' : 'pendiente'
    return { ...x, moneda: monedaDe(activas[0] || x.matriculas[0]), activas, precio, pagado, saldo: r2(Math.max(0, precio - pagado)), pagosLista: lista, estado, codigos: x.matriculas.map((m) => m.grupo_codigo).filter(Boolean), mes: String(x.fecha || x.creado || '').slice(0, 7) }
  }).sort((a, b) => String(b.creado).localeCompare(String(a.creado)))
}

export function inscritosCSV(lista) {
  const cab = ['Fecha de inscripción', 'Código alumno', 'Alumno', 'Documento', 'Celular', 'Email', 'Cursos', 'Códigos', 'Moneda', 'Precio', 'Pagado', 'Saldo', 'Estado', 'Pago 1', 'Pago 2', 'Pago 3']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const filas = lista.map((x) => {
    const a = x.alumno || {}
    const pg = (i) => (x.pagosLista[i] ? `${simbolo(x.moneda)} ${x.pagosLista[i].monto} · ${x.pagosLista[i].metodo} · ${x.pagosLista[i].fecha}` : '')
    return [x.fecha, a.codigo || '', `${a.nombres || ''} ${a.apellido_paterno || ''} ${a.apellido_materno || ''}`.trim(), `${a.tipo_doc || ''} ${a.documento || ''}`, a.celular, a.email,
      x.matriculas.map((m) => m.curso_titulo).join(' + '), x.codigos.join(' + '), x.moneda === 'USD' ? 'US$' : 'S/', x.precio, x.pagado, x.saldo, x.estado, pg(0), pg(1), pg(2)]
  })
  return '\ufeffsep=,\r\n' + [cab, ...filas].map((f) => f.map(esc).join(',')).join('\r\n')
}

/* ¿Tiene el permiso extra de coordinación académica? (ej. Carla: vendedora + Académico) */
export async function getCoordina(email) {
  if (!hasBackend) return !!(demoRead().equipo || []).find((x) => x.email === DEMO_USER)?.coordina
  const { data, error } = await supabase.from('admins').select('coordina').eq('email', email).maybeSingle()
  return !error && !!(data && data.coordina)
}
export async function ponerCoordina(email, valor) {
  if (!hasBackend) { const db = demoRead(); const x = db.equipo.find((y) => y.email === email); if (x) { x.coordina = !!valor; demoWrite(db) } return }
  const { error } = await supabase.from('admins').update({ coordina: !!valor }).eq('email', email)
  if (error) throw new Error(error.code === '42703' ? 'Falta pegar certificados.sql en Supabase (SQL Editor).' : error.message)
}
/* ---------- Equipo: quién entra al panel y con qué rol ---------- */
export const ROLES = {
  gerente: { nombre: 'Gerente', ayuda: 'Ve y maneja todo: gerencia, ventas y web.' },
  vendedora: { nombre: 'Vendedora', ayuda: 'Módulo de ventas: prospectos, inscritos, pagos y grupos.' },
  asistente: { nombre: 'Asistente académico', ayuda: 'Módulo Académico: grupos, clases, profesor, accesos, trabajo final y certificados. No ve pagos, precios ni tarifas.' },
  profesor: { nombre: 'Profesor', ayuda: 'Solo ve sus grupos: alumnos, asistencia y documentos. No ve pagos ni precios.' },
}
export async function guardarMiembro({ email, rol }) {
  const mail = String(email).trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(mail)) throw new Error('Escribe un correo válido.')
  if (!hasBackend) {
    const db = demoRead(); const x = db.equipo.find((y) => y.email === mail)
    if (x) x.rol = rol; else db.equipo.push({ email: mail, rol })
    demoWrite(db); return
  }
  const { error } = await supabase.from('admins').upsert({ email: mail, rol })
  if (error) throw error
}
/* ---------- Clases y asistencia (rol profesor + gerencia) ---------- */
export async function cargarProfesor() {
  if (!hasBackend) {
    const db = demoRead()
    const t = (db.trabajadores || []).find((x) => String(x.email || '').toLowerCase() === DEMO_USER)
    const asg = t ? (db.asignaciones || []).filter((a) => a.trabajador_id === t.id) : []
    const grupos = db.grupos.filter((g) => asg.some((a) => String(a.grupo_id) === String(g.id)))
    return { grupos, cursos: db.cursos, mias: asg.map((a) => ({ grupo_id: a.grupo_id, horas: a.horas, horas_dictadas: a.horas_dictadas })), clases: db.clases.filter((c) => grupos.some((g) => String(g.id) === c.grupo_id)), accesos: db.grupo_accesos || [], asistidas: [...new Set(db.asistencias.map((x) => x.clase_id))] }
  }
  const { data: mias, error } = await supabase.rpc('profesor_mis_grupos')
  if (error) throw error
  const ids = (mias || []).map((x) => x.grupo_id)
  if (!ids.length) return { grupos: [], cursos: [], mias: [], clases: [], accesos: [], asistidas: [] }
  const g = await supabase.from('grupos').select('*').in('id', ids).order('inicio')
  if (g.error) throw g.error
  const cids = [...new Set((g.data || []).map((x) => x.curso_id))]
  const c = await supabase.from('cursos').select('*').in('id', cids)
  if (c.error) throw c.error
  const [cl, ac, as] = await Promise.all([
    supabase.from('clases').select('id, grupo_id, numero, inicio, fin, reabierta_hasta, reabierta_por, reabierta_motivo').in('grupo_id', ids).order('inicio'),
    supabase.from('grupo_accesos').select('*').in('grupo_id', ids),
    supabase.from('asistencias').select('clase_id').in('grupo_id', ids).limit(20000),
  ])
  return { grupos: g.data || [], cursos: c.data || [], mias: mias || [], clases: cl.error ? [] : (cl.data || []), accesos: ac.error ? [] : (ac.data || []), asistidas: as.error ? [] : [...new Set((as.data || []).map((x) => x.clase_id))] }
}

/* Clases, alumnos (solo nombre, código y correo) y asistencias de un grupo */
export async function cargarClasesGrupo(grupoId) {
  const gid = String(grupoId)
  if (!hasBackend) {
    const db = demoRead()
    const alumnos = db.matriculas.filter((m) => String(m.grupo_id) === gid && m.estado === 'activa')
      .map((m) => { const a = db.alumnos.find((x) => x.id === m.alumno_id) || {}; return { alumno_id: m.alumno_id, matricula_id: m.id, codigo: a.codigo, nombres: a.nombres, apellido_paterno: a.apellido_paterno, apellido_materno: a.apellido_materno, email: a.email } })
    return { clases: db.clases.filter((c) => c.grupo_id === gid).sort((a, b) => a.numero - b.numero), alumnos, asistencias: db.asistencias.filter((a) => a.grupo_id === gid) }
  }
  const [c, a, al] = await Promise.all([
    supabase.from('clases').select('*').eq('grupo_id', gid).order('numero'),
    supabase.from('asistencias').select('*').eq('grupo_id', gid).limit(5000),
    supabase.rpc('alumnos_del_grupo', { p_grupo: gid }),
  ])
  const fallo = [c, a, al].find((x) => x.error)
  if (fallo) throw new Error(fallo.error.message.includes('does not exist') || fallo.error.code === '42P01' || fallo.error.code === 'PGRST202' ? 'Falta pegar profesores.sql en Supabase (SQL Editor).' : fallo.error.message)
  return { clases: c.data || [], asistencias: a.data || [], alumnos: al.data || [] }
}

/* Gerencia genera o ajusta las clases de un grupo. filas: [{ numero, inicio, fin }]; quitar: números a borrar */
export async function guardarClases(grupoId, filas, quitar = []) {
  const gid = String(grupoId)
  if (!filas.length) throw new Error('Agrega al menos una clase.')
  for (const f of filas) if (!(new Date(f.fin) > new Date(f.inicio))) throw new Error(`La clase ${f.numero} termina antes de empezar.`)
  if (!hasBackend) {
    const db = demoRead()
    db.clases = db.clases.filter((c) => c.grupo_id !== gid || !quitar.includes(c.numero))
    filas.forEach((f) => { const x = db.clases.find((c) => c.grupo_id === gid && c.numero === f.numero); if (x) Object.assign(x, f); else db.clases.push({ id: uid(), creado: new Date().toISOString(), grupo_id: gid, ...f }) })
    demoWrite(db); return
  }
  if (quitar.length) { const d = await supabase.from('clases').delete().eq('grupo_id', gid).in('numero', quitar); if (d.error) throw d.error }
  const { error } = await supabase.from('clases').upsert(filas.map((f) => ({ grupo_id: gid, numero: f.numero, inicio: f.inicio, fin: f.fin })), { onConflict: 'grupo_id,numero' })
  if (error) throw error
}

/* Guarda la asistencia de una clase. filas: [{ clase_id, alumno_id, estado, participo, motivo }].
   El servidor decide si se puede: el profesor solo dentro de la clase; después solo gerencia, con sustento. */
export async function guardarAsistencias(filas, { gerente = false, clase } = {}) {
  if (!filas.length) return
  if (!hasBackend) {
    const db = demoRead()
    const t = Date.now(), ini = new Date(clase.inicio).getTime(), fin = new Date(clase.fin).getTime()
    const rc = db.clases.find((c) => c.id === clase.id) || clase
    const reab = t > fin && rc.reabierta_hasta && t <= new Date(rc.reabierta_hasta).getTime()
    const fuera = (t > fin && !reab) || t < ini - 10 * 60000
    if (fuera && !gerente) throw new Error('La clase terminó: la asistencia está cerrada. Solo gerencia puede corregirla.')
    if (fuera && gerente && !filas.every((f) => String(f.motivo || '').trim().length >= 10)) throw new Error('La clase está cerrada. Para cambiar la asistencia escribe el sustento (el correo del alumno).')
    filas.forEach((f) => {
      const x = db.asistencias.find((a) => a.clase_id === f.clase_id && a.alumno_id === f.alumno_id)
      if (x) Object.assign(x, { estado: f.estado, participo: f.participo, motivo: f.motivo || x.motivo, editado_por: DEMO_USER, editado_en: new Date().toISOString() })
      else db.asistencias.push({ id: uid(), creado: new Date().toISOString(), clase_id: f.clase_id, grupo_id: clase.grupo_id, alumno_id: f.alumno_id, estado: f.estado, participo: Boolean(f.participo), registrado_por: DEMO_USER, editado_por: '', motivo: f.motivo || '' })
    })
    demoWrite(db); return
  }
  const { error } = await supabase.from('asistencias').upsert(
    filas.map((f) => ({ clase_id: f.clase_id, alumno_id: f.alumno_id, estado: f.estado, participo: Boolean(f.participo), motivo: f.motivo || '' })),
    { onConflict: 'clase_id,alumno_id' })
  if (error) throw error
}

/* Quién cambió qué en una clase (solo gerencia) */
export async function historialAsistencia(claseId) {
  if (!hasBackend) return []
  const { data, error } = await supabase.from('asistencia_historial').select('*').eq('clase_id', claseId).order('creado', { ascending: false })
  if (error) throw error
  return data || []
}

export async function quitarMiembro(email) {
  if (!hasBackend) { const db = demoRead(); db.equipo = db.equipo.filter((y) => y.email !== email); demoWrite(db); return }
  const { error } = await supabase.from('admins').delete().eq('email', email)
  if (error) throw error
}


/* ---------- Seguimiento de interesados (contactó / contestó / observación) ---------- */
export async function seguimientoInteresado(id, cambios) {
  const patch = { ...cambios }
  if ('contactado' in patch) {
    patch.estado = patch.contactado ? 'atendida' : 'nuevo'
    delete patch.contactado
    let quien = DEMO_USER
    if (hasBackend) { const { data } = await supabase.auth.getSession(); quien = data?.session?.user?.email || '' }
    patch.contactado_por = patch.estado === 'atendida' ? quien : null
    patch.contactado_en = patch.estado === 'atendida' ? new Date().toISOString() : null
    if (patch.estado === 'nuevo') patch.contesto = null
  }
  if (!hasBackend) {
    const db = demoRead(); const x = db.interesados.find((y) => y.id === id)
    if (x) { Object.assign(x, patch); demoWrite(db) }
    return
  }
  const { error } = await supabase.from('interesados').update(patch).eq('id', id)
  if (error) throw error
}

/* ---------- Prospectos (base propia de cada vendedor) ---------- */
export const ESTADOS_PROSPECTO = { nuevo: 'Nuevo', contactado: 'Contactado', esperando_pago: 'Esperando pago', inscrito: 'Inscrito', perdido: 'Perdido' }
export const TIPOS_PROSPECTO = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' }
export const ORIGENES = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Referido', 'Web', 'Otro']
export async function guardarProspecto(p) {
  const fila = { nombres: String(p.nombres || '').trim(), celular: String(p.celular || '').trim(), curso: p.curso || '', origen: p.origen || 'WhatsApp', estado: p.estado || 'nuevo', tipo: p.tipo || 'medio', seguimiento: p.seguimiento || null, notas: p.notas || '' }
  // Contacto 1 y 2: solo se envían si el formulario los trae (así los cambios rápidos de estado no los pisan)
  if ('contacto1_fecha' in p || 'recontactar1' in p || 'recontactar2' in p || 'contacto2_fecha' in p) {
    const v = (x) => x || null
    Object.assign(fila, {
      contacto1_fecha: v(p.contacto1_fecha), contacto1_obs: p.contacto1_obs || '', recontactar1: p.recontactar1 || '', recontactar1_fecha: p.recontactar1 === 'si' ? v(p.recontactar1_fecha) : null,
      contacto2_fecha: v(p.contacto2_fecha), contacto2_obs: p.contacto2_obs || '', recontactar2: p.recontactar2 || '', recontactar2_fecha: p.recontactar2 === 'si' ? v(p.recontactar2_fecha) : null,
      recontacto2_hecho: !!p.recontacto2_hecho,
    })
    if (p.contacto1_fecha && !p.recontactar1) throw new Error('Contacto 1: elige si hay que volver a contactar (puede ser "No").')
    if (p.recontactar1 === 'si' && !p.recontactar1_fecha) throw new Error('Contacto 1: pon la fecha para volver a contactar.')
    if (p.contacto2_fecha && !p.recontactar2) throw new Error('Contacto 2: elige si hay que volver a contactar (puede ser "No").')
    if (p.recontactar2 === 'si' && !p.recontactar2_fecha) throw new Error('Contacto 2: pon la fecha para volver a contactar.')
    const prox = fila.recontactar1 === 'si' && !fila.contacto2_fecha ? fila.recontactar1_fecha : (fila.recontactar2 === 'si' && !fila.recontacto2_hecho ? fila.recontactar2_fecha : null)
    fila.seguimiento = prox || ((fila.recontactar1 || fila.recontactar2) ? null : fila.seguimiento)
  }
  // El nombre es opcional (no todos lo dan): basta el celular
  if (fila.nombres.length < 2) fila.nombres = ''
  if (!fila.nombres && fila.celular.replace(/\D/g, '').length < 7) throw new Error('Escribe al menos el celular del prospecto (el nombre es opcional).')
  if (!hasBackend) {
    const db = demoRead()
    if (p.id) { const x = db.prospectos.find((y) => y.id === p.id); if (x) Object.assign(x, fila) }
    else db.prospectos.unshift({ ...fila, id: uid(), creado: new Date().toISOString(), vendedor: DEMO_USER })
    demoWrite(db); return
  }
  const q = p.id ? supabase.from('prospectos').update(fila).eq('id', p.id) : supabase.from('prospectos').insert(fila)
  const { error } = await q
  if (error) throw error
}
/* ---------- Guion de primer contacto por WhatsApp (arma los textos con datos reales del curso y del grupo) ---------- */
export function asesoraNombre(email, trabajadores = []) {
  const t = (trabajadores || []).find((x) => String(x.email || '').toLowerCase() === String(email || '').toLowerCase())
  const base = (t && t.nombre) || String(email || '').split('@')[0].split(/[._-]/)[0] || 'tu asesora'
  const w = String(base).trim().split(/\s+/)[0]
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
}
export function grupoParaOferta(grupos, cursoId) {
  const hoy = new Date().toISOString().slice(0, 10)
  return (grupos || []).filter((g) => g.curso_id === cursoId && g.activo !== false && g.estado !== 'cerrado' && (!g.inicio || g.inicio >= hoy))
    .sort((a, b) => String(a.inicio || '9999').localeCompare(String(b.inicio || '9999')))[0] || null
}
export function guionesVenta({ asesora, nombre, curso, grupo }) {
  const saludo = `Hola 👋 soy tu asesora educativa de CCN, ${asesora} 😊\n\n¿Cuál es tu nombre?\n¿En qué cursos estás interesado?`
  if (!curso) return { saludo, oferta: '', cierre: '', cupos: null }
  const soles = (n) => `S/ ${Number(n).toLocaleString('es-PE')}`
  const lineas = [`${nombre ? `Gracias, ${nombre} 😊\n\n` : ''}📚 *${curso.titulo}*`]
  if (grupo && grupo.inicio) lineas.push(`🗓️ Inicio: ${fechaCorta(grupo.inicio)}`)
  if (grupo && (grupo.dias || grupo.horario)) lineas.push(`⏰ ${[grupo.dias, grupo.horario ? fmtHorario(grupo.horario) : ''].filter(Boolean).join(' · ')}`)
  lineas.push(`💻 Online por Zoom${curso.horas ? ` · ${curso.horas} horas` : ''}`)
  lineas.push('')
  if (curso.precio_antes && Number(curso.precio_antes) > Number(curso.precio)) lineas.push(`💰 Inversión: ~${soles(curso.precio_antes)}~`)
  lineas.push(`💰 *Inversión: ${soles(curso.precio)}*`)
  const cupos = grupo ? Math.max(0, (grupo.maximo || 20) - (grupo.inscritos || 0)) : null
  const cierre = !grupo
    ? 'Aún no tenemos fecha confirmada del próximo grupo; te avisamos apenas abra 🙌\n\n*¿Quieres que te avisemos?*'
    : cupos === 0
      ? 'Este grupo ya está lleno 😅 pero podemos anotarte en lista de espera.\n\n*¿Te anoto?*'
      : `Actualmente contamos con ${cupos} cupo${cupos === 1 ? '' : 's'} disponible${cupos === 1 ? '' : 's'} 🙌\n\n*¿Deseas inscribirte?*`
  return { saludo, oferta: lineas.join('\n') + '\n\n' + cierre, cierre, cupos }
}

/* Al marcar una consulta como atendida, pasa a Prospectos (una sola vez por celular) */
export async function consultaAProspecto(x, existentes = []) {
  const dig = (t) => String(t || '').replace(/\D/g, '').slice(-9)
  if (dig(x.celular) && existentes.some((p) => dig(p.celular) === dig(x.celular))) return false
  const otro = x.curso === 'Otro'
  await guardarProspecto({
    nombres: `${x.nombres} ${x.apellido_paterno}`.trim(), celular: x.celular, curso: otro ? '' : x.curso,
    origen: 'Web', estado: 'contactado',
    notas: `Consulta web${x.modalidad ? ' · ' + x.modalidad : ''}${otro && x.otro_tema ? ' · Tema: ' + x.otro_tema : ''}${x.email ? ' · ' + x.email : ''}`,
  })
  return true
}
export async function borrarProspecto(id) {
  if (!hasBackend) { const db = demoRead(); db.prospectos = db.prospectos.filter((y) => y.id !== id); demoWrite(db); return }
  const { error } = await supabase.from('prospectos').delete().eq('id', id)
  if (error) throw error
}

export async function reasignarInteresado(id, email) {
  const patch = { asignado_a: email || null, asignado_en: email ? new Date().toISOString() : null }
  if (!hasBackend) { const db = demoRead(); const x = db.interesados.find((y) => y.id === id); if (x) { Object.assign(x, patch); demoWrite(db) } return }
  const { error } = await supabase.from('interesados').update(patch).eq('id', id)
  if (error) throw error
}
export async function recibeInteresados(email, valor) {
  if (!hasBackend) { const db = demoRead(); const x = db.equipo.find((y) => y.email === email); if (x) { x.recibe_interesados = valor; demoWrite(db) } return }
  const { error } = await supabase.from('admins').update({ recibe_interesados: valor }).eq('email', email)
  if (error) throw error
}

/* ---------- Trabajadores ---------- */
export async function guardarTrabajador(t) {
  const fila = { nombre: String(t.nombre || '').trim(), puesto: t.puesto || 'vendedor', cargo: t.cargo || '', email: t.email ? String(t.email).trim().toLowerCase() : null, sueldo_base: Number(t.sueldo_base) || 0, bono_pasajes: Number(t.bono_pasajes) || 0, fecha_inicio: t.fecha_inicio || null, documento: t.documento || '', celular: t.celular || '', tarifa_hora: Number(t.tarifa_hora) || 0, cursos: Array.isArray(t.cursos) ? t.cursos.map(String) : [], comision_tramos: t.comision_tramos, metas: t.metas || null, activo: t.activo !== false, notas: t.notas || '' }
  if (fila.nombre.length < 2) throw new Error('Escribe el nombre del trabajador.')
  if (!fila.comision_tramos) delete fila.comision_tramos
  if (!fila.metas) delete fila.metas
  if (t.id) fila.id = t.id
  await save('trabajadores', fila)
}

/* ---------- Grupos de WhatsApp de cada curso ---------- */
export async function guardarWhatsapp({ grupo_id, nombre, enlace, solo_admins }) {
  const fila = { grupo_id: String(grupo_id), nombre: String(nombre || '').trim(), enlace: String(enlace || '').trim(), solo_admins: !!solo_admins }
  if (fila.nombre.length < 3) throw new Error('Escribe el nombre del grupo de WhatsApp.')
  if (!/^https:\/\/chat\.whatsapp\.com\//i.test(fila.enlace)) throw new Error('Pega el enlace de invitación (empieza con https://chat.whatsapp.com/).')
  if (!hasBackend) {
    const db = demoRead(); const i = db.gruposWa.findIndex((x) => String(x.grupo_id) === fila.grupo_id)
    const reg = { ...fila, creado_por: DEMO_USER, creado: new Date().toISOString() }
    if (i >= 0) db.gruposWa[i] = { ...db.gruposWa[i], ...fila }; else db.gruposWa.push(reg)
    demoWrite(db); return
  }
  const { error } = await supabase.from('grupos_whatsapp').upsert(fila, { onConflict: 'grupo_id' })
  if (error) throw error
}

export async function asignarGrupo({ grupo_id, trabajador_id, horas, tarifa_hora }) {
  await save('asignaciones', { grupo_id: String(grupo_id), trabajador_id, horas: Number(horas) || 0, horas_dictadas: 0, tarifa_hora: Number(tarifa_hora) || 0 })
}
export async function pagarTrabajador({ trabajador_id, asignacion_id, monto, fecha, metodo, nota }) {
  const m = Number(monto)
  if (!(m > 0)) throw new Error('Escribe el monto pagado.')
  await save('pagos_trabajador', { trabajador_id, asignacion_id: asignacion_id || null, monto: m, fecha: fecha || new Date().toISOString().slice(0, 10), metodo: metodo || '', nota: nota || '' })
}

/* ---------- Instalaciones remotas ---------- */
export async function guardarInstalacion(f) {
  const fila = { alumno_id: f.alumno_id, grupo_id: String(f.grupo_id || ''), grupo_codigo: f.grupo_codigo || '', curso_titulo: f.curso_titulo || '', programa: f.programa || '', fecha: f.fecha, hora: String(f.hora).slice(0, 5), estado: f.estado || 'agendada', nota: f.nota || '' }
  if (f.id) fila.id = f.id
  if (!hasBackend && !f.id) fila.vendedor = DEMO_USER
  await save('instalaciones', fila)
}

export const CATEGORIAS_ACCESO = ['Web y hosting', 'Redes sociales', 'Correo', 'Pagos y bancos', 'Herramientas', 'Otros']


/* ---------- Jornadas (reloj de trabajo de la vendedora) ---------- */
export async function jornadaIniciar(dispositivo = '') {
  if (!hasBackend) {
    const db = demoRead()
    if (db.jornadas.some((j) => j.vendedor === DEMO_USER && j.estado === 'abierta')) throw new Error('Ya tienes una jornada abierta.')
    const ahora = new Date().toISOString()
    db.jornadas.unshift({ id: uid(), creado: ahora, vendedor: DEMO_USER, inicio: ahora, fin: null, ultimo_pulso: ahora, estado: 'abierta', cierre: '', dispositivo, nota: '' })
    demoWrite(db); return
  }
  const { data: u } = await supabase.auth.getUser()
  const { error } = await supabase.from('jornadas').insert({ vendedor: u.user.email, dispositivo })
  if (error) throw (error.code === '23505' ? new Error('Ya tienes una jornada abierta.') : error)
}
export async function jornadaPulso(id) {
  if (!hasBackend) { const db = demoRead(); const j = db.jornadas.find((x) => x.id === id); if (j && j.estado === 'abierta') { j.ultimo_pulso = new Date().toISOString(); demoWrite(db) } return }
  const { error } = await supabase.from('jornadas').update({ estado: 'abierta' }).eq('id', id)
  if (error) throw error
}
/* estado: 'cerrada' (termina ahora) o 'interrumpida' (se cuenta hasta su último pulso) */
export async function jornadaCerrar(id, estado = 'cerrada', cierre = 'manual') {
  if (!hasBackend) {
    const db = demoRead(); const j = db.jornadas.find((x) => x.id === id); if (!j) return
    j.estado = estado; j.cierre = estado === 'interrumpida' ? 'sin_senal' : cierre
    j.fin = estado === 'interrumpida' ? j.ultimo_pulso : new Date().toISOString(); demoWrite(db); return
  }
  const { error } = await supabase.from('jornadas').update({ estado, cierre }).eq('id', id)
  if (error) throw error
}


/* ---------- Agenda: pendientes y notas ---------- */
async function miCorreo() { if (!hasBackend) return DEMO_USER; const { data: u } = await supabase.auth.getUser(); return u.user.email }
export async function guardarPendiente(p) {
  const titulo = String(p.titulo || '').trim()
  if (!titulo) throw new Error('Escribe el pendiente.')
  const fila = { titulo, detalle: p.detalle || '', fecha_limite: p.fecha_limite || null }
  if (!hasBackend) {
    const db = demoRead()
    if (p.id) {
      const x = db.pendientes.find((y) => y.id === p.id); if (!x) return
      if (x.estado === 'realizado') throw new Error('Un pendiente realizado ya no se puede editar.')
      Object.assign(x, fila)
    } else db.pendientes.unshift({ ...fila, id: uid(), creado: new Date().toISOString(), vendedor: p.vendedor || DEMO_USER, creado_por: DEMO_USER, estado: 'pendiente', realizado_en: null })
    demoWrite(db); return
  }
  if (p.id) { const { error } = await supabase.from('pendientes').update(fila).eq('id', p.id); if (error) throw error; return }
  const me = await miCorreo()
  const { error } = await supabase.from('pendientes').insert({ ...fila, vendedor: p.vendedor || me, creado_por: me })
  if (error) throw error
}
export async function marcarPendiente(id) {
  if (!hasBackend) { const db = demoRead(); const x = db.pendientes.find((y) => y.id === id); if (x && x.estado === 'pendiente') { x.estado = 'realizado'; x.realizado_en = new Date().toISOString(); demoWrite(db) } return }
  const { error } = await supabase.from('pendientes').update({ estado: 'realizado' }).eq('id', id)
  if (error) throw error
}
export async function borrarPendiente(id) {
  if (!hasBackend) { const db = demoRead(); const x = db.pendientes.find((y) => y.id === id); if (x?.estado === 'realizado') throw new Error('Un pendiente realizado ya no se puede borrar.'); db.pendientes = db.pendientes.filter((y) => y.id !== id); demoWrite(db); return }
  const { error } = await supabase.from('pendientes').delete().eq('id', id)
  if (error) throw error
}
export async function guardarNota(n) {
  const fila = { titulo: String(n.titulo || '').trim(), texto: n.texto || '', actualizado: new Date().toISOString() }
  if (!fila.titulo && !fila.texto.trim()) throw new Error('Escribe algo en la nota.')
  if (!hasBackend) {
    const db = demoRead()
    if (n.id) { const x = db.notas_agenda.find((y) => y.id === n.id); if (x) Object.assign(x, fila) }
    else db.notas_agenda.unshift({ ...fila, id: uid(), creado: fila.actualizado, vendedor: DEMO_USER })
    demoWrite(db); return
  }
  const { error } = await (n.id ? supabase.from('notas_agenda').update(fila).eq('id', n.id) : supabase.from('notas_agenda').insert(fila))
  if (error) throw error
}
export async function borrarNota(id) {
  if (!hasBackend) { const db = demoRead(); db.notas_agenda = db.notas_agenda.filter((y) => y.id !== id); demoWrite(db); return }
  const { error } = await supabase.from('notas_agenda').delete().eq('id', id)
  if (error) throw error
}


/* ---------- Contratos y firma ---------- */
export async function guardarPlantilla(tipo, { titulo, contenido }) {
  if (!String(contenido || '').trim() || !String(titulo || '').trim()) throw new Error('El título y el texto no pueden quedar vacíos.')
  const fila = { tipo, titulo: titulo.trim(), contenido, actualizado: new Date().toISOString() }
  if (!hasBackend) { const db = demoRead(); db.plantillas = (db.plantillas || []).filter((x) => x.tipo !== tipo).concat(fila); demoWrite(db); return }
  const { error } = await supabase.from('plantillas_doc').upsert(fila)
  if (error) throw error
}
export async function enviarDocumentos(lista) {
  if (!lista.length) throw new Error('Elige al menos un documento.')
  if (!hasBackend) { const db = demoRead(); lista.forEach((d) => db.documentos.unshift({ ...d, id: uid(), creado: new Date().toISOString(), estado: 'enviado', firmado_nombre: '', firmado_en: null, huella: '', enviado_por: DEMO_USER })); demoWrite(db); return }
  const { error } = await supabase.from('documentos_trab').insert(lista)
  if (error) throw error
}
async function sha256Hex(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('') }
export async function firmarDocumento(id, nombre) {
  const n = String(nombre || '').trim()
  if (n.length < 5) throw new Error('Escribe tu nombre completo para firmar.')
  if (!hasBackend) {
    const db = demoRead(); const d = db.documentos.find((x) => x.id === id); if (!d || d.estado === 'firmado') return
    d.estado = 'firmado'; d.firmado_nombre = n; d.firmado_en = new Date().toISOString(); d.huella = await sha256Hex(`${d.contenido}|${n}|${d.firmado_en}|${d.vendedor}`); demoWrite(db); return
  }
  const { error } = await supabase.from('documentos_trab').update({ estado: 'firmado', firmado_nombre: n }).eq('id', id)
  if (error) throw error
}
export async function borrarDocumento(id) {
  if (!hasBackend) { const db = demoRead(); const d = db.documentos.find((x) => x.id === id); if (d?.estado === 'firmado') throw new Error('Un documento firmado no se puede borrar.'); db.documentos = db.documentos.filter((x) => x.id !== id); demoWrite(db); return }
  const { error } = await supabase.from('documentos_trab').delete().eq('id', id)
  if (error) throw error
}


/* ---------- Quejas y reclamos ---------- */
export async function guardarQueja(q) {
  const fila = { tipo: q.tipo || 'queja', alumno: String(q.alumno || '').trim(), celular: String(q.celular || '').trim(), detalle: String(q.detalle || '').trim() }
  if (fila.detalle.length < 5) throw new Error('Cuenta qué pasó (mínimo una frase).')
  if (!hasBackend) { const db = demoRead(); const r = { ...fila, id: uid(), creado: new Date().toISOString(), vendedor: DEMO_USER, estado: 'nueva', nota_gerencia: '', atendido_en: null }; db.quejas.unshift(r); demoWrite(db); return r }
  const me = await miCorreo()
  const { data, error } = await supabase.from('quejas').insert({ ...fila, vendedor: me }).select().single()
  if (error) throw error
  return data
}
export async function atenderQueja(id, nota) {
  if (!hasBackend) { const db = demoRead(); const x = db.quejas.find((y) => y.id === id); if (x) { x.estado = 'atendida'; x.nota_gerencia = nota || ''; x.atendido_en = new Date().toISOString(); demoWrite(db) } return }
  const { error } = await supabase.from('quejas').update({ estado: 'atendida', nota_gerencia: nota || '', atendido_en: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
export const numeroGerencia = () => numero


/* ================= Certificados y constancias ================= */
/* Clases y asistencias de un grupo (para el cálculo de asistencia; el gerente las lee directo) */
export async function cargarAsistenciaGrupo(grupoId) {
  const gid = String(grupoId)
  if (!hasBackend) { const db = demoRead(); return { clases: db.clases.filter((c) => c.grupo_id === gid).sort((a, b) => a.numero - b.numero), asistencias: db.asistencias.filter((a) => a.grupo_id === gid) } }
  const [c, a] = await Promise.all([
    supabase.from('clases').select('*').eq('grupo_id', gid).order('numero'),
    supabase.from('asistencias').select('*').eq('grupo_id', gid).limit(5000),
  ])
  const fallo = [c, a].find((x) => x.error)
  if (fallo) throw new Error(fallo.error.message)
  return { clases: c.data || [], asistencias: a.data || [] }
}

/* Guarda un documento emitido. `nuevoCodigo` genera el número; si por mala suerte se repite, reintenta. */
export async function emitirCertificado(fila, nuevoCodigo) {
  if (!hasBackend) {
    const db = demoRead()
    if (db.certificados.some((x) => x.matricula_id === fila.matricula_id && x.tipo === fila.tipo && x.curso_titulo === fila.curso_titulo && x.estado === 'vigente')) throw new Error('Ese documento ya fue emitido.')
    const row = { ...fila, id: uid(), creado: new Date().toISOString(), estado: 'vigente', codigo: nuevoCodigo(fila.tipo), emitido_por: DEMO_USER }
    db.certificados.unshift(row); demoWrite(db); return row
  }
  for (let i = 0; i < 4; i++) {
    const { data, error } = await supabase.from('certificados').insert({ ...fila, codigo: nuevoCodigo(fila.tipo) }).select('*').single()
    if (!error) return data
    if (error.code === '23505' && /codigo/.test(error.message)) continue           // número repetido: probar otro
    if (error.code === '23505') throw new Error('Ese documento ya fue emitido.')
    if (error.code === '42P01') throw new Error('Falta pegar certificados.sql en Supabase (SQL Editor).')
    throw error
  }
  throw new Error('No se pudo generar un número único. Intenta de nuevo.')
}

/* Envía el certificado/constancia por correo al alumno (Edge Function `enviar-certificado` + Resend). */
export async function enviarCertificadoCorreo(c, pdfBlob) {
  if (!hasBackend) {
    const db = demoRead(); const x = db.certificados.find((y) => y.id === c.id)
    if (x) { x.enviado_en = new Date().toISOString(); demoWrite(db) }
    return { ok: true, demo: true }
  }
  const pdf_base64 = await new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(',')[1]); f.onerror = rej; f.readAsDataURL(pdfBlob) })
  const { data, error } = await supabase.functions.invoke('enviar-certificado', { body: { certificado_id: c.id, pdf_base64 } })
  if (error) { let m = error.message; try { const j = await error.context?.json?.(); if (j?.error) m = j.error } catch (e) { /* sin detalle */ } throw new Error(m) }
  if (data?.error) throw new Error(data.error)
  return data
}

/* Envía el correo de bienvenida (datos, grupo de WhatsApp, Zoom y Términos en PDF) de una inscripción. Edge Function `enviar-bienvenida` + Resend. */
export async function enviarBienvenidaCorreo(paqueteId, pdfBlob) {
  if (!hasBackend) {
    const db = demoRead(); const ahora = new Date().toISOString()
    db.matriculas.filter((m) => m.paquete_id === paqueteId).forEach((m) => { m.bienvenida_en = ahora }); demoWrite(db)
    return { ok: true, demo: true }
  }
  const pdf_base64 = await new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(',')[1]); f.onerror = rej; f.readAsDataURL(pdfBlob) })
  const { data, error } = await supabase.functions.invoke('enviar-bienvenida', { body: { paquete_id: paqueteId, pdf_base64 } })
  if (error) { let m = error.message; try { const j = await error.context?.json?.(); if (j?.error) m = j.error } catch (e) { /* sin detalle */ } throw new Error(m) }
  if (data?.error) throw new Error(data.error)
  return data
}

export async function anularCertificado(id, estado = 'anulado') {
  if (!hasBackend) { const db = demoRead(); const c = db.certificados.find((x) => x.id === id); if (c) c.estado = estado; demoWrite(db); return }
  const { error } = await supabase.from('certificados').update({ estado }).eq('id', id)
  if (error) throw error
}

/* Verificación pública: hay que acertar el documento del alumno (o su código) y el número del documento */
export async function verificarDocumento(doc, codigo) {
  const d = String(doc || '').replace(/\s/g, '').toUpperCase()
  const c = String(codigo || '').trim().toUpperCase()
  if (!hasBackend) {
    const db = demoRead()
    const x = db.certificados.find((r) => String(r.codigo).toUpperCase() === c && (String(r.alumno_doc || '').replace(/\s/g, '').toUpperCase() === d || String(r.alumno_codigo || '').toUpperCase() === d))
    return x || null
  }
  const { data, error } = await supabase.rpc('verificar_documento', { p_doc: doc, p_codigo: codigo })
  if (error) throw error
  return (data && data[0]) || null
}

/* Firmas reales para los certificados (solo gerencia las ve). clave = 'direccion' o el id del trabajador (instructor). imagen = PNG transparente (data URL). */
export async function guardarFirma(clave, { nombre = '', cargo = '', imagen = '' }) {
  const fila = { clave: String(clave), nombre, cargo, imagen, actualizado: new Date().toISOString() }
  if (!hasBackend) {
    const db = demoRead(); const i = db.firmas.findIndex((x) => x.clave === fila.clave)
    if (i >= 0) db.firmas[i] = { ...db.firmas[i], ...fila }; else db.firmas.push(fila)
    demoWrite(db); return
  }
  const { error } = await supabase.from('firmas').upsert(fila)
  if (error) throw new Error(error.code === '42P01' ? 'Falta pegar certificados.sql en Supabase (SQL Editor).' : error.message)
}
export async function quitarFirma(clave) {
  if (!hasBackend) { const db = demoRead(); db.firmas = db.firmas.filter((x) => x.clave !== String(clave)); demoWrite(db); return }
  const { error } = await supabase.from('firmas').delete().eq('clave', String(clave))
  if (error) throw error
}

/* ================= Entregables ================= */
/* Entregables de un curso y las entregas (marcas) de un grupo. El profesor ve solo su grupo (lo asegura la base de datos). */
export async function cargarEntregasGrupo(grupoId, cursoId) {
  const gid = String(grupoId), cid = String(cursoId)
  if (!hasBackend) {
    const db = demoRead()
    return { entregables: db.entregables.filter((e) => String(e.curso_id) === cid && e.activo !== false).sort((a, b) => a.orden - b.orden), entregas: db.entregas.filter((x) => x.grupo_id === gid), config: (db.grupo_evaluaciones || []).filter((x) => x.grupo_id === gid) }
  }
  const [e, x, cf] = await Promise.all([
    supabase.from('entregables').select('*').eq('curso_id', cid).eq('activo', true).order('orden'),
    supabase.from('entregas').select('*').eq('grupo_id', gid).limit(5000),
    supabase.from('grupo_evaluaciones').select('*').eq('grupo_id', gid),
  ])
  const fallo = [e, x].find((r) => r.error)
  if (fallo) throw new Error(fallo.error.code === '42P01' ? 'Falta pegar entregables.sql en Supabase (SQL Editor).' : fallo.error.message)
  return { entregables: e.data || [], entregas: x.data || [], config: cf.error ? [] : (cf.data || []) }
}

/* Marca o desmarca un entregable de un alumno */
export async function guardarEntrega({ grupo_id, alumno_id, entregable_id, ...cambios }) {
  const campos = {}
  for (const k of ['entregado', 'aprobado', 'repaso']) if (cambios[k] !== undefined) campos[k] = Boolean(cambios[k])
  // Aprobar implica que ya entregó; si se quita la entrega, también se quita la aprobación.
  if (campos.aprobado) campos.entregado = true
  if (campos.entregado === false) campos.aprobado = false
  const fila = { grupo_id: String(grupo_id), alumno_id, entregable_id, ...campos, actualizado: new Date().toISOString() }
  if (!hasBackend) {
    const db = demoRead()
    const x = db.entregas.find((r) => r.grupo_id === fila.grupo_id && r.alumno_id === alumno_id && r.entregable_id === entregable_id)
    if (x) Object.assign(x, fila); else db.entregas.push({ entregado: false, aprobado: false, repaso: false, ...fila, id: uid(), creado: fila.actualizado })
    demoWrite(db); return
  }
  const { error } = await supabase.from('entregas').upsert(fila, { onConflict: 'grupo_id,alumno_id,entregable_id' })
  if (error) throw error
}

/* Enlace de entrega (Drive o Forms) y fecha límite propia de una evaluación de un grupo. Lo hace coordinación académica. */
export async function guardarEvaluacionGrupo({ grupo_id, entregable_id, enlace, fecha_limite }) {
  const fila = { grupo_id: String(grupo_id), entregable_id, enlace: String(enlace || '').trim(), fecha_limite: fecha_limite || null, actualizado: new Date().toISOString() }
  if (fila.enlace && !/^https?:\/\//i.test(fila.enlace)) throw new Error('El enlace debe empezar con https://')
  if (!hasBackend) {
    const db = demoRead()
    const x = db.grupo_evaluaciones.find((r) => r.grupo_id === fila.grupo_id && r.entregable_id === entregable_id)
    if (x) Object.assign(x, fila); else db.grupo_evaluaciones.push({ ...fila, id: uid() })
    demoWrite(db); return
  }
  const { error } = await supabase.from('grupo_evaluaciones').upsert(fila, { onConflict: 'grupo_id,entregable_id' })
  if (error) throw new Error(error.code === '42P01' ? 'Falta pegar entregables.sql en Supabase (SQL Editor).' : error.message)
}

/* Zoom y clases grabadas de un grupo (los pone el asistente académico; el profesor los ve) */
export async function guardarAccesosGrupo({ grupo_id, zoom, grabaciones }) {
  const url = (v) => { const x = String(v || '').trim(); if (x && !/^https?:\/\//i.test(x)) throw new Error('Los enlaces deben empezar con https://'); return x }
  const fila = { grupo_id: String(grupo_id), zoom: url(zoom), grabaciones: url(grabaciones), actualizado: new Date().toISOString() }
  if (!hasBackend) {
    const db = demoRead()
    const x = db.grupo_accesos.find((r) => r.grupo_id === fila.grupo_id)
    if (x) Object.assign(x, fila); else db.grupo_accesos.push(fila)
    demoWrite(db); return
  }
  const { error } = await supabase.from('grupo_accesos').upsert(fila, { onConflict: 'grupo_id' })
  if (error) throw new Error(error.code === '42P01' ? 'Falta pegar entregables.sql en Supabase (SQL Editor).' : error.message)
}
export async function cargarAccesosGrupo(grupoId) {
  const gid = String(grupoId)
  if (!hasBackend) { const db = demoRead(); return db.grupo_accesos.find((r) => r.grupo_id === gid) || { zoom: '', grabaciones: '' } }
  const { data, error } = await supabase.from('grupo_accesos').select('*').eq('grupo_id', gid).maybeSingle()
  if (error) throw new Error(error.code === '42P01' ? 'Falta pegar entregables.sql en Supabase (SQL Editor).' : error.message)
  return data || { zoom: '', grabaciones: '' }
}
/* ---------- Material del grupo y notas por alumno (profesor) ---------- */
const FALTA_SQL = 'Falta pegar entregables.sql en Supabase (SQL Editor).'
export async function cargarMaterialGrupo(grupoId) {
  const gid = String(grupoId)
  if (!hasBackend) { const db = demoRead(); return db.grupo_material.filter((m) => m.grupo_id === gid).sort((a, b) => (a.creado || '').localeCompare(b.creado || '')) }
  const { data, error } = await supabase.from('grupo_material').select('*').eq('grupo_id', gid).order('creado')
  if (error) throw new Error(error.code === '42P01' ? FALTA_SQL : error.message)
  return data || []
}
export async function guardarMaterial({ grupo_id, titulo, enlace }) {
  const t = String(titulo || '').trim(); const u = String(enlace || '').trim()
  if (t.length < 2) throw new Error('Escribe un nombre para el material.')
  if (!/^https?:\/\//i.test(u)) throw new Error('El enlace debe empezar con https://')
  const fila = { grupo_id: String(grupo_id), titulo: t, enlace: u }
  if (!hasBackend) { const db = demoRead(); db.grupo_material.push({ ...fila, id: uid(), creado: new Date().toISOString(), creado_por: DEMO_USER }); demoWrite(db); return }
  const { error } = await supabase.from('grupo_material').insert({ ...fila, creado_por: (await supabase.auth.getUser()).data?.user?.email || '' })
  if (error) throw new Error(error.code === '42P01' ? FALTA_SQL : error.message)
}
export async function quitarMaterial(id) {
  if (!hasBackend) { const db = demoRead(); db.grupo_material = db.grupo_material.filter((m) => m.id !== id); demoWrite(db); return }
  const { error } = await supabase.from('grupo_material').delete().eq('id', id)
  if (error) throw error
}
export async function cargarNotasGrupo(grupoId) {
  const gid = String(grupoId)
  if (!hasBackend) { const db = demoRead(); return db.alumno_notas.filter((n) => n.grupo_id === gid) }
  const { data, error } = await supabase.from('alumno_notas').select('*').eq('grupo_id', gid)
  if (error) { if (error.code === '42P01') return []; throw error }
  return data || []
}
export async function guardarNotaAlumno({ grupo_id, alumno_id, nota }) {
  const fila = { grupo_id: String(grupo_id), alumno_id, nota: String(nota || '').trim().slice(0, 1000), actualizado: new Date().toISOString() }
  if (!hasBackend) {
    const db = demoRead(); const x = db.alumno_notas.find((n) => n.grupo_id === fila.grupo_id && n.alumno_id === alumno_id)
    if (x) Object.assign(x, fila, { autor: DEMO_USER }); else db.alumno_notas.push({ ...fila, autor: DEMO_USER })
    demoWrite(db); return
  }
  const { error } = await supabase.from('alumno_notas').upsert({ ...fila, autor: (await supabase.auth.getUser()).data?.user?.email || '' }, { onConflict: 'grupo_id,alumno_id' })
  if (error) throw new Error(error.code === '42P01' ? FALTA_SQL : error.message)
}

/* Asignar profesor a un grupo SIN ver ni tocar pagos: la tarifa se copia sola desde la ficha del profesor (gerencia la revisa) */
export async function asignarInstructor(grupoId, trabajadorId) {
  const gid = String(grupoId)
  if (!hasBackend) {
    const db = demoRead()
    const a = db.asignaciones.find((x) => String(x.grupo_id) === gid)
    if (a && a.trabajador_id === trabajadorId) return
    const t = db.trabajadores.find((x) => x.id === trabajadorId)
    const g = db.grupos.find((x) => String(x.id) === gid)
    const c = g && db.cursos.find((x) => String(x.id) === String(g.curso_id))
    const fila = { grupo_id: gid, trabajador_id: trabajadorId, horas: Number(c?.horas) || 0, horas_dictadas: a?.horas_dictadas || 0, tarifa_hora: Number(t?.tarifa_hora) || 0, nota: 'Asignado por el asistente académico: gerencia revisa la tarifa y las horas' }
    if (a) Object.assign(a, fila); else db.asignaciones.push({ id: uid(), ...fila })
    demoWrite(db); return
  }
  const { error } = await supabase.rpc('asignar_instructor', { p_grupo: gid, p_trabajador: trabajadorId })
  if (error) throw new Error(error.message || 'No se pudo asignar')
}
export async function quitarInstructor(grupoId) {
  const gid = String(grupoId)
  if (!hasBackend) { const db = demoRead(); db.asignaciones = db.asignaciones.filter((x) => String(x.grupo_id) !== gid); demoWrite(db); return }
  const { error } = await supabase.rpc('quitar_instructor', { p_grupo: gid })
  if (error) throw new Error(error.message || 'No se pudo quitar')
}

/* Reabrir por unas horas la asistencia de una clase que ya cerró (asistente académico o gerencia) */
export async function reabrirAsistencia(claseId, horas, motivo) {
  const h = Number(horas)
  if (!(h >= 1 && h <= 48)) throw new Error('La reapertura puede durar de 1 a 48 horas.')
  if (String(motivo || '').trim().length < 10) throw new Error('Escribe el motivo de la reapertura (mínimo 10 letras).')
  if (!hasBackend) {
    const db = demoRead(); const c = db.clases.find((x) => x.id === claseId)
    if (!c) throw new Error('La clase no existe.')
    if (Date.now() <= new Date(c.fin).getTime()) throw new Error('Esa clase todavía no terminó: la asistencia sigue abierta.')
    Object.assign(c, { reabierta_hasta: new Date(Date.now() + h * 3600000).toISOString(), reabierta_por: DEMO_USER, reabierta_motivo: String(motivo).trim() })
    demoWrite(db); return
  }
  const { error } = await supabase.rpc('reabrir_asistencia', { p_clase: claseId, p_horas: h, p_motivo: String(motivo).trim() })
  if (error) throw new Error(error.code === '42883' ? 'Falta pegar entregables.sql en Supabase (SQL Editor).' : error.message)
}
export async function cerrarReapertura(claseId) {
  if (!hasBackend) { const db = demoRead(); const c = db.clases.find((x) => x.id === claseId); if (c) { c.reabierta_hasta = new Date().toISOString(); demoWrite(db) } return }
  const { error } = await supabase.rpc('cerrar_reapertura', { p_clase: claseId })
  if (error) throw new Error(error.message)
}

/* Horario "19:00 - 21:00" -> "7:00 p. m. - 9:00 p. m." (solo para mostrar; lo guardado no cambia) */
export function fmtHorario(t) {
  return String(t ?? '')
    .replace(/\s*[–—]\s*/g, ' - ')
    .replace(/\b(\d{1,2}):(\d{2})(?!\s*[ap]\.?\s*m)/gi, (_, h, m) => {
      const n = Number(h)
      if (n > 23) return _
      return `${n % 12 || 12}:${m} ${n >= 12 ? 'p. m.' : 'a. m.'}`
    })
}
