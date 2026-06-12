import type { ReactNode } from 'react';
import { useState } from 'react';
import { FileText } from 'lucide-react';
import TableContextMenu from './TableContextMenu';
import type { TableContextMenuAction } from './TableContextMenu';

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyVariant?: 'plain' | 'ghost';
  isLoading?: boolean;
  loadingMessage?: string;
  minWidth?: string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  getContextActions?: (row: T) => TableContextMenuAction[];
};

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const DataTable = <T,>({
  rows,
  columns,
  getRowKey,
  emptyMessage = 'Sin datos para mostrar.',
  emptyTitle,
  emptyDescription,
  emptyVariant = 'ghost',
  isLoading = false,
  loadingMessage = 'Cargando datos...',
  minWidth,
  rowClassName,
  onRowClick,
  getContextActions,
}: Props<T>) => {
  const [menu, setMenu] = useState<{ x: number; y: number; row: T } | null>(null);
  const colSpan = Math.max(columns.length, 1);
  const ghostRows = Array.from({ length: 8 }, (_, rowIndex) => rowIndex);

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse" style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr className="bg-[#fbf9fa]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`border-b border-[#c4c6cd] px-6 py-4 text-[13px] font-medium uppercase leading-[18px] tracking-wider text-[#44474c] ${alignClass[column.align ?? 'left']} ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={colSpan} className="px-6 py-8 text-center text-[14px] text-[#44474c]">
                {loadingMessage}
              </td>
            </tr>
          ) : rows.length ? (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                onContextMenu={(event) => {
                  const actions = getContextActions?.(row) ?? [];
                  if (!actions.length) return;
                  event.preventDefault();
                  setMenu({ x: event.clientX, y: event.clientY, row });
                }}
                className={`border-b border-[#e5e7eb] text-[14px] transition-colors last:border-b-0 hover:bg-[#f5f3f4] ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName?.(row) ?? ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={`${getRowKey(row)}-${column.key}`}
                    className={`px-6 py-4 ${alignClass[column.align ?? 'left']} ${column.className ?? ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : emptyVariant === 'ghost' ? (
            <tr>
              <td colSpan={colSpan} className="p-0">
                <div className="relative min-h-[390px] overflow-hidden bg-white">
                  <div className="pointer-events-none absolute inset-0 opacity-45 blur-[1.2px]">
                    {ghostRows.map((rowIndex) => (
                      <div
                        key={rowIndex}
                        className="grid border-b border-[#e5e7eb] px-6 py-4"
                        style={{
                          gridTemplateColumns: `repeat(${colSpan}, minmax(120px, 1fr))`,
                        }}
                      >
                        {columns.map((column, columnIndex) => (
                          <div
                            key={`${rowIndex}-${column.key}`}
                            className={`${alignClass[column.align ?? 'left']} ${column.className ?? ''}`}
                          >
                            <span
                              className={`inline-block h-3 rounded-full bg-[#dfe7ec] ${
                                column.align === 'right'
                                  ? 'ml-auto'
                                  : column.align === 'center'
                                    ? 'mx-auto'
                                    : ''
                              }`}
                              style={{
                                width: `${58 + ((rowIndex + columnIndex) % 4) * 16}%`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-white/72" />
                  <div className="relative z-10 flex min-h-[390px] items-center justify-center px-6 py-12 text-center">
                    <div className="max-w-[430px]">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#d7dee5] bg-white text-[#8b9aaa] shadow-sm">
                        <FileText size={38} strokeWidth={1.7} />
                      </div>
                      <div className="text-[18px] font-bold text-[#041627]">
                        {emptyTitle ?? emptyMessage}
                      </div>
                      {emptyDescription ? (
                        <div className="mt-3 text-[14px] leading-6 text-[#44474c]">
                          {emptyDescription}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan={colSpan} className="px-6 py-8 text-center text-[14px] text-[#44474c]">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {menu ? (
        <TableContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          actions={getContextActions?.(menu.row) ?? []}
        />
      ) : null}
    </div>
  );
};

export default DataTable;
