import { useState } from 'react';
import { AlertTriangle, Package, RefreshCw, MapPin, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAlertasStock } from '../hooks/useAlertasStock';
import ModalUpdateStock from '../components/Products/ModalUpdateStock';
import type { IAlertaStock } from '../api/stock.api';
import { formatStockQuantity } from '../utils/stockFormat';
import { useAuthStore } from '../../../store/auth.store';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Severidad = 'sin_stock' | 'critico' | 'bajo';
type FiltroSeveridad = 'todos' | Severidad;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSeveridad = (alerta: IAlertaStock): Severidad => {
  if (alerta.cantidad === 0) return 'sin_stock';
  const porcentaje = alerta.cantidad / alerta.cantidad_minima;
  if (porcentaje <= 0.5) return 'critico';
  return 'bajo';
};

const severidadConfig: Record<Severidad, { label: string; badgeCls: string; rowCls: string; cantidadCls: string }> = {
  sin_stock: {
    label: 'Sin stock',
    badgeCls: 'bg-red-100 text-red-700 border-red-200',
    rowCls: 'border-l-4 border-l-red-400',
    cantidadCls: 'text-red-600 font-bold',
  },
  critico: {
    label: 'Crítico',
    badgeCls: 'bg-orange-100 text-orange-700 border-orange-200',
    rowCls: 'border-l-4 border-l-orange-400',
    cantidadCls: 'text-orange-600 font-bold',
  },
  bajo: {
    label: 'Bajo mínimo',
    badgeCls: 'bg-amber-100 text-amber-700 border-amber-200',
    rowCls: 'border-l-4 border-l-amber-400',
    cantidadCls: 'text-amber-600 font-bold',
  },
};

const formatUbicacion = (alerta: IAlertaStock): string => {
  const partes = [
    alerta.deposito,
    alerta.pasillo,
    alerta.estante,
    alerta.sector,
    alerta.codigo_ubicacion ? `Cod. ${alerta.codigo_ubicacion}` : null,
    alerta.ubicacion_referencia,
  ].filter(Boolean);
  return partes.length ? partes.join(' · ') : '';
};

// Convierte IAlertaStock al shape que espera ModalUpdateStock
const alertaToProductoModal = (alerta: IAlertaStock) => ({
  id: alerta.producto_id,
  nombre: alerta.producto.nombre,
  unidad_venta: alerta.producto.unidad_venta,
  es_fraccionable: alerta.producto.es_fraccionable,
  stock: [
    {
      sucursal_id: alerta.sucursal_id,
      cantidad: alerta.cantidad,
      cantidad_minima: alerta.cantidad_minima,
    },
  ],
});

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AlertasStockPage() {
  const { data: alertas = [], isLoading, dataUpdatedAt } = useAlertasStock();
  const [filtro, setFiltro] = useState<FiltroSeveridad>('todos');
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<IAlertaStock | null>(null);
  const queryClient = useQueryClient();
  const tienePermiso = useAuthStore((s) => s.tienePermiso);
  const puedeAjustar = tienePermiso('productos.ajustar-stock');

  const alertasFiltradas = filtro === 'todos'
    ? alertas
    : alertas.filter(a => getSeveridad(a) === filtro);

  const conteoSinStock = alertas.filter(a => getSeveridad(a) === 'sin_stock').length;
  const conteoCritico = alertas.filter(a => getSeveridad(a) === 'critico').length;
  const conteoBajo = alertas.filter(a => getSeveridad(a) === 'bajo').length;

  const manejarRefrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['stock-alertas'] });
    queryClient.invalidateQueries({ queryKey: ['stock-alertas-conteo'] });
  };

  const ultimaActualizacion = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* ── Encabezado ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Alertas de stock mínimo</h1>
            <p className="text-sm text-gray-500">
              Productos con cantidad igual o menor al mínimo configurado
              {ultimaActualizacion && (
                <span className="ml-2 text-gray-400">· Actualizado {ultimaActualizacion}</span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={manejarRefrescar}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* ── Tarjetas de resumen ── */}
      {!isLoading && alertas.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFiltro(filtro === 'sin_stock' ? 'todos' : 'sin_stock')}
            className={`rounded-lg border p-4 text-left transition-all ${
              filtro === 'sin_stock'
                ? 'border-red-300 bg-red-50 ring-2 ring-red-200'
                : 'border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/50'
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500">Sin stock</p>
            <p className="mt-1 text-3xl font-black text-red-600">{conteoSinStock}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">productos agotados</p>
          </button>
          <button
            type="button"
            onClick={() => setFiltro(filtro === 'critico' ? 'todos' : 'critico')}
            className={`rounded-lg border p-4 text-left transition-all ${
              filtro === 'critico'
                ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-200'
                : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50'
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-500">Crítico</p>
            <p className="mt-1 text-3xl font-black text-orange-600">{conteoCritico}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">≤ 50% del mínimo</p>
          </button>
          <button
            type="button"
            onClick={() => setFiltro(filtro === 'bajo' ? 'todos' : 'bajo')}
            className={`rounded-lg border p-4 text-left transition-all ${
              filtro === 'bajo'
                ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200'
                : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/50'
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Bajo mínimo</p>
            <p className="mt-1 text-3xl font-black text-amber-600">{conteoBajo}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">&gt; 50% del mínimo</p>
          </button>
        </div>
      )}

      {/* ── Filtro activo pill ── */}
      {filtro !== 'todos' && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[12px] text-gray-500">Filtrando por:</span>
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${severidadConfig[filtro].badgeCls}`}
          >
            {severidadConfig[filtro].label}
            <span className="text-current opacity-60">×</span>
          </button>
        </div>
      )}

      {/* ── Estado de carga ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={18} className="mr-2 animate-spin" />
          <span className="text-sm">Cargando alertas...</span>
        </div>
      )}

      {/* ── Sin alertas ── */}
      {!isLoading && alertas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-gray-400">
          <Package size={32} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium">Sin alertas de stock</p>
          <p className="mt-1 text-xs">Todos los productos están por encima del mínimo configurado</p>
        </div>
      )}

      {/* ── Sin resultados con filtro activo ── */}
      {!isLoading && alertas.length > 0 && alertasFiltradas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-gray-400">
          <p className="text-sm">No hay productos en esta categoría</p>
          <button type="button" onClick={() => setFiltro('todos')} className="mt-2 text-xs text-[#075E54] hover:underline">
            Ver todos
          </button>
        </div>
      )}

      {/* ── Tabla ── */}
      {!isLoading && alertasFiltradas.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Ubicación
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Stock actual
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Mínimo
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Diferencia
                </th>
                {puedeAjustar && (
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Acción
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alertasFiltradas.map((alerta) => {
                const sev = getSeveridad(alerta);
                const cfg = severidadConfig[sev];
                const diferencia = alerta.cantidad - alerta.cantidad_minima;
                const ubicacion = formatUbicacion(alerta);
                const stockFmt = formatStockQuantity(
                  alerta.cantidad,
                  alerta.producto.unidad_venta,
                  alerta.producto.es_fraccionable,
                );
                const minimoFmt = formatStockQuantity(
                  alerta.cantidad_minima,
                  alerta.producto.unidad_venta,
                  alerta.producto.es_fraccionable,
                );
                const diferenciaFmt = formatStockQuantity(
                  Math.abs(diferencia),
                  alerta.producto.unidad_venta,
                  alerta.producto.es_fraccionable,
                );

                return (
                  <tr key={alerta.id} className={`hover:bg-gray-50/60 ${cfg.rowCls}`}>
                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.badgeCls}`}>
                        {cfg.label}
                      </span>
                    </td>

                    {/* Producto */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{alerta.producto.nombre}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {alerta.producto.codigo_barras && (
                          <span className="text-[11px] text-gray-400">{alerta.producto.codigo_barras}</span>
                        )}
                        {alerta.variante && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                            {alerta.variante.sku}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ubicación */}
                    <td className="px-4 py-3">
                      {ubicacion ? (
                        <span className="flex items-center gap-1 text-[12px] text-gray-500">
                          <MapPin size={11} className="shrink-0 text-gray-400" />
                          {ubicacion}
                        </span>
                      ) : (
                        <span className="text-[12px] text-gray-300">—</span>
                      )}
                    </td>

                    {/* Stock actual */}
                    <td className={`px-4 py-3 text-right text-base ${cfg.cantidadCls}`}>
                      {stockFmt}
                    </td>

                    {/* Mínimo */}
                    <td className="px-4 py-3 text-right text-gray-500">{minimoFmt}</td>

                    {/* Diferencia */}
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badgeCls}`}>
                        -{diferenciaFmt}
                      </span>
                    </td>

                    {/* Acción */}
                    {puedeAjustar && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setAlertaSeleccionada(alerta)}
                          className="inline-flex items-center gap-1 rounded border border-[#c4c6cd] bg-white px-2.5 py-1 text-[12px] font-medium text-[#075E54] hover:bg-[#f3fbf9]"
                        >
                          <Plus size={12} />
                          Reponer
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-[11px] text-gray-400">
            {filtro === 'todos'
              ? `${alertas.length} producto${alertas.length !== 1 ? 's' : ''} con stock bajo el mínimo`
              : `${alertasFiltradas.length} de ${alertas.length} productos · filtro: ${severidadConfig[filtro].label}`}
          </div>
        </div>
      )}

      {/* ── Modal ajuste rápido ── */}
      {alertaSeleccionada && (
        <ModalUpdateStock
          isActive={!!alertaSeleccionada}
          onClose={() => {
            setAlertaSeleccionada(null);
            manejarRefrescar();
          }}
          product={alertaToProductoModal(alertaSeleccionada)}
        />
      )}
    </div>
  );
}
