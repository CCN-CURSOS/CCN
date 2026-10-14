import { useEffect, useState } from 'react'
import { loadCatalog, wa } from '../lib/data.js'
import { Header, Footer } from '../components/Layout.jsx'
import { SeccionComo, SeccionModalidades, SeccionRuta, SeccionCta, SeccionHorarios, SeccionPreguntas, SeccionContacto } from '../components/Secciones.jsx'

function usarCatalogo() {
  const [data, setData] = useState({ cursos: [], grupos: [] })
  useEffect(() => { loadCatalog().then(setData).catch(() => {}) }, [])
  return data
}

function Pagina({ titulo, children, oscuro }) {
  useEffect(() => { document.title = `CCN · ${titulo}` }, [titulo])
  return (
    <>
      <Header />
      <main className={`subpage${oscuro ? ' subpage-osc' : ''}`}>{children}</main>
      <Footer />
    </>
  )
}

export function PaginaComo() {
  const { cursos, grupos } = usarCatalogo()
  return <Pagina titulo="Cómo aprendes"><SeccionModalidades /><SeccionComo cursos={cursos} grupos={grupos} /><SeccionRuta /><SeccionCta /></Pagina>
}
export function PaginaHorarios() {
  const { cursos, grupos } = usarCatalogo()
  return <Pagina titulo="Horarios" oscuro><SeccionHorarios cursos={cursos} grupos={grupos} /></Pagina>
}
export function PaginaPreguntas() {
  return <Pagina titulo="Preguntas"><SeccionPreguntas /></Pagina>
}
const TERMINOS = [
  'Cualquier consulta adicional deberá hacerse a través de los canales de contacto oficiales de CCN.',
  'Si el alumno requiere de forma imprevista una reprogramación o cambio de curso, deberá comunicarse oportunamente con el equipo de CCN. Podrá hacerlo hasta dos (02) días hábiles antes del día de inicio del curso, a través de cualquier canal de contacto oficial de CCN.',
  'Una vez iniciado el curso y como máximo hasta la mitad del mismo, si el alumno desea cambiar de horario, temporada o curso en el que se inscribió, deberá pagar una penalidad de S/ 50 soles o $14 dólares americanos, según sea el caso.',
  'El alumno se compromete a pagar la totalidad del valor monetario del curso en las fechas establecidas por el equipo de CCN.',
  'La separación de vacante se completa pagando el saldo del curso a más tardar un (01) día antes de su inicio, para poder brindarle sus accesos. Excepcionalmente puede pagarse el mismo día del inicio, hasta tres (03) horas antes de la hora de la clase. Si el curso inicia y el pago no se ha realizado, no se brindan los accesos y el alumno es retirado del grupo de WhatsApp hasta que pague.',
  'Todo pago se realiza únicamente a las cuentas oficiales de CCN que te indique el equipo por los canales oficiales.',
  'Cada curso abre con un mínimo de cinco (5) participantes por horario y tiene un máximo de veinte (20). Si no se llega al mínimo, CCN podrá postergar el inicio del curso entre 1 y 2 semanas, según la cantidad de participantes que falten.',
  'Para recibir el certificado del curso, el alumno debe cumplir la asistencia mínima, participar en las clases y aprobar las dos evaluaciones del curso: el trabajo T1 (a mitad del curso) y el trabajo T2 (proyecto final). Las fechas de cada entrega se informan en el cronograma del grupo: el T1 se entrega dentro de los tres (03) días posteriores a la clase en que se anuncia y el T2 a más tardar cuarenta y ocho (48) horas antes de la última clase. El alumno que no entregue a tiempo o no apruebe no accede al certificado; si cumplió la asistencia mínima, recibe la constancia de participación.',
  'La última clase del curso es de repaso: el profesor revisa con los alumnos los trabajos que elija y se resuelven preguntas. El certificado se emite dentro de las setenta y dos (72) horas posteriores a la última clase y se envía al correo registrado por el alumno, por lo que debe escribirlo correctamente al inscribirse. Cada certificado y cada constancia llevan un código QR con el que cualquier persona puede verificarlos.',
  'Las clases se graban y quedan disponibles para los alumnos del grupo durante un tiempo limitado como beneficio del curso. Está prohibido compartirlas, copiarlas o publicarlas.',
  'Los precios publicados son finales; no se suma ningún monto adicional. CCN, a través de FIDTAIL PERU S.A.C. (RUC 20608933019), emite boleta o factura electrónica por tu pago.',
  'El material producido por el alumno para la obtención de todo tipo de constancia o certificado podrá ser usado por CCN con fines publicitarios, acreditando la autoría del material al alumno correspondiente.',
  'No se realizan devoluciones.',
]
export function PaginaTerminos() {
  return (
    <Pagina titulo="Términos y condiciones">
      <section id="terminos"><div className="wrap">
        <div className="head"><span className="eyebrow">Legal</span><h2>Términos y condiciones</h2><p>CCN – Centro de Capacitación &amp; Negocios es una marca de FIDTAIL PERU S.A.C. (RUC 20608933019). Al inscribirte en un curso de CCN aceptas las siguientes condiciones.</p></div>
        <ol className="tc">
          {TERMINOS.map((t, i) => <li key={i}><span className="tc-n">{String(i + 1).padStart(2, '0')}</span><p>{t}</p></li>)}
        </ol>
      </div></section>
    </Pagina>
  )
}

const PRIVACIDAD = [
  ['Quién es el responsable', <p>El responsable del tratamiento de tus datos personales es FIDTAIL PERU S.A.C. (RUC 20608933019), titular de la marca CCN – Centro de Capacitación &amp; Negocios.</p>],
  ['Qué datos recopilamos', <p>A través de los formularios «Solicita información» e «Inscripción» de cada curso recopilamos tus nombres y apellidos, correo electrónico, tipo y número de documento (DNI o carné de extranjería), número de celular, el curso que te interesa y, en «Solicita información», la modalidad y el tema que indiques. También registramos la fecha y hora de envío y las autorizaciones que nos otorgas.</p>],
  ['Para qué usamos tus datos', <><p><b>Finalidad principal:</b> Atender tu solicitud y comunicarnos contigo sobre los cursos, horarios, inscripción y condiciones.</p><p><b>Finalidad adicional (opcional):</b> Enviarte información sobre otros cursos y novedades de CCN, solo si marcas esa autorización. Puedes solicitar información sin aceptar esta finalidad.</p></>],
  ['Quién accede a tus datos', <p>Solo el equipo autorizado de CCN accede a la información de las solicitudes. No vendemos ni cedemos tus datos a terceros con fines comerciales. Para operar este sitio usamos proveedores tecnológicos de alojamiento y base de datos, que pueden procesar la información en servidores ubicados fuera del Perú. Aplicamos medidas de seguridad, como el acceso restringido a la información.</p>],
  ['Cuánto tiempo los conservamos', <p>Conservamos tus datos mientras sean necesarios para atender tu solicitud y mantener la relación con CCN, o hasta que solicites su eliminación.</p>],
  ['Tus derechos', <><p>Conforme a la Ley N.º 29733, Ley de Protección de Datos Personales, y su reglamento, puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición, así como revocar las autorizaciones que nos diste.</p><p>Para hacerlo, escríbenos por <a href={wa('Hola, quiero ejercer mis derechos sobre mis datos personales. Mi nombre y documento son: ')} target="_blank" rel="noopener noreferrer">WhatsApp</a> indicando tu nombre completo y tu documento de identidad. Si consideras que no atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.</p></>],
  ['Pagos', <p>Este sitio no procesa pagos. La inscripción y la coordinación del pago se realizan por WhatsApp.</p>],
  ['Cambios en esta política', <p>Podemos actualizar esta política. La versión vigente estará siempre disponible en esta página. Última actualización: octubre de 2026.</p>],
]
export function PaginaPrivacidad() {
  return (
    <Pagina titulo="Política de privacidad">
      <section id="privacidad"><div className="wrap">
        <div className="head"><span className="eyebrow">Legal</span><h2>Política de privacidad</h2><p>En CCN – Centro de Capacitación &amp; Negocios cuidamos tus datos personales. Aquí te explicamos qué información recopilamos en ccnperuacademy.com, para qué la usamos y cómo ejercer tus derechos.</p></div>
        <div className="legal">
          {PRIVACIDAD.map(([t, c], i) => <article key={t}><h3><span>{String(i + 1).padStart(2, '0')}</span>{t}</h3>{c}</article>)}
        </div>
      </div></section>
    </Pagina>
  )
}
export function PaginaContacto() {
  const { cursos } = usarCatalogo()
  return <Pagina titulo="Escríbenos"><SeccionContacto cursos={cursos} /></Pagina>
}
