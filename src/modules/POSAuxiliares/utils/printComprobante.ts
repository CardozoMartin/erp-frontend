
import type { IComprobanteAux, IConfiguracionPosSucursal, IDespachoAux } from '../types/pos-aux.type';
import { money } from './format';

type PrintOptions = {
  titulo?: string;
  config?: Partial<IConfiguracionPosSucursal> | null;
  formato?: IConfiguracionPosSucursal['formato_impresion_comprobante'];
  printWindow?: Window | null;
  despacho?: IDespachoAux | null;
  vendedor?: string | null;
  cajero?: string | null;
  listaPrecio?: {
    nombre?: string | null;
    modo_iva?: 'NO_APLICA' | 'IVA_INCLUIDO' | 'AGREGAR_IVA';
    porcentaje_iva?: number | string | null;
    tipo_ajuste?: string | null;
    porcentaje?: number | string | null;
  } | null;
  ivaEstimado?: number | string | null;
  /** PNG del QR fiscal como data URI, generado por el backend (ver obtenerQrFiscal) */
  qrDataUri?: string | null;
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const line = (label: string, value?: unknown) => {
  const text = String(value ?? '').trim();
  return text ? `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(text)}</div>` : '';
};

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const motivoPendienteLabel = (motivo?: string | null) => {
  if (!motivo) return '';
  const labels: Record<string, string> = {
    RETIRA_LUEGO: 'Retira luego',
    SIN_STOCK: 'Sin stock',
    EN_GARANTIA: 'En garantia',
  };
  return labels[motivo] ?? motivo;
};

const listaPrecioLabel = (lista?: PrintOptions['listaPrecio']) => {
  if (!lista) return '';
  const ajuste =
    lista.tipo_ajuste && toNumber(lista.porcentaje) > 0
      ? ` (${lista.tipo_ajuste.toLowerCase()} ${toNumber(lista.porcentaje)}%)`
      : '';
  return `${lista.nombre ?? 'Lista de precio'}${ajuste}`;
};

const modoIvaLabel = (modo?: string, porcentaje?: unknown) => {
  const iva = toNumber(porcentaje);
  if (!modo || modo === 'NO_APLICA' || iva <= 0) return '';
  if (modo === 'AGREGAR_IVA') return `IVA ${iva}% agregado`;
  if (modo === 'IVA_INCLUIDO') return `IVA ${iva}% incluido`;
  return `IVA ${iva}%`;
};

const formatQty = (value: unknown) => {
  const numeric = toNumber(value);
  return Number.isInteger(numeric)
    ? String(numeric)
    : numeric
        .toFixed(3)
        .replace(/0+$/, '')
        .replace(/\.$/, '');
};

const isThermal = (formato: string) =>
  formato === 'TICKET_80MM' || formato === 'TICKET_58MM';

const getTitle = (comprobante: IComprobanteAux, fallback?: string) => {
  if (fallback) return fallback;
  if (comprobante.tipo === 'TICKET') return 'Ticket';
  if (comprobante.tipo?.startsWith('FACTURA')) return comprobante.tipo.replace('_', ' ');
  return 'Comprobante';
};

const fiscalCodeFromType = (tipo?: string | null) => {
  if (tipo === 'FACTURA_A') return '001';
  if (tipo === 'FACTURA_B') return '006';
  if (tipo === 'FACTURA_C') return '011';
  if (tipo === 'TICKET') return '083';
  return '';
};

// Comprobantes que se autorizan ante ARCA. Una VENTA, un TICKET interno, una
// COTIZACION o un REMITO no llevan CAE ni QR: no es que esten "pendientes".
const esComprobanteFiscal = (tipo?: string | null) =>
  tipo === 'FACTURA_A' ||
  tipo === 'FACTURA_B' ||
  tipo === 'FACTURA_C' ||
  tipo === 'NOTA_CREDITO';

const fiscalLetterFromType = (tipo?: string | null) => {
  if (tipo === 'FACTURA_A') return 'A';
  if (tipo === 'FACTURA_B' || tipo === 'TICKET') return 'B';
  if (tipo === 'FACTURA_C') return 'C';
  return 'X';
};

const onlyDigits = (value?: unknown) => String(value ?? '').replace(/\D/g, '');

const formatDate = (value?: unknown) => {
  if (!value) return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('es-AR');
};

const formatDateTime = (value?: unknown) => {
  if (!value) return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-AR');
};

const formatVoucherNumber = (puntoVenta?: unknown, numero?: unknown) => {
  const pv = onlyDigits(puntoVenta).padStart(4, '0').slice(-4);
  const seqSource = onlyDigits(numero);
  const seq = seqSource ? seqSource.slice(-8).padStart(8, '0') : '';
  if (pv && seq) return `${pv}-${seq}`;
  return String(numero ?? '').trim();
};

// ─────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────
const getStyles = (formato: string, diseno: string) => {
  const thermal = isThermal(formato);
  const width = formato === 'TICKET_58MM' ? '58mm' : '80mm';
  const accent = '#075E54';

  // ── TICKET TÉRMICO (sin cambios) ──────────────────────────────────────────
  if (thermal) {
    return `
      @page { size: ${width} auto; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #fff;
        color: #111;
        font-family: "Courier New", monospace;
        font-size: ${formato === 'TICKET_58MM' ? '10px' : '11px'};
      }
      .sheet { width: ${width}; padding: ${diseno === 'WAVE' ? '0 0 4mm' : '4mm 3mm'}; }
      .brand { text-align: center; border-bottom: 1px dashed #111; padding: ${diseno === 'WAVE' ? '4mm 3mm 7mm' : '0 0 7px'}; position: relative; overflow: hidden; }
      .design-wave .brand { background: ${accent}; color: #fff; border-bottom: 0; margin-bottom: 4mm; }
      .design-wave .brand::after {
        content: "";
        position: absolute;
        left: -8%;
        right: -8%;
        bottom: -10px;
        height: 22px;
        background: #fff;
        border-radius: 0 0 50% 50%;
      }
      .design-clasico .brand { border: 1px solid #111; padding: 8px 4px; margin-bottom: 7px; }
      .brand h1 { margin: 0 0 4px; font-size: ${formato === 'TICKET_58MM' ? '15px' : '18px'}; text-transform: uppercase; }
      .brand > div { position: relative; z-index: 1; }
      .design-wave .body-content { padding: 0 3mm; }
      .brand div, .meta div, .fiscal div { line-height: 1.35; }
      .doc-title { text-align: center; margin: 8px 0; font-weight: 700; text-transform: uppercase; }
      .meta, .fiscal, .message { border-bottom: 1px dashed #111; padding: 7px 0; }
      .dispatch { border-bottom: 1px dashed #111; padding: 7px 0; }
      .dispatch-title { margin: 0 0 6px; font-weight: 700; text-transform: uppercase; }
      .status-grid { margin: 6px 0; }
      .status-card { display: flex; justify-content: space-between; gap: 6px; padding: 2px 0; }
      .status-card span { font-weight: 700; }
      .design-wave .doc-title { color: ${accent}; }
      .design-clasico .doc-title { border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 5px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 7px; }
      th { border-bottom: 1px dashed #111; font-size: 9px; text-align: left; padding: 0 0 4px; }
      td { padding: 5px 0; vertical-align: top; border-bottom: 1px dotted #aaa; }
      .item-name { font-weight: 700; }
      .right { text-align: right; }
      .totals { margin-top: 8px; border-top: 1px dashed #111; padding-top: 6px; }
      .total-row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
      .grand { margin-top: 4px; border-top: 1px solid #111; padding-top: 6px; font-size: 14px; font-weight: 700; }
      .fiscal-auth { border-top: 1px dashed #111; margin-top: 8px; padding-top: 6px; }
      .arca-footer { border-top: 1px dashed #111; margin-top: 8px; padding-top: 7px; text-align: center; }
      .qr { width: 30mm; height: 30mm; margin: 5px auto 0; object-fit: contain; }
      .message { text-align: center; white-space: pre-wrap; }
      .footer { padding-top: 7px; text-align: center; font-size: 9px; }
      @media print { body { width: ${width}; } .sheet { padding: ${diseno === 'WAVE' ? '0 0 3mm' : '3mm'}; } }
    `;
  }

  // ── A4 limpio — inspirado en comprobante comercial argentino ────────────────
  return `
    @page { size: A4; margin: 14mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #fff;
      color: #222;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      line-height: 1.45;
    }
    .sheet {
      width: 100%;
      max-width: 178mm;
      min-height: 262mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    .body-content { flex: 1; }

    /* ── ENCABEZADO ─────────────────────────────────────── */
    .header-wrap {
      display: grid;
      grid-template-columns: 1fr 30mm 55mm;
      border: 1px solid #222;
      min-height: 36mm;
    }

    /* columna izquierda: nombre + datos emisor */
    .issuer-col {
      padding: 10px 12px;
      border-right: 1px solid #222;
    }
    .store-name {
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .store-subtitle {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 7px;
      letter-spacing: 0.5px;
    }
    .issuer-line {
      font-size: 9px;
      color: #333;
      margin-bottom: 1px;
    }

    /* columna central: letra fiscal */
    .letter-col {
      border-right: 1px solid #222;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px 4px;
    }
    .fiscal-letter {
      font-size: 44px;
      font-weight: 900;
      line-height: 1;
      color: #222;
    }
    .fiscal-cod-label {
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      color: #666;
      text-align: center;
      margin-top: 4px;
      line-height: 1.4;
    }

    /* columna derecha: tipo + número + fecha */
    .voucher-col {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .doc-type {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .doc-num {
      font-size: 12px;
      font-weight: 700;
      margin-top: 3px;
    }
    .doc-meta {
      font-size: 9px;
      color: #333;
      margin-top: 2px;
    }
    .doc-copy {
      font-size: 8px;
      color: #999;
      text-transform: uppercase;
      margin-top: auto;
    }

    /* barra fiscal del emisor bajo el header */
    .fiscal-bar {
      display: flex;
      border: 1px solid #222;
      border-top: 0;
      font-size: 9px;
    }
    .fiscal-bar .fb { padding: 4px 10px; border-right: 1px solid #ccc; }
    .fiscal-bar .fb:last-child { border-right: 0; }
    .fiscal-bar .fb-label { font-size: 7px; font-weight: 700; text-transform: uppercase; color: #888; display: block; }
    .fiscal-bar .fb-val { font-weight: 700; color: #222; }

    /* ── DATOS DEL CLIENTE ───────────────────────────────── */
    .cliente-block {
      margin-top: 8px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
      font-size: 9.5px;
    }
    .cliente-row { display: flex; flex-wrap: wrap; gap: 0 28px; margin-bottom: 2px; }
    .cliente-row span { color: #555; }
    .cliente-row b { color: #222; font-weight: 700; }

    /* barra vendedor/cajero/lista */
    .op-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0;
      border-bottom: 1px solid #eee;
      margin-bottom: 0;
      font-size: 9px;
    }
    .op-bar .ob { padding: 3px 12px 3px 0; margin-right: 12px; color: #555; }
    .op-bar .ob b { color: #222; font-weight: 700; }

    /* ── TABLA ───────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      page-break-inside: auto;
    }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th {
      border-bottom: 1.5px solid #222;
      border-top: 1.5px solid #222;
      padding: 5px 6px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #222;
      text-align: left;
      background: #fff;
    }
    th.right { text-align: right; }
    td {
      border-bottom: 1px solid #e8e8e8;
      padding: 6px 6px;
      vertical-align: top;
      font-size: 9.5px;
      color: #222;
    }
    tbody tr:last-child td { border-bottom: 1.5px solid #222; }
    .item-desc { font-weight: 600; }
    .item-code { font-size: 8px; color: #aaa; }
    .right { text-align: right; }
    .center { text-align: center; }

    /* ── TOTALES ─────────────────────────────────────────── */
    .bottom-section {
      display: grid;
      grid-template-columns: 1fr 58mm;
      gap: 0;
      margin-top: 10px;
      align-items: start;
    }
    .bottom-left {
      padding-right: 14px;
      font-size: 9px;
      color: #444;
    }
    .bottom-left .bl-row { margin-bottom: 3px; }
    .bottom-left .bl-row b { color: #222; }
    .importe-letras {
      margin-top: 8px;
      font-size: 8.5px;
      color: #555;
      font-style: italic;
      border-top: 1px solid #e0e0e0;
      padding-top: 6px;
      line-height: 1.5;
    }

    .totals-col { border-left: 1px solid #e0e0e0; padding-left: 12px; }
    .t-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 9.5px;
      border-bottom: 1px solid #f2f2f2;
      color: #444;
    }
    .t-row:last-child { border-bottom: 0; }
    .t-row b { color: #222; }
    .t-row.descuento b { color: #c0392b; }
    .t-total {
      display: flex;
      justify-content: space-between;
      padding: 7px 0 5px;
      border-top: 1.5px solid #222;
      margin-top: 4px;
      font-size: 14px;
      font-weight: 900;
      color: #222;
    }

    /* ── MENSAJE ─────────────────────────────────────────── */
    .msg-block {
      margin-top: 10px;
      font-size: 9px;
      color: #555;
      text-align: center;
      white-space: pre-wrap;
      line-height: 1.5;
      border-top: 1px dashed #ddd;
      padding-top: 7px;
    }

    /* ── CAE / QR ARCA ───────────────────────────────────── */
    .cae-section {
      margin-top: 12px;
      border-top: 1px solid #222;
      padding-top: 8px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 14px;
      align-items: center;
    }
    .cae-fields { display: flex; flex-wrap: wrap; gap: 6px 20px; }
    .cae-field .cf-label {
      font-size: 7px; font-weight: 700; text-transform: uppercase;
      color: #999; display: block; margin-bottom: 1px;
    }
    .cae-field .cf-val { font-size: 9.5px; font-weight: 700; color: #222; }
    .cae-field .cf-val.pending { color: #aaa; font-weight: 400; font-style: italic; font-size: 8.5px; }
    .qr { width: 28mm; height: 28mm; display: block; object-fit: contain; }
    .qr-label { font-size: 7px; color: #ccc; text-align: center; margin-top: 2px; }
    .qr-placeholder {
      width: 28mm; height: 28mm;
      border: 1px dashed #ddd;
      display: flex; align-items: center; justify-content: center;
      font-size: 7.5px; color: #ccc; text-align: center;
    }

    /* ── REMITO ──────────────────────────────────────────── */
    .dispatch-block {
      margin-top: 12px;
      border: 1px solid #ccc;
      padding: 10px 12px;
    }
    .dispatch-block h3 {
      font-size: 9.5px; font-weight: 700; text-transform: uppercase;
      color: #555; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;
    }
    .dispatch-summary {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 6px; margin-bottom: 10px;
    }
    .ds-box { border: 1px solid #e0e0e0; background: #fafafa; padding: 6px 8px; }
    .ds-box span { display: block; font-size: 7px; font-weight: 700; text-transform: uppercase; color: #999; }
    .ds-box strong { display: block; font-size: 14px; font-weight: 700; margin-top: 2px; }
    .pending-qty { color: #b45309; font-weight: 700; }

    .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
    .sig-box {
      min-height: 40px; border-top: 1px solid #222;
      padding-top: 5px; font-size: 8.5px; color: #999; text-align: center;
    }

    /* ── PIE ─────────────────────────────────────────────── */
    .page-footer {
      margin-top: auto; padding-top: 8px;
      border-top: 1px solid #e8e8e8;
      text-align: center; font-size: 8px; color: #ccc;
    }

    @media print {
      .sheet { padding: 0; }
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
};

// ─────────────────────────────────────────────
//  HTML — encabezado A4 estándar fiscal AFIP
// ─────────────────────────────────────────────
const condicionIva = (letra: string) => {
  if (letra === 'A') return 'Responsable Inscripto';
  if (letra === 'C') return 'Monotributista';
  if (letra === 'B') return 'Responsable Inscripto';
  return 'Responsable Inscripto';
};

const buildHeaderA4 = ({
  storeName,
  config,
  titulo,
  letraFiscal,
  codigoFiscal,
  numeroFiscal,
  comprobante,
  puntoVenta,
  esFiscal,
}: {
  storeName: string;
  config: Partial<IConfiguracionPosSucursal>;
  titulo: string;
  letraFiscal: string;
  codigoFiscal: string;
  numeroFiscal: string;
  comprobante: IComprobanteAux;
  puntoVenta: string;
  esFiscal: boolean;
}) => `
  <div class="header-wrap">
    <div class="issuer-col">
      <div class="store-name">${escapeHtml(storeName)}</div>
      ${config.razon_social_ticket ? `<div class="store-subtitle">${escapeHtml(config.razon_social_ticket)}</div>` : ''}
      ${config.domicilio_ticket ? `<div class="issuer-line">${escapeHtml(config.domicilio_ticket)}</div>` : ''}
      ${config.telefono_ticket ? `<div class="issuer-line">Tel: ${escapeHtml(config.telefono_ticket)}</div>` : ''}
      ${config.email_ticket ? `<div class="issuer-line">${escapeHtml(config.email_ticket)}</div>` : ''}
      ${config.web_ticket ? `<div class="issuer-line">${escapeHtml(config.web_ticket)}</div>` : ''}
    </div>
    <div class="letter-col">
      <div class="fiscal-letter">${escapeHtml(esFiscal ? letraFiscal : 'X')}</div>
      ${esFiscal
        ? `<div class="fiscal-cod-label">Cod.${escapeHtml(codigoFiscal || '000')}</div>`
        : '<div class="fiscal-cod-label">Documento<br>no fiscal</div>'}
    </div>
    <div class="voucher-col">
      <div class="doc-type">${escapeHtml(titulo)}</div>
      <div class="doc-num">Numero: ${escapeHtml(numeroFiscal || comprobante.numero)}</div>
      <div class="doc-meta">Fecha: ${escapeHtml(new Date(comprobante.created_at).toLocaleDateString('es-AR'))}</div>
      ${puntoVenta ? `<div class="doc-meta">Punto de venta: ${escapeHtml(puntoVenta)}</div>` : ''}
      <div class="doc-copy">Original</div>
    </div>
  </div>
  <div class="fiscal-bar">
    ${config.cuit_ticket ? `<div class="fb"><span class="fb-label">C.U.I.T.</span><span class="fb-val">${escapeHtml(config.cuit_ticket)}</span></div>` : ''}
    ${config.ingresos_brutos_ticket ? `<div class="fb"><span class="fb-label">Ing. Brutos</span><span class="fb-val">${escapeHtml(config.ingresos_brutos_ticket)}</span></div>` : ''}
    ${config.inicio_actividades_ticket ? `<div class="fb"><span class="fb-label">Inicio de Act.</span><span class="fb-val">${escapeHtml(config.inicio_actividades_ticket)}</span></div>` : ''}
    ${esFiscal ? `<div class="fb"><span class="fb-label">IVA</span><span class="fb-val">${escapeHtml(condicionIva(letraFiscal))}</span></div>` : ''}
  </div>
`;

// ─────────────────────────────────────────────
//  FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────
export const imprimirComprobante = (
  comprobante: IComprobanteAux,
  options: string | PrintOptions = 'Comprobante',
) => {
  const opts: PrintOptions = typeof options === 'string' ? { titulo: options } : options;
  const config = opts.config ?? {};
  const formato = opts.formato ?? config.formato_impresion_comprobante ?? 'BOLETA_A4';
  const thermal = isThermal(formato);
  const diseno = thermal ? (config.diseno_comprobante ?? 'BASICO') : 'CLASICO';
  const titulo = getTitle(comprobante, opts.titulo);
  const items = comprobante.items ?? [];
  const storeName =
    config.nombre_fantasia_ticket?.trim() ||
    config.razon_social_ticket?.trim() ||
    'Comercio';
  const message = thermal ? config.mensaje_ticket : config.mensaje_boleta;
  const showDetail = config.mostrar_detalle_productos !== false;
  const showFiscal = config.mostrar_datos_fiscales !== false;
  const showDiscounts = config.mostrar_descuentos !== false;
  const showRecargos = config.mostrar_recargos !== false;
  const despacho = opts.despacho ?? null;
  const listaPrecio = opts.listaPrecio ?? null;
  const ivaPorcentaje = toNumber(listaPrecio?.porcentaje_iva);
  const ivaCalculado =
    opts.ivaEstimado !== undefined && opts.ivaEstimado !== null
      ? toNumber(opts.ivaEstimado)
      : listaPrecio &&
          ivaPorcentaje > 0 &&
          ['AGREGAR_IVA', 'IVA_INCLUIDO'].includes(listaPrecio.modo_iva ?? '')
        ? toNumber(comprobante.subtotal) -
          toNumber(comprobante.subtotal) / (1 + ivaPorcentaje / 100)
        : 0;
  const isRemito = comprobante.tipo === 'REMITO' || titulo.toUpperCase() === 'REMITO';
  const remitoItems = items.filter((item) => toNumber(item.cantidad) > 0);
  const remitoCantidadPorDescripcion = new Map(
    remitoItems.map((item) => [
      String(item.descripcion).trim().toLowerCase(),
      toNumber(item.cantidad),
    ]),
  );
  const resumenDespacho = despacho?.items.reduce(
    (acc, item) => ({
      solicitado: acc.solicitado + toNumber(item.cantidad_solicitada),
      entregado: acc.entregado + toNumber(item.cantidad_despachada),
      pendiente: acc.pendiente + toNumber(item.cantidad_pendiente),
    }),
    { solicitado: 0, entregado: 0, pendiente: 0 },
  ) ?? { solicitado: 0, entregado: 0, pendiente: 0 };
  const entregadoEnRemito = remitoItems.reduce(
    (sum, item) => sum + toNumber(item.cantidad),
    0,
  );
  const puntoVenta = String(
    comprobante.punto_venta ?? config.punto_venta_arca ?? '',
  ).trim();
  const codigoFiscal = String(
    comprobante.codigo_fiscal ?? fiscalCodeFromType(comprobante.tipo),
  ).trim();
  const letraFiscal = fiscalLetterFromType(comprobante.tipo);
  const numeroFiscal = formatVoucherNumber(
    puntoVenta,
    comprobante.numero_secuencial ?? comprobante.numero,
  );
  const cae = String(comprobante.cae ?? '').trim();
  const caeVencimiento = formatDate(comprobante.cae_vencimiento);
  // Solo los comprobantes que se envian a ARCA llevan el bloque CAE/QR. En una
  // venta interna o un ticket, "Pendiente ARCA" se lee como un error y no lo es:
  // esos documentos nunca se autorizan. La NC interna tampoco (no tiene CAE).
  const esFiscal = esComprobanteFiscal(comprobante.tipo);
  // El PNG lo genera el backend y llega ya resuelto como data URI: la impresion
  // no debe depender de un servicio externo ni de tener internet.
  const qrSrc = opts.qrDataUri ?? '';

  // ── bloque térmico ──────────────────────────────────────────────────────────
  const thermalHtml = `
    <section class="brand">
      <div>
        <h1>${escapeHtml(storeName)}</h1>
        ${line('Razon social', config.razon_social_ticket)}
        ${line('Domicilio', config.domicilio_ticket)}
        ${line('Tel', config.telefono_ticket)}
        ${line('Email', config.email_ticket)}
        ${line('Web', config.web_ticket)}
      </div>
    </section>
    <div class="body-content">
      ${showFiscal ? `
        <section class="fiscal">
          ${line('CUIT', config.cuit_ticket)}
          ${line('IIBB', config.ingresos_brutos_ticket)}
          ${line('Inicio act.', config.inicio_actividades_ticket)}
          ${line('Pto. venta', puntoVenta)}
          ${line('Cod. fiscal', codigoFiscal)}
        </section>` : ''}
      <div class="doc-title">${escapeHtml(titulo)} — N° ${escapeHtml(numeroFiscal || comprobante.numero)}</div>
      <section class="meta">
        ${line('Fecha', formatDateTime(comprobante.created_at))}
        ${line('Cliente', comprobante.cliente_nombre || 'Consumidor final')}
        ${opts.vendedor ? line('Vendedor', opts.vendedor) : ''}
        ${opts.cajero ? line('Cajero', opts.cajero) : ''}
        ${listaPrecio ? line('Lista precio', listaPrecioLabel(listaPrecio)) : ''}
      </section>
      ${showDetail && items.length ? `
        <table>
          <thead><tr>
            <th>Descripcion</th>
            <th class="right">Cant</th>
            <th class="right">Importe</th>
          </tr></thead>
          <tbody>
            ${items.map((item) => `
              <tr>
                <td><div class="item-name">${escapeHtml(item.descripcion)}</div></td>
                <td class="right">${escapeHtml(formatQty(item.cantidad))}</td>
                <td class="right">${money(item.subtotal)}</td>
              </tr>`).join('')}
          </tbody>
        </table>` : ''}
      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>${money(comprobante.subtotal)}</span></div>
        ${showDiscounts && toNumber(comprobante.descuento_total) > 0 ? `<div class="total-row"><span>Descuento</span><span>-${money(comprobante.descuento_total)}</span></div>` : ''}
        ${showRecargos && toNumber(comprobante.recargo_total) > 0 ? `<div class="total-row"><span>Recargo</span><span>${money(comprobante.recargo_total)}</span></div>` : ''}
        ${ivaCalculado > 0 ? `<div class="total-row"><span>${escapeHtml(modoIvaLabel(listaPrecio?.modo_iva, listaPrecio?.porcentaje_iva) || 'IVA')}</span><span>${money(ivaCalculado)}</span></div>` : ''}
        <div class="grand"><span>TOTAL</span><span>${money(comprobante.total)}</span></div>
      </div>
      ${cae || caeVencimiento ? `
        <section class="fiscal-auth">
          ${line('CAE', cae)}
          ${line('Vto. CAE', caeVencimiento)}
        </section>` : ''}
      ${qrSrc ? `
        <section class="arca-footer">
          <img class="qr" src="${qrSrc}" alt="QR ARCA" />
          <div>Comprobante autorizado por ARCA</div>
        </section>` : ''}
      ${message ? `<section class="message">${escapeHtml(message)}</section>` : ''}
      <div class="footer">Comprobante emitido por sistema POS</div>
    </div>
  `;

  // ── bloque A4 ───────────────────────────────────────────────────────────────
  const remitoRows = (() => {
    if (!isRemito) return '';
    if (despacho?.items?.length) {
      return despacho.items.map((item) => {
        const key = String(item.descripcion).trim().toLowerCase();
        const cantRemito = remitoCantidadPorDescripcion.get(key) ?? 0;
        const pend = toNumber(item.cantidad_pendiente);
        return `<tr>
          <td><div class="item-desc">${escapeHtml(item.descripcion)}</div></td>
          <td class="right">${escapeHtml(formatQty(item.cantidad_solicitada))}</td>
          <td class="right"><b>${escapeHtml(formatQty(cantRemito))}</b></td>
          <td class="right">${escapeHtml(formatQty(item.cantidad_despachada))}</td>
          <td class="right ${pend > 0 ? 'pending-qty' : ''}">${escapeHtml(formatQty(item.cantidad_pendiente))}</td>
          <td>${escapeHtml(motivoPendienteLabel(item.motivo_pendiente) || (pend > 0 ? 'Pendiente' : 'Entregado'))}</td>
        </tr>`;
      }).join('');
    }
    return remitoItems.map((item) => `<tr>
      <td><div class="item-desc">${escapeHtml(item.descripcion)}</div></td>
      <td class="right">—</td>
      <td class="right"><b>${escapeHtml(formatQty(item.cantidad))}</b></td>
      <td class="right">${escapeHtml(formatQty(item.cantidad))}</td>
      <td class="right">0</td>
      <td>Entregado</td>
    </tr>`).join('') || '<tr><td colspan="6">Sin artículos.</td></tr>';
  })();

  const a4Html = `
    ${buildHeaderA4({ storeName, config, titulo, letraFiscal, codigoFiscal, numeroFiscal, comprobante, puntoVenta, esFiscal })}

    <div class="body-content">

      ${isRemito ? `
        <div class="dispatch-block" style="margin-top:10px">
          <h3>Remito de despacho</h3>
          <div class="dispatch-summary">
            <div class="ds-box"><span>Solicitado</span><strong>${escapeHtml(formatQty(resumenDespacho.solicitado || entregadoEnRemito))}</strong></div>
            <div class="ds-box"><span>Este remito</span><strong>${escapeHtml(formatQty(entregadoEnRemito))}</strong></div>
            <div class="ds-box"><span>Entregado</span><strong>${escapeHtml(formatQty(resumenDespacho.entregado || entregadoEnRemito))}</strong></div>
            <div class="ds-box"><span>Pendiente</span><strong class="${resumenDespacho.pendiente > 0 ? 'pending-qty' : ''}">${escapeHtml(formatQty(resumenDespacho.pendiente))}</strong></div>
          </div>
          <table>
            <thead><tr>
              <th style="width:36%">Artículo</th>
              <th class="right" style="width:12%">Solicitado</th>
              <th class="right" style="width:12%">Este remito</th>
              <th class="right" style="width:12%">Entregado</th>
              <th class="right" style="width:12%">Pendiente</th>
              <th style="width:16%">Estado</th>
            </tr></thead>
            <tbody>${remitoRows}</tbody>
          </table>
          <p style="margin-top:12px;font-size:8.5px;color:#888;border-top:1px solid #e8e8e8;padding-top:7px;">
            Al firmar este remito el receptor da conformidad a la mercadería recibida. Los artículos pendientes quedan registrados para retiro o entrega posterior.
          </p>
          <div class="signature-row">
            <div class="sig-box">Firma y aclaración — quien entrega</div>
            <div class="sig-box">Firma y aclaración — quien recibe</div>
          </div>
        </div>` : `

        <div class="cliente-block">
          <div class="cliente-row">
            <span>CLIENTE: <b>${escapeHtml(comprobante.cliente_nombre || 'Consumidor Final')}</b></span>
            ${comprobante.cliente_cuit || comprobante.cliente_dni ? `<span>C.U.I.T.: <b>${escapeHtml(comprobante.cliente_cuit || comprobante.cliente_dni || '')}</b></span>` : ''}
          </div>
          ${comprobante.cliente_domicilio ? `<div class="cliente-row"><span>DOMICILIO: <b>${escapeHtml(comprobante.cliente_domicilio)}</b></span></div>` : ''}
          ${comprobante.cliente_condicion_iva ? `<div class="cliente-row"><span>COND. IVA: <b>${escapeHtml(comprobante.cliente_condicion_iva)}</b></span></div>` : ''}
        </div>

        ${opts.vendedor || opts.cajero || listaPrecio ? `
          <div class="op-bar">
            ${opts.vendedor ? `<div class="ob">VENDEDOR: <b>${escapeHtml(opts.vendedor)}</b></div>` : ''}
            ${opts.cajero ? `<div class="ob">CAJERO: <b>${escapeHtml(opts.cajero)}</b></div>` : ''}
            ${listaPrecio ? `<div class="ob">LISTA: <b>${escapeHtml(listaPrecioLabel(listaPrecio))}</b></div>` : ''}
          </div>` : ''}

        ${showDetail && items.length ? `
          <table>
            <thead><tr>
              <th style="width:44%">Descripción</th>
              <th class="right" style="width:10%">Cantidad</th>
              <th class="right" style="width:18%">Precio</th>
              <th class="right" style="width:14%">Desc.</th>
              <th class="right" style="width:14%">Total</th>
            </tr></thead>
            <tbody>
              ${items.map((item) => `
                <tr>
                  <td><div class="item-desc">${escapeHtml(item.descripcion)}</div></td>
                  <td class="right">${escapeHtml(formatQty(item.cantidad))}</td>
                  <td class="right">${money(item.precio_unitario)}</td>
                  <td class="right">${toNumber(item.descuento_porcentaje) > 0 ? escapeHtml(String(item.descuento_porcentaje)) + '%' : '—'}</td>
                  <td class="right">${money(item.subtotal)}</td>
                </tr>`).join('')}
            </tbody>
          </table>` : ''}

        <div class="bottom-section">
          <div class="bottom-left">
            ${opts.vendedor ? `<div class="bl-row">VENDEDOR: <b>${escapeHtml(opts.vendedor)}</b></div>` : ''}
            ${listaPrecio ? `<div class="bl-row">LISTA: <b>${escapeHtml(listaPrecioLabel(listaPrecio))}</b></div>` : ''}
            ${comprobante.total_letras ? `<div class="importe-letras">IMPORTE EN PESOS: ${escapeHtml(comprobante.total_letras).toUpperCase()}</div>` : ''}
          </div>
          <div class="totals-col">
            <div class="t-row"><span>Subtotal</span><b>${money(comprobante.subtotal)}</b></div>
            ${showDiscounts && toNumber(comprobante.descuento_total) > 0 ? `<div class="t-row descuento"><span>Bonificación</span><b>- ${money(comprobante.descuento_total)}</b></div>` : ''}
            ${ivaCalculado > 0 ? `<div class="t-row"><span>${escapeHtml(modoIvaLabel(listaPrecio?.modo_iva, listaPrecio?.porcentaje_iva) || 'IVA')}</span><b>${money(ivaCalculado)}</b></div>` : ''}
            ${showRecargos && toNumber(comprobante.recargo_total) > 0 ? `<div class="t-row"><span>Recargos</span><b>${money(comprobante.recargo_total)}</b></div>` : ''}
            <div class="t-total"><span>TOTAL</span><span>${money(comprobante.total)}</span></div>
          </div>
        </div>

        ${message ? `<div class="msg-block">${escapeHtml(message)}</div>` : ''}

        ${showFiscal && esFiscal ? `
          <div class="cae-section">
            <div class="cae-fields">
              <div class="cae-field">
                <span class="cf-label">CAE N.°</span>
                <span class="cf-val ${cae ? '' : 'pending'}">${escapeHtml(cae || 'Pendiente ARCA')}</span>
              </div>
              <div class="cae-field">
                <span class="cf-label">Vto. CAE</span>
                <span class="cf-val ${caeVencimiento ? '' : 'pending'}">${escapeHtml(caeVencimiento || 'Pendiente')}</span>
              </div>
            </div>
            <div>
              ${qrSrc
                ? `<img class="qr" src="${qrSrc}" alt="QR ARCA" /><div class="qr-label">Verificar en ARCA</div>`
                : '<div class="qr-placeholder">QR ARCA<br>pendiente</div>'}
            </div>
          </div>` : ''}
      `}

    </div>

    <div class="page-footer">
      ${isRemito
        ? `Remito N.° ${escapeHtml(comprobante.numero)} — constancia de entrega de mercadería`
        : `${escapeHtml(titulo)} N.° ${escapeHtml(numeroFiscal || comprobante.numero)} — ${escapeHtml(new Date(comprobante.created_at).toLocaleDateString('es-AR'))}`}
    </div>
  `;

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(titulo)} ${escapeHtml(comprobante.numero)}</title>
    <style>${getStyles(formato, diseno)}</style>
  </head>
  <body>
    <main class="sheet">
      ${thermal ? thermalHtml : a4Html}
    </main>
    <script>
      window.addEventListener('load', () => { window.focus(); window.print(); });
    </script>
  </body>
</html>`;

  const printWindow = opts.printWindow ?? window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
