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
  const ajuste = lista.tipo_ajuste && toNumber(lista.porcentaje) > 0
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
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
};

const isThermal = (formato: string) => formato === 'TICKET_80MM' || formato === 'TICKET_58MM';

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

const getStyles = (formato: string, diseno: string) => {
  const thermal = isThermal(formato);
  const width = formato === 'TICKET_58MM' ? '58mm' : '80mm';
  const accent = '#075E54';

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

  return `
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #fff;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
    }
    .sheet { width: 100%; max-width: 190mm; min-height: 273mm; margin: 0 auto; padding: ${diseno === 'WAVE' ? '0 0 14px' : '0'}; overflow: hidden; }
    .body-content { padding: ${diseno === 'WAVE' ? '0 6mm' : '0'}; }
    .brand {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 22mm minmax(0, 1fr);
      gap: 0;
      align-items: stretch;
      border: 1.5px solid #111827;
      min-height: 48mm;
    }
    .design-wave .brand {
      position: relative;
      background: ${accent};
      color: #fff;
      border-bottom: 0;
      padding: 22px 7mm 40px;
      margin-bottom: 16px;
    }
    .design-wave .brand::after {
      content: "";
      position: absolute;
      left: -5%;
      right: -5%;
      bottom: -24px;
      height: 52px;
      background: #fff;
      border-radius: 0 0 50% 50%;
    }
    .design-wave .brand > div { position: relative; z-index: 1; }
    .design-clasico .brand { border: 1.5px solid #111827; }
    .issuer-box, .voucher-box { padding: 12px 14px; }
    .brand h1 { margin: 0 0 8px; font-size: 23px; letter-spacing: 0; text-transform: uppercase; }
    .brand div { line-height: 1.45; }
    .invoice-letter {
      display: flex;
      flex-direction: column;
      align-items: center;
      border-left: 1.5px solid #111827;
      border-right: 1.5px solid #111827;
      text-align: center;
    }
    .invoice-letter strong {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 17mm;
      height: 17mm;
      border: 1.5px solid #111827;
      border-top: 0;
      font-size: 28px;
      line-height: 1;
    }
    .invoice-letter span {
      display: block;
      padding-top: 5px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .doc-badge {
      border: 0;
      padding: 0;
      text-align: right;
      background: transparent;
    }
    .design-wave .doc-badge {
      border-color: rgba(255,255,255,0.45);
      background: rgba(255,255,255,0.12);
      color: #fff;
    }
    .doc-badge strong { display: block; font-size: 20px; text-transform: uppercase; }
    .doc-badge span { display: block; margin-top: 4px; font-size: 12px; }
    .doc-title {
      margin: 18px 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #d1d5db;
      font-size: 20px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .design-wave .doc-title { color: ${accent}; }
    .design-clasico .doc-title { border-bottom: 2px solid #111827; padding-bottom: 8px; }
    .meta, .fiscal {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      margin: 0 0 12px;
      border: 1px solid #e5e7eb;
      border-bottom: 0;
    }
    .fiscal-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border: 1px solid #111827;
      border-bottom: 0;
      margin: 12px 0;
    }
    .fiscal-summary div {
      min-height: 30px;
      padding: 7px 9px;
      border-right: 1px solid #111827;
      border-bottom: 1px solid #111827;
    }
    .fiscal-summary div:nth-child(4n) { border-right: 0; }
    .fiscal-summary strong {
      display: block;
      margin-bottom: 2px;
      font-size: 9px;
      text-transform: uppercase;
    }
    .meta div, .fiscal div {
      min-height: 34px;
      padding: 8px 10px;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
    }
    .meta div:nth-child(3n), .fiscal div:nth-child(3n) { border-right: 0; }
    .meta strong, .fiscal strong {
      display: block;
      margin-bottom: 2px;
      color: #4b5563;
      font-size: 10px;
      text-transform: uppercase;
    }
    .operation-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 12px 0;
    }
    .operation-details div {
      min-height: 42px;
      border: 1px solid #e5e7eb;
      background: #fbfbfc;
      padding: 8px 10px;
    }
    .operation-details strong {
      display: block;
      margin-bottom: 3px;
      color: #4b5563;
      font-size: 10px;
      text-transform: uppercase;
    }
    .remito-doc .doc-title {
      margin-bottom: 8px;
      border-bottom: 0;
      padding-bottom: 0;
    }
    .remito-subtitle {
      margin: -4px 0 14px;
      color: #4b5563;
      font-size: 12px;
    }
    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 12px 0;
    }
    .party-box {
      min-height: 74px;
      border: 1px solid #e5e7eb;
      padding: 10px 12px;
    }
    .party-box h2 {
      margin: 0 0 8px;
      color: #4b5563;
      font-size: 11px;
      text-transform: uppercase;
    }
    .party-box div { line-height: 1.5; }
    .delivery-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin: 12px 0 14px;
    }
    .delivery-summary div {
      border: 1px solid #e5e7eb;
      background: #fbfbfc;
      padding: 8px 10px;
    }
    .delivery-summary span {
      display: block;
      color: #4b5563;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .delivery-summary strong {
      display: block;
      margin-top: 3px;
      font-size: 16px;
    }
    .remito-table th:nth-child(1) { width: 37%; }
    .remito-table th:nth-child(2),
    .remito-table th:nth-child(3),
    .remito-table th:nth-child(4),
    .remito-table th:nth-child(5) { width: 12%; }
    .pending-note { color: #92400e; font-weight: 700; }
    .terms {
      margin-top: 16px;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
      color: #4b5563;
      font-size: 11px;
      line-height: 1.45;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
      margin-top: 26px;
    }
    .signature-box {
      min-height: 52px;
      border-top: 1px solid #111827;
      padding-top: 7px;
      color: #4b5563;
      font-size: 11px;
      text-align: center;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 9px 7px; vertical-align: top; }
    th {
      background: #f3f4f6;
      text-align: left;
      text-transform: uppercase;
      font-size: 10px;
      color: #4b5563;
    }
    tbody tr:nth-child(even) td { background: #fbfbfc; }
    .item-name { font-weight: 700; }
    .right { text-align: right; }
    .totals {
      margin-left: auto;
      margin-top: 16px;
      width: 76mm;
      border-top: 1px solid #111827;
      padding-top: 6px;
    }
    .tax-box {
      margin-top: 16px;
      width: 96mm;
      border: 1px solid #111827;
      border-bottom: 0;
    }
    .tax-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      border-bottom: 1px solid #111827;
    }
    .tax-row span, .tax-row strong { padding: 6px 8px; border-right: 1px solid #111827; }
    .tax-row :last-child { border-right: 0; text-align: right; }
    .tax-head { background: #f3f4f6; font-size: 10px; text-transform: uppercase; }
    .auth-grid {
      display: grid;
      grid-template-columns: 1fr 38mm;
      gap: 14px;
      align-items: end;
      margin-top: 18px;
      border-top: 1px solid #111827;
      padding-top: 12px;
    }
    .auth-lines {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 7px 14px;
    }
    .auth-lines div { border-bottom: 1px solid #d1d5db; padding-bottom: 5px; }
    .qr { width: 34mm; height: 34mm; object-fit: contain; display: block; margin-left: auto; }
    .qr-placeholder {
      width: 34mm;
      height: 34mm;
      margin-left: auto;
      border: 1px dashed #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      font-size: 10px;
      text-align: center;
      padding: 4px;
    }
    .total-row { display: flex; justify-content: space-between; gap: 18px; padding: 5px 0; }
    .grand {
      border-top: 2px solid #111827;
      margin-top: 6px;
      padding-top: 10px;
      font-size: 19px;
      font-weight: 700;
    }
    .message, .observaciones {
      margin-top: 18px;
      border: 1px solid #e5e7eb;
      border-left: 3px solid ${accent};
      padding: 10px 12px;
      white-space: pre-wrap;
    }
    .dispatch { margin-top: 18px; border: 1px solid #e5e7eb; padding: 12px; }
    .dispatch-title { margin: 0 0 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #111827; }
    .status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
    .status-card { border: 1px solid #e5e7eb; background: #fbfbfc; padding: 8px; }
    .status-card span { display: block; color: #4b5563; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .status-card strong { display: block; margin-top: 3px; font-size: 15px; }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #4b5563;
      font-size: 11px;
    }
    @media print {
      .sheet { padding: ${diseno === 'WAVE' ? '0 0 14px' : '0'}; }
      .doc-badge, th, tbody tr:nth-child(even) td, .status-card, .delivery-summary div { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
};

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
    remitoItems.map((item) => [String(item.descripcion).trim().toLowerCase(), toNumber(item.cantidad)]),
  );
  const resumenDespacho = despacho?.items.reduce(
    (acc, item) => ({
      solicitado: acc.solicitado + toNumber(item.cantidad_solicitada),
      entregado: acc.entregado + toNumber(item.cantidad_despachada),
      pendiente: acc.pendiente + toNumber(item.cantidad_pendiente),
    }),
    { solicitado: 0, entregado: 0, pendiente: 0 },
  ) ?? { solicitado: 0, entregado: 0, pendiente: 0 };
  const entregadoEnRemito = remitoItems.reduce((sum, item) => sum + toNumber(item.cantidad), 0);
  const documentoOrigen = despacho?.comprobante?.numero ?? comprobante.comprobante_origen_id ?? '';
  const fechaEntrega = despacho?.fecha_despacho ?? comprobante.created_at;
  const puntoVenta = String(comprobante.punto_venta ?? config.punto_venta_arca ?? '').trim();
  const codigoFiscal = String(comprobante.codigo_fiscal ?? fiscalCodeFromType(comprobante.tipo)).trim();
  const letraFiscal = fiscalLetterFromType(comprobante.tipo);
  const numeroFiscal = formatVoucherNumber(puntoVenta, comprobante.numero_secuencial ?? comprobante.numero);
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
          ${thermal ? `
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
          ` : `
            <section class="brand">
              <div class="issuer-box">
                <h1>${escapeHtml(storeName)}</h1>
                ${line('Razon social', config.razon_social_ticket)}
                ${line('Domicilio comercial', config.domicilio_ticket)}
                ${line('Telefono', config.telefono_ticket)}
                ${line('Email', config.email_ticket)}
                ${line('Web', config.web_ticket)}
              </div>
              <div class="invoice-letter">
                <strong>${escapeHtml(letraFiscal)}</strong>
                <span>Codigo ${escapeHtml(codigoFiscal || '-')}</span>
              </div>
              <div class="voucher-box">
                <div class="doc-badge">
                  <strong>${escapeHtml(isRemito ? 'Remito' : titulo)}</strong>
                  <span>Nro. ${escapeHtml(numeroFiscal || comprobante.numero)}</span>
                  ${line('Fecha de emision', formatDate(comprobante.created_at))}
                  ${line('Punto de venta', puntoVenta)}
                  ${line('Original', 'Documento generado por sistema')}
                </div>
              </div>
            </section>
          `}

          <div class="body-content">
          <div class="doc-title">${escapeHtml(isRemito ? 'Remito de despacho' : titulo)}</div>
          ${isRemito ? '<div class="remito-subtitle">Documento de control de entrega de mercaderia. No reemplaza factura o comprobante fiscal.</div>' : ''}

          ${showFiscal && thermal ? `
            <section class="fiscal">
              ${line('CUIT', config.cuit_ticket)}
              ${line('IIBB', config.ingresos_brutos_ticket)}
              ${line('Inicio act.', config.inicio_actividades_ticket)}
              ${line('Pto. venta', puntoVenta)}
              ${line('Cod. fiscal', codigoFiscal)}
            </section>
          ` : ''}
          ${showFiscal && !thermal ? `
            <section class="fiscal-summary">
              ${line('CUIT', config.cuit_ticket)}
              ${line('Ingresos Brutos', config.ingresos_brutos_ticket)}
              ${line('Inicio actividades', config.inicio_actividades_ticket)}
              ${line('Condicion IVA', letraFiscal === 'A' ? 'Responsable Inscripto' : 'Consumidor final / Exento')}
            </section>
          ` : ''}

          ${isRemito ? `
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
                ${line('Domicilio', '')}
                ${line('Condicion', 'Entrega de mercaderia')}
              </div>
            </section>
          ` : `
            <section class="meta">
              ${line('Numero', thermal ? comprobante.numero : numeroFiscal || comprobante.numero)}
              ${line('Fecha', formatDateTime(comprobante.created_at))}
              ${line('Tipo', comprobante.tipo)}
              ${line('Estado', comprobante.estado)}
              ${line('Cliente', comprobante.cliente_id || 'Consumidor final')}
              ${line('CUIT/DNI receptor', 'Consumidor final')}
              ${line('Condicion venta', 'Contado')}
              ${line('Caja', comprobante.caja_id || '-')}
            </section>
          `}

          ${!isRemito && (opts.vendedor || opts.cajero || listaPrecio) ? `
            <section class="operation-details">
              ${line('Vendedor', opts.vendedor)}
              ${line('Cajero', opts.cajero)}
              ${line('Lista de precio', listaPrecioLabel(listaPrecio))}
              ${line('IVA', modoIvaLabel(listaPrecio?.modo_iva, listaPrecio?.porcentaje_iva))}
            </section>
          ` : ''}

          ${isRemito ? `
            <section class="delivery-summary">
              <div><span>Solicitado</span><strong>${escapeHtml(formatQty(resumenDespacho.solicitado || entregadoEnRemito))}</strong></div>
              <div><span>Entregado en remito</span><strong>${escapeHtml(formatQty(entregadoEnRemito))}</strong></div>
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
                  ${despacho?.items?.length
                    ? despacho.items
                        .map(
                          (item) => {
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
                          },
                        )
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
                            `,
                          )
                          .join('')
                      : `
                      <tr>
                        <td colspan="6">Sin productos entregados en este remito.</td>
                      </tr>
                    `}
                </tbody>
              </table>
            </section>
          ` : showDetail ? `
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="right">Cant.</th>
                  <th class="right">Precio</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                      <tr>
                        <td><div class="item-name">${escapeHtml(item.descripcion)}</div></td>
                        <td class="right">${escapeHtml(item.cantidad)}</td>
                        <td class="right">${money(item.precio_unitario)}</td>
                        <td class="right">${money(item.subtotal)}</td>
                      </tr>
                    `,
                  )
                  .join('')}
              </tbody>
            </table>
          ` : ''}

          ${isRemito ? '' : `<section class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <strong>${money(comprobante.subtotal)}</strong>
            </div>
            ${ivaCalculado > 0 ? `
              <div class="total-row">
                <span>Base imponible</span>
                <strong>${money(baseImponible)}</strong>
              </div>
              <div class="total-row">
                <span>${escapeHtml(modoIvaLabel(listaPrecio?.modo_iva, listaPrecio?.porcentaje_iva) || 'IVA')}</span>
                <strong>${money(ivaCalculado)}</strong>
              </div>
            ` : ''}
            ${showDiscounts ? `
              <div class="total-row">
                <span>Descuentos</span>
                <strong>${money(comprobante.descuento_total)}</strong>
              </div>
            ` : ''}
            ${showRecargos ? `
              <div class="total-row">
                <span>Recargos</span>
                <strong>${money(comprobante.recargo_total)}</strong>
              </div>
            ` : ''}
            <div class="total-row grand">
              <span>Total</span>
              <span>${money(comprobante.total)}</span>
            </div>
          </section>`}

          ${!isRemito && !thermal ? `
            <section class="tax-box">
              <div class="tax-row tax-head">
                <strong>Neto gravado</strong>
                <strong>IVA / Impuestos</strong>
                <strong>Total</strong>
              </div>
              <div class="tax-row">
                <span>${money(baseImponible || comprobante.subtotal)}</span>
                <span>${money(ivaCalculado)}</span>
                <strong>${money(comprobante.total)}</strong>
              </div>
            </section>
          ` : ''}

          ${!isRemito && thermal && (cae || caeVencimiento || qrUrl) ? `
            <section class="fiscal-auth">
              ${line('CAE', cae)}
              ${line('Vto. CAE', caeVencimiento)}
              ${line('ARCA QR', qrUrl ? 'Disponible' : '')}
            </section>
          ` : ''}

          ${despacho && !isRemito ? `
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
                      `,
                    )
                    .join('')}
                </tbody>
              </table>
            </section>
          ` : ''}

          ${
            showObservaciones && comprobante.observaciones
              ? `<section class="observaciones"><strong>Observaciones:</strong> ${escapeHtml(comprobante.observaciones)}</section>`
              : ''
          }

          ${!isRemito && !thermal ? `
            <section class="auth-grid">
              <div class="auth-lines">
                ${line('CAE', cae || 'Pendiente de autorizacion ARCA')}
                ${line('Vencimiento CAE', caeVencimiento || 'Pendiente')}
                ${line('Codigo fiscal', codigoFiscal || fiscalCodeFromType(comprobante.tipo) || '-')}
                ${line('Punto de venta', puntoVenta || '-')}
              </div>
              <div>
                ${qrUrl
                  ? `<img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}" alt="QR ARCA" />`
                  : '<div class="qr-placeholder">QR ARCA pendiente</div>'
                }
              </div>
            </section>
          ` : ''}

          ${message ? `<section class="message"><strong>Mensaje:</strong><br />${escapeHtml(message)}</section>` : ''}
          ${isRemito ? `
            <section class="terms">
              Al firmar este remito, el receptor deja constancia de la mercaderia entregada en las cantidades indicadas. Los productos pendientes quedan registrados para retiro o entrega posterior.
            </section>
            <section class="signature-grid">
              <div class="signature-box">Firma y aclaracion de quien entrega</div>
              <div class="signature-box">Firma y aclaracion de quien recibe</div>
            </section>
          ` : ''}
          <section class="footer">
            ${isRemito ? 'Remito emitido como constancia de entrega de mercaderia.' : 'Comprobante emitido por sistema POS'}
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
