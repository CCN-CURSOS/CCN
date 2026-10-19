/* =====================================================================
   Manual de ventas (módulo para vendedoras)
   Todo el texto se arma solo con los datos reales del curso y del grupo
   (precio, fechas, horario, horas, cupos). Para cambiar un speech, se edita aquí.
   Lo marcado con `pendiente: true` NO está decidido por Diego: la vendedora
   debe consultar a gerencia antes de prometerlo.
   ===================================================================== */
import { fechaCorta, fmtHorario, telefono } from './data'
import { precioEn, antesEn, precioMinimoLibre, fmtMoneda, vendeEnUsd } from './moneda'

const soles = (n) => `S/ ${Number(n).toLocaleString('es-PE')}`
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/* Presentación por programa: lo que se aprende, lo que incluye. (Basado en los temarios) */
const PITCH = [
  { re: /club/, tipo: 'el *{titulo}*', intro: 'reúne Word, Excel y PowerPoint en un solo programa para que aprendas desde cero y domines las herramientas más usadas en el trabajo y los estudios.',
    apr: ['Word: documentos profesionales, estilos, tablas, índices y combinar correspondencia.', 'Excel: fórmulas, funciones, tablas dinámicas, gráficos y control de datos.', 'PowerPoint: presentaciones claras, bien diseñadas y con seguridad al exponer.', 'Un proyecto final en cada programa.', 'Plantillas listas para usar (currículum, informes, control de ventas y más).'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, clases grabadas, instalación de los programas con nuestro apoyo y certificados CCN al terminar.' },
  { re: /pagina web|\bweb\b/, intro: 'está diseñado para que aprendas desde cero a crear tu propia página web y publicarla en internet, incluso si estás empezando en el mundo de la programación.',
    apr: ['HTML y CSS para crear y diseñar tu página.', 'Diseño adaptable a celulares y computadoras.', 'JavaScript básico.', 'Cómo publicar tu página en internet.', 'Cómo desarrollar y presentar tu propio proyecto web.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones y certificado CCN al terminar el curso.' },
  { re: /word/, intro: 'está diseñado para que aprendas desde cero a crear documentos profesionales, incluso si nunca lo has usado.',
    apr: ['Dar formato profesional con estilos, listas y tabulaciones.', 'Insertar imágenes, tablas y organizar el diseño de página.', 'Crear documentos largos con índice, notas al pie y bibliografía.', 'Usar plantillas y combinar correspondencia.', 'Desarrollar y presentar tu proyecto final.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, clases grabadas, plantillas listas (currículum, carta, informe, cotización) y certificado CCN al terminar.' },
  { re: /excel/, intro: 'está diseñado para que aprendas desde cero a organizar datos, hacer cálculos y presentar resultados con claridad.',
    apr: ['Manejar celdas, formatos, fórmulas y funciones básicas.', 'Usar funciones de uso diario (SI, BUSCARV, SUMAR.SI y más).', 'Ordenar, filtrar y validar tus datos.', 'Crear gráficos y tablas dinámicas.', 'Desarrollar y presentar tu proyecto final.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, clases grabadas, plantillas de control de ventas, gastos e inventario, y certificado CCN al terminar.' },
  { re: /powerpoint|power point/, intro: 'está diseñado para que aprendas desde cero a crear presentaciones claras, atractivas y profesionales.',
    apr: ['Diseñar diapositivas con orden, color y buena tipografía.', 'Usar imágenes, íconos, formas y esquemas.', 'Crear tablas, gráficos, líneas de tiempo e infografías.', 'Aplicar animaciones, audio y video con criterio.', 'Presentar con seguridad y exportar a PDF o video.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, clases grabadas, plantillas de presentación y certificado CCN al terminar.' },
  { re: /notion/, intro: 'está diseñado para que aprendas desde cero a organizar tu trabajo, tus estudios y tu día a día en un solo lugar.',
    apr: ['Crear páginas y organizarlas con bloques.', 'Armar bases de datos con filtros, vistas y plantillas.', 'Conectar información con relaciones y fórmulas básicas.', 'Organizar tareas, proyectos y finanzas.', 'Crear tu panel de control y presentar tu proyecto final.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, clases grabadas y certificado CCN al terminar.' },
  { re: /photoshop/, intro: 'está diseñado para que aprendas desde cero a editar, retocar y crear imágenes, incluso si nunca has usado el programa.',
    apr: ['Trabajar con capas, selecciones y máscaras.', 'Retocar fotos y corregir el color.', 'Agregar texto, formas y estilos.', 'Crear fotomontajes.', 'Diseñar piezas para redes sociales y presentar tu proyecto final.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, clases grabadas, apoyo en la instalación del programa y certificado CCN al terminar.' },
  { re: /illustrator/, intro: 'está diseñado para que aprendas desde cero a crear diseños vectoriales y logotipos.',
    apr: ['Dibujar formas y trazados con la herramienta Pluma.', 'Trabajar color, degradados y tipografía.', 'Usar capas, máscaras y efectos.', 'Convertir imágenes en vectores y construir logotipos.', 'Exportar tu proyecto final en PNG, SVG y PDF.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, clases grabadas, apoyo en la instalación del programa y certificado CCN al terminar.' },
  { re: /ia aplicada|\bia\b/, intro: 'está diseñado para que aprendas, desde cero, a usar la inteligencia artificial en el trabajo diario de tu negocio.',
    apr: ['Qué puede y qué no puede hacer la IA, y por dónde empezar.', 'Pedirle a la IA lo que necesitas de forma clara y efectiva.', 'Aplicarla en ventas, atención al cliente y marketing.', 'Automatizar documentos, análisis y tareas repetitivas.', 'Armar tu plan de IA y presentar tu proyecto final.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones y certificado CCN al terminar.' },
  { re: /claude/, intro: 'está diseñado para que aprendas desde cero a usar Claude, un asistente de inteligencia artificial, en tu trabajo, tus estudios y tu día a día.',
    apr: ['Crear tu cuenta y manejar la interfaz.', 'Pedir bien las cosas: instrucciones claras, contexto y ejemplos.', 'Redactar y mejorar textos.', 'Analizar documentos, tablas e imágenes.', 'Automatizar tareas repetitivas y presentar tu proyecto final.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, una biblioteca de instrucciones listas para copiar y certificado CCN al terminar.' },
  { re: /canva/, intro: 'está diseñado para que aprendas desde cero a crear diseños atractivos para redes sociales, tu marca y piezas para imprimir.',
    apr: ['Usar plantillas, formatos y la interfaz de Canva.', 'Diseñar con buen color, tipografía y orden.', 'Crear publicaciones e historias para redes.', 'Armar tu kit de marca, flyers y piezas para imprimir.', 'Hacer presentaciones y videos cortos, y presentar tu pack de marca final.'],
    extra: 'clases en vivo con el instructor, práctica durante las sesiones, plantillas editables para redes y certificado CCN al terminar.' },
]

function pitchDe(curso) {
  const t = norm(curso && curso.titulo)
  return PITCH.find((p) => p.re.test(t)) || null
}

/* Datos del curso y del grupo para rellenar los textos */
export function variables({ asesora, nombre, curso, grupo, cursos = [], descMax = 0, moneda = 'PEN' }) {
  const g = grupo || {}
  const cupos = grupo ? Math.max(0, (g.maximo || 20) - (g.inscritos || 0)) : null
  const buscar = (re) => cursos.find((c) => re.test(norm(c.titulo)))
  const suelto = ['word', 'excel', 'powerpoint'].map((k) => buscar(new RegExp(k)))
  const club = buscar(/club/)
  const sumaSueltos = suelto.every(Boolean) ? suelto.reduce((s, c) => s + Number(c.precio || 0), 0) : 0
  const ahorro = club && sumaSueltos > Number(club.precio) ? sumaSueltos - Number(club.precio) : 0
  const out = {
    asesora: asesora || 'tu asesora', nombre: nombre || '',
    curso: curso ? curso.titulo : '', precio: curso ? soles(curso.precio) : '',
    antes: curso && curso.precio_antes && Number(curso.precio_antes) > Number(curso.precio) ? soles(curso.precio_antes) : '',
    horas: curso ? String(curso.horas || '') : '', sesiones: curso ? String(curso.sesiones || '') : '',
    fecha: g.inicio ? fechaCorta(g.inicio) : '', dias: g.dias ? String(g.dias).toLowerCase() : '',
    horario: g.horario ? fmtHorario(g.horario) : '', cupos: cupos == null ? '' : String(cupos),
    whatsapp: telefono(), clubPrecio: club ? soles(club.precio) : '', sueltos: sumaSueltos ? soles(sumaSueltos) : '', ahorro: ahorro ? soles(ahorro) : '',
    tieneGrupo: !!(grupo && grupo.inicio),
    // Dólares y descuento libre (el tope lo define gerencia en Web → Ajustes)
    precioUsd: curso && vendeEnUsd(curso) ? fmtMoneda(precioEn(curso, 'USD'), 'USD') : '',
    antesUsd: curso && antesEn(curso, 'USD') > precioEn(curso, 'USD') ? fmtMoneda(antesEn(curso, 'USD'), 'USD') : '',
    descMax: descMax > 0 ? String(descMax) : '',
    precioMin: curso && descMax > 0 ? soles(precioMinimoLibre(Number(curso.precio), descMax)) : '',
    precioMinUsd: curso && descMax > 0 && vendeEnUsd(curso) ? fmtMoneda(precioMinimoLibre(precioEn(curso, 'USD'), descMax), 'USD') : '',
    moneda,
  }
  // La vendedora elige la moneda: en dólares, todos los precios del manual pasan a US$ (la web pública solo muestra soles)
  if (moneda === 'USD') {
    const U = (n) => fmtMoneda(n, 'USD')
    const sueltosU = suelto.every((c) => c && vendeEnUsd(c)) ? suelto.reduce((a, c) => a + precioEn(c, 'USD'), 0) : 0
    const clubU = club && vendeEnUsd(club) ? precioEn(club, 'USD') : 0
    out.precio = out.precioUsd || (curso ? '[falta precio en US$: cárgalo en Web → Cursos]' : '')
    out.antes = out.antesUsd
    out.precioMin = out.precioMinUsd || (curso ? '[falta precio en US$]' : '')
    out.clubPrecio = clubU ? U(clubU) : ''
    out.sueltos = sueltosU ? U(sueltosU) : ''
    out.ahorro = sueltosU && clubU && sueltosU > clubU ? U(sueltosU - clubU) : ''
  }
  return out
}

/* Reemplaza {dato}; si falta, deja [dato] para que la vendedora lo vea */
export function rellenar(texto, v) {
  return String(texto).replace(/\{(\w+)\}/g, (_, k) => (v[k] ? v[k] : `[${k}]`))
}

/* ---------------- 1. Presentación del curso (se arma sola) ---------------- */
export function presentacion(v, curso) {
  if (!curso) return ''
  const p = pitchDe(curso)
  const titulo = `*${curso.titulo}*`
  const apr = (p ? p.apr : (curso.temario || [])).slice(0, 3).map((a) => String(a).replace(/\.$/, ''))
  const nombre = v.nombre ? `Hola ${v.nombre}! 😊` : 'Hola! 😊'
  const L = [`${nombre} Soy ${v.asesora}, asesora educativa de CCN 👋`, '', `🔥 Con ${titulo} vas a:`, ...apr.map((a) => `✅ ${a}`), '', '🎓 Clases en vivo + grabadas + certificado CCN']
  return L.join('\n').replace(/\.\./g, '.')
}

/* Oferta (precio) y cierre con cupos reales */
export function oferta(v, curso) {
  if (!curso) return ''
  const L = [`${v.nombre ? `Gracias, ${v.nombre} 😊\n\n` : ''}📚 *${curso.titulo}*`]
  if (v.fecha) L.push(`🗓️ Inicio: ${v.fecha}`)
  if (v.dias || v.horario) L.push(`⏰ ${[v.dias, v.horario].filter(Boolean).join(' · ')}`)
  L.push(`💻 Online por Zoom${v.horas ? ` · ${v.horas} horas` : ''}`, '')
  if (v.antes) L.push(`💰 Inversión: ~${v.antes}~`)
  L.push(`💰 *Inversión: ${v.precio}*`, '', cierre(v))
  return L.join('\n')
}
export function cierre(v) {
  if (!v.tieneGrupo) return 'Aún no tenemos fecha confirmada del próximo grupo; te avisamos apenas abra 🙌\n\n*¿Quieres que te avisemos?*'
  if (v.cupos === '0') return 'Este grupo ya está lleno 😅 pero podemos anotarte en lista de espera.\n\n*¿Te anoto?*'
  return `Actualmente contamos con ${v.cupos} cupo${v.cupos === '1' ? '' : 's'} disponible${v.cupos === '1' ? '' : 's'} 🙌\n\n*¿Deseas inscribirte?*`
}

/* ---------------- 2. Guía rápida ---------------- */
export const PASOS = [
  ['Saluda y pregunta', 'Mensaje corto: tu nombre, “¿cuál es tu nombre?” y “¿en qué cursos estás interesado?”.'],
  ['Registra al prospecto', 'En Prospectos → Registro rápido: nombre, celular y curso. Si falta algo, no importa: se completa después.'],
  ['Presenta el curso', 'Envía el flyer y el mensaje de “Presentación” (pestaña Presentación). Luego el temario en PDF.'],
  ['Da fecha, precio y cierre', 'Mensaje de “Fecha, precio y cierre” con el precio final y, si existe, el tachado. Sin inventar descuentos. Si el cliente es del extranjero, cambia “Moneda del cliente” a Dólares: todos los mensajes salen en US$.'],
  ['Cierra con cupos reales', '“Actualmente contamos con X cupos”. El número sale del grupo real. Pregunta: “¿Deseas inscribirte?”.'],
  ['Resuelve dudas', 'Usa Preguntas frecuentes. Responde corto, con una idea por mensaje, y vuelve a preguntar si se inscribe.'],
  ['Cobra e inscribe', 'Pide nombre completo, DNI o CE, correo y celular; envía los Términos y los datos de pago oficiales.'],
  ['Confirma y envía la bienvenida', 'Registra el pago, inscribe en el panel y envía el correo de bienvenida. Agenda la instalación si el curso la necesita.'],
]
export const REGLAS = [
  'Responde rápido: máximo 2 horas entre 8 a. m. y 7 p. m.; después de las 7 p. m., al día siguiente.',
  'Nunca inventes cupos, fechas ni descuentos. Todo sale del panel. Siempre ofreces el precio de la página; el descuento libre (con tope) es el último recurso para cerrar.',
  'Cada inscripción va en una sola moneda: soles o dólares (US$). No se mezclan ni se convierten.',
  'Máximo 3 intentos de seguimiento por prospecto; luego se marca como perdido.',
  'Todo contacto queda registrado en Prospectos.',
  'Los pagos van solo a las cuentas oficiales de CCN, nunca a cuentas personales.',
  'No prometas devoluciones ni cambios que no estén en los Términos y condiciones.',
  'Nunca hables de lo que ganan las vendedoras ni los instructores.',
  'Si hay un reclamo o algo que no sabes, no inventes: avisa a gerencia (botón de Quejas y reclamos).',
  'No digas ni insinúes que CCN tiene solo 5 cursos.',
]
export const NO_DECIR = [
  ['“Es solo por este mes” / “última oportunidad”', 'No hay fecha real de cierre. Usa solo cupos y fecha reales.'],
  ['“Te hago un descuento” (de entrada)', 'Primero ofrece el precio de la página. El descuento libre es solo el último recurso para cerrar la venta, nunca se anuncia y nunca pasa del tope.'],
  ['“Seguro te devolvemos el dinero”', 'La respuesta en primera instancia es no. Revisa los Términos.'],
  ['“Es un título oficial” / “reconocido por el Ministerio”', 'Es un certificado CCN verificable con código QR.'],
  ['“Aprendes todo sin esfuerzo”', 'El curso pide asistencia, práctica y proyecto final. Sé realista.'],
]

/* ---------------- 3. Preguntas frecuentes ---------------- */
/* a: respuesta lista para copiar. tip: cómo manejar la conversación. pendiente: consultar antes. */
export function faqs(v) {
  const club = v.clubPrecio && v.ahorro
    ? `Si lo que quieres es Word, Excel y PowerPoint, el *Club Ofimática* te conviene más: ${v.clubPrecio} por los tres (42 horas) en lugar de ${v.sueltos} por separado, así ahorras ${v.ahorro} 🙌`
    : 'Si quieres Word, Excel y PowerPoint, el *Club Ofimática* los reúne en un solo programa (42 horas) y te sale más conveniente que llevarlos por separado 🙌'
  return [
    /* ---- Precio y pago ---- */
    { g: 'Precio y pago', q: '¿Cuánto cuesta?', a: 'El curso *{curso}* tiene una inversión de {precio} 😊 Incluye clases en vivo por Zoom, clases grabadas y certificado CCN al aprobar el curso. ¿Te comparto las fechas y el temario?', tip: 'Da el precio junto con el valor (qué incluye) y termina con una pregunta que avance la conversación.' },
    { g: 'Precio y pago', q: '“Está caro”', a: 'Te entiendo 😊 El precio que ves ya es el precio promocional de la web. Lo que recibes: clases en vivo con el instructor, clases grabadas para repasar, práctica guiada, proyecto final y certificado CCN. ¿Qué parte del curso te interesa más? Así te cuento cómo te ayuda.', tip: 'No te pongas a la defensiva ni bajes el precio. Pasa de “precio” a “valor” y pregunta qué necesita resolver.' },
    { g: 'Precio y pago', q: '¿Tienen descuento / promoción?', a: 'El precio de {precio} ya incluye la promoción vigente de la web 😊 {club_}', tip: 'Ofrece SIEMPRE primero el precio de la página y una alternativa de valor (Club). El descuento libre es el último recurso para cerrar la venta: mira “Último recurso: descuento” en Casos especiales. Nunca lo anuncies ni lo ofrezcas de entrada.', conClub: true },
    { g: 'Precio y pago', q: '¿Puedo pagar en dólares / desde el extranjero?', a: '¡Sí! 😊 Puedes pagar en dólares (US$) por PayPal. El precio de *{curso}* en dólares es {precioUsd}. Cuando estés listo, te envío tu enlace de pago.', tip: 'El enlace de pago PayPal lo creas tú o se lo pides a gerencia (no hay un link fijo). Si arriba sale [precioUsd], ese curso aún no tiene precio en dólares (se pone en Web → Cursos). Toda la inscripción va en una sola moneda.' },
    { g: 'Clases y horarios', q: 'Vivo en otro país: ¿a qué hora son las clases?', a: 'Las clases son en vivo por Zoom y se dictan en *horario de Perú* (GMT-5): {dias} de {horario}. Todas quedan grabadas, así que si por la diferencia horaria no puedes conectarte a alguna, la puedes ver después 😊', tip: 'No hagas la conversión de hora por el cliente (te puedes equivocar): dile que el horario es de Perú y que puede verificar su hora local. Si el curso necesita instalación de programas, se coordina aparte con gerencia.' },
    { g: 'Precio y pago', q: 'Pagué en dólares: ¿me dan comprobante?', a: 'Por ahora, en los pagos en dólares te enviamos una *nota de pago* con el detalle de tu pago 😊', tip: 'En el panel: Ventas → Inscritos → botón “Nota de pago” (solo en inscripciones en dólares). No es boleta ni factura: por ahora no se emite comprobante electrónico en dólares.' },
    { g: 'Precio y pago', q: '¿Cómo puedo pagar?', a: 'Puedes pagar por *Yape, Plin o transferencia* a las cuentas oficiales de CCN. Cuando estés listo, te envío los datos y, al pagar, me compartes la captura 😊', tip: 'Envía los datos de pago solo cuando el cliente confirme que quiere inscribirse.' },
    { g: 'Precio y pago', q: '¿Puedo separar mi cupo?', a: 'Sí, puedes reservar tu cupo 😊 Solo debes completar el pago del curso *antes de que inicie*: lo ideal es un día antes, y excepcionalmente el mismo día hasta 3 horas antes de la primera clase. Si no se completa el pago, no podrás ingresar a las clases.', tip: 'La reserva no es un adelanto parcial: es apartar el cupo y pagar el total antes del inicio.' },
    { g: 'Precio y pago', q: '¿Puedo pagar en cuotas / por partes?', a: 'Déjame confirmarlo con la coordinación y te respondo en un momento 😊', pendiente: true, tip: 'NO está definido. No prometas cuotas. Consulta con gerencia.' },
    { g: 'Precio y pago', q: '¿Me dan boleta o factura?', a: 'Sí, te entregamos tu comprobante de pago. Si necesitas factura, envíame tu RUC y razón social y lo coordinamos 😊', pendiente: true, tip: 'Solo para pagos en soles. El comprobante electrónico con SUNAT está decidido pero aún no está activo (los botones Boleta y Factura del panel aparecen apagados). Confirma con gerencia cómo y cuándo se entrega antes de prometer fechas. Pagos en dólares: ver “Pagué en dólares”.' },
    { g: 'Precio y pago', q: '¿Hay devolución si no me gusta?', a: 'Los pagos no son reembolsables 😊 Por eso te recomiendo revisar bien el temario, las fechas y el horario antes de inscribirte. Si tienes cualquier duda, te la resuelvo ahora mismo.', tip: 'En primera instancia la respuesta es no. Sé clara y amable; si insiste, deriva a gerencia.' },
    { g: 'Precio y pago', q: 'Ya pagué y no puedo asistir. ¿Qué hago?', a: 'Gracias por avisarme 🙌 Voy a revisar tu caso con la coordinación y te respondo hoy mismo.', pendiente: true, tip: 'No prometas reembolso ni cambio. Registra el caso y avisa a gerencia.' },
    { g: 'Precio y pago', q: '¿El precio incluye IGV?', a: 'El precio de {precio} es el *precio final*, no se agrega ningún costo adicional 😊', tip: 'No entres en detalles de IGV. Es precio final.' },
    /* ---- Clases y horarios ---- */
    { g: 'Clases y horarios', q: '¿Cuándo empieza?', a: 'El próximo grupo de *{curso}* inicia el *{fecha}*, {dias} de {horario} 😊 ¿Te reservo tu cupo?', tip: 'Si el curso no tiene grupo, ofrece avisarle apenas abra (usa el caso “Sin fecha” en Casos especiales).' },
    { g: 'Clases y horarios', q: '¿Cuántas horas dura? ¿Cuántas sesiones son?', a: 'El curso dura *{horas} horas*, distribuidas en *{sesiones} sesiones* en vivo por Zoom 😊', tip: '' },
    { g: 'Clases y horarios', q: '¿Las clases son en vivo o grabadas?', a: 'Son *en vivo por Zoom* con el instructor, y además *quedan grabadas* para que puedas repasarlas cuando quieras 😊', tip: 'Las dos cosas son beneficios: en vivo para preguntar y grabadas para repasar.' },
    { g: 'Clases y horarios', q: '¿Qué pasa si falto a una clase?', a: 'No te preocupes 😊 Las clases quedan grabadas y podrás verlas. Eso sí, la asistencia cuenta para tu certificado y la escuela no se responsabiliza por las clases a las que el alumno no asista.', tip: 'Menciona que se necesita asistencia mínima para el certificado (ver Certificado).' },
    { g: 'Clases y horarios', q: '“No tengo tiempo”', a: 'Te entiendo 😊 Justo por eso las clases quedan grabadas: si algún día no puedes conectarte, la repasas después. Son {sesiones} sesiones en total; ¿el horario de {dias} de {horario} te vendría bien?', tip: 'Pregunta por el horario concreto antes de dar por perdido al cliente.' },
    { g: 'Clases y horarios', q: '¿Puedo cambiar de horario o de grupo?', a: 'Déjame consultarlo con la coordinación y te confirmo 😊', pendiente: true, tip: 'No está definido. Consulta con gerencia.' },
    { g: 'Clases y horarios', q: '¿Cuántos alumnos hay por grupo?', a: 'Trabajamos con grupos reducidos para que el instructor pueda resolver las dudas de cada alumno 😊', tip: 'No digas el número máximo de alumnos salvo que lo pida y lo hayas consultado.' },
    { g: 'Clases y horarios', q: '¿Y si el curso no abre / no se completa el grupo?', a: 'Los cursos abren cuando se completa el cupo mínimo. Si hiciera falta, el inicio se posterga una o dos semanas, pero no se cancela 😊 Si ya estás inscrito, tu inscripción se mantiene según nuestros Términos y condiciones.', tip: 'Transmite tranquilidad: no se cancela, se reprograma.' },
    /* ---- Contenido y nivel ---- */
    { g: 'Contenido y nivel', q: '“No sé nada, soy principiante”', a: '¡Perfecto, justo para eso es! 🙌 *{curso}* empieza desde cero y va paso a paso. No necesitas experiencia previa. Además, las clases quedan grabadas para que repases las veces que quieras.', tip: 'Refuerza que empieza desde cero. Recuerda que hay práctica y proyecto final.' },
    { g: 'Contenido y nivel', q: '¿Qué voy a aprender exactamente?', a: 'Con gusto 😊 Te envío el temario en PDF y te cuento lo principal: (usa el mensaje de “Presentación” de este manual).', tip: 'Envía el mensaje de Presentación y el PDF del temario.' },
    { g: 'Contenido y nivel', q: '¿Hay tareas o evaluaciones?', a: 'Sí 😊 Practicas durante las clases y hay dos entregas: una a mitad del curso y un proyecto final. Con eso aplicas lo aprendido y, al aprobarlas, accedes a tu certificado.', tip: 'Evita sonar a “examen difícil”: son entregas prácticas.' },
    { g: 'Contenido y nivel', q: '¿Word, Excel y PowerPoint por separado o el Club?', a: '{club_}', tip: 'Pregunta qué necesita (trabajo, estudios) antes de recomendar.', soloClub: true },
    { g: 'Contenido y nivel', q: '¿Qué diferencia hay entre “Claude” e “IA aplicada a negocios”?', a: '*Claude para principiantes* te enseña a usar la herramienta Claude desde cero (cuenta, cómo pedir bien las cosas, redactar, analizar documentos). *IA aplicada a negocios* va más allá: cómo usar la IA en ventas, atención al cliente, marketing y procesos de un negocio. ¿Para qué lo quieres usar tú?', pendiente: true, tip: 'La diferencia de contenido aún se está afinando. Pregunta para qué lo necesita y recomienda sin prometer detalles que no estén en el temario.' },
    { g: 'Contenido y nivel', q: '¿Puedo llevar varios cursos?', a: 'Claro 😊 Puedes inscribirte en más de uno. Solo revisemos que los horarios no se crucen. ¿Cuáles te interesan?', tip: 'Cada curso es independiente. Revisa fechas y horarios en Grupos.' },
    { g: 'Contenido y nivel', q: '¿Tienen cursos de nivel avanzado?', a: 'Por ahora nuestros cursos empiezan desde cero y van subiendo paso a paso. Te aviso si abrimos nuevos niveles 😊', pendiente: true, tip: 'No hay niveles avanzados confirmados. No prometas.' },
    /* ---- Certificado ---- */
    { g: 'Certificado', q: '¿Dan certificado? ¿Es válido?', a: 'Sí 😊 Recibes un *certificado CCN* con código QR que se puede verificar en nuestra web. Se entrega al cumplir con la asistencia mínima, la participación y aprobar el trabajo final del curso.', tip: 'No lo llames “título”, “oficial” ni “reconocido por el Estado”. Es certificado CCN verificable.' },
    { g: 'Certificado', q: '¿Cuándo me entregan el certificado?', a: 'Te lo enviamos por correo a más tardar 72 horas después de la última clase, siempre que hayas cumplido con los requisitos 😊', tip: '' },
    { g: 'Certificado', q: '¿Qué necesito para obtener el certificado?', a: 'Asistir al menos al 80 % de las clases, participar en las sesiones y aprobar las dos entregas del curso (la de mitad y el proyecto final) 😊', tip: 'Dilo como algo alcanzable, no como una amenaza.' },
    /* ---- Requisitos técnicos ---- */
    { g: 'Requisitos técnicos', q: '¿Qué necesito para llevar el curso?', a: 'Necesitas una laptop o PC, internet estable, cámara y micrófono 💻 Para los cursos de ofimática la computadora debe tener *Windows*. Los programas los instalamos contigo antes del inicio.', tip: 'Confirma si el cliente tiene Windows antes de inscribirlo en Word, Excel, PowerPoint o el Club.' },
    { g: 'Requisitos técnicos', q: '¿Funciona en Mac, tablet o celular?', a: 'Déjame confirmarlo con la coordinación y te respondo enseguida 😊', pendiente: true, tip: 'Para Office solo Windows. Para otros cursos, consulta antes de decir que sí.' },
    { g: 'Requisitos técnicos', q: '¿Tengo que comprar los programas? ¿Son con licencia?', a: 'No tienes que comprar nada 😊 Los programas de los cursos los gestiona CCN y los instalamos contigo de forma remota.', tip: 'Aplica a los programas que se instalan (Office, Adobe). Para herramientas gratuitas (Canva, Notion, Claude) solo hay que crear la cuenta.' },
    { g: 'Requisitos técnicos', q: '¿Cómo es la instalación?', a: 'Es *remota*: nuestro equipo se conecta a tu computadora por AnyDesk (un programa gratuito que descargas) y deja todo listo, en aproximadamente 1 hora, antes de que empiecen las clases. Yo te agendo el día y la hora 😊', tip: 'Las instalaciones se agendan en la ventana: lunes a viernes 7–10 p. m., sábado 3–10 p. m., domingo 8 a. m.–10 p. m. Listas 3 días antes del inicio.' },
    /* ---- Inscripción ---- */
    { g: 'Inscripción', q: '¿Cómo me inscribo?', a: 'Es muy fácil 😊 Necesito: *nombre completo, DNI o CE, correo y celular*. Te envío también los Términos y condiciones y los datos de pago. Cuando pagues, quedas inscrito.', tip: 'Correo y DNI/CE son obligatorios.' },
    { g: 'Inscripción', q: '¿Qué pasa después de pagar?', a: '¡Listo! 🙌 Te llega un *correo de bienvenida* con el link del grupo de WhatsApp, los datos de tu curso y el enlace de Zoom. Luego coordinamos la instalación de los programas, si tu curso la necesita.', tip: 'Registra el pago en el panel y envía la bienvenida (Ventas → Inscritos).' },
    { g: 'Inscripción', q: '¿Puedo inscribir a otra persona / es para un regalo?', a: 'Claro, lo vemos 😊 Necesito los datos de la persona que llevará el curso: nombre completo, DNI o CE, correo y celular.', pendiente: true, tip: 'No está definido el tema de regalos. Confirma con gerencia si hay alguna condición.' },
    { g: 'Inscripción', q: '¿Hay precio para grupos o empresas?', a: 'Gracias por tu interés 😊 Para grupos o empresas lo coordinamos directamente con la gerencia. ¿Me indicas cuántas personas serían y qué curso les interesa?', pendiente: true, tip: 'Cotizaciones para empresas aún no están definidas. Toma los datos y deriva a gerencia.' },
    /* ---- Confianza ---- */
    { g: 'Confianza', q: '¿Quiénes son? ¿Es seguro pagar?', a: 'CCN – Centro de Capacitaciones y Negocios es una marca de *FIDTAIL PERU S.A.C.* (RUC 20608933019) 😊 Los pagos se hacen únicamente a nuestras cuentas oficiales y te entregamos tu comprobante. Si quieres, puedes ver más en ccnperuacademy.com.', tip: 'Nunca aceptes ni des datos de pago de cuentas personales.' },
    { g: 'Confianza', q: '¿Tienen clases presenciales?', a: 'Por ahora nuestros cursos son *online en vivo* por Zoom 😊', pendiente: true, tip: 'Las presenciales/mentorías están en evaluación. No prometas.' },
    { g: 'Confianza', q: '¿Quién es el profesor?', a: 'Nuestros instructores son especialistas en cada tema y te acompañan en vivo durante todas las sesiones 😊', pendiente: true, tip: 'La web no muestra los nombres de los instructores. Si insiste, consulta con gerencia.' },
  ].map((f) => ({ ...f, a: rellenar(f.a.replace('{club_}', club), v) }))
}

/* ---------------- 4. Seguimiento (máximo 3 intentos) ---------------- */
export function seguimientos(v) {
  const pregunta = v.tieneGrupo ? `El grupo inicia el ${v.fecha} y quedan ${v.cupos} cupos 🙌` : 'Apenas abramos el grupo te aviso 🙌'
  return [
    { id: 'seg1', t: 'Intento 1 · Al día siguiente', nota: 'Suave, para recordar y ofrecer ayuda.', a: `Hola ${v.nombre || '[nombre]'} 😊 ¿pudiste revisar el temario de *${v.curso || '[curso]'}*? Si tienes alguna duda, con gusto te ayudo. ${pregunta}` },
    { id: 'seg2', t: 'Intento 2 · A los 2–3 días', nota: 'Aporta valor: en vivo, grabadas y certificado.', a: `Hola ${v.nombre || '[nombre]'} 👋 te escribo por si te quedó alguna duda sobre *${v.curso || '[curso]'}*. Las clases son en vivo por Zoom, quedan grabadas y al terminar recibes tu certificado CCN. ¿Te ayudo a reservar tu cupo?` },
    { id: 'seg3', t: 'Intento 3 · Cierre amable (último)', nota: 'Después de este mensaje, marca el prospecto como PERDIDO en el panel. No hay un cuarto intento.', a: `Hola ${v.nombre || '[nombre]'} 😊 no quiero ser insistente. Dejo tu información guardada y, si más adelante te interesa, aquí estaré para ayudarte. ¡Éxitos! 🙌` },
    { id: 'seg-r', t: 'Si responde “lo voy a pensar”', nota: 'Averigua qué lo detiene.', a: '¡Claro! 😊 Solo para ayudarte a decidir: ¿qué te gustaría resolver antes de inscribirte? (el horario, el precio, el contenido…) ' + (v.tieneGrupo ? `Te recuerdo que el grupo inicia el ${v.fecha} y quedan ${v.cupos} cupos.` : '') },
  ]
}

/* ---------------- 5. Cierre y pago ---------------- */
export function cierres(v) {
  return [
    { id: 'c1', t: 'Pedir datos para inscribir', nota: 'Correo y DNI/CE son obligatorios. Envía también los Términos y condiciones (y los requisitos de PC si es ofimática).', a: 'Para inscribirte necesito estos datos 😊\n\n• Nombre completo\n• DNI o CE\n• Correo electrónico\n• Celular\n\nTe envío también los Términos y condiciones para que los revises.' },
    { id: 'c1b', t: 'Pedir datos · alumno del extranjero', nota: 'Solo si paga en dólares. Antes elige “Dólares” en Moneda del cliente. En el panel registra la inscripción en Dólares. Envía también los Términos y condiciones.', a: 'Para inscribirte necesito estos datos 😊\n\n• Nombre completo\n• Documento de identidad (pasaporte o documento de tu país) y su número\n• País donde vives\n• Correo electrónico\n• Celular con código de país (WhatsApp)\n\nTe envío también los Términos y condiciones para que los revises. Las clases son en horario de Perú (GMT-5) y quedan grabadas.' },
    { id: 'c2', t: 'Enviar datos de pago', nota: 'Reemplaza [datos de la cuenta oficial] con las cuentas de CCN (Yape, Plin o transferencia). Nunca cuentas personales.', a: `Perfecto, ${v.nombre || '[nombre]'} 🙌 El pago de *${v.curso || '[curso]'}* es de *${v.precio || '[precio]'}*.\n\nPuedes pagar por Yape, Plin o transferencia:\n[datos de la cuenta oficial]\n\nCuando pagues, envíame la captura y quedas inscrito 😊` },
    { id: 'c2b', t: 'Enviar datos de pago en dólares (PayPal)', nota: 'Crea tú el enlace de cobro de PayPal por el monto exacto, o pídeselo a gerencia. La inscripción completa va en dólares (no se mezcla con soles).', a: `Perfecto, ${v.nombre || '[nombre]'} 🙌 El pago de *${v.curso || '[curso]'}* en dólares es de *${v.precioUsd || '[precio en US$]'}*.\n\nAquí tienes tu enlace de pago de PayPal:\n[enlace de pago]\n\nCuando pagues, envíame la captura y quedas inscrito 😊` },
    { id: 'c4b', t: 'Confirmar pago en dólares + nota de pago', nota: 'Registra el pago en dólares en el panel y envía la bienvenida (Ventas → Inscritos). La “Nota de pago” (botón en Inscritos) es solo para alumnos del extranjero que pagan en dólares: no es boleta ni factura.', a: `¡Pago recibido, gracias! ✅ Ya estás inscrito en *${v.curso || '[curso]'}*. En breve te llegará un correo de bienvenida con el link del grupo de WhatsApp y los datos de tu clase (horario de Perú, GMT-5). Si necesitas una *nota de pago* de tu inscripción, te la envío por aquí 😊` },
    { id: 'c3', t: 'Recordar el pago antes del inicio', nota: 'Fecha límite: idealmente 1 día antes; excepcionalmente hasta 3 horas antes de la clase.', a: `Hola ${v.nombre || '[nombre]'} 😊 te recuerdo que para asegurar tu cupo en *${v.curso || '[curso]'}* debes completar tu pago antes del inicio (${v.fecha || '[fecha]'}). Si no se completa, no podrás ingresar a las clases. ¿Te ayudo con algo?` },
    { id: 'c4', t: 'Confirmar el pago recibido', nota: 'Registra el pago en el panel y envía la bienvenida (Ventas → Inscritos).', a: `¡Pago recibido, gracias! ✅ Ya estás inscrito en *${v.curso || '[curso]'}*. En breve te llegará un correo de bienvenida con el link del grupo de WhatsApp y los datos de tu clase. Si tu curso lo necesita, te escribo para agendar la instalación de los programas 😊` },
  ]
}

/* ---------------- 6. Casos especiales ---------------- */
export function casos(v) {
  return [
    { id: 'k0', t: 'Último recurso: descuento libre', pendiente: !v.descMax, nota: v.descMax
      ? `Solo si el cliente está por irse y el precio es lo único que falta. Antes ofrece SIEMPRE el precio de la página y el valor del curso. Puedes bajar hasta ${v.descMax} % (mínimo ${v.precioMin || '[elige un curso]'}) sin pedir autorización; más abajo necesitas la autorización de gerencia. Al inscribir, pon el precio acordado: el panel lo reconoce como descuento libre. No uses frases como “solo por hoy”.`
      : 'Aún no hay un tope de descuento libre (se define en Web → Ajustes). Mientras tanto, cualquier descuento necesita autorización previa de gerencia.',
      a: v.descMax ? `Te entiendo 😊 Déjame ver qué puedo hacer por ti… Puedo ofrecerte *${v.precioMin || '[precio mínimo]'}* por *${v.curso || '[curso]'}*. ¿Te inscribes con ese precio?` : 'Déjame consultarlo con la coordinación y te respondo en un momento 😊' },
    { id: 'k0b', t: 'Alumno del extranjero · primer mensaje', nota: 'Elige Dólares en “Moneda del cliente” para que el precio salga en US$. Un solo tipo de moneda por inscripción: no mezcles soles y dólares. El enlace de PayPal lo creas tú por el monto exacto o lo pides a gerencia.', a: `¡Hola ${v.nombre || '[nombre]'}! 😊 Gracias por escribirnos desde el extranjero 🌎 Nuestro curso *${v.curso || '[curso]'}* es 100 % online: clases en vivo por Zoom (horario de Perú, GMT-5)${v.tieneGrupo ? `, inicia el *${v.fecha}* · ${v.dias || '[días]'} · ${v.horario || '[horario]'}` : ''}, con clases grabadas y certificado CCN al aprobar.\n\n💰 ${v.antesUsd ? `Precio regular ~${v.antesUsd}~ · ` : ''}*Inversión: ${v.precioUsd || '[precio en US$]'}* (pago por PayPal)\n\n¿Te comparto el temario y los pasos para inscribirte?` },
    { id: 'k1', t: 'Curso sin fecha confirmada', nota: 'Segunda ola (p. ej. Claude, IA aplicada, Canva) mientras no haya grupo.', a: `Este curso aún no tiene fecha confirmada 😊 Si quieres, te anoto y te aviso apenas abramos el grupo. ¿Te parece?` },
    { id: 'k2', t: 'Grupo lleno → lista de espera', nota: 'Registra al cliente como prospecto con el curso.', a: 'Este grupo ya está completo 🙌 Puedo anotarte en lista de espera y avisarte apenas haya un cupo o se abra un nuevo grupo. ¿Te anoto?' },
    { id: 'k3', t: 'El grupo se posterga (no llegó al mínimo)', nota: 'Avisa a quienes ya se inscribieron. La reprogramación se rige por los Términos y condiciones.', a: `Hola ${v.nombre || '[nombre]'} 😊 Te aviso que el grupo de *${v.curso || '[curso]'}* se posterga [1 o 2] semana(s) para completar el cupo mínimo. La nueva fecha de inicio será el [nueva fecha]. Tu inscripción se mantiene según nuestros Términos y condiciones. ¿Alguna duda?` },
    { id: 'k4', t: 'Venta cruzada: Club Ofimática', nota: 'Para quien pregunta por Word, Excel o PowerPoint.', a: v.clubPrecio && v.ahorro ? `Si quieres Word, Excel y PowerPoint, el *Club Ofimática* te sale mejor: ${v.clubPrecio} por los tres (42 horas) en vez de ${v.sueltos} por separado. Los ves en una sola línea de aprendizaje 🙌` : 'Si quieres Word, Excel y PowerPoint, el *Club Ofimática* los reúne en un solo programa de 42 horas y te sale más conveniente 🙌' },
    { id: 'k5', t: 'Cliente molesto o con un reclamo', nota: 'No discutas ni prometas. Registra el caso con el botón de Quejas y reclamos y avisa a gerencia.', a: 'Lamento mucho lo que me cuentas 🙏 Voy a registrar tu caso ahora mismo y lo reviso con la coordinación para darte una respuesta lo antes posible. ¿Me confirmas tu nombre completo y tu DNI?' },
    { id: 'k6', t: 'Cliente que no responde después del 3.er intento', nota: 'No insistas más: marca el prospecto como PERDIDO. Si él escribe de nuevo, retoma desde la presentación.', a: 'No se envía otro mensaje. Marca el prospecto como PERDIDO en Prospectos y pasa al siguiente 🙂' },
    { id: 'k7', t: 'Alumno que ya pagó y pregunta cuándo empieza', nota: 'Revisa el cronograma en Grupos para confirmar la fecha real.', a: `¡Hola ${v.nombre || '[nombre]'}! 😊 Tu curso *${v.curso || '[curso]'}* inicia el *${v.fecha || '[fecha]'}*, ${v.dias || '[días]'} de ${v.horario || '[horario]'}. El link de Zoom y del grupo de WhatsApp están en tu correo de bienvenida. ¿Lo recibiste?` },
  ]
}
