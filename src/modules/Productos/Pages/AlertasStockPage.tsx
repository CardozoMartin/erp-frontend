import { AlertTriangle, Package } from 'lucide-react';
import { useAlertasStock } from '../hooks/useAlertasStock';

export default function AlertasStockPage() {
  const { data: alertas = [], isLoading } = useAlertasStock();

  return (
    <div className="p-6">
      {/* 1.- Encabezado */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
          <AlertTriangle size={18} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Alertas de stock mínimo</h1>
          <p className="text-sm text-gray-500">
            Productos con cantidad igual o menor al mínimo configurado
          </p>
        </div>
      </div>

      {/* 2.- Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <span className="text-sm">Cargando alertas...</span>
        </div>
      )}

      {/* 3.- Sin alertas */}
      {!isLoading && alertas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-gray-400">
          <Package size={32} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium">Sin alertas de stock</p>
          <p className="mt-1 text-xs">Todos los productos están por encima del mínimo configurado</p>
        </div>
      )}

      {/* 4.- Tabla de alertas */}
      {!isLoading && alertas.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Variante
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Stock actual
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Mínimo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Diferencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alertas.map((alerta) => {
                const diferencia = alerta.cantidad - alerta.cantidad_minima;
                const sinStock = alerta.cantidad === 0;

                return (
                  <tr key={alerta.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{alerta.producto.nombre}</div>
                      {alerta.producto.codigo_barras && (
                        <div className="text-xs text-gray-400">{alerta.producto.codigo_barras}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {alerta.variante?.nombre ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${sinStock ? 'text-red-600' : 'text-amber-600'}`}
                      >
                        {alerta.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{alerta.cantidad_minima}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          sinStock
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {diferencia}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-400">
            {alertas.length} producto{alertas.length !== 1 ? 's' : ''} con stock bajo el mínimo
          </div>
        </div>
      )}
    </div>
  );
}
