# Cuenta corriente comercial — marco legal y estado del sistema

> ⚠️ **No es asesoramiento legal.** Es un relevamiento de lo que la normativa argentina
> exige razonablemente y de cómo está implementado hoy. **Revisar con un contador o
> abogado antes de producción.**
>
> Última actualización: **2026-08-14**

---

## 1. Qué es legalmente (y qué no)

**No es un préstamo, es una venta a plazo.** La distinción define todo lo demás:

- Prestar dinero requiere ser entidad financiera (Ley 21.526). **No es lo que hacemos.**
- Vender y diferir el cobro es una operación comercial común: **CCyC arts. 1430-1441**.
- Mientras no se financie con interés explícito, no aplican las reglas de crédito al
  consumo (Ley 24.240 art. 36). **Al cobrar mora sí se entra en terreno regulado.**

## 2. El hecho imponible es la entrega, no el cobro

Es el error más común:

- **La factura se emite al entregar la mercadería**, no cuando el cliente paga
- El IVA se devenga en ese momento (Ley IVA art. 5) y se ingresa en ese período
  **aunque no se haya cobrado un peso**
- La cuenta corriente es **solo el registro de la deuda** — no es comprobante fiscal

✅ **El sistema esto lo hace bien.** La venta a cuenta corriente genera su comprobante
y el movimiento de CC va por separado.

## 3. Qué hay que poder demostrar en juicio

| Qué probar | Con qué |
|---|---|
| Que existió la operación | Factura o remito **conformado** (firmado por quien recibió) |
| Que el cliente conocía las condiciones | **Solicitud de crédito firmada** |
| Cuánto debe hoy | Resumen de cuenta con detalle de movimientos |

**CCyC art. 1145:** el silencio del cliente ante un resumen **no vale como aceptación**,
salvo pacto escrito. Por eso el resumen debe informar el plazo de objeción y el cliente
debe haberlo aceptado al firmar la solicitud.

**CCyC art. 1440:** la cuenta corriente mercantil cerrada y certificada es **título
ejecutivo** — permite ejecutar sin juicio ordinario. Requiere contrato firmado.

## 4. Interés por mora — el punto más sensible

- Solo se puede cobrar **si fue pactada por escrito** (CCyC art. 768). Sin contrato
  firmado, un juez puede declararla improcedente.
- Los jueces **reducen de oficio** las tasas usurarias (art. 771). Criterio habitual:
  no superar 2 a 2,5 veces la tasa activa del Banco Nación.
- **Prohibido capitalizar** el interés (anatocismo, art. 770) salvo pacto expreso con
  periodicidad no menor a semestral.

> 💡 Una tasa diaria engaña: **1% diario = 365% anual.** Un juez lo reduce sin dudar.

## 5. Datos personales (Ley 25.326)

Se guarda CUIT, domicilio y comportamiento de pago:

- Necesita consentimiento (va en la solicitud de crédito)
- **No se puede informar a un buró de crédito sin notificar previamente** al deudor
- Los datos negativos caducan a los **5 años**

Aplica a los campos `bloqueado` y `accion_legal` si alguna vez salen del sistema.

---

## Estado de implementación

### ✅ Ya resuelto

| Punto | Dónde |
|---|---|
| Venta a plazo separada del comprobante fiscal | `registrarCargo()` |
| Movimientos tipificados (cargo, pago, NC, recargo, ajuste) | `TipoMovimientoCC` |
| **Interés simple, sin capitalizar** — se calcula sobre el capital del cargo, nunca sobre el saldo | `calcularRecargos()` |
| Recargos con posibilidad de perdón manual y auditoría | `omitirRecargo()` |
| Planes de vencimiento (día fijo / días desde compra) | `PlanPago` |
| Límite de crédito con validación al vender | `validarLimiteCC()` |
| **Tope legal a la tasa de mora: 0,20% diario (~73% anual)** | `cuenta-corriente.constants.ts` |
| **Leyenda de objeción a 30 días en resumen (email y PDF)** | `LEYENDA_OBJECION_RESUMEN` |

El tope de mora tiene **doble cerrojo**: `@Max` en el DTO al guardar el plan, y un
recorte defensivo en `calcularRecargos()` para planes cargados antes de la validación
(loguea un warning cuando recorta).

### ⚠️ Pendiente

| # | Falta | Por qué importa | Esfuerzo |
|---|---|---|---|
| **1** | **Solicitud de crédito firmada** | Sin esto la mora es impugnable y el resumen no se tiene por aceptado. **Es la brecha grande** | Medio |
| **2** | **Imputación de pagos ordenada** | Hoy el pago baja el saldo global. La ley (CCyC arts. 900-903) manda imputar a la deuda más antigua y **primero a intereses**. Sin esto se sabe *cuánto* deben pero no *qué* deben | Medio |
| **3** | **Antigüedad de saldos (30/60/90)** | Es lo primero que pide un contador y lo que permite gestionar la cobranza | Medio |

> El **#2** es el más engañoso: si el cliente paga la mitad, hoy no se puede determinar
> qué facturas quedaron impagas. Se necesita tanto para el reclamo judicial como para
> el reporte de antigüedad.

---

## Constantes configurables

`erp-backend/src/clientes/cuenta-corriente.constants.ts`

| Constante | Valor | Cambiar si… |
|---|---|---|
| `TASA_MORA_DIARIA_MAXIMA` | `0.2` (%/día) | Cambia el contexto inflacionario o la tasa del BNA. Recalcular contra 2-2,5x la tasa activa |
| `DIAS_OBJECION_RESUMEN` | `30` días corridos | Se pacta otro plazo en la solicitud de crédito. **Debe coincidir con lo firmado** |

El frontend duplica el tope en `clientes.utils.ts` solo para avisar antes de guardar;
**la validación que manda es la del backend**.
