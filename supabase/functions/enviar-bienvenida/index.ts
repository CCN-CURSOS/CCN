// Edge Function: envía por correo (Resend) la bienvenida a un alumno ya inscrito y con pago registrado.
// Incluye datos del alumno, cursos, fecha y horario, grupo de WhatsApp, Zoom (solo si ya pagó todo), requisitos y el PDF de Términos.
// Requiere el secreto RESEND_API_KEY. Remitente: cursos@ccnperuacademy.com
// La consulta va con el JWT de quien llama: la RLS decide qué inscripciones puede ver (gerente / vendedora dueña / asistente).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const SITIO = 'https://ccnperuacademy.com'
const DESDE = 'CCN Centro de Capacitaciones & Negocios <cursos@ccnperuacademy.com>'
const WA = '+51 931 330 058'
const esc = (t: unknown) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
const soles = (n: number) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const horario = (t: string) => String(t ?? '').replace(/\s*[–—]\s*/g, ' - ').replace(/\b(\d{1,2}):(\d{2})(?!\s*[ap]\.?\s*m)/gi, (m, h, mi) => { const n = Number(h); return n > 23 ? m : `${n % 12 || 12}:${mi} ${n >= 12 ? 'p. m.' : 'a. m.'}` })
const fecha = (iso: string) => {
  if (!iso) return 'Por confirmar'
  const d = new Date(iso + 'T12:00:00-05:00')
  const t = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
const necesitaPC = (titulo: string) => /word|excel|power\s*point|club|illustrator|photoshop/i.test(titulo)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const key = Deno.env.get('RESEND_API_KEY')
    if (!key) return json({ error: 'Falta configurar RESEND_API_KEY en Supabase (Edge Functions → Secrets).' }, 500)
    const auth = req.headers.get('Authorization') ?? ''
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })

    const { paquete_id, pdf_base64 } = await req.json()
    if (!paquete_id || !pdf_base64 || String(pdf_base64).length > 5_000_000) return json({ error: 'Datos incompletos o PDF demasiado grande.' }, 400)

    const { data: mats } = await sb.from('matriculas').select('*').eq('paquete_id', paquete_id).eq('estado', 'activa')
    if (!mats?.length) return json({ error: 'No tienes permiso o la inscripción no existe o está anulada.' }, 403)

    const { data: a } = await sb.from('alumnos').select('*').eq('id', mats[0].alumno_id).maybeSingle()
    const correo = String(a?.email ?? '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return json({ error: 'El alumno no tiene un correo válido registrado.' }, 400)

    const ids = mats.map((m) => m.id)
    const gids = [...new Set(mats.map((m) => String(m.grupo_id)))]
    const { data: pagos } = await sb.from('pagos').select('*').in('matricula_id', ids)
    const pagado = (pagos ?? []).reduce((t, p) => t + Number(p.monto), 0)
    if (pagado <= 0) return json({ error: 'Aún no hay un pago registrado: la bienvenida se envía al confirmar el pago.' }, 400)
    const precio = mats.reduce((t, m) => t + Number(m.precio), 0)
    const saldo = Math.max(0, Math.round((precio - pagado) * 100) / 100)

    const { data: grupos } = await sb.from('grupos').select('*').in('id', gids)
    const { data: was } = await sb.from('grupos_whatsapp').select('*').in('grupo_id', gids)
    const { data: acc } = await sb.from('grupo_accesos').select('*').in('grupo_id', gids)

    const club = String(mats[0].paquete).trim().toLowerCase() === 'club ofimática'
    const bloques = mats.map((m) => {
      const g = (grupos ?? []).find((x) => String(x.id) === String(m.grupo_id))
      const wa = (was ?? []).find((x) => String(x.grupo_id) === String(m.grupo_id))?.enlace
      const zoom = (acc ?? []).find((x) => String(x.grupo_id) === String(m.grupo_id))?.zoom
      const filas = [
        ['Inicio', fecha(g?.inicio)],
        ['Días', g?.dias || 'Por confirmar'],
        ['Horario', g?.horario ? horario(g.horario) : 'Por confirmar'],
      ]
      const fila = (k: string, v: string) => `<tr><td style="padding:3px 12px 3px 0;color:#6b7a90">${k}</td><td style="padding:3px 0"><b>${esc(v)}</b></td></tr>`
      const enlaces = [
        wa ? `<p style="margin:8px 0 0">💬 <a href="${esc(wa)}" style="color:#1FBFA8;font-weight:bold">Únete al grupo de WhatsApp</a></p>` : `<p style="margin:8px 0 0;color:#6b7a90">💬 Te enviaremos el link del grupo de WhatsApp por este medio en breve.</p>`,
        saldo > 0 ? `<p style="margin:6px 0 0;color:#6b7a90">🎥 El link de Zoom te llega apenas completes tu pago.</p>`
          : zoom ? `<p style="margin:6px 0 0">🎥 <a href="${esc(zoom)}" style="color:#1FBFA8;font-weight:bold">Entrar a la clase por Zoom</a> <span style="color:#6b7a90">(el mismo link para todas las clases)</span></p>`
          : `<p style="margin:6px 0 0;color:#6b7a90">🎥 Te enviaremos el link de Zoom antes de la primera clase.</p>`,
      ].join('')
      return `<div style="border:1px solid #e3e8f0;border-radius:12px;padding:14px 16px;margin:12px 0">
        <div style="font-size:16px;color:#0F2547"><b>${esc(m.curso_titulo)}</b>${g?.codigo ? ` <span style="font-size:12px;color:#6b7a90">· ${esc(g.codigo)}</span>` : ''}</div>
        <table style="font-size:14px;margin-top:6px;border-collapse:collapse">${filas.map(([k, v]) => fila(k, v)).join('')}</table>${enlaces}</div>`
    }).join('')

    const nombre = esc(a?.nombres || '')
    const fila = (k: string, v: string) => `<tr><td style="padding:3px 12px 3px 0;color:#6b7a90">${k}</td><td style="padding:3px 0"><b>${esc(v)}</b></td></tr>`
    const pagosTxt = (pagos ?? []).sort((x, y) => x.numero - y.numero).map((p) => `${soles(p.monto)} (${p.metodo})`).join(' + ')
    const pc = mats.some((m) => necesitaPC(m.curso_titulo)) || club
    const aviso = saldo > 0
      ? `<div style="background:#fff7e6;border:1px solid #f3d9a4;border-radius:10px;padding:12px 14px;margin:14px 0;font-size:14px"><b>Saldo pendiente: ${soles(saldo)}.</b> Para recibir tus accesos, págalo a más tardar 1 día antes del inicio (excepcionalmente hasta 3 horas antes de la clase) a las cuentas oficiales de CCN que te indicó nuestro equipo. Si el curso inicia sin pago completo, no se brindan los accesos.</div>`
      : `<div style="background:#e9faf6;border:1px solid #b6ebe0;border-radius:10px;padding:12px 14px;margin:14px 0;font-size:14px"><b>¡Tu pago está completo!</b> Tu vacante está asegurada.</div>`

    const html = `<div style="font-family:Arial,sans-serif;color:#0F2547;max-width:580px;margin:auto;line-height:1.5">
      <h2 style="color:#0F2547;margin-bottom:4px">¡Bienvenido/a a CCN, ${nombre}! 🎉</h2>
      <p style="margin-top:0">Ya eres parte de <b>CCN – Centro de Capacitaciones &amp; Negocios</b>. Aquí tienes todo lo que necesitas para empezar.</p>
      <h3 style="color:#1FBFA8;margin:18px 0 4px">Tus datos</h3>
      <table style="font-size:14px;border-collapse:collapse">${[
        a?.codigo ? fila('Código de alumno', a.codigo) : '',
        fila('Alumno', [a?.nombres, a?.apellido_paterno, a?.apellido_materno].filter(Boolean).join(' ')),
        fila('Documento', `${a?.tipo_doc ?? ''} ${a?.documento ?? ''}`.trim()),
        fila('Correo', correo),
        a?.celular ? fila('Celular', a.celular) : '',
      ].join('')}</table>
      <h3 style="color:#1FBFA8;margin:18px 0 0">Tu${mats.length > 1 ? 's' : ''} curso${mats.length > 1 ? 's' : ''}${club ? ' · Club Ofimática' : ''}</h3>
      ${bloques}
      <h3 style="color:#1FBFA8;margin:18px 0 4px">Tu pago</h3>
      <table style="font-size:14px;border-collapse:collapse">${[
        fila('Precio', soles(precio)),
        fila('Pagado', `${soles(pagado)}${pagosTxt ? ' · ' + pagosTxt : ''}`),
        fila('Saldo', saldo > 0 ? soles(saldo) : 'S/ 0'),
      ].join('')}</table>
      ${aviso}
      ${pc ? `<h3 style="color:#1FBFA8;margin:18px 0 4px">Qué necesitas</h3><ul style="font-size:14px;padding-left:18px;margin-top:4px"><li>Una computadora con <b>Windows</b>.</li><li>Nosotros instalamos el programa contigo de forma remota por <b>AnyDesk</b> antes de empezar: descarga AnyDesk (gratis) en anydesk.com y te contactaremos para coordinar el horario.</li><li>Conexión estable a internet, cámara y micrófono para Zoom.</li></ul>`
        : `<h3 style="color:#1FBFA8;margin:18px 0 4px">Qué necesitas</h3><ul style="font-size:14px;padding-left:18px;margin-top:4px"><li>Una computadora o laptop con conexión estable a internet.</li><li>Cámara y micrófono para las clases por Zoom.</li></ul>`}
      <p style="font-size:14px">📎 Adjuntamos los <b>Términos y condiciones</b> en PDF. Al inscribirte los aceptas; guárdalos por si necesitas consultarlos.</p>
      <p style="font-size:14px">Las clases se graban y quedan disponibles para tu grupo. ¿Dudas? Escríbenos al WhatsApp <b>${WA}</b> o responde este correo.</p>
      <p><b>Aprende. Aplica. Crece.</b></p>
      <hr style="border:none;border-top:1px solid #e3e8f0"><p style="font-size:12px;color:#6b7a90">CCN – Centro de Capacitaciones &amp; Negocios · cursos@ccnperuacademy.com · ${SITIO.replace('https://', '')}</p></div>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: DESDE, to: [correo], reply_to: 'cursos@ccnperuacademy.com', subject: `¡Bienvenido/a a CCN! Tu inscripción en ${club ? 'Club Ofimática' : mats.map((m) => m.curso_titulo).join(' + ')}`, html, attachments: [{ filename: 'Terminos-y-condiciones-CCN.pdf', content: pdf_base64 }] }),
    })
    if (!r.ok) return json({ error: 'Resend no pudo enviar el correo: ' + (await r.text()).slice(0, 200) }, 502)

    const ahora = new Date().toISOString()
    await sb.from('matriculas').update({ bienvenida_en: ahora }).eq('paquete_id', paquete_id)
    return json({ ok: true, enviado_en: ahora, a: correo })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
