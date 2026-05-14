import type { ISucursal } from '../types/sucursal.type';

interface Props {
  sucursales: ISucursal[];
}

export default function SucursalTable({ sucursales }: Props) {

  console.log('Renderizando SucursalTable con sucursales:', sucursales);
  return (
    <section className="bg-white border-t border-[#c4c6cd] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#fbf9fa]">
              {[
                { label: 'Nombre', align: 'text-left' },
                { label: 'Dirección', align: 'text-left' },
                { label: 'Teléfono', align: 'text-left' },
                { label: 'Activa', align: 'text-center' },
                { label: 'Empresa', align: 'text-left' },
                { label: 'Creado', align: 'text-right' },
              ].map(({ label, align }) => (
                <th
                  key={label}
                  className={`px-6 py-4 font-medium text-[13px] leading-[18px] tracking-wider uppercase text-[#44474c] border-b border-[#c4c6cd] ${align}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sucursales.length > 0 ? (
              sucursales.map((sucursal) => (
                <tr key={sucursal.id} className="border-b border-[#efedef] hover:bg-[#f8f8f9]">
                  <td className="px-6 py-4 text-[14px] text-[#1b1c1d]">{sucursal.nombre}</td>
                  <td className="px-6 py-4 text-[14px] text-[#1b1c1d]">
                    {sucursal.direccion || '-'}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[#1b1c1d]">
                    {sucursal.telefono || '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-[14px] text-[#1b1c1d]">
                    {sucursal.activa ? 'Sí' : 'No'}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[#1b1c1d]">{sucursal.empresa_id}</td>
                  <td className="px-6 py-4 text-right text-[14px] text-[#44474c]">
                    {new Date(sucursal.creado_en).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[14px] text-[#44474c]">
                  No se encontraron sucursales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
