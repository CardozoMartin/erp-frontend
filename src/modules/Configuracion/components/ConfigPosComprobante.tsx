import { FileText, Printer } from 'lucide-react';
import type { UseFormRegister } from 'react-hook-form';
import type { ConfiguracionPosPayload } from '../../POSAuxiliares/types/pos-aux.type';

const designOptions = [
  { value: 'BASICO', label: 'Basico termico', description: 'Lineal, rapido y muy legible para impresoras de calor.' },
  { value: 'WAVE', label: 'Wave', description: 'Encabezado con banda curva tipo Odoo y mayor presencia visual.' },
  { value: 'CLASICO', label: 'Clasico', description: 'Orden administrativo formal para boletas y facturas comunes.' },
] as const;

interface Props {
  register: UseFormRegister<ConfiguracionPosPayload>;
  watchedDiseno: string;
  sucursalNombre?: string;
}

const inputClass = 'h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]';
const labelClass = 'mb-1 block text-[12px] font-semibold text-[#44474c]';

export const ConfigPosComprobante = ({ register, watchedDiseno, sucursalNombre }: Props) => (
  <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
    <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
      <Printer size={15} className="text-[#075E54]" />
      Comprobante impreso
    </div>

    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.9fr]">
      {/* Datos fiscales del ticket */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={labelClass}>Nombre visible de la tienda</span>
          <input maxLength={120} placeholder={sucursalNombre ?? 'Mi tienda'} {...register('nombre_fantasia_ticket')} className={inputClass + ' font-semibold'} />
        </label>
        <label className="block">
          <span className={labelClass}>Razon social</span>
          <input maxLength={160} {...register('razon_social_ticket')} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>CUIT</span>
          <input maxLength={20} placeholder="20-00000000-0" {...register('cuit_ticket')} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Ingresos brutos</span>
          <input maxLength={80} {...register('ingresos_brutos_ticket')} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Inicio actividades</span>
          <input maxLength={20} placeholder="01/01/2026" {...register('inicio_actividades_ticket')} className={inputClass} />
        </label>
        <label className="block md:col-span-2">
          <span className={labelClass}>Domicilio comercial</span>
          <input maxLength={180} {...register('domicilio_ticket')} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Telefono</span>
          <input maxLength={80} {...register('telefono_ticket')} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Email</span>
          <input maxLength={120} {...register('email_ticket')} className={inputClass} />
        </label>
        <label className="block md:col-span-2">
          <span className={labelClass}>Web o redes</span>
          <input maxLength={120} placeholder="instagram.com/mitienda" {...register('web_ticket')} className={inputClass} />
        </label>
      </div>

      {/* Formato, diseño y mensajes */}
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-[#44474c]">
            <Printer size={14} className="text-[#075E54]" />
            Formato por defecto
          </span>
          <select {...register('formato_impresion_comprobante')} className={inputClass}>
            <option value="TICKET_80MM">Ticket termico 80 mm</option>
            <option value="TICKET_58MM">Ticket termico 58 mm</option>
            <option value="BOLETA_A4">Boleta / hoja A4</option>
          </select>
        </label>

        <div>
          <span className="mb-2 block text-[12px] font-semibold text-[#44474c]">Diseno visual</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {designOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded border bg-white p-3 transition ${
                  watchedDiseno === option.value
                    ? 'border-[#075E54] shadow-[0_0_0_2px_rgba(7,94,84,0.12)]'
                    : 'border-[#c4c6cd] hover:border-[#075E54]/50'
                }`}
              >
                <input type="radio" value={option.value} {...register('diseno_comprobante')} className="sr-only" />
                <span className="block text-[13px] font-bold text-[#041627]">{option.label}</span>
                <span className="mt-1 block text-[11px] leading-snug text-[#44474c]">{option.description}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-3">
          <span className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
            <Printer size={16} className="text-[#075E54]" />
            Imprimir al finalizar venta
          </span>
          <input type="checkbox" {...register('imprimir_automaticamente')} className="h-4 w-4 accent-[#075E54]" />
        </label>

        <label className="block">
          <span className={labelClass}>Mensaje para ticket</span>
          <textarea rows={3} maxLength={400} {...register('mensaje_ticket')} className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]" />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-[#44474c]">
            <FileText size={14} className="text-[#075E54]" />
            Mensaje para boleta A4
          </span>
          <textarea rows={3} maxLength={400} {...register('mensaje_boleta')} className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]" />
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['mostrar_detalle_productos', 'Detalle productos'],
            ['mostrar_datos_fiscales', 'Datos fiscales'],
            ['mostrar_descuentos', 'Descuentos'],
            ['mostrar_recargos', 'Recargos'],
            ['mostrar_observaciones', 'Observaciones'],
          ].map(([name, label]) => (
            <label key={name} className="flex items-center justify-between gap-2 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[13px] font-semibold text-[#041627]">
              {label}
              <input type="checkbox" {...register(name as keyof ConfiguracionPosPayload)} className="h-4 w-4 accent-[#075E54]" />
            </label>
          ))}
        </div>
      </div>
    </div>
  </section>
);
