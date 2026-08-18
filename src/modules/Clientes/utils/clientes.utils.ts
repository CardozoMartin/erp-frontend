import type { ICliente, IClientePayload, TipoVencimientoCuenta } from '../types/cliente.type';
import type { IMovimientoCuentaCorrienteAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime } from '../../POSAuxiliares/utils/format';

// ─── Limites legales de la cuenta corriente ───────────────────────────────────
// Debe coincidir con `cuenta-corriente.constants.ts` del backend, que es quien
// rechaza el guardado. Aca solo se avisa antes de que el usuario intente guardar.

/** Tope de mora diaria: por encima un juez puede reducirla de oficio (CCyC 771) */
export const TASA_MORA_DIARIA_MAXIMA = 0.2;

/** Equivalente anual de una tasa diaria, para mostrarlo junto al campo */
export const tasaAnualEquivalente = (tasaDiaria: number) =>
  Math.round(tasaDiaria * 365 * 100) / 100;

// ─── Tipos locales ────────────────────────────────────────────────────────────

export type ClienteFormValues = {
  nombre: string;
  apellido: string;
  razon_social: string;
  tipo: string;
  cuit: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  altura: string;
  barrio: string;
  localidad: string;
  codigo_postal: string;
  referencia_entrega: string;
  usarCuentaCorriente: boolean;
  credito_sin_limite: boolean;
  limite_credito: number;
  tipo_vencimiento: TipoVencimientoCuenta;
  valor_vencimiento: number;
  recargo_activo: boolean;
  recargo_porcentaje_diario: number;
};

export type TipoResumenEmail = 'CARGOS' | 'COMPRAS' | 'CARGOS_Y_RECARGOS' | 'TODOS';

// ─── Valores por defecto ──────────────────────────────────────────────────────

export const defaultValues: ClienteFormValues = {
  nombre: '',
  apellido: '',
  razon_social: '',
  tipo: 'CONSUMIDOR_FINAL',
  cuit: '',
  dni: '',
  email: '',
  telefono: '',
  direccion: '',
  altura: '',
  barrio: '',
  localidad: '',
  codigo_postal: '',
  referencia_entrega: '',
  usarCuentaCorriente: false,
  credito_sin_limite: false,
  limite_credito: 0,
  tipo_vencimiento: 'DIA_FIJO',
  valor_vencimiento: 10,
  recargo_activo: false,
  recargo_porcentaje_diario: 0,
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export const money = (value: unknown) =>
  Number(value ?? 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

export const csvValue = (value: unknown) => {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
};

export const downloadTextFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const clienteNombre = (cliente: ICliente) =>
  cliente.razon_social || `${cliente.nombre} ${cliente.apellido ?? ''}`.trim();

export const movimientoProductos = (movimiento: IMovimientoCuentaCorrienteAux) =>
  movimiento.comprobante?.items ?? [];

export const movimientoProductosTexto = (movimiento: IMovimientoCuentaCorrienteAux) => {
  const items = movimientoProductos(movimiento);
  if (!items.length) return '';
  return items
    .map(
      (item) =>
        `${Number(item.cantidad ?? 0)} x ${item.descripcion} (${money(item.subtotal)})`,
    )
    .join(' | ');
};

// ─── Transformaciones form ↔ API ──────────────────────────────────────────────

export const toPayload = (values: ClienteFormValues): IClientePayload => {
  const payload: IClientePayload = {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim() || null,
    razon_social: values.razon_social.trim() || null,
    tipo: values.tipo as ICliente['tipo'],
    cuit: values.cuit.trim() || null,
    dni: values.dni.trim() || null,
    email: values.email.trim() || null,
    telefono: values.telefono.trim() || null,
    direccion: values.direccion.trim() || null,
    altura: values.altura.trim() || null,
    barrio: values.barrio.trim() || null,
    localidad: values.localidad.trim() || null,
    codigo_postal: values.codigo_postal.trim() || null,
    referencia_entrega: values.referencia_entrega.trim() || null,
  };

  if (values.usarCuentaCorriente) {
    payload.cuentaCorriente = {
      limite_credito: values.credito_sin_limite ? 0 : Number(values.limite_credito || 0),
      planPago: {
        tipo_vencimiento: values.tipo_vencimiento,
        valor_vencimiento: Number(values.valor_vencimiento || 1),
        recargo_activo: values.recargo_activo,
        recargo_porcentaje_diario: values.recargo_activo
          ? Number(values.recargo_porcentaje_diario || 0)
          : 0,
      },
    };
  }

  return payload;
};

export const valuesFromCliente = (cliente: ICliente): ClienteFormValues => ({
  nombre: cliente.nombre ?? '',
  apellido: cliente.apellido ?? '',
  razon_social: cliente.razon_social ?? '',
  tipo: cliente.tipo ?? 'CONSUMIDOR_FINAL',
  cuit: cliente.cuit ?? '',
  dni: cliente.dni ?? '',
  email: cliente.email ?? '',
  telefono: cliente.telefono ?? '',
  direccion: cliente.direccion ?? '',
  altura: cliente.altura ?? '',
  barrio: cliente.barrio ?? '',
  localidad: cliente.localidad ?? '',
  codigo_postal: cliente.codigo_postal ?? '',
  referencia_entrega: cliente.referencia_entrega ?? '',
  usarCuentaCorriente: !!cliente.cuentaCorriente,
  credito_sin_limite:
    !!cliente.cuentaCorriente && Number(cliente.cuentaCorriente.limite_credito ?? 0) === 0,
  limite_credito: Number(cliente.cuentaCorriente?.limite_credito ?? 0),
  tipo_vencimiento: cliente.cuentaCorriente?.planPago?.tipo_vencimiento ?? 'DIA_FIJO',
  valor_vencimiento: Number(cliente.cuentaCorriente?.planPago?.valor_vencimiento ?? 10),
  recargo_activo: cliente.cuentaCorriente?.planPago?.recargo_activo ?? false,
  recargo_porcentaje_diario: Number(
    cliente.cuentaCorriente?.planPago?.recargo_porcentaje_diario ?? 0,
  ),
});

// ─── Historial ────────────────────────────────────────────────────────────────

export const clienteHistoryLabels: Record<string, string> = {
  CREAR_CLIENTE: 'Creo el cliente',
  ACTUALIZAR_CLIENTE: 'Actualizo la ficha',
  ACTIVAR_CUENTA_CORRIENTE: 'Activo cuenta corriente',
  CARGO_CUENTA_CORRIENTE: 'Cargo cuenta corriente',
  PAGO_CUENTA_CORRIENTE: 'Registro pago',
  NOTA_CREDITO_CUENTA_CORRIENTE: 'Aplico nota de credito',
};

const clienteFieldLabels: Record<string, string> = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  razon_social: 'Razon social',
  tipo: 'Condicion fiscal',
  cuit: 'CUIT',
  dni: 'DNI',
  email: 'Email',
  telefono: 'Telefono',
  direccion: 'Direccion',
  altura: 'Altura',
  barrio: 'Barrio',
  localidad: 'Localidad',
  codigo_postal: 'Codigo postal',
  referencia_entrega: 'Referencia de entrega',
  cuentaCorriente: 'Cuenta corriente',
};

const formatHistoryValue = (value: any) => {
  if (value === null || value === undefined || value === '') return 'vacio';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === 'object') return 'datos actualizados';
  return String(value);
};

export const clienteChanges = (
  before?: Record<string, any> | null,
  after?: Record<string, any> | null,
): string[] => {
  if (!before && after) return ['Alta inicial del cliente'];
  if (!before || !after) return [];
  return Object.keys(clienteFieldLabels)
    .filter(
      (key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null),
    )
    .map(
      (key) =>
        `${clienteFieldLabels[key]}: ${formatHistoryValue(before[key])} -> ${formatHistoryValue(after[key])}`,
    );
};

// ─── Export / impresión cuenta corriente ─────────────────────────────────────

export const buildCuentaCorrienteCsv = (
  cliente: ICliente,
  movimientos: IMovimientoCuentaCorrienteAux[],
): string => {
  const rows = movimientos.map((movimiento) => [
    dateTime(movimiento.fecha),
    movimiento.tipo,
    movimiento.descripcion ?? '',
    Number(movimiento.monto ?? 0),
    movimiento.comprobante_id ?? '',
    movimientoProductosTexto(movimiento),
    movimiento.omitido ? 'Si' : 'No',
  ]);
  const clienteRows = [
    ['Cliente', clienteNombre(cliente)],
    ['Documento', cliente.cuit || cliente.dni || ''],
    ['Saldo', Number(cliente.cuentaCorriente?.saldo ?? 0)],
    ['Limite', Number(cliente.cuentaCorriente?.limite_credito ?? 0) || 'Sin limite'],
    [],
  ];
  const header = ['Fecha', 'Tipo', 'Descripcion', 'Monto', 'Comprobante', 'Productos', 'Omitido'];
  return [...clienteRows, header, ...rows]
    .map((row) => row.map(csvValue).join(';'))
    .join('\n');
};

export const imprimirCuentaCorriente = (
  cliente: ICliente,
  movimientos: IMovimientoCuentaCorrienteAux[],
) => {
  const rows = movimientos
    .map((movimiento) => {
      const productos = movimientoProductos(movimiento);
      const productosRows = productos.length
        ? productos
            .map(
              (item) =>
                `<div>${Number(item.cantidad ?? 0)} x ${item.descripcion} - ${money(item.subtotal)}</div>`,
            )
            .join('')
        : '-';
      return `
        <tr>
          <td>${dateTime(movimiento.fecha)}</td>
          <td>${movimiento.tipo}</td>
          <td>${movimiento.descripcion ?? ''}</td>
          <td>${productosRows}</td>
          <td style="text-align:right">${money(movimiento.monto)}</td>
          <td>${movimiento.omitido ? 'Si' : 'No'}</td>
        </tr>
      `;
    })
    .join('');
  const win = window.open('', '_blank', 'width=980,height=720');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Cuenta corriente - ${clienteNombre(cliente)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #041627; padding: 24px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          .meta { color: #44474c; font-size: 13px; margin-bottom: 18px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
          .box { border: 1px solid #c4c6cd; padding: 10px; border-radius: 4px; }
          .label { font-size: 11px; text-transform: uppercase; color: #44474c; font-weight: 700; }
          .value { margin-top: 5px; font-size: 16px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border-bottom: 1px solid #d9dce2; padding: 8px; text-align: left; }
          th { background: #f4f5f6; text-transform: uppercase; font-size: 11px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Imprimir / guardar PDF</button>
        <h1>${clienteNombre(cliente)}</h1>
        <div class="meta">${cliente.cuit || cliente.dni || 'Sin documento'} | ${cliente.tipo}</div>
        <div class="summary">
          <div class="box"><div class="label">Saldo</div><div class="value">${money(cliente.cuentaCorriente?.saldo)}</div></div>
          <div class="box"><div class="label">Limite</div><div class="value">${Number(cliente.cuentaCorriente?.limite_credito) > 0 ? money(cliente.cuentaCorriente?.limite_credito) : 'Sin limite'}</div></div>
          <div class="box"><div class="label">Movimientos</div><div class="value">${movimientos.length}</div></div>
        </div>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Tipo</th><th>Descripcion</th><th>Productos</th><th style="text-align:right">Monto</th><th>Omitido</th></tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">Sin movimientos</td></tr>'}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
};
