# CLAUDE.md — Briefing del programa de AVERÍAS JS-TECH (LÉEME PRIMERO)

> **IA nueva: este briefing es del PROGRAMA DE AVERÍAS (`averias_agora.html`).**
> Si vas a tocar el panel **CONTABLE** (banco, proveedores, conciliación) o el **bridge** en general,
> el briefing es `C:\agora-bridge\CLAUDE.md`. No mezcles los dos temas en el mismo chat.
> Al terminar algo importante, ACTUALIZA este fichero y avisa a Joan de commitear.

## Quién es quién
- **Joan Serra Miret** (jsm@js-tech.es) — el usuario. Empresa: **JS TECHNOLOGY MENORCA SL** (NIF B57841140), Maó (Menorca).
  Trato directo y al grano. Sin ventanas de selección (AskUserQuestion) — preguntar siempre por escrito en el chat.
- **Técnicos** — usuarios de Ágora con perfil NO-admin (p.ej. perfil "tecnico", id 5). Ven solo lo suyo.
- **Administradores** — perfil con "admin" en el nombre. Ven y hacen de todo.

## Qué es el proyecto
App web de gestión de **averías / órdenes de trabajo (OT)** de JS-TECH, servida desde GitHub Pages.
- Fichero principal: **`averias_agora.html`** (en el repo `joanserramiret/averias-jstech`, rama main).
- Habla con un **bridge Flask** (`C:\agora-bridge\bridge.py`, Python 3.8 en el PC de Joan) por **ngrok**:
  `https://uncooked-sprung-unpinned.ngrok-free.dev` → constante `BRIDGE_URL` en el HTML.
- El bridge proxya a **Ágora** (TPV/ERP de JST, vía `/api/...`) y guarda las OT en `ot_db.json` (endpoints `/ot*`).
- **Plantilla de documentos**: `plantilla_documento.html` (presupuestos/partes de OT en PDF).

> ⚠️ El mismo repo contiene también `contable.html` y `portal_facturas.html`, que son OTROS proyectos.
> En un chat de averías, NO los toques salvo que Joan lo pida explícitamente.

## Cómo trabajar (GOTCHAS)
- **El git lo hace Joan** con GitHub Desktop (no hagas git/commit desde bash). Recuérdaselo tras editar.
- **`averias_agora.html` es enorme (~760 KB)**. Edita con Read/Edit puntual, no lo reescribas entero.
  Tras cada cambio de JS valida con `node --check` (o `new Function()` sobre cada `<script>`).
- **Cuidado con la corrupción de mount** (bytes nulos / truncado al escribir desde el sandbox).
  Verifica SIEMPRE con Grep/Read del host tras escribir, y comprueba `null bytes: 0`.
- **El bridge sirve los `/ot*`**; si tocas backend de OT, Joan debe **reiniciar el bridge** (Ctrl+C + `arrancar_bridge.bat`).
- **ngrok cachea**: si pruebas un endpoint, añade `&nocache=<n>`. Para recargar el HTML: Ctrl+Shift+R.

## Sistema de ROLES (lo más importante de la app)
- Constantes en el HTML: `PERFIL_TECNICO_IDS = [5]`, `CURRENT_USER_ROLE` ('admin' | 'tecnico'), guardado en `localStorage` (`jstech_user_role`).
- **Detección del rol al login** (Ágora NO exporta ProfileId, solo el nombre del perfil):
  `esPorPerfil = PERFIL_TECNICO_IDS.includes(profileId) || (perfilNombre !== '' && perfilNombre.indexOf('admin') === -1)`.
  Es decir: si el perfil NO contiene "admin", es técnico.
- **`aplicarPermisos()`**: oculta a los técnicos la pestaña **Facturas** y el panel contable; ajusta dashboard/KPI/badge.
- Técnico: no factura (`if (CURRENT_USER_ROLE==='tecnico') return` en facturar y en la pestaña facturas).

## OT — funcionalidad por rol
- **Listado filtrado**: `renderOTs` muestra al técnico solo SUS OT + las SIN asignar. El admin las ve todas.
- **Filtro admin por técnico**: select `ot-filtro-tecnico` + `obtenerTecnicos()` (usuarios Ágora con perfil no-admin + nombres históricos de OT) + datalist `lista-tecnicos` de autocompletado. Oculto para técnicos.
- **Autoasignarse**: botón 🙋 "Asignarme" → `asignarmeOT(otId)`. Un técnico no puede quitarle una OT a otro técnico.
- **Crear OT sin técnico**: checkbox "Asignármela a mí" (`ot-tecnico-self-chk`) vía `aplicarPermisoTecnicoOT()` + `toggleAsignarmeOT()`. Los técnicos pueden crear OT sin asignar o asignárselas.
- **Bug resuelto**: al guardar una OT editada se perdía la previsualización → `guardarOT` ya no resetea el filtro cuando hay `editId`.
- **Notificaciones ntfy por técnico [2026-06-08]**: al crear una OT, el **bridge** notifica siempre al topic de admins (`jstech-averias-joan`) y, si hay técnico, además a `jstech-averias-<nombre normalizado>` (ej. Andrew → `jstech-averias-andrew`). El código vive en `C:\agora-bridge\bridge.py` (`notificar`, `_ntfy_topic_tecnico`, `ot_create`); detalle en el CLAUDE.md del bridge. El HTML no envía ntfy, solo hace `POST /ot` con el campo `tecnico`. Pendiente: no avisa al reasignar vía `PUT /ot`.

## Cambios sesión [2026-06-13] (averías) — todo en `averias_agora.html`, un commit
- **Facturación: se retiró la APPF (serie muerta) y se factura serie F como `facturacion.js-tech.es`.**
  - Las viejas acciones APPF vía `/api/import/` están MUERTAS: botones "🧾 Facturar seleccionados" y el viejo "🧾 Facturar"
    del modal QUITADOS; `facturarSeleccionados`/`facturarAlbaranManual`/`crearFacturaGrupo` = código muerto. Y `crearAlbaran`
    ya NO crea factura APPF al pagar (rama tras `if (false)`); "Crear albarán" solo crea el **albarán** (serie APP).
  - **NUEVO círculo: OT → Crear albarán → "🧾 Facturar albarán" (en el modal del albarán, SOLO admins)** → emite **serie F
    REAL** por el MISMO endpoint del facturador **`POST /facturacion/albaran_emitir`** (canal `/bus/`, crea artículos que
    falten, queda en el histórico del facturador). Replica la tarjeta de `facturacion.html` (líneas editables, forma de pago
    Recibo/Transferencia, total en vivo, confirmación "factura fiscal real"). Funciones: `abrirFacturarAlbaran`,
    `renderFacturarAlbaran`, `albfSet/albfDel/albfAddLn/albfSetPago`, `emitirFacturaAlbaran`; modal `#modal-facturar-alb`.
    Mapea el albarán (`Customer`/`Lines`/`Payments`) → `{ref,customer_id,cif,cliente,forma_pago_id,lineas}`.
  - **Albaranes y Facturas = SOLO admins de Ágora** (`aplicarPermisos` oculta a técnicos `tab-facturas` Y `tab-buscar`
    + sus accesos del dashboard). Los técnicos crean albaranes desde la OT, pero no ven las pestañas Albaranes/Facturas.
  - **MARCADO DE FACTURADOS [resuelto]**: averías cruza el histórico del facturador para saber qué albaranes APP ya tienen F.
    `cargarAlbFacturados()` lee `GET /facturacion/historico` (`{facturas:[...]}`), saca de cada `centro` "Albarán APP-N" el nº →
    `_albFacturados[nº]='F-N'`. Helper `_albEstaFacturado(a)` = en histórico O `a.Status==='Invoiced'`. En `buscarAlbaranes`,
    por defecto NO muestra facturados; el check **"Mostrar también los facturados"** los revela. En `renderAlbaranes` el
    facturado sale **en gris (opacity .6)**, badge **"✅ Facturado · F-N"**, **sin checkbox** (no seleccionable en lote) y
    **agrupado abajo** ("✅ Facturados (N)"). En `verDetalle`, `facturado=_albEstaFacturado(a)` → `isPending=false` → se ocultan
    Editar/Eliminar/Cobrar/Facturar → **no se puede modificar ni re-facturar** (cero F duplicadas). Sin tocar el bridge.
- **Campo Técnico de la OT = `<select>`** (antes input+datalist). Se rellena con `poblarSelectTecnicoOT(valor)` a partir
  de `obtenerTecnicos()` (Ágora no-admin + históricos) + opción "— Sin asignar —"; conserva el valor aunque no esté en la
  lista (no pierde nombres antiguos). Técnicos lo ven **`disabled`** (antes `readOnly`) y usan la casilla "Asignármela a mí".
- **Filtro de estado de OTs por defecto = "🟡🔵 Pendientes + en curso"** (valor `activas`). `renderOTs` es la AUTORIDAD:
  `activas`→solo pendiente+en_curso; `''` (Todos)→todas; estado concreto→ese. `loadOTs` trae todo para `activas`/`''`.
  El reset al CREAR una OT va a `activas`. (Ojo bug ya corregido: `'' || 'activas'` convertía "Todos" en activas.)
- **Albarán desde OT**: la nota de la línea "Hora servicio técnico" lleva la **descripción de la OT**
  (`crearAlbaran` lee `_otParaAlbaran.descripcion`); sirve de descripción del trabajo. Albarán suelto → sin nota.
- **Botón "＋ Nuevo albarán (sin OT)"** en la pestaña Albaranes → `nuevoAlbaranDirecto()` (pone `_otParaAlbaran=null`,
  resetea y abre el form). Activa `tc-nueva` a mano (NO existe `tab-nueva`).
- **Fix `switchTab`**: ahora tolera que no exista el botón `tab-<x>` (caso `'nueva'`) → **editar/duplicar albarán
  reparados** (antes `switchTab('nueva')` petaba y dejaba pantalla en blanco).
- **Producto nuevo** (`crearYAnadirProducto`): `UseAsDirectSale:false` → entra en Ágora SIN crear botón de venta
  directa en la pantalla de familias (sigue siendo vendible: `SaleableAsMain:true`).
- **GOTCHA mount**: editar `averias_agora.html` con la herramienta Edit deja el HOST correcto, pero si la edición
  ACORTA el fichero, la copia del mount (bash) muestra **bytes nulos al final** (tras `</html>`) — es artefacto del
  sandbox, NO del fichero real. Verificar el final con Read del host, no con el conteo de nulos de bash.

## Dashboard
- KPI principal: **`kpi-ots`** = OT pendientes + en curso (vía bridge `/ot`, filtradas por rol, clicable).
  (Antes era "Clientes sin email", que se quitó por irrelevante.)
- **Splash de espera** al login: "espere mientras se cargan los clientes" (`cargarClientes`/`cargarDashboard` envueltos en try/finally), keyframes `splashspin`.

## Portal de Facturas (`portal_facturas.html`) [2026-06-10]
- Portal de cliente: entra con ID de cliente + CIF y ve SUS facturas de Ágora (pestañas Facturas / Mayor / Modelo 347).
- **Lee de la CACHÉ del bridge, NO de Ágora en directo.** Al hacer login llama UNA vez a
  `GET /portal/facturas-cliente?id=<Customer.Id>` (en `bridge.py`: lee `agora_docs` tipo='factura', filtra por cliente).
  Devuelve TODO su histórico (todos los años) de golpe → `cargarFacturasCliente()` lo guarda en `facturasTodas`.
- **Filtros EN LOCAL**: Año / T1–T4 / Desde-Hasta / botón Buscar filtran lo ya cargado en el navegador, al instante,
  sin re-consultar Ágora (`aplicarFiltro()`). Antes pedía día a día a Ágora vía `/api/export/?business-day=` (lento).
- La caché la rellena `/agora/sync` (incremental; tablas `agora_docs`/`agora_dias` en `banco.db`). **Backfill 2013→2026
  hecho [2026-06-10]: ~22.033 docs.** Detalle del sync en el CLAUDE.md del bridge. El endpoint nuevo es solo lectura.
- **Refresco de facturas nuevas: cada 2 días** (decidido [2026-06-10]) — tarea programada que lanza el `/agora/sync`
  incremental (solo baja los días nuevos). PENDIENTE de montar la tarea.
- **PENDIENTE: quitar el "cargador de facturas"** del portal — la carga manual día a día ya no sirve (ahora todo viene
  de la caché). Confirmar con Joan qué elemento exacto se elimina antes de tocarlo.
- **Template de factura calcado a Ágora [2026-06-10]**: el portal genera cada PDF de factura con el MISMO render que
  averías/contable, vía fichero compartido **`factura_template.js`** (`generarDocHTML(doc,'factura')` + `generarPDFBlob`,
  extraídos de `averias_agora.html`). Consume el formato nativo de Ágora; usa `_tfm`/`_tfd` propios (= los de averías,
  con hora en fecha y sin separador de miles) para no depender de los `fm`/`fd` del portal, que difieren. Cableado en las
  3 descargas por-factura (botón ⬇ PDF de fila, suelta y ZIP); Mayor/347 siguen con su plantilla. `generarFacturaHTML`
  del portal queda como código muerto. **Hay que commitear `factura_template.js` (nuevo) + `portal_facturas.html`.**
  PENDIENTE/idea: de-duplicar — que averías y contable tiren también de `factura_template.js` (ahora cada uno tiene su copia).

## Domiciliación SEPA en el portal [2026-06-11]
- Tarjeta "💳 Domiciliación bancaria (SEPA)" en `portal_facturas.html` (entre Filtros y Tabs) + JS al final
  (`sepaFirmar`/`sepaPad`) + qrcodejs por CDN. Backend: módulo `sepa_mandatos.py` del bridge (ver su CLAUDE.md).
- "✍ Firmar mandato SEPA" → `/sepa/auto?cliente=<currentCustomer.Id>` (flujo completo: vista previa + FIRMAR AQUÍ).
- "📱 Usar tu móvil como tableta de firma" SOLO se ve en PC (detección `pointer:coarse` + ancho <820):
  pinta QR (`url_pad`) y hace polling a `/sepa/f/<token>/estado` hasta el "✔ ¡Mandato firmado!".
  En móvil se oculta: el cliente firma normal con el dedo (decisión de Joan 2026-06-11).
- OJO: `/sepa/auto&json=1` CREA mandato si no existe → solo se llama al PULSAR el botón, nunca al cargar.
- **PWA del panel SEPA [2026-06-11]**: carpeta `sepa/` del repo (index.html + manifest.json + sw.js + icon-*.png)
  → `https://joanserramiret.github.io/averias-jstech/sepa/`. Es el MISMO panel que sirve el bridge en `/sepa/`
  pero estático en Pages, responsive e instalable (móvil y PC). Habla con el bridge por ngrok (`const BRIDGE`,
  CORS ya abierto). El sw.js NUNCA cachea el ngrok; network-first para estáticos. Banner rojo si el bridge
  no responde. Si cambia la URL de ngrok: tocar `BRIDGE` en `sepa/index.html` Y el panel del módulo del bridge.

## Estado al 2026-06-08
- Roles técnico/admin funcionando (detección por nombre de perfil; "andrew" ya no ve facturas).
- Filtros de OT por técnico (admin) + autoasignación + crear sin asignar: hechos.
- Dashboard con KPI de averías pendientes + splash de carga: hecho.
- App reconstruida desde blob de git intacto tras una corrupción de mount (se habían perdido logos JS-TECH y el vínculo con la API de Ágora; restaurado).

## Pendiente / ideas
- (Anota aquí lo que vaya saliendo en el desarrollo de averías.)

## Notas de despliegue (recordatorio para Joan)
1. Commit + push de `averias_agora.html` con GitHub Desktop (repo `joanserramiret/averias-jstech`, rama main).
2. Si se tocó el bridge: reiniciar "Bridge Agora" (Ctrl+C + `arrancar_bridge.bat`).
3. En el navegador: Ctrl+Shift+R para saltar la caché de ngrok/GitHub Pages.
