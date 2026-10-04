import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Cursos from './pages/Cursos.jsx'
import Links from './pages/Links.jsx'
import Admin from './pages/Admin.jsx'
import { ScrollToHash } from './components/Layout.jsx'

export default function App() {
  return (
    <>
    <ScrollToHash />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cursos" element={<Cursos />} />
      <Route path="/links" element={<Links />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Home />} />
    </Routes>
    </>
  )
}
