/* Documentos de trabajo: textos base (BORRADOR, para que los revise un contador o abogado).
   Variables: {{nombre}} {{documento}} {{email}} {{puesto}} {{sueldo}} {{bono}} {{fecha_inicio}} {{fecha_fin}} {{mes}} {{fecha_envio}} */
export const TIPOS_DOC = { contrato: 'Contrato', confidencialidad: 'Acuerdo de confidencialidad', plan: 'Plan de trabajo y funciones' }
export const VARIABLES_DOC = ['{{nombre}}', '{{documento}}', '{{email}}', '{{puesto}}', '{{sueldo}}', '{{bono}}', '{{fecha_inicio}}', '{{fecha_fin}}', '{{mes}}', '{{fecha_envio}}']

export const DOC_DEFAULT = {
  contrato: {
    titulo: 'Contrato de locación de servicios — {{mes}}',
    contenido: `CONTRATO DE LOCACIÓN DE SERVICIOS (BORRADOR)

Entre FIDTAIL PERU S.A.C., RUC 20608933019, titular de la marca CCN – Centro de Capacitaciones y Negocios ("CCN"), y {{nombre}}, DNI {{documento}} ("el/la Prestador/a"), se acuerda lo siguiente:

1. OBJETO. El/la Prestador/a brindará servicios de venta de los cursos de CCN: atención de prospectos por WhatsApp, TikTok e Instagram, seguimiento, inscripción de alumnos y administración de los grupos de WhatsApp, según el documento "Plan de trabajo y funciones".

2. PLAZO. Desde el {{fecha_inicio}} hasta el {{fecha_fin}}. Se renueva mediante un nuevo contrato mensual.

3. RETRIBUCIÓN. (a) Honorario base: {{sueldo}} mensuales, más un bono de movilidad (pasajes) de {{bono}} mensuales, contra recibo por honorarios. En el primer mes se paga en proporción a los días del periodo. (b) Comisión sobre el total vendido del mes, por cupos cerrados: de 0 a 9 cupos, 3 %; de 10 a 14, 4 %; desde 15, 5 %. (c) Bono de S/ 50 por cada curso que se cierre (abra con su mínimo de inscritos) en el que haya vendido al menos un alumno.

4. HORAS. Dedicación mínima de 24 horas por semana (4 horas por día, de lunes a sábado), registradas con la jornada del sistema. Los feriados se pagan y cuentan como 4 horas cumplidas. Se trabaja de lunes a domingo con un día de descanso por semana, que se elige de lunes a viernes y se avisa con una semana de anticipación. Los sábados y domingos la asistencia a la oficina es obligatoria, y entre semana se acuerda un tercer día presencial; los días presenciales son de 4 horas. Los descuentos se calculan por hora sobre el total mensual (honorario base más bono de movilidad): valor de la hora = total mensual ÷ horas mínimas del mes. Se descuentan las horas no trabajadas y cada día presencial no asistido (4 horas), y el descuento alcanza también al bono de movilidad.

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
- Cada curso abre con MÍNIMO 5 inscritos y tiene un MÁXIMO de 20 alumnos. Tu trabajo es llenar los cupos.
- Tus metas por hitos (cupos y fechas) las ves siempre actualizadas en tu dashboard, en "Mi avance".
- Si un curso no llega a 5, se posterga entre 1 y 2 semanas, según cuántos alumnos falten (no se cancela) y no hay penalidad para ti.
- Un curso se considera CERRADO EN VENTA cuando llega a 20 alumnos. No se inscribe más allá de 20.
- Club Ofimática (Word + Excel + PowerPoint) cuenta como 1 cupo.

2. HORARIO, JORNADA Y PRESENCIALIDAD
- Trabajas de lunes a domingo, con 1 día de descanso por semana. El descanso es obligatorio: lo eliges de lunes a viernes y lo avisas con 1 semana de anticipación.
- Mínimo 4 horas por día trabajado (24 horas por semana como mínimo), en varios bloques si lo necesitas. Es un mínimo: puedes trabajar más. Tú eliges tu hora de entrada.
- Sábado y domingo vienes a la oficina de La Molina: es obligatorio y no se negocia. Al inicio vienes 3 días por semana: sábado, domingo y un tercer día entre semana que fijas tú. Los días presenciales también son de 4 horas. Si gerencia aumenta los días presenciales, te lo avisa con anticipación.
- Usa "Iniciar jornada / Terminar jornada" desde una laptop. Al llegar a la oficina entras a tu sistema y ahí registras tu entrada. Sin señal por 15 minutos, la jornada se cierra sola. Solo gerencia corrige horas.
- Los feriados cuentan como 4 h.
- Terminadas tus horas puedes y debes seguir contestando: cada venta que cierres te da comisión.

3. QUÉ HACES
- Respondes TODOS los mensajes de WhatsApp, TikTok e Instagram (tienes rol de vendedora: solo ver y responder mensajes).
- Registras a cada prospecto y llenas Contacto 1 y Contacto 2 (en qué quedó y si hay que volver a contactar, con fecha).
- Usas tu Agenda: pendientes, notas y calendario.
- Inscribes a los alumnos (Ventas → Inscritos). El sistema genera solo el código de alumno.
- Las inscripciones que llegan desde la web (carrito) entran como interesados y se abre un WhatsApp con el pedido (código P-…, cursos y total, IGV incluido). Los atiendes en el mismo orden: respondes, confirmas el pago y los inscribes. Quien lleva varios cursos llena sus datos una sola vez.
- Programas las instalaciones de programas dentro de las ventanas permitidas; las instalaciones las hace gerencia de forma remota por AnyDesk (el alumno debe tener AnyDesk descargado).
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
- Después de crearlo: lo dejas en "solo administradores" y lo registras en Ventas → Grupos de WhatsApp con su enlace de invitación (el sistema avisa si falta). Ese enlace es el que recibe cada alumno en su correo de bienvenida.
- Cualquier duda con el código, consulta a gerencia antes de crear el grupo.

6. ANTES DE INSCRIBIR A UN ALUMNO
- Envías primero los términos y condiciones. El sistema no te deja inscribir sin marcarlo.
- Si el curso requiere instalar un programa, envías también los requisitos mínimos de PC.
- Verificas que el pago entre a una cuenta oficial de CCN y registras el comprobante.
- Confirmas el curso, el grupo y la fecha de inicio.
- El DNI o carné de extranjería y el correo del alumno son OBLIGATORIOS. Revisa que el correo esté bien escrito: a ese correo llega su bienvenida, y al terminar el curso, sus documentos. Un correo mal escrito significa que el alumno no recibirá nada.
- Apenas registres el primer pago, envías el correo de bienvenida desde Ventas → Inscritos con el botón "✉️ Bienvenida" (solo aparece cuando hay un pago registrado). Lleva sus datos, curso, fecha y horario, el link del grupo de WhatsApp, el Zoom, el resumen de su pago, qué necesita y los Términos y condiciones en PDF. Si todavía debe saldo, el correo sale sin el link de Zoom y le recuerda el saldo y la fecha límite. Después de enviarlo, el botón cambia a "Reenviar".
- Para que la bienvenida salga completa, el grupo de WhatsApp debe estar registrado en Ventas → Grupos de WhatsApp (con su enlace) y el Zoom del grupo cargado en Académico → Accesos. Si falta alguno, el correo avisa al alumno que se lo enviarán después.

7. REGLAS AL VENDER
- Precio fijo según la lista de cada curso en el sistema. Descuentos solo con autorización previa de gerencia; el sistema te pide marcarla y anotar quién y por qué.
- Los pagos entran SOLO a las cuentas oficiales de CCN, nunca a cuentas personales.
- Devoluciones: en primera instancia la respuesta es NO.
- Club Ofimática: es un paquete (Word + Excel + PowerPoint), cuenta como 1 cupo.
- Los precios del sistema son FINALES e incluyen IGV: no se suma nada. Dile al alumno el precio que muestra el sistema.
- EVALUACIONES T1 Y T2 Y CERTIFICADO: cada curso tiene dos trabajos obligatorios: T1 (a mitad del curso) y T2 (proyecto final). El T1 se entrega dentro de los 3 días después de la clase en que se anuncia; el T2, a más tardar 48 horas antes de la última clase. La última clase es de repaso: el profesor revisa los trabajos que elija con los alumnos y resuelve preguntas. Quien no entrega a tiempo o no aprueba NO accede al certificado (si cumplió la asistencia mínima, recibe la constancia). El certificado sale dentro de las 72 horas después de la última clase. Debes decirlo al vender; también está en los términos y condiciones. Para el certificado además se pide asistencia mínima y participación.
- BENEFICIO: las clases se graban y los alumnos del grupo pueden volver a verlas.

8. PROBLEMAS, QUEJAS Y RECLAMOS
- Si un alumno tiene un problema, lo atiendes tú, pero consultas siempre con gerencia cómo solucionarlo.
- Una queja o reclamo se registra en "Quejas y reclamos" y se avisa a gerencia de inmediato.

9. AL TERMINAR UN CURSO: CERTIFICADOS Y ASISTENCIAS
- Al terminar, cada alumno recibe por CORREO su constancia de participación (si cumplió la asistencia mínima) y, si cumplió además la participación y aprobó T1 y T2, su certificado. Se emiten dentro de las 72 horas después de la última clase (ver la sección 12 si haces de asistente académico).
- NO avises a los grupos de WhatsApp que el certificado ya se emitió: el correo llega directo al alumno. Si alguien pregunta, dile que le llega a su correo una vez aprobado por gerencia.
- Las asistencias las toma el profesor durante la clase y se cierran al terminar. Tú NO puedes modificarlas ni prometer que se cambiarán. Si un profesor olvidó tomarla, solo puedes reabrirla para que él la registre (sección 12).
- Si un alumno reclama por su asistencia, indícale que escriba al correo oficial de la escuela con su sustento. Solo gerencia decide si se corrige.
- Cada certificado y cada constancia tienen un código y un QR con el que cualquier persona puede verificarlos.

10. TU PAGO
Sueldo mensual + bono de pasajes (ambos figuran en tu ficha y en tu contrato; si se aumenta tu sueldo, el bono se mantiene) + comisión sobre lo vendido en el mes (3 % de 0 a 9 cupos, 4 % de 10 a 14, 5 % desde 15) + S/ 50 por cada curso que se llena (20 alumnos) en el que vendiste al menos un alumno. La comisión se calcula sobre el precio sin IGV. Lo ves en "Mi avance".
DESCUENTOS: se calculan por hora sobre el total (sueldo + bono de pasajes). Valor de la hora = total mensual ÷ horas mínimas del mes. Se descuentan las horas no trabajadas y cada día presencial al que no asistas (se descuentan sus 4 horas). El descuento alcanza también al bono de pasajes.

11. LO QUE SE REVISA
Gerencia revisa tu reporte semanal: inscritos, ventas, atención, recontactos, pendientes y horas. Si haces de asistente académico, también: cronogramas al día, accesos cargados, clases sin asistencia y certificados dentro de las 72 horas.

12. SI HACES DE ASISTENTE ACADÉMICO (mientras no haya una persona en ese puesto)
El asistente académico es un puesto aparte del de vendedora; por ahora lo cubres tú y por eso ves el módulo "Académico" en tu panel. No entras a Gerencia y no ves sueldos, pagos, tarifas ni contratos de nadie. Cuando se contrate a la persona del puesto, este módulo pasa a ella.
- Grupos: creas y editas los grupos y generas sus clases (Académico → Grupos). No puedes borrarlos: eso lo hace gerencia.
- Profesor: eliges el profesor del grupo en Académico → Cronograma y accesos. Si dice "sin acceso al panel", avisa a gerencia para que lo habilite. La tarifa la revisa gerencia.
- Accesos de cada grupo: un solo enlace de Zoom por grupo y una carpeta de clases grabadas por grupo. El profesor los ve en su panel y el Zoom sale en el correo de bienvenida de los alumnos que ya pagaron todo, así que deben estar cargados antes de enviar las primeras bienvenidas y antes de la primera clase.
- Evaluaciones: por cada grupo creas el Google Forms (con subida de archivos) o la carpeta de Drive de T1 y de T2, y pegas el enlace en el cronograma. Revisa que las fechas límite sean las correctas.
- Cronograma: al cargar los enlaces, descargas el PDF del cronograma o copias el texto para WhatsApp y se lo envías al profesor. Incluye fechas exactas de T1, T2 y de la última clase (repaso).
- Asistencia: revisas las clases que terminaron sin asistencia. Si el profesor olvidó tomarla, usas "Reabrir para el profesor": eliges 12, 24 o 48 horas y escribes el motivo (mínimo 10 letras). Tú no tomas ni corriges asistencias; solo el profesor la registra, y queda anotado quién la reabrió y por qué.
- Certificados: dentro de las 72 horas después de la última clase, emites las constancias y certificados en Académico → Certificados. El sistema solo deja emitir si el curso terminó, todas las clases tienen asistencia y el grupo tiene profesor con firma. El PDF lleva un QR de verificación. No avises a los grupos de WhatsApp: el alumno lo recibe en su correo.
- Revisas semanalmente: grupos sin profesor, accesos faltantes, cronogramas por vencer y clases sin asistencia.`,
  },
}

export function renderDoc(texto, v = {}) {
  const mapa = { nombre: v.nombre, documento: v.documento || '__________', email: v.email, puesto: v.puesto || 'Vendedora', sueldo: v.sueldo, bono: v.bono, fecha_inicio: v.fecha_inicio, fecha_fin: v.fecha_fin, mes: v.mes, fecha_envio: v.fecha_envio }
  return String(texto || '').replace(/\{\{(\w+)\}\}/g, (m, k) => (mapa[k] != null && mapa[k] !== '' ? mapa[k] : m))
}
export const plantillaDe = (data, tipo) => (data.plantillas || []).find((x) => x.tipo === tipo) || { tipo, ...DOC_DEFAULT[tipo] }
export const fechaLarga = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
