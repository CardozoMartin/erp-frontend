import { Edit3, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import type { ISucursal } from '../types/sucursal.type';

interface Props {
  sucursales: ISucursal[];
}

export default function SucursalTable({ sucursales }: Props) {
  const navigate = useNavigate();
  const columns: DataTableColumn<ISucursal>[] = [
    { key: 'nombre', header: 'Nombre', render: (sucursal) => sucursal.nombre },
    { key: 'direccion', header: 'Direccion', render: (sucursal) => sucursal.direccion || '-' },
    { key: 'telefono', header: 'Telefono', render: (sucursal) => sucursal.telefono || '-' },
    {
      key: 'logo',
      header: 'Logo',
      align: 'center',
      render: (sucursal) =>
        sucursal.logoUrl ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]">
            <Image size={15} />
          </span>
        ) : (
          <span className="text-[12px] text-[#9ca3af]">-</span>
        ),
    },
    {
      key: 'activa',
      header: 'Activa',
      align: 'center',
      render: (sucursal) => (sucursal.activa ? 'Si' : 'No'),
    },
    { key: 'empresa', header: 'Empresa', render: (sucursal) => sucursal.empresa_id },
    {
      key: 'creado',
      header: 'Creado',
      align: 'right',
      render: (sucursal) => new Date(sucursal.creado_en).toLocaleDateString('es-AR'),
    },
  ];

  return (
    <section className="overflow-hidden border-t border-[#c4c6cd] bg-white">
      <DataTable
        rows={sucursales}
        columns={columns}
        getRowKey={(sucursal) => sucursal.id}
        emptyMessage="No se encontraron sucursales."
        getContextActions={(sucursal) => [
          {
            label: 'Editar sucursal',
            icon: <Edit3 size={14} />,
            onClick: () => navigate(`/sucursales/${sucursal.id}/editar`),
          },
        ]}
      />
    </section>
  );
}
