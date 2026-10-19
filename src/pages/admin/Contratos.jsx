import { useState } from 'react'
import Icon from '../../components/Icons'
import { SUELDO_DEF } from '../../lib/ventas'
import { TIPOS_DOC, VARIABLES_DOC, renderDoc, plantillaDe, fechaLarga } from '../../lib/docs'
import { soles, nombreMes } from '../../lib/formato.js'
import { hasBackend, fechaCorta, guardarPlantilla, enviarDocumentos, firmarDocumento, borrarDocumento } from '../../lib/data.js'
import { Confirmar, Drawer, Seccion } from '../../components/ui.jsx'
import { hoyISO } from './util.js'

/* ================= CONTRATOS Y FIRMA ================= */
export function VerDoc({ doc, onClose }) {
  return (
    <Drawer titulo={doc.titulo} onClose={onClose} pie={<button className="btn btn-line" onClick={onClose}>Cerrar</button>}>
      <pre className="doc-txt">{doc.contenido}</pre>
      {doc.estado === 'firmado'
        ? <p className="firma-ok">✅ Firmado por <b>{doc.firmado_nombre}</b> el {fechaCorta(doc.firmado_en)} · {new Date(doc.firmado_en).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}<small>Huella: {doc.huella}</small></p>
        : <p className="note">Enviado, aún sin firmar.</p>}
    </Drawer>
  )
}

export function EnviarContrato({ t, data, onClose, hacer }) {
  const hoy = new Date()
  const ini0 = t.fecha_inicio && t.fecha_inicio > hoyISO() ? t.fecha_inicio : new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
  const fin0 = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10)
  const firmoConf = (data.documentos || []).some((d) => d.vendedor === t.email && d.tipo === 'confidencialidad' && d.estado === 'firmado')
  const [f, setF] = useState({ inicio: ini0, fin: fin0, contrato: true, confidencialidad: !firmoConf })
  const faltan = [!t.documento && 'DNI', !t.email && 'correo de acceso', !t.fecha_inicio && 'fecha de inicio', !(Number(t.sueldo_base) > 0) && 'sueldo'].filter(Boolean)
  const vars = { nombre: t.nombre, documento: t.documento, email: t.email, sueldo: soles(t.sueldo_base), bono: soles(t.bono_pasajes), fecha_inicio: fechaLarga(f.inicio), fecha_fin: fechaLarga(f.fin), mes: nombreMes(f.inicio.slice(0, 7)), fecha_envio: fechaLarga(hoyISO()) }
  const tipos = ['contrato', 'confidencialidad'].filter((k) => f[k])
  const enviar = () => hacer(async () => {
    if (!f.inicio || !f.fin || f.fin < f.inicio) throw new Error('Revisa las fechas: la de fin no puede ser antes que la de inicio.')
    await enviarDocumentos(tipos.map((k) => { const pl = plantillaDe(data, k); return { vendedor: t.email, tipo: k, titulo: renderDoc(pl.titulo, vars), contenido: renderDoc(pl.contenido, vars), fecha_inicio: f.inicio, fecha_fin: f.fin } }))
    onClose()
  }, 'Enviado a ' + t.nombre)
  return (
    <Drawer titulo={`Enviar contrato a ${t.nombre}`} onClose={onClose}
      pie={<><button className="btn btn-line" onClick={onClose}>Cancelar</button><button className="btn btn-teal" disabled={!tipos.length || faltan.length > 0} onClick={enviar}>Enviar</button></>}>
      <div className="fs">
        <div className="g2">
          <label>Desde<input id="ec-ini" type="date" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></label>
          <label>Hasta<input id="ec-fin" type="date" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></label>
        </div>
        <label className="chk"><input type="checkbox" checked={f.contrato} onChange={(e) => setF({ ...f, contrato: e.target.checked })} /> Contrato del periodo</label>
        <label className="chk"><input type="checkbox" checked={f.confidencialidad} onChange={(e) => setF({ ...f, confidencialidad: e.target.checked })} /> Acuerdo de confidencialidad{firmoConf ? ' (ya lo firmó)' : ''}</label>
        {faltan.length > 0
          ? <p className="alerta rojo"><b>Aún no se puede enviar.</b> Faltan en su ficha: {faltan.join(', ')}. Mientras tanto puedes leer cómo quedará el contrato.</p>
          : <p className="note ok">Datos completos. Lee la vista previa y, si todo está bien, pulsa Enviar.</p>}
        <p className="note">Los textos salen de las plantillas de <b>Gerencia → Contratos</b> (ahí puedes editarlos). Aquí solo cambias las fechas.</p>
        <h3>Vista previa</h3>
        {tipos.map((k) => <div key={k}><b>{TIPOS_DOC[k]}</b><pre className="doc-txt">{renderDoc(plantillaDe(data, k).contenido, vars)}</pre></div>)}
      </div>
    </Drawer>
  )
}

export function DocumentosDe({ data, t, hacer }) {
  const [ver, setVer] = useState(null)
  const [env, setEnv] = useState(false)
  const [borrando, setBorrando] = useState(null)
  const docs = (data.documentos || []).filter((d) => d.vendedor === t.email)
  return (
    <section className="reporte">
      <div className="sec-h"><h3>Contratos y firmas</h3><button className="btn btn-teal sm" onClick={() => setEnv(true)}>Vista previa y enviar</button></div>
      {data.documentosError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. {data.documentosError}</p>}
      {!docs.length && <p className="note">Aún no le has enviado documentos.</p>}
      <ul className="pend">
        {docs.map((d) => (
          <li key={d.id}>
            <span>{d.estado === 'firmado' ? '✅' : '⏳'}</span>
            <div><b>{d.titulo}</b><small>{d.fecha_inicio ? `${fechaCorta(d.fecha_inicio)} → ${d.fecha_fin ? fechaCorta(d.fecha_fin) : '…'} · ` : ''}{d.estado === 'firmado' ? `Firmado el ${fechaCorta(d.firmado_en)}` : 'Pendiente de firma'}</small></div>
            <span className="acc"><button className="btn btn-line sm" onClick={() => setVer(d)}>Ver</button>{d.estado === 'enviado' && <button className="ib red" onClick={() => setBorrando(d)} aria-label="Borrar"><Icon n="trash" /></button>}</span>
          </li>
        ))}
      </ul>
      {env && <EnviarContrato t={t} data={data} hacer={hacer} onClose={() => setEnv(false)} />}
      {ver && <VerDoc doc={ver} onClose={() => setVer(null)} />}
      {borrando && <Confirmar texto={`¿Borrar «${borrando.titulo}»? Aún no está firmado.`} onNo={() => setBorrando(null)} onSi={() => { const x = borrando; setBorrando(null); hacer(() => borrarDocumento(x.id), 'Borrado') }} />}
    </section>
  )
}

export function Contratos({ data, hacer }) {
  const [ed, setEd] = useState(null)
  const [ver, setVer] = useState(null)
  const docs = data.documentos || []
  const nombreDe = (email) => armarTrabajadores(data).find((t) => t.email === email)?.nombre || email
  return (
    <>
      <Seccion titulo="Contratos" ayuda="Edita los textos base. Se envían desde la ficha de cada trabajador (botón «Vista previa y enviar»)." />
      <div className="plant-grid">
        {['contrato', 'confidencialidad', 'plan'].map((k) => {
          const pl = plantillaDe(data, k)
          return (
            <article key={k} className="plant">
              <h4>{TIPOS_DOC[k]}</h4>
              <p>{pl.titulo}</p>
              <small>{k === 'plan' ? 'Lo lee cada vendedora en «Plan de trabajo»' : 'Se firma desde «Firmar»'}{(data.plantillas || []).some((x) => x.tipo === k) ? ' · editada' : ' · texto base'}</small>
              <button className="btn btn-teal sm" onClick={() => setEd({ tipo: k, titulo: pl.titulo, contenido: pl.contenido })}>Editar texto</button>
            </article>
          )
        })}
      </div>
      <p className="note">Son borradores: hazlos revisar por tu contador o abogado antes de usarlos. Variables disponibles: {VARIABLES_DOC.join('  ')}</p>
      <h3>Trabajadores</h3>
      <div className="cons-wrap"><table className="cons-table">
        <thead><tr><th>Nombre</th><th>Puesto</th><th>Sueldo</th><th>Contrato</th><th>Confidencialidad</th></tr></thead>
        <tbody>{armarTrabajadores(data).filter((t) => t.puesto === 'vendedor').map((t) => {
          const ult = (tipo) => docs.filter((d) => d.vendedor === t.email && d.tipo === tipo)[0]
          const est = (d) => !d ? <span className="est-doc sin">Sin enviar</span> : d.estado === 'firmado' ? <button className="link" onClick={() => setVer(d)}>✅ Firmó el {fechaCorta(d.firmado_en)}</button> : <button className="link" onClick={() => setVer(d)}>⏳ Enviado, sin firmar</button>
          return <tr key={t.id || t.email}><td><b>{t.nombre}</b></td><td>{t.cargo || 'Vendedora'}</td><td>{soles(t.sueldo_base)}</td><td>{est(ult('contrato'))}{ult('contrato')?.fecha_inicio && <small className="paq">{nombreMes(ult('contrato').fecha_inicio.slice(0, 7))}</small>}</td><td>{est(ult('confidencialidad'))}</td></tr>
        })}</tbody>
      </table></div>
      <p className="note">Para enviar un contrato entra a la ficha del trabajador (Gerencia → Trabajadores) y pulsa «Vista previa y enviar».</p>
      <h3>Historial de documentos enviados</h3>
      {!docs.length && <div className="vacio"><p>Aún no se envió ningún documento.</p></div>}
      {docs.length > 0 && (
        <div className="cons-wrap"><table className="cons-table">
          <thead><tr><th>Trabajador</th><th>Documento</th><th>Periodo</th><th>Estado</th><th /></tr></thead>
          <tbody>{docs.map((d) => (
            <tr key={d.id}><td>{nombreDe(d.vendedor)}</td><td>{TIPOS_DOC[d.tipo]}</td><td>{d.fecha_inicio ? `${fechaCorta(d.fecha_inicio)} → ${d.fecha_fin ? fechaCorta(d.fecha_fin) : '…'}` : '—'}</td>
              <td>{d.estado === 'firmado' ? `✅ Firmado ${fechaCorta(d.firmado_en)}` : '⏳ Sin firmar'}</td>
              <td className="acc"><button className="btn btn-line sm" onClick={() => setVer(d)}>Ver</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
      {ed && (
        <Drawer titulo={`Editar: ${TIPOS_DOC[ed.tipo]}`} onClose={() => setEd(null)}
          pie={<><button className="btn btn-line" onClick={() => setEd(null)}>Cancelar</button><button className="btn btn-teal" onClick={() => hacer(async () => { await guardarPlantilla(ed.tipo, ed); setEd(null) }, 'Plantilla guardada')}>Guardar</button></>}>
          <div className="fs">
            <label>Título<input id="pl-tit" value={ed.titulo} onChange={(e) => setEd({ ...ed, titulo: e.target.value })} /></label>
            <label>Texto<textarea id="pl-txt" rows={22} className="doc-edit" value={ed.contenido} onChange={(e) => setEd({ ...ed, contenido: e.target.value })} /></label>
            <p className="note">Variables: {VARIABLES_DOC.join('  ')}. Lo que edites aplica a los documentos que envíes desde ahora; los ya enviados no cambian.</p>
          </div>
        </Drawer>
      )}
      {ver && <VerDoc doc={ver} onClose={() => setVer(null)} />}
    </>
  )
}

/* Vendedora: firmar documentos */
export function Firmar({ data, email, hacer }) {
  const mios = (data.documentos || []).filter((d) => d.vendedor === email)
  const pend = mios.filter((d) => d.estado === 'enviado')
  const firmados = mios.filter((d) => d.estado === 'firmado')
  const [ver, setVer] = useState(null)
  return (
    <>
      <Seccion titulo="Firmar" ayuda="Aquí te llegan tu contrato y tu acuerdo de confidencialidad. Léelos completos y fírmalos." />
      {data.documentosError && hasBackend && <p className="banner">Falta pegar <b>crm.sql</b> en Supabase. {data.documentosError}</p>}
      {!pend.length && <div className="vacio"><p>No tienes documentos por firmar 🎉</p></div>}
      {pend.map((d) => <FirmaCard key={d.id} d={d} hacer={hacer} />)}
      {firmados.length > 0 && <>
        <h3>Ya firmados</h3>
        <ul className="pend">{firmados.map((d) => (
          <li key={d.id}><span>✅</span><div><b>{d.titulo}</b><small>Firmado el {fechaCorta(d.firmado_en)}</small></div><span className="acc"><button className="btn btn-line sm" onClick={() => setVer(d)}>Ver</button></span></li>
        ))}</ul>
      </>}
      {ver && <VerDoc doc={ver} onClose={() => setVer(null)} />}
    </>
  )
}

export function FirmaCard({ d, hacer }) {
  const [ok, setOk] = useState(false)
  const [nombre, setNombre] = useState('')
  return (
    <article className="firma-card">
      <h3>{d.titulo}</h3>
      {d.fecha_inicio && <small>Periodo: {fechaCorta(d.fecha_inicio)} → {d.fecha_fin ? fechaCorta(d.fecha_fin) : '…'}</small>}
      <pre className="doc-txt">{d.contenido}</pre>
      <label className="chk"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> He leído el documento completo y acepto sus términos.</label>
      <label>Escribe tu nombre completo para firmar<input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombres y apellidos" /></label>
      <button className="btn btn-teal" disabled={!ok || nombre.trim().length < 5} onClick={() => hacer(() => firmarDocumento(d.id, nombre), 'Documento firmado ✅')}>Firmar</button>
      <small>Quedan registrados tu nombre, la fecha y hora, y una huella digital del texto.</small>
    </article>
  )
}

/* Vendedora: plan de trabajo y funciones */
export function PlanTrabajo({ data, email }) {
  const t = armarTrabajadores(data).find((x) => x.email === email) || { nombre: email }
  const pl = plantillaDe(data, 'plan')
  const vars = { nombre: t.nombre, documento: t.documento, email, sueldo: soles(t.sueldo_base), bono: soles(t.bono_pasajes), fecha_inicio: t.fecha_inicio ? fechaLarga(t.fecha_inicio) : '', mes: '', fecha_envio: '' }
  return (
    <>
      <Seccion titulo="Plan de trabajo" ayuda="Tus funciones y reglas. Léelo cada vez que tengas dudas." />
      <pre className="doc-txt plan">{renderDoc(pl.contenido, vars)}</pre>
    </>
  )
}

/* ================= GERENCIA: TRABAJADORES ================= */
export function armarTrabajadores(data) {
  const filas = [...(data.trabajadores || [])]
  const conCorreo = new Set(filas.map((t) => t.email).filter(Boolean))
  ;(data.equipo || []).filter((e) => e.rol === 'vendedora' && !conCorreo.has(e.email)).forEach((e) =>
    filas.push({ id: null, nombre: e.email.split('@')[0], puesto: 'vendedor', cargo: 'Vendedora', email: e.email, sueldo_base: SUELDO_DEF, comision_tramos: null, activo: true, notas: '', virtual: true }))
  return filas
}
