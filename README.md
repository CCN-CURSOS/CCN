# CCN · Centro de Capacitaciones y Negocios

Web pública + panel interno de CCN (FIDTAIL PERU S.A.C.). React 18 + Vite 5 + react-router + Supabase, publicada en Vercel (ccnperuacademy.com).

## Probarlo en local
```
npm install
npm run dev
```
Sin las variables de Supabase funciona en **modo demostración** (lo que cambies se guarda solo en tu navegador). Para conectarlo de verdad copia `.env.example` como `.env` y llena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings > API). Nunca pongas la clave `service_role` en el proyecto.

## Subir cambios
1. Si hay un archivo `.sql` nuevo, primero pégalo (su contenido) en Supabase > SQL Editor.
2. `git add .` → `git commit -m "mensaje"` → `git push`. Vercel despliega solo.

## Estructura
- `src/pages/` páginas públicas (Home, Cursos, CursoDetalle, Carrito, Inscripcion, Links, Verificar, Secundarias) y los paneles: `Admin.jsx` (solo el acceso/login), `admin/` (una pieza por módulo: Web, Prospectos, Agenda, Contratos, Inscritos, Quejas, Instalaciones, Gerencia, Personal y el `Panel` que las une), `Academico`, `Certificados`, `Profesor` y `AvanceVendedor`.
- `src/components/ui.jsx`: piezas compartidas (Drawer, Seccion, Switch, Confirmar, Imagen). `src/lib/formato.js`: funciones de formato y redondeo compartidas (soles, r2, suma…).
- `src/lib/` lógica: `data.js` (datos y Supabase), `ventas.js` (comisiones y métricas), `moneda.js` y `monedaWeb.js` (soles/dólares), `igv.js`, `pago.js`, `manual.js` (Manual de ventas), `docs.js` (Plan de trabajo y contratos), `terminos.js` (Términos y condiciones: una sola fuente), `cronograma.js`, `certificados.js`.
- `supabase/` SQL y Edge Functions (`enviar-bienvenida`, `enviar-certificado`). Ver `supabase/LEEME.md` para el orden y el estado de cada archivo.
- `public/` logo, favicon, plantilla y fuentes de certificados, logos de herramientas.

## Reglas que el código respeta
- Precios finales con IGV incluido; la web pública muestra solo soles y nunca menciona IGV.
- Dólares solo en el panel y el Manual de ventas (PayPal; enlace creado por la vendedora o gerencia).
- Inscripciones solo por WhatsApp (+51 944 485 759, se cambia en Web > Ajustes).
- Cada curso: mínimo 5 y máximo 20 inscritos; un solo trabajo final por curso (uno por programa en el Club).
- Los pagos a instructores y vendedoras son internos: nunca van en la web.
