# PROGRESO DEL PROYECTO — ERP Gestión Contable de Ventas

> Última actualización: **2026-08-14**
> Stack: NestJS 11 + TypeORM + MySQL 8 | React 19 + Vite 8 + Tailwind 4 + TanStack Query + Zustand

---

## 📌 SESIÓN 2026-08-14 — auditoría de flujos POS × roles

Revisión completa de la matriz **4 modos POS × combinaciones de permisos**, a pedido del usuario: "tiene que funcionar en todos los aspectos".

### Cómo queda cada modo

| Modo | Vender+cobrar junto | Pendientes | Cajas abiertas | Escenario real |
|---|---|---|---|---|
| **SIMPLE** | ✅ obligatorio | ❌ prohibido | **1 por sucursal, compartida** | Kiosco. Ahora **varios vendedores** sobre la misma caja |
| **MULTICAJA** | ✅ obligatorio | ❌ prohibido | 1 por empleado | Varios vendedores, cada uno su caja |
| **CAJA_CENTRALIZADA** | ❌ prohibido | ✅ obligatorio | 1 por empleado | Vendedores + cajero central |
| **CON_DESPACHO** | ❌ prohibido | ✅ obligatorio | 1 por empleado | Igual + zona de entrega |

> **Regla que resume todo:** SIMPLE y MULTICAJA exigen un operador que **venda Y cobre**. Un vendedor puro o un cajero puro **no pueden operar** en esos modos — es por diseño, no un bug. Para separar roles hay que usar CAJA_CENTRALIZADA o CON_DESPACHO.

### Los 5 hallazgos y su corrección

| # | Problema | Corrección |
|---|---|---|
| **1** 🔴 | **"Varios vendedores, una caja" era imposible.** SIMPLE permite una sola caja abierta (`caja.service.ts:63`) pero cobrar exigía caja **propia** (`pagos-pos.service.ts:55`). El segundo vendedor no podía abrir otra ni usar la ajena: quedaba trabado sin salida | La regla de caja propia **ya no aplica en SIMPLE**. Además `findAbiertaPorEmpleado` devuelve la caja de la sucursal si el empleado no tiene la suya, y `crearVenta` pide "alguna caja abierta" en vez de caja propia. Cada pago sigue guardando su `empleado_id`, así que el arqueo distingue quién cobró |
| **2** 🔴 | El vendedor de flujo separado descubría que no había caja abierta **recién al enviar la venta**, con el carrito ya armado. Empeoró con el rol POS: ya no pasa por la pantalla de apertura | Nuevo `GET /caja/hay-abierta` (solo devuelve un booleano, sin exponer cajas ajenas) + banner de aviso al entrar al POS |
| **3** 🟠 | `posAccess.requiereCajaParaCobrar` decía `true` siempre, pero en flujo separado el backend pide caja **de la sucursal**, no propia | Agregado `requiereCajaPropiaParaVender` (solo MULTICAJA) y documentado a qué validación del backend corresponde cada flag |
| **4** 🟠 | Un cajero puro en modo SIMPLE veía "necesitás permiso `ventas.crear`" — un permiso que su rol **nunca** debería tener. El problema real era el modo de la sucursal | Mensajes reescritos: ahora dicen que la sucursal está en un modo que exige vender y cobrar, y sugieren CAJA_CENTRALIZADA |
| **5** 🟡 | Se podía pasar a SIMPLE con varias cajas abiertas, dejando un estado que el propio backend rechaza (nadie puede abrir caja hasta cerrarlas todas) | `validarCambioDeModo()` en `ConfiguracionService.update` devuelve 409 si hay más de una caja abierta |
| **6** 🔴 | **Contracara de #1** (planteado por el usuario): al compartir la caja en SIMPLE había que asegurar que **no se pueda cerrar la caja de otro**. El cierre ya estaba protegido, pero **egresos y consumos internos NO**: cualquiera con el permiso movía plata de una caja ajena | Nuevo helper `validarCajaPropia()` aplicado a **cerrar, movimientos y consumo interno**. Devuelve **403** con mensaje claro. El cierre además pasó de un 404 engañoso ("Caja no encontrada") a un 403 que dice el motivo real |

| **7** 🔴 | **El cambio de modo POS "no se guardaba"**: se elegía otro modo, se guardaba, y la pantalla volvía a mostrar el anterior. **El backend guardaba bien** — verificado por API y en BD; el que revertía era el formulario | Ver detalle abajo |

### P6 cerrado + auditoría legible (2026-08-14)

**P6 ✅** — `NCA-D-000002` emitida sobre `C0001-000011`:

| Verificación | Resultado |
|---|---|
| CAE propio de AFIP | ✅ `86330758062175` (distinto al de la factura) |
| Código fiscal | ✅ `013` (NC clase C) |
| Vencimiento de CAE | ✅ 2026-08-24 |
| QR fiscal (`GET /comprobantes/:id/qr`) | ✅ PNG 240×240, `tipoCmp 13`, 11 campos válidos según RG 4892 |
| Numeración AFIP vs local | ✅ 11 = 11, sin colisiones |

> **Con esto se cierra el circuito fiscal completo.** No quedan brechas de ARCA abiertas fuera de A6 (reintento ante caída de AFIP) y A10 (padrón), ambas no bloqueantes.

### Auditoría: filtros y lectura

La página existía con filtros completos, pero tenía problemas de uso concretos:

| # | Problema | Solución |
|---|---|---|
| 1 | **Abría vacía**: el rango arrancaba en "hoy", así que sin movimientos del día parecía rota | Arranca en **últimos 7 días** + atajos **Hoy / Ayer / 7 días / 30 días / Este mes** |
| 2 | **"Solo sensibles" mentía**: filtraba los 50 registros de la página, no el total. Decía "0 sensibles" habiéndolos en otra página | Filtro movido a **SQL** (`solo_sensibles=true`). Verificado: 347 eventos totales → **18 sensibles** reales |
| 3 | **El detalle era JSON crudo**: había que comparar dos objetos a ojo para ver qué cambió | Nuevo `CambiosEvento.tsx`: tabla **campo por campo** con valor viejo tachado → valor nuevo, nombres traducidos y montos formateados. El JSON queda plegado en "Ver datos completos" |
| 4 | La columna Detalle mostraba JSON cortado a 130 caracteres | Ahora dice **"Cambió: estado, total y 2 más"** |
| 5 | **"Acción exacta"** obligaba a saber que se llamaba `CAMBIAR_ESTADO_PEDIDO_ENVIO` | Selector poblado con las acciones que **existen en la base**, acotado al módulo elegido. Nuevo `GET /auditoria/acciones` |

También distingue altas y bajas (un solo lado, no hay "cambio") y avisa cuando el evento no modificó datos.

> ⚠️ **La UI no se probó en pantalla**, solo compila y los endpoints están verificados por API.
>
> **Pendiente sugerido:** exportar el listado filtrado a Excel/PDF — hoy no se puede sacar para un contador o un reclamo.

### Cuenta corriente: encuadre legal (2026-08-14)

Análisis del marco legal argentino de la cuenta corriente comercial y cierre de las dos brechas más urgentes. **Documento completo en [`CUENTA-CORRIENTE-LEGAL.md`](CUENTA-CORRIENTE-LEGAL.md)** — conviene revisarlo con un contador.

**Lo que ya estaba bien:** la venta a plazo se separa del comprobante fiscal, y el interés de mora se calcula **sobre el capital del cargo, no sobre el saldo** — o sea que no capitaliza, lo cual evita el anatocismo (CCyC art. 770) que está prohibido salvo pacto semestral expreso.

| # | Corrección | Detalle |
|---|---|---|
| **1** | **Tope legal a la tasa de mora: 0,20% diario (~73% anual)** | El CCyC art. 771 faculta a los jueces a reducir de oficio los intereses usurarios; el criterio habitual es no pasar de 2-2,5x la tasa activa del BNA. Antes se podía cargar **cualquier** tasa: `@Min(0)` sin máximo |
| **2** | **Leyenda de objeción a 30 días** en el resumen (email **y** PDF) | Sin ese aviso el silencio del cliente **no vale como aceptación** del saldo (CCyC art. 1145), y la cuenta no se puede tener por conformada |

**Doble cerrojo en el tope:** `@Max` en el DTO al guardar el plan, y un recorte defensivo en `calcularRecargos()` para planes cargados antes de la validación (loguea un warning al recortar). El frontend además avisa el equivalente anual mientras se tipea — *1% diario suena poco pero son 365% anual*.

Constantes en `erp-backend/src/clientes/cuenta-corriente.constants.ts`.

#### Verificación por API (2026-08-14)

| Tasa | Resultado |
|---|---|
| 0,15% diario | ✅ aceptada |
| 0,20% diario (tope) | ✅ aceptada |
| 1,00% diario | ✅ **rechazada** — "no puede superar 0.2% diario (73% anual)… puede considerarse usuraria" |
| 5,00% diario | ✅ rechazada |

Resumen en PDF generado con la leyenda (`src/scripts/verificar-resumen-cc.ts`). Datos de prueba borrados; queda un PDF de muestra en el escritorio.

#### Pendiente (ordenado por impacto)

1. **Solicitud de crédito firmada** — sin esto la mora es impugnable y el resumen no se tiene por aceptado. **Es la brecha grande**
2. **Imputación de pagos ordenada** (CCyC arts. 900-903: primero a la deuda más antigua, y dentro de ella primero a intereses). Hoy el pago baja el saldo global: se sabe *cuánto* deben pero no *qué* deben
3. **Antigüedad de saldos 30/60/90** — lo primero que pide un contador

### Envíos a domicilio: configuración + carga desde el POS (2026-08-14)

**Lo que ya existía** (backend completo, no había que rehacerlo): estados `PENDIENTE → PREPARANDO → EN_CAMINO → ENTREGADO → CANCELADO`, estados de pago `PENDIENTE_PAGO → PENDIENTE_RENDICION → RENDIDO`, y `rendir()` que llama a `pagosPosService.cobrar` — **la plata sí impacta en caja con su movimiento**.

**Las dos brechas que se cerraron:**

| # | Faltaba | Solución |
|---|---|---|
| 1 | **Nada habilitaba el módulo.** Estaba siempre activo para todas las sucursales, hicieran delivery o no | Campo `permitir_envios` en `configuracion_sucursal` + toggle "Permitir envíos a domicilio". **Validado en el servicio**, no solo en la UI: `validarEnviosHabilitados()` rechaza la creación por API si la sucursal no lo tiene activo |
| 2 | **La carga no arrancaba del POS.** El botón era un `<Link>` que sacaba del POS a `/pedidos-envio` y obligaba a recargar cliente y productos desde cero — el carrito se perdía | Nuevo `ModalEnvio.tsx`: botón **"Enviar a domicilio"** en el carrito que abre un modal con los datos de entrega. **Los productos salen del carrito ya armado.** El `<Link>` viejo quedó como "Ver envíos" (acceso al seguimiento) y solo aparece si hay envíos habilitados |

**Cobro:** en el modal se elige el medio previsto y un check **"Ya pagó en el local"**. Si está marcado el pedido nace `PAGADO`; si no, queda `PENDIENTE_PAGO` y al marcarlo entregado pasa a `PENDIENTE_RENDICION` hasta que el repartidor rinde en caja.

#### Verificación por API (2026-08-14)

| Paso | Resultado |
|---|---|
| Crear pedido con `permitir_envios = 0` | ✅ **rechazado** con mensaje accionable |
| Crear pedido con envíos habilitados | ✅ `PENDIENTE` / `PENDIENTE_PAGO`, total $2.960 |
| Marcar `EN_CAMINO` sin repartidor | ✅ rechazado: "Debe asignar un repartidor" |
| Marcar `ENTREGADO` | ✅ pasa solo a **`PENDIENTE_RENDICION`** |
| `rendir()` | ✅ `RENDIDO`, comprobante **`COBRADA`**, monto 2960 |
| **Impacto en caja** | ✅ `pagos_pos` con el empleado que rindió + movimiento **`COBRO 2960.00`** en la caja |

> Datos de prueba borrados al terminar. **Shaddai quedó con `permitir_envios = 1`** para probar en la UI.

### Modal de cobro con vuelto (2026-08-14)

Al quedar Shaddai en modo SIMPLE apareció el botón "Cobrar" con cobro directo, y el panel de pagos del vendedor era un formulario apretado en la columna derecha, **sin vuelto**.

**Nuevo `components/shared/ModalCobro.tsx`** — se abre al tocar "Cobrar":

- **Total gigante** arriba, que es el número que el cajero canta
- Botones de medio de pago en grilla de 3
- Campo **"Con cuánto paga"** grande, enfocado al abrir para tipear sin mouse
- Atajos: **Justo** + los billetes que alcanzan el total (se filtran los menores)
- **Vuelto en 34px**, en verde; si falta plata pasa a rojo y dice "Falta"
- **Enter** confirma, **Escape** cierra
- **"Dividir pago"** pliega el pago mixto: por defecto un solo medio, que es el caso común

> ⚠️ **El importe recibido NO viaja al backend** — es solo ayuda visual para el vuelto. `construirPagos` cobra el total exacto; mandar lo que entregó el cliente haría fallar el cobro por diferencia. Mismo criterio que ya usaba `PanelMedioPago` del cajero.

**Detalle:** al activar "Dividir pago" se precarga el primer pago con el total, porque `construirPagos` exige que la suma cierre y arrancar en cero obliga a tipear todo de nuevo.

El componente se desmonta al cerrarse (wrapper `ModalCobro` → `ContenidoModalCobro`), así el estado nace limpio sin resetearlo dentro de un efecto.

> 💡 **El cajero ya tenía vuelto** en `PanelMedioPago`. Lo que faltaba era el lado del **vendedor con cobro directo** (SIMPLE / MULTICAJA).

### #7 — Por qué el modo POS parecía no guardarse

El `useEffect` de `ConfiguracionPosPage` que hidrata el form dependía de `configQuery.data`, con un guard de `isDirty` que **no alcanzaba**:

1. Cambiás el modo → `isDirty = true`
2. Guardás → **el backend persiste correctamente**
3. `onSuccess` hace `form.reset(payload)` → `isDirty` vuelve a **false**
4. La mutación hace `setQueryData` → cambia la identidad de `configQuery.data` → **el efecto se dispara de nuevo**
5. Con `isDirty` ya en false, el guard no protege: un refetch (el query usa `staleTime: 0` + `refetchOnWindowFocus`) rehidrata el form **con el valor viejo**

**Fix:** `sucursalHidratadaRef` — el form se hidrata **una sola vez por sucursal**. Después la fuente de verdad de lo que se ve en pantalla es el form, y el servidor solo se relee al cambiar de sucursal.

> 💡 El síntoma era engañoso: parecía un bug de backend o de permisos, pero el dato viajaba y se guardaba bien. Era puramente de sincronización del formulario.

> 🔑 **Criterio que quedó:** en SIMPLE se comparte **el cobro**, no la **responsabilidad del cierre**. Cobrar sobre la caja de otro está permitido (varios vendedores, una caja); cerrarla, sacar un egreso o registrar un consumo interno **solo puede hacerlo quien la abrió**, porque es quien rinde el arqueo. `validarCajaPropia()` no se relaja en ningún modo.

**Archivos tocados:** `pagos-pos.service.ts`, `pos-ventas.service.ts`, `caja.service.ts`, `caja.controller.ts`, `configuracion.service.ts`, `posAccess.ts`, `pos.api.ts`, `usePos.ts`, `useEstadoPos.ts`, `PuntoDeVentaPages.tsx`. Front y backend compilan limpio.

### Verificación por API (2026-08-14)

Se puso Shaddai2 en SIMPLE y se ejercitó el escenario real con **dos usuarios distintos**:

| Paso | Resultado |
|---|---|
| `cajerovendedor` abre la caja única | ✅ |
| `todospermisos` (sin caja propia) consulta `/caja/abierta` | ✅ **ve la caja compartida** — antes devolvía `null` |
| `todospermisos` intenta abrir una segunda caja | ✅ rechazado: SIMPLE admite una sola |
| **`todospermisos` vende y cobra sobre la caja ajena** | ✅ `VTA-000003` **COBRADA** — antes era imposible |
| Atribución en el arqueo | ✅ el pago quedó con `empleado_id = todospermisos` dentro de la caja de `cajerovendedor`: **el arqueo cierra por caja y sabe quién cobró cada peso** |
| Pasar Shaddai a SIMPLE con 2 cajas abiertas | ✅ **409** con mensaje accionable (#5) |
| `GET /caja/hay-abierta` con vendedor y cajero | ✅ 200 en ambos (#2) |
| Otro usuario intenta **cerrar** caja ajena | ✅ **403** con mensaje claro (#6) |
| Otro usuario intenta un **egreso** en caja ajena | ✅ **403** (#6) |
| El **dueño** cierra su propia caja | ✅ pasa la validación de propiedad (frena después por ventas pendientes, que es otra regla y correcta) |

> Los modos de las sucursales se restauraron al terminar (Shaddai `CON_DESPACHO`, Shaddai2 `CAJA_CENTRALIZADA`).

> ⚠️ **Falta probarlo desde la interfaz.** La lógica quedó verificada por API, pero el banner de #2 y los mensajes de #4 son UI y no se vieron en pantalla.

---

## 📌 SESIÓN 2026-08-13 (noche) — selección de rol en el POS

Bloque de cambios en el POS, **sin probar todavía en la interfaz**.

**Qué se agregó:** cuando la sucursal está en modo de flujo separado (`CAJA_CENTRALIZADA` o `CON_DESPACHO`) **y** el empleado tiene los dos permisos (`ventas.crear` + `caja.cobrar`), el POS ya no adivina qué rol cumple: le pregunta.

| Archivo | Qué cambió |
|---|---|
| `hooks/useEstadoPos.ts` | Estado `rolPosElegido` + flag `necesitaElegirRol`. `esSoloCajero` ahora sale del rol elegido cuando hay doble permiso |
| `Pages/PuntoDeVentaPages.tsx` | Modal "¿Cómo vas a operar hoy?" con dos tarjetas (Vendedor / Cajero) |
| `utils/posAccess.ts` | Nuevos `requiereCajaParaVender`, `requiereCajaParaCobrar` y `descripcionModo` (texto explicativo por modo) |
| `components/PosAbrirCaja.tsx` | Badge del rol, botón "Cambiar rol" y cartel con la descripción del modo |
| `components/cajero/PosCajeroBarra.tsx` | Badge del rol y "Cambiar rol" en la cabecera |
| `components/vendedor/PosCamposVenta.tsx` · `PosVendedorView.tsx` | Idem, del lado del vendedor |

**Dos efectos sobre el flujo:**

- El bloqueo por caja ahora distingue **para qué** se necesita la caja: un vendedor en flujo separado ya no queda trabado en la pantalla de apertura, porque él no cobra
- `habilitarPendientes` exige `esSoloCajero`: si elegís rol vendedor, las ventas pendientes ni se piden al backend

**Errores de tipos: 21 → 0.** Verificado el 2026-08-14 con `npx tsc --noEmit` en frontend y backend: **ambos compilan limpio**. Queda cerrado el punto 2 de "pendientes" de la sesión anterior.

### Bug encontrado al probar P0 (2026-08-14)

**Síntoma:** al entrar al POS con `vendedor@gmail.com` saltaba el modal **"Acción no permitida"** y la pantalla no cargaba.

**Causa:** `useEstadoPos` llama a `useMediosPagoActivos()` **sin condición**, y `GET /pagos/activos` exige `medios_pago.ver`. Ese permiso **no estaba en ninguno de los tres roles del POS** (Vendedor, Cajero, Vendedor Cajero) — solo en Admin. El 403 lo levantaba el interceptor de `ApiBase.ts` y disparaba el modal global.

Pasó desapercibido hasta ahora porque siempre se probó con usuarios Admin, que tienen todos los permisos.

**Fix:** `medios_pago.ver` agregado a los tres roles, en **dos lugares** (si se toca solo uno, el arreglo se pierde):

1. `src/roles/roles-seed.ts` — la fuente de verdad; sin esto `npm run seed` lo revierte
2. La base actual, vía `INSERT` en `rol_permisos`, para no depender de correr el seed

**Verificado por API (2026-08-14):** con `vendedor`, `cajero` y `cajerovendedor`, los cinco endpoints del arranque del POS (`/pagos/activos`, `/clientes`, `/listas-precio`, `/caja/abierta`, `/configuracion/:id`) responden **200**. Antes `/pagos/activos` daba 403.

**Segundo hallazgo:** `cajerovendedor@gmail.com` estaba con `activo = 0` en la BD y por eso su login daba 401. Es el **único** usuario con rol "Vendedor Cajero" — el caso real de doble permiso. Reactivado el 2026-08-14.

#### Usuarios de prueba (contraseña `holamundo123` en todos)

| Usuario | vender | cobrar | Sirve para |
|---|---|---|---|
| `cajerovendedor@gmail.com` | ✅ | ✅ | **El modal de rol** — es el caso real, sin permisos de más |
| `vendedor@gmail.com` | ✅ | ❌ | Control: **no** debe salir el modal |
| `cajero@gmail.com` | ❌ | ✅ | Control: **no** debe salir el modal |
| `martin@gmail.com` | ✅ | ✅ | Admin. El modal sale, pero tiene permisos de más y **ya escondió un bug** (el de `medios_pago.ver`) |

> 💡 Probar el POS con Admin no vale como prueba de permisos: tiene todo y tapa los 403.

> ⚠️ **El resto del bloque sigue sin probarse en la UI.** Ver **P0**.

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
| **P0** | **Selección de rol en el POS** (código del 13/08 a la noche) | Poner la sucursal en `CAJA_CENTRALIZADA` → entrar al POS con un usuario que tenga **ambos** permisos → debe aparecer el modal. Elegir **Vendedor**: no debe pedir caja ni cargar pendientes. Elegir **Cajero**: pide caja y muestra pendientes. "Cambiar rol" vuelve al modal desde las tres pantallas (apertura de caja, barra de cajero, campos de vendedor) | ⏳ **PENDIENTE.** Es el único código sin ejercitar nunca. Compila, pero compilar no es funcionar |
| ~~**P1**~~ | ~~Cobrar una venta en el POS con impresión automática~~ | ✅ **OK** (13/08) | |
| ~~**P2**~~ | ~~Facturar esa venta~~ | ✅ **OK** — `C0001-000011` con CAE | |
| ~~**P3**~~ | ~~Imprimir la factura~~ | ✅ **OK** — QR visible tras el fix | |
| ~~**P4**~~ | ~~Escanear el QR con el celular~~ | ✅ **OK** — AFIP responde "no encontrado" porque el visor lee **producción** y el comprobante es de homologación. El QR está bien formado | |
| ~~**P5**~~ | ~~Mandar la factura por email~~ | ✅ **OK** — PDF con QR, CAE, razón social e IIBB | |
| ~~**P6**~~ | ~~Nota de crédito sobre esa factura~~ | ✅ **OK** (14/08) — `NCA-D-000002` con CAE propio `86330758062175`, código `013`, contra `C0001-000011`. QR fiscal válido (`tipoCmp 13`) | |

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
2. ~~**21 errores de tipos en el frontend**~~ — ✅ **0 errores** al 2026-08-14. Front y backend compilan limpio con `npx tsc --noEmit`
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
| ~~A15~~ | ~~QR AFIP con receptor hardcodeado~~ | — | ✅ **RESUELTO 2026-08-13** — `buildArcaQrUrl` eliminado del front. El QR ahora se pide al backend con `obtenerQrFiscalFn(comprobante.id)`, que ya arma el receptor correcto. El front solo lo pide cuando hay CAE |
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
11. ~~**A15** — QR con receptor hardcodeado~~ ✅ **RESUELTO 2026-08-13**
12. ~~**A5** — CAE para notas de crédito con `CbtesAsoc`~~ ✅ **RESUELTO 2026-08-12**
13. **← RETOMAR ACÁ: pruebas de UI.** No quedan brechas de código de ARCA abiertas fuera de A6/A10 (no bloqueantes). Lo que falta es ejercitar la interfaz: **P0** (rol POS, código sin probar) y **P6** (NC con CAE)

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
