import { Tag, Calendar, Award, BadgePercent, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '../../Pages/Productdetailview';
import { OfertasSection } from '../ProductFormSections/OfertasSection';
import { ModalOfertaRapida } from '../Products/ModalOfertaRapida';
import { useFormContext } from 'react-hook-form';
import { useEliminarOferta } from '../../hooks/useProductos';
import Swal from 'sweetalert2';

const TabPrecios = ({ product, isEditing }: any) => {
  const formContext = useFormContext();
  const watchedTieneVariantes = formContext ? formContext.watch('tiene_variantes') : product?.tiene_variantes;
  const [modalOfertaAbierto, setModalOfertaAbierto] = useState(false);
  const { mutate: eliminarOferta } = useEliminarOferta();

  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-slate-50 border border-slate-200/50 rounded-lg p-8 max-w-lg mx-auto my-4 shadow-sm">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200 shadow-inner">
          <BadgePercent size={26} className="stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-[#041627]">Precios y Ofertas por Variantes</h4>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Este producto tiene la configuración de variantes activa. Los precios y campañas de descuento específicos se gestionan en la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded border border-slate-100">
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded text-xs text-gray-500 border border-slate-150">
          <Tag size={14} className="text-[#075E54] shrink-0" />
          <span>Configura campañas de ofertas y descuentos temporales para este producto. Las ofertas se activarán de forma automática durante las fechas definidas.</span>
        </div>
        <OfertasSection namePrefix="ofertas" />
      </div>
    );
  }

  const ofertas = product?.ofertas ?? [];

  return (
    <>
    <div className="flex flex-col gap-6 pt-3">
      
      {/* Grid: Base Price & Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Base Price Box */}
        <div className="md:col-span-1 bg-gradient-to-br from-[#075E54]/5 to-transparent border border-[#075E54]/20 rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#075E54]/5 rounded-full translate-x-8 -translate-y-8" />
          <div>
            <span className="text-[10px] font-bold text-[#075E54] uppercase tracking-widest bg-[#075E54]/10 px-2 py-0.5 rounded">
              Tarifa Regular
            </span>
            <p className="text-sm font-extrabold text-[#041627] mt-4 uppercase tracking-wider">Precio de Venta Base</p>
            <p className="text-xs text-gray-400 mt-0.5">Precio estándar sin impuestos aplicados.</p>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-black text-[#075E54] tracking-tight leading-none">
              {formatPrice(product?.precio_base)}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
              por {product?.unidad_venta?.toLowerCase() ?? 'unidad'}
            </p>
          </div>
        </div>

        {/* Right Side: Discounts & Offers Timeline */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
            <p className="text-sm font-extrabold text-[#041627] uppercase tracking-wider flex items-center gap-1.5">
              <Award size={15} className="text-[#075E54]" />
              Campañas y Ofertas Especiales
            </p>
            {product?.id && (
              <button
                type="button"
                onClick={() => setModalOfertaAbierto(true)}
                className="flex items-center gap-1 rounded border border-[#075E54] px-2.5 py-1 text-[12px] font-medium text-[#075E54] hover:bg-[#f3fbf9]"
              >
                <Plus size={13} />
                Nueva oferta
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {ofertas.map((o: any, idx: number) => {
              const precioOferta = Number(o.precio_oferta ?? 0);
              const precioBase = Number(product.precio_base ?? 0);
              const pct = precioBase > 0 && precioOferta < precioBase
                ? Math.round((1 - precioOferta / precioBase) * 100)
                : 0;
              const ahora = new Date();
              const inicio = new Date(o.fecha_inicio);
              const fin = new Date(o.fecha_fin);
              const vigente = o.activo && inicio <= ahora && fin >= ahora;

              const manejarEliminar = () => {
                if (!o.id) return;
                Swal.fire({
                  title: '¿Eliminar oferta?',
                  text: 'Esta acción no se puede deshacer.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#d33',
                  cancelButtonColor: '#3085d6',
                  confirmButtonText: 'Eliminar',
                  cancelButtonText: 'Cancelar',
                }).then((result) => {
                  if (result.isConfirmed) eliminarOferta(o.id);
                });
              };

              return (
                <div
                  key={o.id ?? idx}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#DCF8C6]/10 hover:bg-[#DCF8C6]/20 transition-all rounded-lg border border-[#DCF8C6] shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#075E54] group-hover:w-1.5 transition-all" />

                  <div className="flex items-start gap-3 pl-2 flex-1">
                    <div className="p-2 bg-white rounded-md border border-[#DCF8C6] text-[#075E54] shrink-0 mt-0.5">
                      <TrendingDown size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#041627] flex items-center gap-2">
                        {`Oferta ${idx + 1}`}
                        {pct > 0 && (
                          <span className="text-[9px] font-black text-[#075E54] bg-[#DCF8C6] px-1.5 py-0.5 rounded tracking-wide uppercase">
                            -{pct}% OFF
                          </span>
                        )}
                        {vigente ? (
                          <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase">
                            Vigente
                          </span>
                        ) : !o.activo ? (
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">
                            Inactiva
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center gap-1">
                        <Calendar size={11} className="text-gray-400" />
                        {o.fecha_inicio} → {o.fecha_fin}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 sm:mt-0 pl-11 sm:pl-0 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-gray-400 line-through">
                        {formatPrice(precioBase)}
                      </span>
                      <p className="text-lg font-black text-[#075E54] tracking-tight leading-none mt-0.5">
                        {formatPrice(precioOferta)}
                      </p>
                    </div>
                    {o.id && (
                      <button
                        type="button"
                        onClick={manejarEliminar}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Eliminar oferta"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {ofertas.length === 0 && (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center gap-2">
                <BadgePercent size={32} className="opacity-25 text-gray-400 stroke-[1.5]" />
                <p className="text-sm font-medium">No se registran ofertas activas para este producto.</p>
                <p className="text-xs text-gray-400">Las ofertas permiten fijar tarifas de descuento automáticas por fecha.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>

    {modalOfertaAbierto && product?.id && (
      <ModalOfertaRapida
        productoId={product.id}
        productoNombre={product.nombre}
        precioVenta={Number(product.precio_venta ?? product.precio_base ?? 0)}
        ofertasExistentes={product.ofertas}
        onClose={() => setModalOfertaAbierto(false)}
      />
    )}
    </>
  );
}

export default TabPrecios;
