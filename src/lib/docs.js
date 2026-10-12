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

Este documento reúne todo lo que debes saber para trabajar en CCN: tus metas, tus plazos y límites, tus funciones y las reglas al vender. Léelo completo y vuelve a él cuando tengas una duda.

1. TUS METAS
- Cada curso abre con MÍNIMO 10 inscritos y tiene un MÁXIMO de 20 alumnos. Tu trabajo es llenar los cupos.
- Tus metas por hitos (cupos y fechas) las ves siempre actualizadas en tu dashboard, en "Mi avance".
- Si un curso no llega a 10, se posterga 1 o 2 semanas (no se cancela) y no hay penalidad para ti.
- Un curso se considera CERRADO EN VENTA cuando llega a 20 alumnos. No se inscribe más allá de 20.
- Club Ofimática (Word + Excel + PowerPoint) cuenta como 1 cupo.

2. HORARIO Y JORNADA
- Mínimo 24 horas por semana (4 h por día, de lunes a sábado), en varios bloques si lo necesitas. Es un mínimo: puedes trabajar más.
- Usa "Iniciar jornada / Terminar jornada" desde una laptop. Sin señal por 15 minutos, la jornada se cierra sola. Solo gerencia corrige horas.
- Los feriados cuentan como 4 h.
- Terminadas tus horas puedes y debes seguir contestando: cada venta que cierres te da comisión.

3. QUÉ HACES
- Respondes TODOS los mensajes de WhatsApp, TikTok e Instagram (tienes rol de vendedora: solo ver y responder mensajes).
- Registras a cada prospecto y llenas Contacto 1 y Contacto 2 (en qué quedó y si hay que volver a contactar, con fecha).
- Usas tu Agenda: pendientes, notas y calendario.
- Inscribes a los alumnos (Ventas → Inscritos). El sistema genera solo el código de alumno.
- Programas las instalaciones de programas dentro de las ventanas permitidas; las instalaciones las hace gerencia.
- Creas y administras los grupos de WhatsApp de cada curso.
- Atiendes y registras quejas y reclamos.
- Subes las clases grabadas: entras a cada clase en Zoom, descargas el video y lo subes al Drive, en la carpeta "Cursos" > carpeta del curso > carpeta del código del grupo (la misma que el grupo de WhatsApp). Plazo máximo: 24 horas después de la clase. Solo trabajas dentro de la carpeta "Cursos"; esa carpeta del grupo es la que se comparte con los alumnos del grupo (solo lectura). La carpeta de un grupo se elimina un mes después de terminado el curso; gerencia te avisa.

4. PLAZOS Y LÍMITES (lo que no puedes pasar por alto)
- Respuesta a mensajes: máximo 2 horas entre las 8 a. m. y las 7 p. m. Lo que llega después de las 7 p. m. se responde al día siguiente. Cada mensaje sin responder es una venta que se puede perder.
- Pago de la vacante: lo ideal es un día antes del inicio, para poder darle sus accesos. Excepcionalmente puede pagar el mismo día, hasta 3 horas antes de la clase. Si el curso empieza y no pagó, no se le dan accesos y se le retira del grupo de WhatsApp hasta que pague. El panel te avisa (pronto / hoy / retirar).
- Instalaciones de programas: las agendas solo en estas ventanas — lunes a viernes de 7 p. m. a 10 p. m., sábados de 3 p. m. a 10 p. m., domingos de 8 a. m. a 10 p. m. Cada una dura 1 hora y debe quedar lista 3 días antes del inicio del curso.
- Recontactos: no dejes pasar la fecha de "volver a contactar"; el panel te avisa cuando se te pasa.
- Quejas y reclamos: se avisan a gerencia de inmediato.
- Descuentos: ninguno sin autorización previa de gerencia.
- Grupos de WhatsApp: se dejan en "solo administradores" hasta el inicio del curso.

5. GRUPOS DE WHATSAPP: CÓMO CREARLOS Y NOMBRARLOS
- Creas el grupo de cada curso apenas gerencia confirma la fecha de inicio. Un grupo por curso y por fecha de inicio.
- El nombre del grupo es el CÓDIGO DEL GRUPO, siempre con este formato:
  G + número del grupo (2 cifras) - DÍAS - CURSO - FECHA DE INICIO (día.mes)
  Ejemplo: G05-M/J-NOTION-24.11 (grupo 5, martes y jueves, curso Notion, inicia el 24 de noviembre)
- Número del grupo: correlativo, en el orden en que se crean (G01, G02, G03...). No se repite ni se reutiliza.
- Días de clase, con estas letras: L = lunes, M = martes, X = miércoles, J = jueves, V = viernes, S = sábado, D = domingo. Dos días van separados por una barra: L/X (lunes y miércoles), M/J (martes y jueves). Un solo día va solo: D.
- Curso: en MAYÚSCULAS, sin tildes ni espacios (usa guion si hace falta). Ejemplos: CLUB, WORD, EXCEL, POWERPOINT, NOTION, PHOTOSHOP, ILLUSTRATOR, WEB, CLAUDE, IA, CANVA.
- Fecha de inicio: día y mes separados por punto, con dos cifras (24.11, 04.01). Si la fecha cambia, renombras el grupo y avisas a gerencia.
- Después de crearlo: lo dejas en "solo administradores" y lo registras en Ventas → Grupos de WhatsApp (el sistema avisa si falta).
- Cualquier duda con el código, consulta a gerencia antes de crear el grupo.

6. ANTES DE INSCRIBIR A UN ALUMNO
- Envías primero los términos y condiciones. El sistema no te deja inscribir sin marcarlo.
- Si el curso requiere instalar un programa, envías también los requisitos mínimos de PC.
- Verificas que el pago entre a una cuenta oficial de CCN y registras el comprobante.
- Confirmas el curso, el grupo y la fecha de inicio.
- El DNI o carné de extranjería y el correo del alumno son OBLIGATORIOS. Revisa que el correo esté bien escrito: a ese correo llega su bienvenida, y al terminar el curso, sus documentos. Un correo mal escrito significa que el alumno no recibirá nada.
- Tras inscribir, envías el correo de bienvenida desde el panel (botón con vista previa) cuando esté disponible.

7. REGLAS AL VENDER
- Precio fijo según la lista de cada curso en el sistema. Descuentos solo con autorización previa de gerencia; el sistema te pide marcarla y anotar quién y por qué.
- Los pagos entran SOLO a las cuentas oficiales de CCN, nunca a cuentas personales.
- Devoluciones: en primera instancia la respuesta es NO.
- Club Ofimática: es un paquete (Word + Excel + PowerPoint), cuenta como 1 cupo.

8. PROBLEMAS, QUEJAS Y RECLAMOS
- Si un alumno tiene un problema, lo atiendes tú, pero consultas siempre con gerencia cómo solucionarlo.
- Una queja o reclamo se registra en "Quejas y reclamos" y se avisa a gerencia de inmediato.

9. AL TERMINAR UN CURSO: CERTIFICADOS Y ASISTENCIAS
- Al terminar, cada alumno recibe por CORREO su constancia de participación (si cumplió la asistencia mínima) y, si cumplió además la participación y los entregables del curso, su certificado. Los aprueba gerencia y el sistema los envía solo.
- NO avises a los grupos de WhatsApp que el certificado ya se emitió: el correo llega directo al alumno. Si alguien pregunta, dile que le llega a su correo una vez aprobado por gerencia.
- Las asistencias las toma el profesor durante la clase y se cierran al terminar. Tú NO puedes modificarlas ni prometer que se cambiarán.
- Si un alumno reclama por su asistencia, indícale que escriba al correo oficial de la escuela con su sustento. Solo gerencia decide si se corrige.
- Cada certificado y cada constancia tienen un código y un QR con el que cualquier persona puede verificarlos.

10. TU PAGO
Honorario base mensual (recibo por honorarios) + comisión sobre lo vendido en el mes (3 % de 0 a 9 cupos, 4 % de 10 a 14, 5 % desde 15) + S/ 50 por cada curso que se llena (20 alumnos) en el que vendiste al menos un alumno. Lo ves en "Mi avance".

11. LO QUE SE REVISA
Gerencia revisa tu reporte semanal: inscritos, ventas, atención, recontactos, pendientes y horas.`,
  },
}

export function renderDoc(texto, v = {}) {
  const mapa = { nombre: v.nombre, documento: v.documento || '__________', email: v.email, puesto: v.puesto || 'Vendedora', sueldo: v.sueldo, fecha_inicio: v.fecha_inicio, fecha_fin: v.fecha_fin, mes: v.mes, fecha_envio: v.fecha_envio }
  return String(texto || '').replace(/\{\{(\w+)\}\}/g, (m, k) => (mapa[k] != null && mapa[k] !== '' ? mapa[k] : m))
}
export const plantillaDe = (data, tipo) => (data.plantillas || []).find((x) => x.tipo === tipo) || { tipo, ...DOC_DEFAULT[tipo] }
export const fechaLarga = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
