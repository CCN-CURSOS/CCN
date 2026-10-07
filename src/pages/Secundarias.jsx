import { useEffect, useState } from 'react'
import { loadCatalog } from '../lib/data.js'
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
  return <Pagina titulo="Cómo aprendes"><SeccionModalidades /><SeccionComo /><SeccionRuta /><SeccionCta /></Pagina>
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
  'Cada curso abre con un mínimo de diez (10) participantes por horario. Si no se llega a completar, CCN podrá postergar el inicio del mismo por 1 o 2 semanas como máximo.',
  'El material producido por el alumno para la obtención de todo tipo de constancia o certificado podrá ser usado por CCN con fines publicitarios, acreditando la autoría del material al alumno correspondiente.',
  'No se realizan devoluciones.',
]
export function PaginaTerminos() {
  return (
    <Pagina titulo="Términos y condiciones">
      <section id="terminos"><div className="wrap">
        <div className="head"><span className="eyebrow">Legal</span><h2>Términos y condiciones</h2><p>Al inscribirte en un curso de CCN aceptas las siguientes condiciones.</p></div>
        <ol className="tc">
          {TERMINOS.map((t, i) => <li key={i}><span className="tc-n">{String(i + 1).padStart(2, '0')}</span><p>{t}</p></li>)}
        </ol>
      </div></section>
    </Pagina>
  )
}
export function PaginaContacto() {
  const { cursos } = usarCatalogo()
  return <Pagina titulo="Escríbenos"><SeccionContacto cursos={cursos} /></Pagina>
}
