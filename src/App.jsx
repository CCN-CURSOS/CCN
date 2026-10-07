import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Cursos from './pages/Cursos.jsx'
import CursoDetalle from './pages/CursoDetalle.jsx'
import Links from './pages/Links.jsx'
import Admin from './pages/Admin.jsx'
import { PaginaComo, PaginaHorarios, PaginaPreguntas, PaginaContacto, PaginaTerminos, PaginaPrivacidad } from './pages/Secundarias.jsx'
import { ScrollToHash } from './components/Layout.jsx'

export default function App() {
  return (
    <>
    <ScrollToHash />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cursos" element={<Cursos />} />
      <Route path="/cursos/:id" element={<CursoDetalle />} />
      <Route path="/como-aprendes" element={<PaginaComo />} />
      <Route path="/horarios" element={<PaginaHorarios />} />
      <Route path="/preguntas" element={<PaginaPreguntas />} />
      <Route path="/contacto" element={<PaginaContacto />} />
      <Route path="/terminos" element={<PaginaTerminos />} />
      <Route path="/privacidad" element={<PaginaPrivacidad />} />
      <Route path="/links" element={<Links />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Home />} />
    </Routes>
    </>
  )
}
