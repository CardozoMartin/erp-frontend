
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

const buildArcaQrUrl = ({
  comprobante,
  config,
  puntoVenta,
  codigoFiscal,
}: {
  comprobante: IComprobanteAux;
  config: Partial<IConfiguracionPosSucursal>;
  puntoVenta: string;
  codigoFiscal: string;
}) => {
  const cuit = onlyDigits(config.cuit_ticket);
  const cae = onlyDigits(comprobante.cae);
  if (!cuit || !cae || !puntoVenta || !codigoFiscal) return '';

  const payload = {
    ver: 1,
    fecha: new Date(comprobante.created_at).toISOString().slice(0, 10),
    cuit: Number(cuit),
    ptoVta: Number(onlyDigits(puntoVenta)),
    tipoCmp: Number(codigoFiscal),
    nroCmp: Number(onlyDigits(comprobante.numero_secuencial ?? comprobante.numero) || 0),
    importe: Number(toNumber(comprobante.total).toFixed(2)),
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: 99,
    nroDocRec: 0,
    tipoCodAut: 'E',
    codAut: Number(cae),
  };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `https://www.afip.gob.ar/fe/qr/?p=${encoded}`;
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
      .meta, .fiscal, .message, .observaciones { border-bottom: 1px dashed #111; padding: 7px 0; }
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

  // ── A4 / BOLETA — diseño renovado ─────────────────────────────────────────
  return `
    @page { size: A4; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #fff;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
    }
    .sheet { width: 100%; max-width: 186mm; min-height: 277mm; margin: 0 auto; }
    .body-content { padding: 0; }

    /* ── Encabezado: 3 columnas con letra fiscal ── */
    .brand {
      display: grid;
      grid-template-columns: 1fr 22mm 1fr;
      border: 1.5px solid #111827;
      min-height: 42mm;
    }
    .issuer-box, .voucher-box { padding: 10px 12px; }
    .issuer-box h1 {
      margin: 0 0 7px;
      font-size: 21px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .issuer-box p { line-height: 1.55; font-size: 10px; }

    /* letra fiscal central */
    .invoice-letter {
      border-left: 1.5px solid #111827;
      border-right: 1.5px solid #111827;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    .invoice-letter strong {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 20mm;
      border-bottom: 1.5px solid #111827;
      font-size: 36px;
      font-weight: 700;
      line-height: 1;
    }
    .invoice-letter span {
      font-size: 8px;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      padding: 5px 3px;
      line-height: 1.5;
    }

    /* columna derecha del encabezado */
    .voucher-box {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }
    .voucher-box .doc-type {
      font-size: 19px;
      font-weight: 700;
      text-transform: uppercase;
      text-align: right;
      margin-bottom: 5px;
    }
    .voucher-box .doc-num {
      font-size: 13px;
      font-weight: 700;
      text-align: right;
      margin-bottom: 7px;
      padding-bottom: 7px;
      border-bottom: 1px solid #d1d5db;
    }
    .voucher-box p { text-align: right; line-height: 1.6; font-size: 10px; }
    .voucher-box .doc-original {
      margin-top: 6px;
      font-size: 9px;
      color: #6b7280;
      text-align: right;
    }

    /* ── Barra fiscal del emisor ── */
    .fiscal-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border: 1px solid #111827;
      border-top: 0;
      border-bottom: 1.5px solid #111827;
    }
    .fiscal-bar > div {
      padding: 5px 8px;
      border-right: 1px solid #ccc;
      font-size: 10px;
      line-height: 1.5;
    }
    .fiscal-bar > div:last-child { border-right: 0; }
    .fiscal-bar strong {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 1px;
    }

    /* ── Datos del receptor ── */
    .receptor {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid #d1d5db;
      margin: 10px 0 0;
    }
    .receptor-title {
      grid-column: 1 / -1;
      background: #f3f4f6;
      padding: 4px 10px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4b5563;
      border-bottom: 1px solid #d1d5db;
    }
    .receptor > div {
      padding: 6px 10px;
      border-right: 1px solid #d1d5db;
      border-bottom: 1px solid #d1d5db;
      line-height: 1.6;
      font-size: 10px;
    }
    .receptor > div:nth-child(2n+2) { border-right: 0; }
    .receptor strong {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 1px;
    }

    /* ── Detalles de operación (vendedor, cajero, lista) ── */
    .operation-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      border: 1px solid #d1d5db;
      border-top: 0;
      margin-bottom: 2px;
    }
    .operation-details > div {
      padding: 5px 10px;
      border-right: 1px solid #d1d5db;
      font-size: 10px;
      line-height: 1.5;
    }
    .operation-details > div:last-child { border-right: 0; }
    .operation-details strong {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 1px;
    }

    /* ── Tabla de productos ── */
    table { width: 100%; border-collapse: collapse; margin-top: 12px; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 6px 7px;
      text-align: left;
      text-transform: uppercase;
      font-size: 8.5px;
      color: #4b5563;
      font-weight: 700;
    }
    td { border-bottom: 1px solid #e5e7eb; padding: 8px 7px; vertical-align: top; font-size: 10.5px; }
    tbody tr:nth-child(even) td { background: #fafafa; }
    .item-name { font-weight: 700; }
    .item-code { font-size: 9px; color: #9ca3af; margin-top: 1px; }
    .right { text-align: right; }

    /* ── Sección totales + tax box ── */
    .totals-section {
      display: grid;
      grid-template-columns: 1fr 72mm;
      gap: 16px;
      margin-top: 14px;
      align-items: start;
    }
    .tax-box {
      border: 1px solid #111827;
      font-size: 10.5px;
    }
    .tax-box .tax-head {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      background: #f3f4f6;
      border-bottom: 1px solid #111827;
    }
    .tax-box .tax-head span {
      padding: 5px 8px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4b5563;
      border-right: 1px solid #ccc;
    }
    .tax-box .tax-head span:last-child { border-right: 0; }
    .tax-box .tax-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
    }
    .tax-box .tax-row span {
      padding: 7px 8px;
      border-right: 1px solid #e5e7eb;
      font-size: 10.5px;
    }
    .tax-box .tax-row span:last-child {
      border-right: 0;
      text-align: right;
      font-weight: 700;
    }
    .importe-letras {
      margin-top: 7px;
      font-size: 9.5px;
      color: #6b7280;
      line-height: 1.4;
    }
    .totals-right { }
    .total-row { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
    .total-row:last-child { border-bottom: 0; }
    .grand {
      display: flex;
      justify-content: space-between;
      margin-top: 7px;
      padding-top: 9px;
      border-top: 2px solid #111827;
      font-size: 18px;
      font-weight: 700;
    }

    /* ── Remito ── */
    .remito-doc .doc-title { margin-bottom: 6px; border-bottom: 0; padding-bottom: 0; }
    .remito-subtitle { margin: -4px 0 12px; color: #6b7280; font-size: 11px; }
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
    .party-box { border: 1px solid #d1d5db; padding: 10px 12px; min-height: 70px; }
    .party-box h2 { margin: 0 0 7px; color: #6b7280; font-size: 10px; text-transform: uppercase; }
    .party-box div { line-height: 1.5; font-size: 10.5px; }
    .delivery-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0 14px; }
    .delivery-summary div { border: 1px solid #d1d5db; background: #fafafa; padding: 8px 10px; }
    .delivery-summary span { display: block; color: #6b7280; font-size: 8.5px; font-weight: 700; text-transform: uppercase; }
    .delivery-summary strong { display: block; margin-top: 3px; font-size: 16px; }
    .remito-table th:nth-child(1) { width: 37%; }
    .remito-table th:nth-child(2),
    .remito-table th:nth-child(3),
    .remito-table th:nth-child(4),
    .remito-table th:nth-child(5) { width: 12%; }
    .pending-note { color: #92400e; font-weight: 700; }
    .terms { margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 10px; color: #6b7280; font-size: 10.5px; line-height: 1.5; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 28px; }
    .signature-box { min-height: 52px; border-top: 1px solid #111827; padding-top: 7px; color: #6b7280; font-size: 10.5px; text-align: center; }

    /* ── CAE / ARCA ── */
    .auth-grid {
      display: grid;
      grid-template-columns: 1fr 38mm;
      gap: 14px;
      align-items: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1.5px solid #111827;
    }
    .auth-lines {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 7px 14px;
    }
    .auth-lines div {
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 5px;
    }
    .auth-lines div span {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 2px;
    }
    .auth-lines div strong { font-size: 11px; }
    .qr { width: 34mm; height: 34mm; object-fit: contain; display: block; margin-left: auto; }
    .qr-placeholder {
      width: 34mm;
      height: 34mm;
      margin-left: auto;
      border: 1px dashed #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      font-size: 9px;
      text-align: center;
      padding: 4px;
    }

    /* ── Observaciones / mensaje ── */
    .message, .observaciones {
      margin-top: 16px;
      border: 1px solid #e5e7eb;
      border-left: 3px solid ${accent};
      padding: 9px 12px;
      white-space: pre-wrap;
      font-size: 10.5px;
    }

    /* ── Despacho ── */
    .dispatch { margin-top: 16px; border: 1px solid #e5e7eb; padding: 12px; }
    .dispatch-title { margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
    .status-card { border: 1px solid #e5e7eb; background: #fafafa; padding: 8px; }
    .status-card span { display: block; color: #6b7280; font-size: 8.5px; font-weight: 700; text-transform: uppercase; }
    .status-card strong { display: block; margin-top: 3px; font-size: 15px; }

    /* ── Pie ── */
    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 9.5px;
    }

    /* ── Cotización / sin tipo fiscal ── */
    .doc-title {
      margin: 14px 0 10px;
      padding-bottom: 7px;
      border-bottom: 1px solid #d1d5db;
      font-size: 19px;
      font-weight: 700;
      text-transform: uppercase;
    }

    @media print {
      .sheet { padding: 0; }
      th, thead tr,
      .fiscal-bar, .receptor-title,
      tbody tr:nth-child(even) td,
      .status-card, .delivery-summary div,
      .auth-lines div, .tax-box .tax-head {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
};

// ─────────────────────────────────────────────
//  HTML — bloque brand A4 (reemplaza el anterior)
// ─────────────────────────────────────────────
const buildBrandA4 = ({
  storeName,
  config,
  titulo,
  isRemito,
  letraFiscal,
  codigoFiscal,
  numeroFiscal,
  comprobante,
  puntoVenta,
}: {
  storeName: string;
  config: Partial<IConfiguracionPosSucursal>;
  titulo: string;
  isRemito: boolean;
  letraFiscal: string;
  codigoFiscal: string;
  numeroFiscal: string;
  comprobante: IComprobanteAux;
  puntoVenta: string;
}) => `
  <section class="brand">
    <div class="issuer-box">
      <h1>${escapeHtml(storeName)}</h1>
      ${config.razon_social_ticket ? `<p><strong>Razón social:</strong> ${escapeHtml(config.razon_social_ticket)}</p>` : ''}
      ${config.domicilio_ticket ? `<p><strong>Domicilio:</strong> ${escapeHtml(config.domicilio_ticket)}</p>` : ''}
      ${config.telefono_ticket ? `<p><strong>Tel:</strong> ${escapeHtml(config.telefono_ticket)}</p>` : ''}
      ${config.email_ticket ? `<p><strong>Email:</strong> ${escapeHtml(config.email_ticket)}</p>` : ''}
      ${config.web_ticket ? `<p><strong>Web:</strong> ${escapeHtml(config.web_ticket)}</p>` : ''}
    </div>
    <div class="invoice-letter">
      <strong>${escapeHtml(letraFiscal)}</strong>
      <span>Código<br>${escapeHtml(codigoFiscal || '-')}</span>
    </div>
    <div class="voucher-box">
      <div class="doc-type">${escapeHtml(isRemito ? 'Remito' : titulo)}</div>
      <div class="doc-num">N° ${escapeHtml(numeroFiscal || comprobante.numero)}</div>
      <p><strong>Fecha de emisión:</strong> ${escapeHtml(new Date(comprobante.created_at).toLocaleDateString('es-AR'))}</p>
      ${puntoVenta ? `<p><strong>Punto de venta:</strong> ${escapeHtml(puntoVenta)}</p>` : ''}
      <p class="doc-original">ORIGINAL — Documento generado por sistema</p>
    </div>
  </section>
  <div class="fiscal-bar">
    ${config.cuit_ticket ? `<div><strong>CUIT</strong>${escapeHtml(config.cuit_ticket)}</div>` : ''}
    ${config.ingresos_brutos_ticket ? `<div><strong>Ing. Brutos</strong>${escapeHtml(config.ingresos_brutos_ticket)}</div>` : ''}
    ${config.inicio_actividades_ticket ? `<div><strong>Inicio actividades</strong>${escapeHtml(config.inicio_actividades_ticket)}</div>` : ''}
    <div><strong>Condición IVA</strong>${escapeHtml(letraFiscal === 'A' ? 'Responsable Inscripto' : letraFiscal === 'C' ? 'Monotributista' : 'Responsable Inscripto')}</div>
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
  const showObservaciones = config.mostrar_observaciones !== false;
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
  const baseImponible =
    ivaCalculado > 0 ? toNumber(comprobante.subtotal) - ivaCalculado : 0;
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
  const documentoOrigen =
    despacho?.comprobante?.numero ?? comprobante.comprobante_origen_id ?? '';
  const fechaEntrega = despacho?.fecha_despacho ?? comprobante.created_at;
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
  const qrUrl = buildArcaQrUrl({ comprobante, config, puntoVenta, codigoFiscal });

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(titulo)} ${escapeHtml(comprobante.numero)}</title>
        <style>${getStyles(formato, diseno)}</style>
      </head>
      <body>
        <main class="sheet design-${escapeHtml(diseno.toLowerCase())} ${isRemito ? 'remito-doc' : ''}">
          ${
            thermal
              ? `
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
          `
              : buildBrandA4({
                  storeName,
                  config,
                  titulo,
                  isRemito,
                  letraFiscal,
                  codigoFiscal,
                  numeroFiscal,
                  comprobante,
                  puntoVenta,
                })
          }

          <div class="body-content">

          ${
            showFiscal && thermal
              ? `
            <section class="fiscal">
              ${line('CUIT', config.cuit_ticket)}
              ${line('IIBB', config.ingresos_brutos_ticket)}
              ${line('Inicio act.', config.inicio_actividades_ticket)}
              ${line('Pto. venta', puntoVenta)}
              ${line('Cod. fiscal', codigoFiscal)}
            </section>
          `
              : ''
          }

          ${
            isRemito
              ? `
            <div class="doc-title">Remito de despacho</div>
            <div class="remito-subtitle">Documento de control de entrega de mercadería. No reemplaza factura o comprobante fiscal.</div>
            <section class="party-grid">
              <div class="party-box">
                <h2>Entrega</h2>
                ${line('Remito', comprobante.numero)}
                ${line('Fecha de entrega', new Date(fechaEntrega).toLocaleString('es-AR'))}
                ${line('Comprobante origen', documentoOrigen)}
                ${line('Estado despacho', despacho?.estado ?? comprobante.estado)}
              </div>
              <div class="party-box">
                <h2>Destinatario</h2>
                ${line('Cliente', comprobante.cliente_id || despacho?.comprobante?.cliente_id || 'Consumidor final')}
                ${line('Condicion', 'Entrega de mercaderia')}
              </div>
            </section>
          `
              : `
            <div class="receptor">
              <div class="receptor-title">Datos del receptor</div>
              <div><strong>Cliente</strong>${escapeHtml(comprobante.cliente_nombre || comprobante.cliente_id || 'Consumidor final')}</div>
              <div><strong>CUIT / DNI</strong>${escapeHtml(comprobante.cliente_cuit || comprobante.cliente_dni || 'Consumidor final')}</div>
              <div><strong>Domicilio</strong>${escapeHtml(comprobante.cliente_domicilio || '-')}</div>
              <div><strong>Condición IVA receptor</strong>${escapeHtml(comprobante.cliente_condicion_iva || 'Consumidor Final')}</div>
            </div>
          `
          }

          ${
            !isRemito && (opts.vendedor || opts.cajero || listaPrecio)
              ? `
            <div class="operation-details">
              ${opts.vendedor ? `<div><strong>Vendedor</strong>${escapeHtml(opts.vendedor)}</div>` : ''}
              ${opts.cajero ? `<div><strong>Cajero</strong>${escapeHtml(opts.cajero)}</div>` : ''}
              ${listaPrecio ? `<div><strong>Lista de precio</strong>${escapeHtml(listaPrecioLabel(listaPrecio))}</div>` : ''}
            </div>
          `
              : ''
          }

          ${
            isRemito
              ? `
            <section class="delivery-summary">
              <div><span>Solicitado</span><strong>${escapeHtml(formatQty(resumenDespacho.solicitado || entregadoEnRemito))}</strong></div>
              <div><span>Este remito</span><strong>${escapeHtml(formatQty(entregadoEnRemito))}</strong></div>
              <div><span>Entregado total</span><strong>${escapeHtml(formatQty(resumenDespacho.entregado || entregadoEnRemito))}</strong></div>
              <div><span>Pendiente</span><strong>${escapeHtml(formatQty(resumenDespacho.pendiente))}</strong></div>
            </section>
            <section>
              <table class="remito-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="right">Solicitado</th>
                    <th class="right">Este remito</th>
                    <th class="right">Entregado</th>
                    <th class="right">Pendiente</th>
                    <th>Motivo / estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    despacho?.items?.length
                      ? despacho.items
                          .map((item) => {
                            const key = String(item.descripcion).trim().toLowerCase();
                            const cantidadRemito = remitoCantidadPorDescripcion.get(key) ?? 0;
                            const pendiente = toNumber(item.cantidad_pendiente);
                            return `
                            <tr>
                              <td><div class="item-name">${escapeHtml(item.descripcion)}</div></td>
                              <td class="right">${escapeHtml(formatQty(item.cantidad_solicitada))}</td>
                              <td class="right"><strong>${escapeHtml(formatQty(cantidadRemito))}</strong></td>
                              <td class="right">${escapeHtml(formatQty(item.cantidad_despachada))}</td>
                              <td class="right ${pendiente > 0 ? 'pending-note' : ''}">${escapeHtml(formatQty(item.cantidad_pendiente))}</td>
                              <td>${escapeHtml(motivoPendienteLabel(item.motivo_pendiente) || (pendiente > 0 ? 'Pendiente' : 'Entregado'))}</td>
                            </tr>
                          `;
                          })
                          .join('')
                      : remitoItems.length
                        ? remitoItems
                            .map(
                              (item) => `
                              <tr>
                                <td><div class="item-name">${escapeHtml(item.descripcion)}</div></td>
                                <td class="right">-</td>
                                <td class="right"><strong>${escapeHtml(formatQty(item.cantidad))}</strong></td>
                                <td class="right">${escapeHtml(formatQty(item.cantidad))}</td>
                                <td class="right">0</td>
                                <td>Entregado</td>
                              </tr>
                            `
                            )
                            .join('')
                        : `<tr><td colspan="6">Sin productos entregados en este remito.</td></tr>`
                  }
                </tbody>
              </table>
            </section>
          `
              : showDetail
                ? `
            <table>
              <thead>
                <tr>
                  <th>Producto / Descripción</th>
                  <th class="right" style="width:8%">Cant.</th>
                  <th class="right" style="width:15%">P.U. Neto</th>
                  <th class="right" style="width:12%">Imp. Nac.</th>
                  <th class="right" style="width:15%">Importe Total</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                      <tr>
                        <td>
                          <div class="item-name">${escapeHtml(item.descripcion)}</div>
                          ${item.codigo ? `<div class="item-code">Cód. ${escapeHtml(item.codigo)}</div>` : ''}
                        </td>
                        <td class="right">${escapeHtml(formatQty(item.cantidad))}</td>
                        <td class="right">${money(toNumber(item.precio_unitario) / (1 + (ivaPorcentaje || 21) / 100))}</td>
                        <td class="right">${money(toNumber(item.precio_unitario) - toNumber(item.precio_unitario) / (1 + (ivaPorcentaje || 21) / 100))}</td>
                        <td class="right">${money(item.subtotal)}</td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          `
                : ''
          }

          ${
            !isRemito
              ? `
            <div class="totals-section">
              <div>
                <div class="tax-box">
                  <div class="tax-head">
                    <span>Neto gravado</span>
                    <span>IVA / Impuestos</span>
                    <span>Total</span>
                  </div>
                  <div class="tax-row">
                    <span>${money(baseImponible || comprobante.subtotal)}</span>
                    <span>${money(ivaCalculado)}</span>
                    <span>${money(comprobante.total)}</span>
                  </div>
                </div>
                ${comprobante.total_letras ? `<p class="importe-letras">Son Pesos: <strong>${escapeHtml(comprobante.total_letras)}</strong></p>` : ''}
              </div>
              <div class="totals-right">
                <div class="total-row"><span>Subtotal</span><strong>${money(comprobante.subtotal)}</strong></div>
                ${showDiscounts ? `<div class="total-row"><span>Descuentos</span><strong>${money(comprobante.descuento_total)}</strong></div>` : ''}
                ${showRecargos ? `<div class="total-row"><span>Recargos</span><strong>${money(comprobante.recargo_total)}</strong></div>` : ''}
                ${ivaCalculado > 0 ? `<div class="total-row"><span>${escapeHtml(modoIvaLabel(listaPrecio?.modo_iva, listaPrecio?.porcentaje_iva) || 'IVA')}</span><strong>${money(ivaCalculado)}</strong></div>` : ''}
                <div class="grand"><span>TOTAL</span><span>${money(comprobante.total)}</span></div>
              </div>
            </div>
          `
              : ''
          }

          ${
            despacho && !isRemito
              ? `
            <section class="dispatch">
              <div class="dispatch-title">Estado del despacho</div>
              <div><strong>Estado:</strong> ${escapeHtml(despacho.estado)}</div>
              <div class="status-grid">
                <div class="status-card"><span>Solicitado</span><strong>${escapeHtml(resumenDespacho.solicitado)}</strong></div>
                <div class="status-card"><span>Entregado total</span><strong>${escapeHtml(resumenDespacho.entregado)}</strong></div>
                <div class="status-card"><span>Pendiente</span><strong>${escapeHtml(resumenDespacho.pendiente)}</strong></div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="right">Solicitado</th>
                    <th class="right">Entregado</th>
                    <th class="right">Pendiente</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  ${despacho.items
                    .map(
                      (item) => `
                        <tr>
                          <td>${escapeHtml(item.descripcion)}</td>
                          <td class="right">${escapeHtml(item.cantidad_solicitada)}</td>
                          <td class="right">${escapeHtml(item.cantidad_despachada)}</td>
                          <td class="right">${escapeHtml(item.cantidad_pendiente)}</td>
                          <td>${escapeHtml(motivoPendienteLabel(item.motivo_pendiente))}</td>
                        </tr>
                      `
                    )
                    .join('')}
                </tbody>
              </table>
            </section>
          `
              : ''
          }

          ${
            showObservaciones && comprobante.observaciones
              ? `<section class="observaciones"><strong>Observaciones:</strong> ${escapeHtml(comprobante.observaciones)}</section>`
              : ''
          }

          ${
            !isRemito && !thermal
              ? `
            <section class="auth-grid">
              <div class="auth-lines">
                <div>
                  <span>CAE N°</span>
                  <strong>${escapeHtml(cae || 'Pendiente de autorización ARCA')}</strong>
                </div>
                <div>
                  <span>Fecha de vto. CAE</span>
                  <strong>${escapeHtml(caeVencimiento || 'Pendiente')}</strong>
                </div>
                <div>
                  <span>Código fiscal</span>
                  <strong>${escapeHtml(codigoFiscal || fiscalCodeFromType(comprobante.tipo) || '-')}</strong>
                </div>
                <div>
                  <span>Punto de venta</span>
                  <strong>${escapeHtml(puntoVenta || '-')}</strong>
                </div>
              </div>
              <div>
                ${
                  qrUrl
                    ? `<img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}" alt="QR ARCA" />`
                    : '<div class="qr-placeholder">QR ARCA<br>pendiente</div>'
                }
              </div>
            </section>
          `
              : ''
          }

          ${
            !isRemito && thermal && (cae || caeVencimiento || qrUrl)
              ? `
            <section class="fiscal-auth">
              ${line('CAE', cae)}
              ${line('Vto. CAE', caeVencimiento)}
              ${line('ARCA QR', qrUrl ? 'Disponible' : '')}
            </section>
          `
              : ''
          }

          ${message ? `<section class="message"><strong>Mensaje:</strong><br />${escapeHtml(message)}</section>` : ''}

          ${
            isRemito
              ? `
            <section class="terms">
              Al firmar este remito, el receptor deja constancia de la mercadería entregada en las cantidades indicadas.
              Los productos pendientes quedan registrados para retiro o entrega posterior.
            </section>
            <section class="signature-grid">
              <div class="signature-box">Firma y aclaración de quien entrega</div>
              <div class="signature-box">Firma y aclaración de quien recibe</div>
            </section>
          `
              : ''
          }

          <section class="footer">
            ${isRemito ? 'Remito emitido como constancia de entrega de mercadería.' : 'Comprobante emitido por sistema POS'}
          </section>
          </div>
        </main>
        <script>
          window.addEventListener('load', () => {
            window.focus();
            window.print();
          });
        </script>
      </body>
    </html>
  `;

  const printWindow = opts.printWindow ?? window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
