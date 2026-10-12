/* Documentos de trabajo: textos base (BORRADOR, para que los revise un contador o abogado).
   Variables: {{nombre}} {{documento}} {{email}} {{puesto}} {{sueldo}} {{fecha_inicio}} {{fecha_fin}} {{mes}} {{fecha_envio}} */
export const TIPOS_DOC = { contrato: 'Contrato', confidencialidad: 'Acuerdo de confidencialidad', plan: 'Plan de trabajo y funciones' }
export const VARIABLES_DOC = ['{{nombre}}', '{{documento}}', '{{email}}', '{{puesto}}', '{{sueldo}}', '{{fecha_inicio}}', '{{fecha_fin}}', '{{mes}}', '{{fecha_envio}}']

export const DOC_DEFAULT = {
  contrato: {
    titulo: 'Contrato de locación de servicios — {{mes}}',
    contenido: `CONTRATO DE LOCACIÓN DE SERVICIOS (BORRADOR)

Entre CCN – Centro de Capacitaciones y Negocios ("CCN") y {{nombre}}, DNI {{documento}} ("el/la Prestador/a"), se acuerda lo siguiente:

1. OBJETO. El/la Prestador/a brindará servicios de venta de los cursos de CCN: atención de prospectos por WhatsApp, TikTok e Instagram, seguimiento, inscripción de alumnos y administración de los grupos de WhatsApp, según el documento "Plan de trabajo y funciones".

2. PLAZO. Desde el {{fecha_inicio}} hasta el {{fecha_fin}}. Se renueva mediante un nuevo contrato mensual.

3. RETRIBUCIÓN. (a) Honorario base: {{sueldo}} mensuales, contra recibo por honorarios. En el primer mes se paga en proporción a los días del periodo. (b) Comisión sobre el total vendido del mes, por cupos cerrados: de 0 a 9 cupos, 3 %; de 10 a 14, 4 %; desde 15, 5 %. (c) Bono de S/ 50 por cada curso que se cierre (abra con su mínimo de inscritos) en el que haya vendido al menos un alumno.

4. HORAS. Dedicación mínima de 24 horas por semana (4 horas por día, de lunes a sábado), registradas con la jornada del sistema. Los feriados se pagan y cuentan como 4 horas cumplidas. Si no se cumple el mínimo semanal, se descuenta en proporción a las horas faltantes.

5. COBROS. Todo pago de alumnos se hace únicamente a las cuentas oficiales de CCN. Está prohibido recibir dinero en cuentas personales.

6. PRECIOS. El precio es fijo. Un descuento solo se concede con autorización previa de gerencia.

7. CONDUCTA. Antes de inscribir a un alumno se le envían los términos y condiciones. La devolución, en primera instancia, es negativa. Los problemas de alumnos y las quejas y reclamos se comunican de inmediato a gerencia.

8. CONFIDENCIALIDAD. Se rige por el Acuerdo de confidencialidad firmado.

9. NATURALEZA. El/la Prestador/a presta sus servicios de forma independiente y emite recibo por honorarios. Este contrato no genera relación laboral.

10. TÉRMINO. Cualquiera de las partes puede darlo por terminado comunicándolo por escrito con anticipación razonable.

Aceptado electrónicamente en la plataforma de CCN. Fecha de envío: {{fecha_envio}}.`,
  },
  confidencialidad: {
    titulo: 'Acuerdo de confidencialidad',
    contenido: `ACUERDO DE CONFIDENCIALIDAD (BORRADOR)

Yo, {{nombre}}, DNI {{documento}}, me comprometo con CCN – Centro de Capacitaciones y Negocios a:

1. Mantener en reserva toda la información a la que acceda: bases de prospectos y alumnos, datos personales, precios, márgenes, pagos a trabajadores e instructores, accesos y contraseñas, estrategias de venta y materiales de los cursos.

2. No copiar, compartir, vender ni usar esa información fuera de mi trabajo para CCN, ni durante ni después de mi vínculo.

3. No compartir mis accesos con terceros y avisar de inmediato a gerencia ante cualquier pérdida o uso indebido.

4. Devolver o eliminar la información de CCN al terminar mi vínculo.

5. Cumplir la normativa de protección de datos personales al tratar datos de alumnos y prospectos.

El incumplimiento puede dar lugar a las acciones legales que correspondan.

Vigente desde el {{fecha_inicio}}. Aceptado electrónicamente. Fecha de envío: {{fecha_envio}}.`,
  },
  plan: {
    titulo: 'Plan de trabajo y funciones',
    contenido: `PLAN DE TRABAJO Y FUNCIONES — {{nombre}}

1. TU META
Vender los cursos de CCN y que cada curso abra con mínimo 10 inscritos. Metas por hitos: las fija gerencia en tu ficha. Si no se cumplen, el curso se puede postergar; no hay penalidad.

2. HORARIO
Mínimo 24 horas por semana (4 h por día, lunes a sábado), en varios bloques si lo necesitas. Usa "Iniciar jornada / Terminar jornada" desde una laptop. Los feriados cuentan como 4 h. Terminadas tus horas puedes y debes seguir contestando: cada venta que cierres te da comisión.

3. QUÉ HACES
- Respondes TODOS los mensajes de WhatsApp, TikTok e Instagram (tienes rol de vendedora: solo ver y responder mensajes).
- De 8 am a 7 pm la respuesta no debe tardar más de 2 horas. Lo de después de las 7 pm se responde al día siguiente, sabiendo que cada mensaje sin responder es una venta que se puede perder.
- Registras a cada prospecto y llenas Contacto 1 y Contacto 2 (en qué quedó y si hay que volver a contactar, con fecha).
- Usas tu Agenda: pendientes, notas y calendario.
- Inscribes a los alumnos (Ventas → Inscritos).
- Programas las instalaciones de programas dentro de las ventanas permitidas; las instalaciones las hace gerencia.
- Eres administradora de los grupos de WhatsApp: los dejas para que nadie escriba hasta antes del curso.

4. REGLAS AL VENDER
- Precio fijo S/ 299. Descuentos solo con autorización previa de gerencia.
- Antes de inscribir envías los términos y condiciones (y los requisitos de PC si aplica). El sistema no te deja inscribir sin marcarlo.
- Los pagos entran SOLO a las cuentas oficiales de CCN, nunca a cuentas personales.
- Devoluciones: en primera instancia la respuesta es NO.
- Separación de vacante: se paga a más tardar un día antes del curso. Si el curso empieza y no pagó, no se le dan accesos y se le retira del grupo hasta que pague.
- Club Ofimática: es un paquete (Word + Excel + PowerPoint), cuenta como 1 cupo.

5. PROBLEMAS, QUEJAS Y RECLAMOS
- Si un alumno tiene un problema, lo atiendes tú, pero consultas siempre con gerencia cómo solucionarlo.
- Una queja o reclamo se avisa a gerencia de inmediato.

6. TU PAGO
Honorario base mensual (recibo por honorarios) + comisión sobre lo vendido (3 % / 4 % / 5 % según cupos del mes) + S/ 50 por curso cerrado en el que vendiste. Lo ves en "Mi avance".

7. LO QUE SE REVISA
Gerencia revisa tu reporte semanal: inscritos, ventas, atención, recontactos, pendientes y horas.`,
  },
}

export function renderDoc(texto, v = {}) {
  const mapa = { nombre: v.nombre, documento: v.documento || '__________', email: v.email, puesto: v.puesto || 'Vendedora', sueldo: v.sueldo, fecha_inicio: v.fecha_inicio, fecha_fin: v.fecha_fin, mes: v.mes, fecha_envio: v.fecha_envio }
  return String(texto || '').replace(/\{\{(\w+)\}\}/g, (m, k) => (mapa[k] != null && mapa[k] !== '' ? mapa[k] : m))
}
export const plantillaDe = (data, tipo) => (data.plantillas || []).find((x) => x.tipo === tipo) || { tipo, ...DOC_DEFAULT[tipo] }
export const fechaLarga = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
