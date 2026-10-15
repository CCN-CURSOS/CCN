// Edge Function: envía por correo (Resend) el certificado o constancia a su alumno.
// Requiere el secreto RESEND_API_KEY (Supabase → Edge Functions → Secrets). Remitente: cursos@ccnperuacademy.com
// Solo la puede usar quien pueda ver certificados (asistente académico / gerente): la consulta va con el JWT de quien llama y la RLS decide.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const SITIO = 'https://ccnperuacademy.com'
const DESDE = 'CCN Centro de Capacitaciones & Negocios <cursos@ccnperuacademy.com>'
const esc = (t: string) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const key = Deno.env.get('RESEND_API_KEY')
    if (!key) return json({ error: 'Falta configurar RESEND_API_KEY en Supabase (Edge Functions → Secrets).' }, 500)
    const auth = req.headers.get('Authorization') ?? ''
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })

    const { certificado_id, pdf_base64 } = await req.json()
    if (!certificado_id || !pdf_base64 || String(pdf_base64).length > 5_000_000) return json({ error: 'Datos incompletos o PDF demasiado grande.' }, 400)

    const { data: c } = await sb.from('certificados').select('*').eq('id', certificado_id).maybeSingle()
    if (!c) return json({ error: 'No tienes permiso o el documento no existe.' }, 403)
    if (c.estado !== 'vigente') return json({ error: 'El documento está anulado.' }, 400)

    const { data: a } = await sb.from('alumnos').select('email, nombres').eq('id', c.alumno_id).maybeSingle()
    const correo = String(a?.email ?? '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return json({ error: 'El alumno no tiene un correo válido registrado.' }, 400)

    const esConstancia = String(c.tipo).startsWith('constancia')
    const tipo = esConstancia ? 'constancia' : 'certificado'
    const nombre = esc(a?.nombres || c.alumno_nombre)
    const url = `${SITIO}/verificar?c=${encodeURIComponent(c.codigo)}`
    const archivo = `${esConstancia ? 'Constancia' : 'Certificado'}-${String(c.curso_titulo).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}.pdf`
    const html = `<div style="font-family:Arial,sans-serif;color:#0F2547;max-width:560px;margin:auto">
      <h2 style="color:#0F2547">¡Felicitaciones, ${nombre}! 🎉</h2>
      <p>Te enviamos tu <b>${tipo}</b> del curso <b>${esc(c.curso_titulo)}</b>. Lo encuentras adjunto en PDF.</p>
      <p>Puedes verificar su autenticidad en cualquier momento con el código <b>${esc(c.codigo)}</b> en
      <a href="${url}" style="color:#1FBFA8">${SITIO.replace('https://', '')}/verificar</a>.</p>
      <p>Gracias por aprender con nosotros.<br><b>Aprende. Aplica. Crece.</b></p>
      <hr style="border:none;border-top:1px solid #e3e8f0"><p style="font-size:12px;color:#6b7a90">CCN – Centro de Capacitaciones &amp; Negocios · cursos@ccnperuacademy.com</p></div>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: DESDE, to: [correo], reply_to: 'cursos@ccnperuacademy.com', subject: `Tu ${tipo} de ${c.curso_titulo} · CCN`, html, attachments: [{ filename: archivo, content: pdf_base64 }] }),
    })
    if (!r.ok) return json({ error: 'Resend no pudo enviar el correo: ' + (await r.text()).slice(0, 200) }, 502)

    const ahora = new Date().toISOString()
    await sb.from('certificados').update({ enviado_en: ahora }).eq('id', certificado_id)
    return json({ ok: true, enviado_en: ahora, a: correo })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
