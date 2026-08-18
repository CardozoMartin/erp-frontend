import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';

type Valor = Record<string, unknown> | null | undefined;

interface Props {
  antes: Valor;
  despues: Valor;
}

/** Nombres tecnicos -> lo que el usuario reconoce en pantalla */
const ETIQUETAS: Record<string, string> = {
  estado: 'Estado',
  estado_pago: 'Estado de pago',
  total: 'Total',
  subtotal: 'Subtotal',
  saldo: 'Saldo',
  monto: 'Monto',
  monto_rendido: 'Monto rendido',
  monto_inicial: 'Monto inicial',
  monto_final_declarado: 'Monto declarado',
  monto_final_calculado: 'Monto calculado',
  diferencia: 'Diferencia',
  cae: 'CAE',
  numero: 'Numero',
  codigo_fiscal: 'Codigo fiscal',
  caja_id: 'Caja',
  cliente_id: 'Cliente',
  precio_venta: 'Precio de venta',
  precio_costo: 'Precio de costo',
  stock: 'Stock',
  cantidad: 'Cantidad',
  activo: 'Activo',
  limite_credito: 'Limite de credito',
  modo_pos: 'Modo POS',
  alicuota_iva: 'Alicuota de IVA',
  observaciones: 'Observaciones',
  empleado_repartidor_id: 'Repartidor',
  direccion_entrega: 'Direccion de entrega',
};

const etiqueta = (clave: string) =>
  ETIQUETAS[clave] ?? clave.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Los ids largos no aportan nada completos: alcanza el prefijo para reconocerlos */
const formatear = (valor: unknown): string => {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Si' : 'No';
  if (typeof valor === 'number') {
    return Number.isInteger(valor) ? String(valor) : valor.toFixed(2);
  }
  if (typeof valor === 'string') {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(valor)) return `${valor.slice(0, 8)}…`;
    return valor.length > 60 ? `${valor.slice(0, 60)}…` : valor;
  }
  if (Array.isArray(valor)) return `${valor.length} elemento(s)`;
  return JSON.stringify(valor);
};

const sonIguales = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Muestra que cambio en el evento, campo por campo.
 *
 * Antes esto eran dos bloques de JSON crudo y habia que comparar dos objetos a
 * ojo para descubrir que se habia modificado.
 */
export const CambiosEvento = ({ antes, despues }: Props) => {
  const [verJson, setVerJson] = useState(false);

  const claves = Array.from(
    new Set([...Object.keys(antes ?? {}), ...Object.keys(despues ?? {})]),
  ).sort();

  const cambiados = claves.filter(
    (clave) => !sonIguales(antes?.[clave], despues?.[clave]),
  );
  // Un alta o una baja traen un solo lado: ahi no hay "cambio", hay un estado.
  const esAlta = !antes && !!despues;
  const esBaja = !!antes && !despues;

  if (!antes && !despues) {
    return (
      <p className="border border-[#e5e7eb] bg-[#fbfbfc] px-3 py-4 text-center text-[13px] text-[#64748b]">
        Este evento no registró cambios de datos.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border border-[#e5e7eb]">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#fbfbfc] px-3 py-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#59616b]">
            {esAlta ? 'Datos registrados' : esBaja ? 'Datos antes de borrar' : 'Qué cambió'}
          </span>
          {!esAlta && !esBaja && (
            <span className="text-[11.5px] text-[#64748b]">
              {cambiados.length} campo{cambiados.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {cambiados.length === 0 && !esAlta && !esBaja ? (
          <p className="px-3 py-4 text-center text-[13px] text-[#64748b]">
            Los datos no cambiaron en este evento.
          </p>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {(esAlta || esBaja ? claves : cambiados).map((clave) => {
              const valorAntes = antes?.[clave];
              const valorDespues = despues?.[clave];
              return (
                <div
                  key={clave}
                  className="grid grid-cols-[minmax(120px,1fr)_auto_minmax(120px,1fr)] items-center gap-2 px-3 py-2"
                >
                  <span className="text-[12.5px] font-semibold text-[#041627]">
                    {etiqueta(clave)}
                  </span>
                  {esAlta ? (
                    <>
                      <span />
                      <span className="text-right font-mono text-[12.5px] text-[#075E54]">
                        {formatear(valorDespues)}
                      </span>
                    </>
                  ) : esBaja ? (
                    <>
                      <span />
                      <span className="text-right font-mono text-[12.5px] text-[#b42318]">
                        {formatear(valorAntes)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-[12.5px] text-[#94a3b8] line-through">
                        {formatear(valorAntes)}
                      </span>
                      <ArrowRight size={13} className="mx-auto shrink-0 text-[#94a3b8]" />
                      <span className="text-right font-mono text-[12.5px] font-bold text-[#075E54]">
                        {formatear(valorDespues)}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* El JSON sigue disponible, pero deja de ser lo primero que se ve */}
      <div className="border border-[#e5e7eb]">
        <button
          type="button"
          onClick={() => setVerJson((v) => !v)}
          className="flex w-full items-center gap-1.5 bg-[#fbfbfc] px-3 py-2 text-left text-[12px] font-bold uppercase tracking-wider text-[#59616b] transition-colors hover:bg-[#f1f5f9]"
        >
          {verJson ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Ver datos completos
        </button>
        {verJson && (
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase text-[#94a3b8]">Antes</p>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap bg-[#f8fafc] p-2 font-mono text-[11.5px] leading-5 text-[#041627]">
                {antes ? JSON.stringify(antes, null, 2) : 'Sin datos'}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase text-[#94a3b8]">Después</p>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap bg-[#f8fafc] p-2 font-mono text-[11.5px] leading-5 text-[#041627]">
                {despues ? JSON.stringify(despues, null, 2) : 'Sin datos'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
