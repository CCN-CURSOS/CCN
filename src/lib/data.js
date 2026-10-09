import { createClient } from '@supabase/supabase-js'

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const WA_ENV = import.meta.env.VITE_WHATSAPP || '51931330058'
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
}

/* ---------- Datos de ejemplo (modo demostración, sin Supabase) ---------- */
const SEED_CURSOS = [
  { id: 'c1', titulo: 'IA aplicada a negocios', color: 'g1', horas: 12, sesiones: 4, precio: 299, orden: 1, activo: true, destacado: true, imagen_url: '', precio_antes: null,
    descripcion: 'Usa la IA para vender, atender y organizar tu negocio. Terminas con un asistente propio.',
    programas: 'ChatGPT, Claude, Gemini, Canva, Google Sheets',
    temario: ['Presentación de las herramientas', 'IA para vender y comunicar', 'IA para organizar tu negocio', 'Tu asistente propio', 'Proyecto y presentación'],
    extra: 'automatización, medir el ahorro y privacidad' },
  { id: 'c2', titulo: 'Crea y publica tu primera página web', color: 'g2', horas: 24, sesiones: 8, precio: 299, orden: 2, activo: true, destacado: true, imagen_url: '', precio_antes: null,
    descripcion: 'Construyes tu página desde cero y la publicas con dominio propio y botón de WhatsApp.',
    programas: 'VS Code, GitHub, Vercel, Chrome',
    temario: ['Cómo funciona la web', 'HTML: la estructura', 'CSS: el estilo', 'Diseño de una landing que convierte', 'JavaScript básico', 'Publicar en internet', 'Aparecer en Google y medir visitas', 'Proyecto y presentación'],
    extra: 'Git, rendimiento, seguridad y cómo cotizar una web' },
  { id: 'c3', titulo: 'Meta Ads para vender', color: 'g3', horas: 16, sesiones: 8, precio: 299, orden: 3, activo: true, destacado: true, imagen_url: '', precio_antes: null,
    descripcion: 'Creas, mides y mejoras anuncios en Facebook e Instagram. Terminas con una campaña lista.',
    programas: 'Meta Business Suite, Administrador de anuncios, Canva',
    temario: ['Presentación de la interfaz', 'Medición: píxel y eventos', 'Estrategia y públicos', 'Creativos que venden', 'Primera campaña', 'Optimización y escalado', 'Presentación de un proyecto'],
    extra: 'rentabilidad, plan de pruebas y reporte semanal' },
  { id: 'c4', titulo: 'Tienda online', color: 'g4', horas: 20, sesiones: 10, precio: 299, orden: 4, activo: true, destacado: true, imagen_url: '', precio_antes: null,
    descripcion: 'Montas tu tienda en internet y la dejas lista para recibir pedidos por WhatsApp.',
    programas: 'Plataforma por confirmar, Canva, WhatsApp Business', temario: [], extra: '' },
  { id: 'c5', titulo: 'Notion para tu negocio', color: 'g5', horas: 12, sesiones: 4, precio: 299, orden: 5, activo: true, destacado: true, imagen_url: '', precio_antes: null,
    descripcion: 'Ordenas clientes, tareas y ventas en un solo espacio de trabajo listo para usar.',
    programas: 'Notion (plan gratuito)', temario: [], extra: '' },
]

const SEED_ENLACES = [
  { id: 'e1', titulo: 'VER LOS CURSOS', subtitulo: 'Online · desde S/299', url: '/cursos', tipo: 'enlace', destacado: true, orden: 1, activo: true, clics: 0 },
  { id: 'e2', titulo: 'ESCRÍBENOS POR WHATSAPP', subtitulo: 'Inscripciones y consultas', url: '', tipo: 'whatsapp', destacado: false, orden: 2, activo: true, clics: 0 },
  { id: 'e3', titulo: 'INSTAGRAM', subtitulo: 'Pon aquí tu @usuario', url: 'https://instagram.com/', tipo: 'enlace', destacado: false, orden: 3, activo: false, clics: 0 },
  { id: 'e4', titulo: 'TIKTOK', subtitulo: 'Pon aquí tu @usuario', url: 'https://tiktok.com/', tipo: 'enlace', destacado: false, orden: 4, activo: false, clics: 0 },
]

const LS = 'ccn-demo-v1'
const demoRead = () => {
  try {
    const raw = localStorage.getItem(LS)
    if (raw) { const d = JSON.parse(raw); if (!d.enlaces) d.enlaces = SEED_ENLACES; if (!d.consultas) d.consultas = []; if (!d.interesados) d.interesados = []; return d }
  } catch (e) { /* sin almacenamiento */ }
  return { cursos: SEED_CURSOS, grupos: [], enlaces: SEED_ENLACES, consultas: [], interesados: [], ajustes: { whatsapp: WA_ENV } }
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
  if (!hasBackend) { const db = demoRead(); return { ...db, ajustes: db.ajustes || { whatsapp: WA_ENV } } }
  const [c, g, a, en, co, it] = await Promise.all([
    supabase.from('cursos').select('*').order('orden'),
    supabase.from('grupos').select('*').order('inicio', { ascending: false }),
    supabase.from('ajustes').select('*'),
    supabase.from('enlaces').select('*').order('orden'),
    supabase.from('consultas').select('*').order('creado', { ascending: false }),
    supabase.from('interesados').select('*').order('creado', { ascending: false }),
  ])
  if (c.error) throw c.error
  if (g.error) throw g.error
  const ajustes = Object.fromEntries((a.data || []).map((x) => [x.clave, x.valor]))
  // Si la tabla "consultas" aún no existe en Supabase, el panel sigue funcionando (solo sin esa sección).
  return { cursos: c.data, grupos: g.data, enlaces: en.data || [], consultas: co.error ? [] : (co.data || []), consultasError: co.error ? co.error.message : '', interesados: it.error ? [] : (it.data || []), interesadosError: it.error ? it.error.message : '', ajustes: { whatsapp: WA_ENV, ...ajustes } }
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
export async function crearInteresado(c) {
  const fila = {
    curso_id: String(c.curso_id), curso: c.curso, lista_espera: Boolean(c.lista_espera), inicio: c.inicio || '',
    nombres: c.nombres, apellido_paterno: c.apellido_paterno, apellido_materno: c.apellido_materno,
    email: c.email, tipo_doc: c.tipo_doc, documento: c.documento, celular: c.celular,
    acepta_datos: true, acepta_adicional: Boolean(c.acepta_adicional), estado: 'nuevo',
  }
  if (!hasBackend) {
    const db = demoRead()
    db.interesados.unshift({ ...fila, id: uid(), creado: new Date().toISOString() })
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
      lista.push({ ...limpio, id: uid() })
    }
    demoWrite(db)
    return
  }
  if (!limpio.id) delete limpio.id
  const { error } = await supabase.from(tabla).upsert(limpio)
  if (error) throw error
}

export async function remove(tabla, id) {
  if (!hasBackend) {
    const db = demoRead()
    db[tabla] = db[tabla].filter((x) => x.id !== id)
    if (tabla === 'cursos') db.grupos = db.grupos.filter((g) => g.curso_id !== id)
    demoWrite(db)
    return
  }
  const { error } = await supabase.from(tabla).delete().eq('id', id)
  if (error) throw error
}

export async function esAdmin(email) {
  if (!hasBackend) return true
  const { data, error } = await supabase.from('admins').select('email').eq('email', email).maybeSingle()
  return !error && Boolean(data)
}

export const fechaCorta = (iso) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long' }) : ''
