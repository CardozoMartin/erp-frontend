# PROGRESO DEL PROYECTO — ERP Gestión Contable de Ventas

> Última actualización: **2026-08-13**
> Stack: NestJS 11 + TypeORM + MySQL 8 | React 19 + Vite 8 + Tailwind 4 + TanStack Query + Zustand

---

## 📌 SESIÓN 2026-08-13 — resultados

**Probado en la UI y funcionando: P1, P2, P3, P4, P5.** Falta **P6** (nota de crédito con CAE) y P7–P14.

### Bugs encontrados y resueltos

| # | Problema | Causa |
|---|---|---|
| 1 | El ticket térmico **nunca imprimía el QR fiscal** | La plantilla solo tenía CAE y vencimiento. Una Factura C sin QR no es válida para entregar |
| 2 | **A15** — `buildArcaQrUrl` eliminado del front | Recalculaba el payload con el `cuit_ticket` viejo y podía ocultar un QR correcto |
| 3 | Tres pantallas imprimían comprobantes fiscales **sin pedir el QR** | `VentaDetallePage`, `NotasCreditoPage` (además sin config) y `VentasPosPage` |
| 4 | Los datos de cliente del A4 salían **vacíos** | El backend no los enviaba. Se agregó relación `cliente` + `@AfterLoad` y `total_letras` (nuevo util `numero-a-letras.ts`) |
| 5 | **"Guardo A4 y sigue saliendo ticket"** | El **seed reescribía la config en cada arranque**. Ahora corre solo con `npm run seed` |
| 6 | Los **precios editados se revertían** al reiniciar | Mismo motivo: el seed los pisaba. Resuelto |
| 7 | Email: **500 opaco** al enviar y al probar | `MASTER_ENCRYPT_KEY` cambió y la password quedó indescifrable. Ahora da un 400 accionable |
| 8 | Fecha de inicio de actividades **un día antes** en el PDF | `new Date('YYYY-MM-DD')` en UTC-3. Cuarto bug de zona horaria del módulo |
| 9 | Una nota de crédito sobre una venta ya facturada salía **sin CAE** | Ahora se emite contra la factura y el modal avisa qué va a pasar |
| 10 | Emitir una NC desde el detalle de venta **no dejaba obtenerla** | Ahora se imprime sola y hay botón de reimpresión en la ficha |

Además: los comprobantes **no fiscales** (venta, ticket, cotización, remito) ya no muestran "Pendiente ARCA" ni el recuadro de QR — decían que faltaba algo que nunca iban a tener.

> ⚠️ **El seed ya no corre al arrancar.** Si hace falta regenerar datos: `npm run seed`. Respeta lo existente; para recrear una config hay que borrar la fila primero.

Errores de tipos del frontend: **66 → 21**.

---

## ⏭️ PRÓXIMA SESIÓN — PLAN DE PRUEBAS (empezar acá)

**Contexto:** el 2026-08-12 se cerró todo el circuito fiscal de ARCA (A3, A5, A9, A11–A14, A16–A19). Todo se verificó **por scripts**, que ejercitan la lógica pero **no la interfaz ni el flujo real de uso**. Lo que falta es probarlo como lo usaría un cajero.

> ⚠️ **Si algo falla, lo más probable es que sea en la UI o en el flujo**, no en la lógica fiscal: esa ya está validada contra AFIP homologación.

### Antes de arrancar

```bash
# 1. Backend
cd erp-backend && npm run start:dev

# 2. Frontend (otra terminal)
cd erp-frontend && npm run dev

# 3. Confirmar que ARCA sigue activo y la numeración está alineada
cd erp-backend
node -r ts-node/register -r tsconfig-paths/register src/scripts/reconciliar-numeracion.ts
```

Lo esperado del paso 3: `AFIP autorizo hasta = Max local`, **sin colisiones**. Si aparece una colisión, revisar antes de emitir nada nuevo.

### Estado actual de datos (2026-08-12)

| Dato | Valor |
|---|---|
| Facturas C emitidas | 8 (6 con CAE, 2 anuladas) |
| Notas de crédito | 5 (1 con CAE, 2 anuladas, 2 internas sin CAE) |
| Ventas cobradas sin facturar | **5** — material para probar |
| Último nº AFIP (Factura C) | 8 |
| Productos cargados | 10, todos al 21% |

---

### 🔴 Prioridad 1 — El flujo que todavía no se probó nunca en la UI

| # | Qué probar | Qué mirar | Por qué importa |
|---|---|---|---|
| ~~**P1**~~ | ~~Cobrar una venta en el POS con impresión automática~~ | ✅ **OK** (13/08) | |
| ~~**P2**~~ | ~~Facturar esa venta~~ | ✅ **OK** — `C0001-000011` con CAE | |
| ~~**P3**~~ | ~~Imprimir la factura~~ | ✅ **OK** — QR visible tras el fix | |
| ~~**P4**~~ | ~~Escanear el QR con el celular~~ | ✅ **OK** — AFIP responde "no encontrado" porque el visor lee **producción** y el comprobante es de homologación. El QR está bien formado | |
| ~~**P5**~~ | ~~Mandar la factura por email~~ | ✅ **OK** — PDF con QR, CAE, razón social e IIBB | |
| **P6** | **Nota de crédito sobre esa factura** | Que traiga **CAE propio** y código `013` | ⏳ **PENDIENTE.** Emitir desde el detalle de una venta ya facturada, o desde `/notas-credito` eligiendo un `C0001-…`. Las NC emitidas hasta ahora salieron sobre ventas internas (`VTA-…`) y por eso no tenían CAE |

### 🟠 Prioridad 2 — Lo que se tocó y conviene confirmar

| # | Qué probar | Qué mirar |
|---|---|---|
| **P7** | **Editar un producto** y guardar sin tocar la alícuota | Que **siga en su valor** y no se resetee a 21% |
| **P8** | **Marcar un producto a 10,5%** (ej. un alimento) | Que persista al recargar la página |
| **P9** | **Alta de producto nuevo** | Que el selector de IVA aparezca y guarde bien |
| **P10** | **Importar productos por Excel** | Bajar la plantilla → que tenga la columna `alicuota_iva` y la hoja Instrucciones |
| **P11** | **Nota de crédito sobre una VENTA interna** (no factura) | Que **NO** pida CAE y quede con `codigo_fiscal` vacío |

### 🟡 Prioridad 3 — Casos borde (si sobra tiempo)

- **P12** — Cobrar **dos ventas casi simultáneas** desde dos pestañas y facturarlas juntas → no deben colisionar en numeración (A9)
- **P13** — Facturar **sin internet** (cortar wifi) → debe emitir **sin CAE** y dejar el motivo en `observaciones`, no romper
- **P14** — Reimprimir una factura vieja → el QR debe seguir saliendo

---

### Cómo ver qué pasó si algo falla

```bash
# Motivo textual del fallo de ARCA (queda en observaciones)
mysql -u root -p sistema_erp -e "SELECT numero, cae, LEFT(observaciones,200) FROM comprobantes ORDER BY created_at DESC LIMIT 5;"
```

Los scripts de `src/scripts/` (ver §4) permiten reprobar cada pieza **sin login**, para aislar si el problema es de la UI o del backend.

### ⚠️ Cosas para tener presente

- **`ARCA_ENCRYPT_KEY`** — si se pierde, las credenciales guardadas quedan **indescifrables** y hay que volver a cargar el `.crt` y el `.key`
- **Homologación consume numeración real** — cada prueba gasta un número de AFIP. Es normal y no afecta producción, pero explica los huecos
- **AFIP se cae seguido** — un `ETIMEDOUT` no es un bug del sistema; pasó durante las pruebas del 12/08. Reintentar
- **La condición fiscal sigue SIN DEFINIR** — hoy el certificado es de monotributo (Factura C, que no discrimina IVA). Todo el desglose de IVA por alícuota recién se usa si pasás a **Responsable Inscripto**
- **`cuit_ticket` en BD sigue siendo el de prueba** (`20-12345678-3`) pero **se imprime el del certificado**. Es a propósito (A14): ARCA manda. Conviene igual corregir el dato en configuración de sucursal

### Lo que queda pendiente después de probar

1. ~~**A15**~~ — ✅ resuelto el 13/08: `buildArcaQrUrl` eliminado del front
2. **21 errores de tipos preexistentes en el frontend** (eran 66) — quedan en Cajas, Empleados y PedidosEnvio. Los de `printComprobante.ts` se resolvieron al agregar los datos de cliente
3. **Remitos sin probar** — la plantilla A4 tiene bloque propio con firmas y columnas solicitado/entregado/pendiente
4. **Credenciales de backup probablemente rotas** — mismo motivo que el email (`MASTER_ENCRYPT_KEY` cambió). Hay que recargarlas desde la UI
5. **12 llamadas a `.descifrar()` sin manejo de error** (MercadoPago 6, backup 3, ARCA 3) → darían 500 opaco si rota su clave
6. **Seguridad** (§3.2) y **Dockerización** (§3.3) — sin tocar

### Para mostrar el A4 completo

Hay que **seleccionar un cliente en el POS antes de cobrar**; si no, el comprobante sale a consumidor final y el bloque de datos del receptor queda vacío. El cliente "Shaddai S.A." tiene CUIT y domicilio cargados.

---

## 0. Respuesta rápida: ¿conviene usar `@ramiidv/arca-sdk` o `@afipsdk/afip.js`?

**No. No instales ninguno de los dos.** El proyecto ya tiene la integración ARCA implementada de forma nativa y funcional en el backend.

### Qué ya existe (y funciona) en `erp-backend/src/arca/`

| Archivo | Líneas | Qué hace |
|---|---|---|
| `arca-wsaa.service.ts` | 205 | Login WSAA: genera TRA, lo firma en PKCS#7 con `node-forge`, llama a AFIP, parsea y **cachea el Ticket de Acceso cifrado en BD** con margen de 5 min |
| `arca-wsfev1.service.ts` | 243 | `FECAESolicitar` (pide CAE) y `FECompUltimoAutorizado` (último número), SOAP crudo + `xml2js` |
| `arca.service.ts` | 193 | Alta/edición de credenciales cifradas, test de conexión, switch testing↔producción, orquestación del CAE |
| `arca.controller.ts` | 54 | 5 endpoints REST |
| `entities/arca-config.entity.ts` | 62 | Config por sucursal: CUIT, punto de venta, cert y clave **cifrados AES-256-GCM**, TA cacheado, estado, último error |

Y está **integrado al flujo de negocio**: `facturacion.service.ts` llama a `arcaService.solicitarCAEParaVenta()` al emitir, y si ARCA no está activo o falla, el comprobante se emite igual sin CAE (modo manual). Eso es una decisión de diseño correcta.

### Comparativa

| Criterio | Implementación actual | `@afipsdk/afip.js` | `@ramiidv/arca-sdk` |
|---|---|---|---|
| Multi-sucursal / multi-CUIT | ✅ Sí, por `sucursal_id` en BD | ⚠️ Pensado para un CUIT; hay que instanciar por tenant | ⚠️ Idem |
| Certificados en BD cifrados | ✅ AES-256-GCM | ❌ Espera archivos en disco o strings | ⚠️ Depende de versión |
| Dependencia de servidor externo | ✅ Ninguna, va directo a AFIP | ⚠️ **El modo por defecto proxea por los servidores de AFIP SDK** (dato fiscal saliendo hacia un tercero). Hay modo local, pero es el no-default | ✅ Directo |
| Madurez / comunidad | — | ✅ Alta, es el estándar de facto | ⚠️ Baja, paquete nuevo y poco adoptado |
| Cobertura de servicios | ⚠️ Solo wsfe (CAE + último nro) | ✅ wsfe, padrón A4/A5/A13, wsmtxca | ⚠️ Parcial |
| Control del código | ✅ Total | ❌ Caja negra | ❌ Caja negra |

### Veredicto

Migrar a un SDK significaría **tirar ~700 líneas ya escritas, probadas en estructura y adaptadas a tu modelo multi-sucursal**, para ganar features que hoy no usás. El punto de `@afipsdk/afip.js` que sí me preocuparía es el proxy por defecto: tus certificados y comprobantes fiscales pasarían por infraestructura de terceros salvo que configures el modo local explícitamente.

**Recomendación:** mantener la implementación propia y completar lo que le falta (ver §3). Si en algún momento necesitás **consulta de padrón AFIP** (traer razón social / condición IVA a partir del CUIT del cliente), ahí sí evaluá agregar `@afipsdk/afip.js` **solo para ese servicio puntual**, sin tocar el flujo de CAE.

---

## 1. Dónde estamos parados

### Estado global: **~90% funcional, en etapa de pruebas y pulido**

El sistema tiene arquitectura sólida, flujos de negocio completos, auditoría, permisos granulares por rol y multi-sucursal.

### Backend — 38 módulos

```
auth · permisos · roles · empleados · sucursal · auditoria
clientes · producto · producto-categoria · producto_precios · marca_productos
variante · atributo-producto · atributo-variante · lista-precio · lote · oferta
stock · stock-movimientos · imagen · cloudinary
pos-ventas · pagos-pos · pagos-module · caja · comprobantes · facturacion
notas-credito · cotizaciones · despachos · pedidos-envio · reportes-pos
arca · mercadopago · email · pdf · excel · backup · configuracion
```

### Frontend — 13 módulos

```
Auth · Dashboard · Productos · Clientes · Ventas · PuntoDeVenta
POSAuxiliares · Cajas · Empleados · Sucursal · Configuracion · Catastro · PedidosEnvio
```

---

## 2. Lo que ya está terminado ✅

### Fase 1 — Seguridad base
- `synchronize: false` en producción
- `@nestjs/config` + validación de env con Joi
- `@nestjs/throttler` (rate limiting) y `helmet()`
- `shared/cifrado.service.ts` — AES-256-GCM unificado

### Fase 2 — Alto valor
- `PdfService` con PDFKit — comprobantes en PDF
- Nodemailer + plantillas HTML; flujo **cobrar → PDF → email**
- ExcelJS: exportación de 6 tipos de reportes
- Alertas de stock mínimo con badge en Navbar

### Fase 3 — Refactor de god-files
- `comprobantes.service.ts` → 4 servicios
- `pos-ventas.service.ts` → Query + Command
- `reportes-pos.service.ts` → 4 servicios por dominio
- `ClientesPage.tsx` → 3 secciones

### Fase 4 — Avanzado
- **Dashboard** con Recharts (métricas del día, área, donut, top 5)
- **Swagger** en `GET /api/docs`
- **Importación masiva de productos** vía Excel con drag & drop
- **Refresh tokens**: access 15m + refresh 30d en `sesiones_activas`, rotación e interceptor Axios transparente

### ARCA — backend
- WSAA con firma PKCS#7 y TA cacheado cifrado
- WSFEv1: solicitud de CAE y consulta de último autorizado
- Credenciales cifradas por sucursal, testing/producción conmutable
- Test de conexión contra AFIP
- Enganchado al flujo de emisión con fallback a modo manual
- Guía de setup completa en `cosas viejas/ARCA-SETUP.md`

---

## 3. Lo que falta / quedó pendiente ⚠️

### 3.1 ARCA — brechas (ordenadas por prioridad)

| # | Brecha | Dónde | Impacto |
|---|---|---|---|
| ~~A1~~ | ~~No hay UI de configuración ARCA~~ | — | ✅ **RESUELTO 2026-08-05** — ruta `/configuracion-arca` con carga de `.crt`/`.key`, selector de ambiente y botón de probar conexión |
| ~~A2~~ | ~~`ArcaController` sin guard~~ | — | ✅ **RESUELTO 2026-08-05** — `JwtAuthGuard + PermisosGuard` con `admin.servicios` |
| ~~A11~~ | ~~El CAE no llega al comprobante~~ | — | ✅ **RESUELTO 2026-08-12** — verificado end-to-end: `C0001-000003` con CAE `86320752808662`. Ver §3.1.b |
| ~~A12~~ | ~~CAE vencimiento un día antes~~ | — | ✅ **RESUELTO 2026-08-12** — se arma con constructor local en vez de `T00:00:00Z`. Verificado: `C0001-000004` guardó `2026-08-22` (AFIP dijo `20260822`) |
| ~~A13~~ | ~~El CUIT impreso no es el del certificado~~ | — | ✅ **RESUELTO 2026-08-12** — ver A14 |
| ~~A14~~ | ~~Datos fiscales duplicados / desincronizados~~ | — | ✅ **RESUELTO 2026-08-12** — `ConfiguracionService.conDatosFiscalesDeArca()` deriva `cuit_ticket` y `punto_venta_arca` de `arca_config` cuando ARCA está activo. Se aplica en `findBySucursal` y `crearPorDefecto`, que son el paso único de impresión/PDF/email. **Es solo lectura**: no pisa lo guardado, y loguea un warning cuando detecta divergencia. Verificado con `verificar-cuit-fiscal.ts` |
| **A15** | **QR AFIP con receptor hardcodeado** | `printComprobante.ts:150-151` | 🟠 `tipoDocRec: 99` y `nroDocRec: 0` fijos. En factura A/B con cliente identificado el QR queda inconsistente con el comprobante |
| ~~A16~~ | ~~QR depende de un servicio externo~~ | — | ✅ **RESUELTO 2026-08-12** — QR generado local con `qrcode`. Nuevo `GET /comprobantes/:id/qr` (PNG) y `QrAfipService`. `api.qrserver.com` eliminado del código |
| ~~A17~~ | ~~El PDF no imprime QR ni datos fiscales~~ | — | ✅ **RESUELTO 2026-08-12** — el PDF ahora embebe el QR y agrega razón social, IIBB e inicio de actividades. Además pasó a leer la config vía `ConfiguracionService`, así que hereda el CUIT correcto de A13/A14 (antes iba directo al repo y habría impreso el CUIT viejo) |
| ~~A3~~ | ~~IVA hardcodeado al 21%~~ | — | ✅ **RESUELTO 2026-08-12** — `productos.alicuota_iva` (decimal, default 21) + `arca-iva.helper.ts` que agrupa por alícuota y arma un `<AlicIva>` por cada una. Exentos van por `ImpOpEx`. Verificado: venta mixta 21%+10,5% da `ImpNeto 2000 / ImpIVA 315` con Ids 5 y 4 |
| ~~A4~~ | ~~`.catch(() => null)` traga el error de AFIP~~ | — | ✅ **RESUELTO 2026-08-05** — try/catch que loguea y deja el motivo en `observaciones` del comprobante |
| ~~A5~~ | ~~Notas de crédito no piden CAE~~ | — | ✅ **RESUELTO 2026-08-12** — `solicitarCAEParaNotaCredito()` con `CbtesAsoc` y código según la letra del origen (A→3, B→8, C→13). Verificado: `NCA-D-000001` con CAE `86320752841701`. Las NC sobre ventas/tickets internos **no** piden CAE (correcto: no son fiscales) |
| **A19** | ~~Nodo `<Iva>` en comprobantes clase C~~ | — | ✅ **RESUELTO 2026-08-12** — hallazgo al probar A5: `esFacturaC` solo miraba el código 11, así que la **NC C (13) enviaba `<Iva>`** y AFIP la rechazaba con `10071`. Generalizado a `esClaseC` (11, 12, 13) |
| A6 | **Sin reintento ante fallo de AFIP** | — | 🟡 AFIP se cae seguido. Falta cola/reintento para comprobantes que quedaron sin CAE |
| A7 | **CAE y vencimiento no salen en el PDF** | `pdf/` | 🟡 Legalmente la factura impresa debe mostrar CAE, vencimiento y código QR AFIP |
| A8 | **Código QR AFIP ausente** | — | 🟡 Obligatorio en comprobantes electrónicos (RG 4892) |
| ~~A9~~ | ~~Race condition en numeración~~ | — | ✅ **RESUELTO 2026-08-12** — cola por sucursal en `ArcaService` + reintento ante error 10016. Verificado emitiendo 2 facturas **en paralelo**: números y CAEs distintos. Numeración reconciliada (AFIP 7 = local 7, sin colisiones) |
| **A18** | **El número impreso podía no ser el autorizado** | `facturacion.service.ts` / `comprobante-numerador.service.ts` | ✅ **RESUELTO 2026-08-12** — hallazgo al trabajar A9: `numeroCbte` se parseaba de AFIP pero **nunca se usaba**; el comprobante se guardaba con el contador local. Coincidían por casualidad. Ahora `numero_afip` viaja en el DTO y el numerador se alinea al número autorizado |
| A10 | **Sin consulta de padrón AFIP** | — | 🟢 Nice-to-have: autocompletar razón social y condición IVA desde el CUIT |

### 3.1.b ✅ A11 — RESUELTO (2026-08-12)

**El fix de namespace ya era correcto; nunca se había ejecutado.** Las observaciones en BD de `C0001-000001/2` eran anteriores al parche, por eso parecía seguir fallando.

Verificación end-to-end con `src/scripts/verificar-cae.ts` (emite por el mismo camino que el endpoint, sin necesitar login):

```
Venta origen : VTA-000017
Comprobante  : C0001-000003
CAE          : 86320752808662   ← confirmado en MySQL
```

**Hallazgo nuevo:** el vencimiento se guarda un día antes (ver **A12**).

<details>
<summary>Historial del diagnóstico (resuelto)</summary>

#### Lo que ya se descartó

| Hipótesis | Verificado |
|---|---|
| Certificado o autorización mal | ❌ Descartado — WSAA autentica y "Probar conexión" da verde |
| AFIP rechaza los datos | ❌ **Descartado** — se reprodujo el request idéntico y AFIP devolvió `Resultado: A`, CAE `86310734742563` |
| Falta `CondicionIVAReceptorId` | ❌ Ya corregido |
| Token del TA cacheado | ❌ Ya corregido (`extraerTokenSign` no desenvolvía el sobre SOAP) |

#### Causa identificada y ya parcheada

`parsearRespuestaCAE` buscaba el sobre con prefijos fijos (`parsed['soapenv:Envelope'] ?? parsed['S:Envelope']`), pero **AFIP responde sin prefijo de namespace**:

```xml
<FECAESolicitarResponse xmlns="http://ar.gov.afip.dif.FEV1/">
```

`body` quedaba `undefined` → `detResp?.Resultado` `undefined` ≠ `'A'` → se tomaba como rechazo → como tampoco había mensajes, salía `AFIP rechazó el comprobante: undefined: undefined`.

**AFIP autorizaba y el sistema descartaba el CAE.** Se agregaron `extraerBody()` y `buscarClave()` (agnósticos al prefijo) más `listarMensajes()`, que ahora lee también `Errors.Err`. Backend compila limpio, pero **el fix no se probó end-to-end**.

#### Por dónde seguir

1. Emitir una Factura C nueva y leer `observaciones` en `comprobantes` — ahí queda el motivo textual si vuelve a fallar
2. Si el CAE llega a la BD pero no se imprime → el problema es de `printComprobante.ts` (la plantilla ya soporta CAE, vto y QR: líneas ~137, ~660, ~716)
3. Si el CAE no llega a la BD → seguir en `parsearRespuestaCAE`, volcando la respuesta cruda de AFIP a un log

#### ⚠️ Desincronización de numeración

Los intentos fallidos **sí consumieron números en AFIP**: el último autorizado de Factura C es **2**, y en la BD local no hay ningún CAE guardado. Antes de producción hace falta reconciliar con `FECompConsultar` (relacionado con A9).

</details>

#### Datos útiles

- CUIT emisor `20-35256076-7` · Punto de venta `1` · Homologación
- **El encabezado del comprobante imprime `CUIT: 20-12345678-3`** (dato de prueba de la sucursal) — no coincide con el del certificado; corregir en configuración de sucursal
- Ticket de acceso: dura 12 h. AFIP rechaza pedir uno nuevo si hay otro vigente (`coe.alreadyAuthenticated`) — hay que reutilizar el cacheado

### 3.2 Seguridad (de `cosas viejas/SEGURIDAD.md`)

**Rápidas (1 línea c/u):**
- **#4** Quitar `logger.log(\`CMD: ${cmd}\`)` en `backup.service.ts:219` — expone `DB_PASS` en logs
- **#9** `requiredAny: ['reportes.ver']` → `['auditoria.ver']` en `auth/front-routes.ts:216`

**Importantes:**
- **#1** `exec()` → `spawn()` en `backup.service.ts` — Command Injection (RCE). De paso elimina el hardcode `C:\Program Files\MySQL\...` que rompe en Docker/Linux
- **#2** Firma del webhook de Mercado Pago obligatoria + `MP_WEBHOOK_SECRET` en Joi
- **#6** `process.env.CORS_ORIGIN` → `ConfigService.getOrThrow()` en `main.ts:18`
- **#8** Lockout por email en `auth.service.ts`

**Diferidas:**
- **#5** Prefijo `v2:` en el cifrado AES (ambigüedad de encoding legacy)
- **#7** JWT de localStorage → cookie HttpOnly
- Token blacklist con Redis (el JWT sigue vivo tras logout)
- Soft delete en Clientes (`CuentaCorriente` puede quedar huérfana)
- Usuario MySQL con permisos mínimos (hoy `root`)
- 2FA para administradores

### 3.3 Dockerización — no iniciada

`docker-compose.yml` previsto: `mysql` (MySQL 8) + `backend` (node:20-alpine) + `frontend` (Vite build → Nginx).

Bloqueantes previos:
- Corregir #1 primero (`spawn` usando el PATH del contenedor)
- Backup escribe en `C:/tmp` → cambiar a `os.tmpdir()`
- `MP_NOTIFICATION_URL` tiene una URL de ngrok hardcodeada en `.env`
- El frontend necesita `VITE_API_BASE_URL` en build time

### 3.4 Deuda menor
- Swagger sin `@ApiProperty` en los DTOs (solo hay tags y bearer en controllers)
- Carpeta `cosas viejas/` con docs que deberían moverse a `docs/`

---

## 4. Próximos pasos sugeridos

### Sprint 1 — Cerrar ARCA
1. ~~**A2** — Guard de permisos en `ArcaController`~~ ✅
2. ~~**A1** — Página de configuración ARCA en el frontend~~ ✅
3. ~~Validar WSAA + WSFEv1 contra homologación~~ ✅ **CAE real obtenido**
4. ~~**A4** — Persistir el error de AFIP en vez de tragarlo~~ ✅
5. ~~**A11** — el CAE no llega al comprobante~~ ✅ **RESUELTO 2026-08-12**, ver §3.1.b
6. ~~**A12** — vencimiento del CAE un día antes~~ ✅ **RESUELTO 2026-08-12**
7. ~~**A13/A14** — CUIT impreso ≠ CUIT del certificado~~ ✅ **RESUELTO 2026-08-12**
8. ~~**A17 + A16** — QR en el PDF y QR local~~ ✅ **RESUELTO 2026-08-12**
9. ~~**A9** — Lock de numeración + reconciliación~~ ✅ **RESUELTO 2026-08-12**. Ya no hay bloqueantes de ARCA para producción
10. ~~**A3** — Alícuotas de IVA~~ ✅ **RESUELTO 2026-08-12**

11. ~~**UI de la alícuota**~~ ✅ **RESUELTO 2026-08-12** — selector en alta (`ProductForm`) y edición (`TabResumen`), columna `alicuota_iva` en la plantilla Excel + instrucciones. Conversión centralizada en `normalizeProductoPayload`. Verificado end-to-end: producto marcado a 10,5% → el cálculo fiscal emite `<AlicIva Id=4>`

> Decisión pendiente del usuario (2026-08-12): **la condición fiscal real todavía no está definida**. El certificado activo es de monotributo → Factura C, que no discrimina IVA. El desglose de A3 recién se usa al emitir A o B como Responsable Inscripto.
11. **A15** — QR con receptor hardcodeado (`tipoDocRec: 99`). El backend ya lo resuelve bien; falta que el front deje de armar su propio payload en `buildArcaQrUrl`
12. ~~**A5** — CAE para notas de crédito con `CbtesAsoc`~~ ✅ **RESUELTO 2026-08-12**
13. **← RETOMAR ACÁ: A15** — el front duplica el payload del QR en `buildArcaQrUrl` con `tipoDocRec: 99` fijo. El backend ya lo resuelve bien; falta que el front consuma `GET /comprobantes/:id/qr` sin recalcular

> ⚠️ **El lock de A9 es in-process.** Alcanza para una instancia del backend. Si en el futuro se corre replicado (varios contenedores), hace falta un lock distribuido; el reintento por 10016 mitiga pero no elimina el problema.

### Scripts de verificación ARCA (`src/scripts/`)

Corren sin login, con `node -r ts-node/register -r tsconfig-paths/register <archivo>`:

| Script | Qué hace |
|---|---|
| `verificar-cae.ts` | Emite una Factura C real y confirma que el CAE llega a la BD |
| `verificar-cuit-fiscal.ts` | Compara el CUIT impreso contra el del certificado |
| `verificar-qr-payload.ts` | Decodifica el QR y valida los 11 campos de la RG 4892 |
| `verificar-qr-pdf.ts` | Confirma que el QR quede embebido en el PDF |
| `verificar-lock-numeracion.ts` | Emite 2 facturas en paralelo y valida que no colisionen |
| `verificar-nc-cae.ts` | Emite una NC sobre una factura con CAE y valida su autorización |
| `reconciliar-numeracion.ts` | Compara numeración local vs AFIP (solo lectura) |
| `anular-facturas-sin-cae.ts` | Anula facturas que quedaron sin CAE |

⚠️ Los que emiten consumen numeración real de AFIP (homologación).
8. **A3** — Alícuotas de IVA reales. ⚠️ **Requiere migración primero**: la tabla `productos` no tiene ningún campo fiscal (verificado 2026-08-12), así que no se puede derivar la alícuota de los ítems. Hoy no molesta porque la Factura C no discrimina IVA, pero rompe al emitir A o B

### Cambios aplicados al flujo POS → factura (2026-08-05)

Decisión del usuario: **ticket interno + factura fiscal aparte**.

- **TICKET ya no pide CAE** — es un recibo interno, no consume numeración de AFIP. Antes se mapeaba a código 6 (Factura B) y pedía autorización
- **Ticket y factura conviven** — `validarNoDuplicado()` distingue por tipo: un ticket bloquea otro ticket, una factura bloquea otra factura, pero el ticket **no impide facturar después**
- **B y C a consumidor final sin cliente** — antes exigía CUIT o DNI para toda factura. AFIP no lo pide por debajo del tope de la RG 4444; se emite con `DocTipo 99` / `DocNro 0`. Factura A sigue requiriendo RI con CUIT
- **`cliente_id` viaja desde el front** — `emitirComprobanteVentaAuxFn` acepta `clienteId` opcional (antes solo mandaba `tipo`, así que era imposible elegir cliente al facturar)
- **Bug de fecha** — `fechaCbte` usaba `toISOString()` (UTC): una venta después de las 21:00 se enviaba con fecha del día siguiente y AFIP la rechazaba por futura

**Pendientes que dejó este bloque:**
- El tope de $417.000 (RG 4444) está hardcodeado en `facturacion.service.ts`. AFIP lo actualiza periódicamente → debería ir a configuración por sucursal
- Falta selector de cliente en la UI de facturación (el backend ya lo soporta)
- `C0001-000001` quedó en la BD sin CAE — conviene anularla para no confundirse

### Validación contra AFIP homologación — 2026-08-05 ✅

| Prueba | Resultado |
|---|---|
| WSAA login (firma PKCS#7) | ✅ TA obtenido, vence 06/08 08:34 |
| `FEDummy` | ✅ AppServer / DbServer / AuthServer OK |
| `FECompUltimoAutorizado` | ✅ Responde para códigos 1, 6 y 11 |
| **`FECAESolicitar`** | ✅ **CAE `86310734290053`**, vto 15/08/2026, Factura C nº 1 |

**Tres bugs encontrados y corregidos gracias a esta prueba:**

1. **`formatAfipDate` mandaba la hora 3 h en el futuro** — `toISOString().replace('Z','-03:00')` etiquetaba UTC como hora local. AFIP rechazaba con `xml.generationTime.invalid`. Ahora calcula el offset real con `getTimezoneOffset()`, y además funciona en contenedores que corren en UTC.
2. **Faltaba `CondicionIVAReceptorId`** — obligatorio desde la **RG 5616**. AFIP rechazaba con observación 10246. El dato ya se calculaba pero nunca se enviaba en el SOAP.
3. **Factura C enviaba el nodo `<Iva>`** — el monotributo no discrimina IVA; el total va como neto y sin nodo `<Iva>`. Además `condicionIvaAfip()` devolvía **13** (Monotributista Social) para monotributo; el correcto es **6** (Responsable Monotributo), verificado contra `FEParamGetCondicionIvaReceptor`.

> `ARCA_ENCRYPT_KEY` faltaba en el `.env` y el provider devolvía `null` en silencio, provocando un `TypeError` opaco recién al guardar. Se agregó la clave y el provider ahora cae a `MASTER_ENCRYPT_KEY` en lugar de devolver `null`.
>
> ⚠️ **Si se pierde `ARCA_ENCRYPT_KEY`, las credenciales guardadas quedan indescifrables** y hay que volver a cargar el `.crt` y el `.key`.

### Credenciales de homologación — ya emitidas (2026-08-05)

| Dato | Valor |
|---|---|
| CUIT | 20-35256076-7 (CARDOZO NOE MIGUEL) |
| Alias / DN | `erptesting` |
| Servicio autorizado | `ws://wsfe` ✅ |
| Vigencia | 05/08/2026 → 04/08/2028 |
| Archivos | `C:\Users\Martin Cardozo\Desktop\certificados-arca\` (fuera del repo) |

Falta confirmar el **número de punto de venta** de homologación (ABM Puntos de Venta, tipo WebServices).

### Sprint 2 — Completitud fiscal
6. **A7 + A8** — CAE, vencimiento y QR AFIP en el PDF
7. **A5** — CAE para notas de crédito con `CbtesAsoc`
8. **A9** — Lock de numeración

### Sprint 3 — Seguridad y despliegue
9. Correcciones #4 y #9 (10 min)
10. Correcciones #1, #2, #6, #8
11. `docker-compose.yml`

---

## 5. Decisiones registradas

| Fecha | Decisión |
|---|---|
| 2026-06 | Fases 1–4 del roadmap completadas |
| 2026-06 | ARCA marcada como "omitida"… pero el backend **sí se implementó** después. Esta nota corrige el registro anterior |
| 2026-08 | **No usar `@ramiidv/arca-sdk` ni `@afipsdk/afip.js`** — se mantiene la implementación nativa. Reevaluar `@afipsdk/afip.js` solo si hace falta consulta de padrón |
