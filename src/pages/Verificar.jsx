import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Header, Footer } from '../components/Layout.jsx'
import { verificarDocumento } from '../lib/data.js'
import { TIPOS_CERT, fechaLargaISO } from '../lib/certificados.js'

/* Página pública: confirma que un certificado o constancia es auténtico.
   Hay que acertar el documento del alumno (DNI/CE o su código) Y el número del documento (el del QR). */
export default function Verificar() {
  const [q] = useSearchParams()
  const [doc, setDoc] = useState('')
  const [codigo, setCodigo] = useState((q.get('c') || '').toUpperCase())
  const [estado, setEstado] = useState('')      // '' | 'buscando' | 'ok' | 'nada' | 'error'
  const [r, setR] = useState(null)
  useEffect(() => { document.title = 'CCN · Verificar certificado' }, [])

  async function enviar(e) {
    e.preventDefault()
    if (doc.trim().length < 5 || codigo.trim().length < 6) { setEstado('nada'); setR(null); return }
    setEstado('buscando'); setR(null)
    try {
      const x = await verificarDocumento(doc, codigo)
      setR(x); setEstado(x ? 'ok' : 'nada')
    } catch (er) { setEstado('error') }
  }

  const anulado = r && r.estado === 'anulado'
  return (
    <>
      <Header />
      <main className="subpage"><section><div className="wrap">
        <div className="head"><span className="eyebrow">Verificación</span><h2>Verifica un certificado o constancia</h2>
          <p>Ingresa el DNI o C.E. del alumno (o su código de alumno) y el número que figura debajo del código QR del documento.</p></div>
        <form className="cform verif" onSubmit={enviar} noValidate>
          <label>DNI, C.E. o código de alumno
            <input value={doc} onChange={(e) => setDoc(e.target.value)} autoComplete="off" placeholder="Ej. 12345678" />
          </label>
          <label>Número del documento
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} autoComplete="off" placeholder="Ej. CER-26-K7M2QX" />
          </label>
          <button className="cfull cbtn" type="submit" disabled={estado === 'buscando'}>{estado === 'buscando' ? 'VERIFICANDO…' : 'VERIFICAR'}</button>
        </form>

        {estado === 'ok' && r && (
          <div className={`verif-res ${anulado ? 'mal' : 'bien'}`} role="status">
            <h3>{anulado ? '⚠️ Este documento fue anulado' : '✅ Documento auténtico'}</h3>
            <dl>
              <div><dt>Documento</dt><dd>{TIPOS_CERT[r.tipo] || r.tipo}</dd></div>
              <div><dt>Otorgado a</dt><dd>{r.alumno_nombre}</dd></div>
              <div><dt>Curso</dt><dd>{r.curso_titulo}{r.horas ? ` · ${r.horas} h` : ''}</dd></div>
              {r.fecha_inicio && r.fecha_fin && <div><dt>Periodo</dt><dd>{fechaLargaISO(r.fecha_inicio)} al {fechaLargaISO(r.fecha_fin)}</dd></div>}
              <div><dt>Emitido el</dt><dd>{fechaLargaISO(r.fecha_emision)}</dd></div>
            </dl>
            {anulado && <p>Si crees que es un error, escríbenos por WhatsApp o al correo de la escuela.</p>}
          </div>
        )}
        {estado === 'nada' && <div className="verif-res mal" role="status"><h3>❌ No encontramos ese documento</h3><p>Revisa que el documento del alumno y el número estén bien escritos. Si el problema continúa, escríbenos por WhatsApp.</p></div>}
        {estado === 'error' && <div className="verif-res mal" role="alert"><h3>No pudimos verificar ahora</h3><p>Inténtalo de nuevo en unos minutos.</p></div>}
      </div></section></main>
      <Footer />
    </>
  )
}
