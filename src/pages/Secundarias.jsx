import { useEffect, useState } from 'react'
import { loadCatalog } from '../lib/data.js'
import { Header, Footer } from '../components/Layout.jsx'
import { SeccionComo, SeccionHorarios, SeccionPreguntas, SeccionContacto } from '../components/Secciones.jsx'

function usarCatalogo() {
  const [data, setData] = useState({ cursos: [], grupos: [] })
  useEffect(() => { loadCatalog().then(setData).catch(() => {}) }, [])
  return data
}

function Pagina({ titulo, children }) {
  useEffect(() => { document.title = `CCN · ${titulo}` }, [titulo])
  return (
    <>
      <Header />
      <main className="subpage">{children}</main>
      <Footer />
    </>
  )
}

export function PaginaComo() {
  return <Pagina titulo="Cómo aprendes"><SeccionComo /></Pagina>
}
export function PaginaHorarios() {
  const { cursos, grupos } = usarCatalogo()
  return <Pagina titulo="Horarios"><SeccionHorarios cursos={cursos} grupos={grupos} /></Pagina>
}
export function PaginaPreguntas() {
  return <Pagina titulo="Preguntas"><SeccionPreguntas /></Pagina>
}
export function PaginaContacto() {
  const { cursos } = usarCatalogo()
  return <Pagina titulo="Escríbenos"><SeccionContacto cursos={cursos} /></Pagina>
}
