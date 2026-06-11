import { BadgePercent, CreditCard, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../../store/auth.store';
import type { IListaPrecioPos } from '../../PuntoDeVenta/types/pos.type';
import { useListasPrecioAux, usePosAuxMutation } from '../hooks/usePosAux';
import type { ListaPrecioPayload } from '../api/posAux.api';

type ListaForm = {
  nombre: string;
  descripcion: string;
  alcance: 'GLOBAL' | 'SUCURSAL';
  tipo_lista: 'CONTADO' | 'TARJETA' | 'MAYORISTA' | 'PROMOCION' | 'PERSONALIZADA';
  tipo_ajuste: 'DESCUENTO' | 'RECARGO';
  porcentaje: number;
  cuotas: number;
  usa_cuotas: boolean;
  modo_iva: 'NO_APLICA' | 'IVA_INCLUIDO' | 'AGREGAR_IVA';
  porcentaje_iva: number;
  activa: boolean;
};

const defaults: ListaForm = {
  nombre: '',
  descripcion: '',
  alcance: 'SUCURSAL',
  tipo_lista: 'CONTADO',
  tipo_ajuste: 'DESCUENTO',
  porcentaje: 0,
  cuotas: 1,
  usa_cuotas: false,
  modo_iva: 'NO_APLICA',
  porcentaje_iva: 21,
  activa: true,
};

const toNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toBoolean = (value: unknown) => value === true || value === 'true';

const describe = (lista: IListaPrecioPos) => {
  const parts = [
    lista.tipo_ajuste === 'DESCUENTO'
      ? `${toNumber(lista.porcentaje)}% descuento`
      : `${toNumber(lista.porcentaje)}% recargo`,
  ];
  if (lista.cuotas) parts.push(`${lista.cuotas} cuotas`);
  if (lista.modo_iva === 'AGREGAR_IVA') parts.push(`agrega IVA ${toNumber(lista.porcentaje_iva)}%`);
  if (lista.modo_iva === 'IVA_INCLUIDO') parts.push('IVA incluido');
  return parts.join(' | ');
};

const valuesFromList = (lista: IListaPrecioPos): ListaForm => ({
  nombre: lista.nombre,
  descripcion: lista.descripcion ?? '',
  alcance: lista.sucursal_id ? 'SUCURSAL' : 'GLOBAL',
  tipo_lista: lista.tipo_lista ?? 'PERSONALIZADA',
  tipo_ajuste: lista.tipo_ajuste,
  porcentaje: toNumber(lista.porcentaje),
  cuotas: toNumber(lista.cuotas || 1),
  usa_cuotas: !!lista.cuotas,
  modo_iva: lista.modo_iva ?? 'NO_APLICA',
  porcentaje_iva: toNumber(lista.porcentaje_iva ?? 21),
  activa: lista.activa,
});

const ListasPrecioAuxPage = () => {
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const listasQuery = useListasPrecioAux();
  const mutations = usePosAuxMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(true);
  const form = useForm<ListaForm>({ defaultValues: defaults });
  const usaCuotas = form.watch('usa_cuotas');
  const modoIva = form.watch('modo_iva');
  const tipoLista = form.watch('tipo_lista');
  const listas = listasQuery.data ?? [];
  const selected = listas.find((lista) => lista.id === selectedId) ?? null;

  const listasOrdenadas = useMemo(
    () => [...listas].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [listas],
  );

  useEffect(() => {
    if (creating || !selected) return;
    form.reset(valuesFromList(selected));
  }, [creating, selected?.id]);

  useEffect(() => {
    if (tipoLista === 'TARJETA') {
      form.setValue('usa_cuotas', true);
      if (form.getValues('tipo_ajuste') === 'DESCUENTO') form.setValue('tipo_ajuste', 'RECARGO');
    }
  }, [tipoLista]);

  const nuevo = () => {
    setCreating(true);
    setSelectedId(null);
    form.reset(defaults);
  };

  const payloadFromValues = (values: ListaForm): ListaPrecioPayload => ({
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || null,
    sucursal_id: values.alcance === 'SUCURSAL' ? sucursalActiva?.id ?? null : null,
    tipo_lista: values.tipo_lista,
    tipo_ajuste: values.tipo_ajuste,
    porcentaje: Number(values.porcentaje || 0),
    cuotas: values.usa_cuotas ? Number(values.cuotas || 1) : null,
    modo_iva: values.modo_iva,
    porcentaje_iva: values.modo_iva === 'NO_APLICA' ? 0 : Number(values.porcentaje_iva || 0),
    activa: toBoolean(values.activa),
  });

  const onSubmit = (values: ListaForm) => {
    const payload = payloadFromValues(values);
    if (creating || !selected) {
      mutations.crearListaPrecio.mutate(payload, {
        onSuccess: (lista) => {
          setCreating(false);
          setSelectedId(lista.id);
        },
      });
      return;
    }
    mutations.actualizarListaPrecio.mutate({ id: selected.id, data: payload });
  };

  const eliminar = () => {
    if (!selected) return;
    const ok = window.confirm(`Eliminar la lista ${selected.nombre}?`);
    if (!ok) return;
    mutations.eliminarListaPrecio.mutate(selected.id, {
      onSuccess: nuevo,
    });
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <BadgePercent size={17} className="text-[#075E54]" />
              Listas de precio
            </div>
            <button
              type="button"
              onClick={nuevo}
              className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62]"
            >
              <Plus size={15} />
              Nueva
            </button>
          </div>

          <div className="max-h-[720px] overflow-auto">
            {listasOrdenadas.map((lista) => (
              <button
                key={lista.id}
                type="button"
                onClick={() => {
                  setCreating(false);
                  setSelectedId(lista.id);
                  form.reset(valuesFromList(lista));
                }}
                className={`w-full border-b border-[#e5e7eb] px-4 py-3 text-left hover:bg-[#f8fafc] ${
                  selected?.id === lista.id && !creating ? 'bg-[#eef8f6]' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold text-[#041627]">{lista.nombre}</div>
                    <div className="mt-1 text-[12px] text-[#44474c]">{describe(lista)}</div>
                  </div>
                  <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2 py-1 text-[11px] font-semibold text-[#075E54]">
                    {lista.tipo_lista ?? 'PERSONALIZADA'}
                  </span>
                </div>
              </button>
            ))}
            {!listasOrdenadas.length && !listasQuery.isLoading ? (
              <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
                Sin listas de precio cargadas.
              </div>
            ) : null}
          </div>
        </section>

        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="text-[18px] font-bold text-[#041627]">
                {creating ? 'Nueva lista' : selected?.nombre ?? 'Lista de precio'}
              </div>
              <div className="text-[13px] text-[#44474c]">
                Contado, mayorista, cuotas, recargos e IVA.
              </div>
            </div>
            <div className="flex gap-2">
              {!creating && selected ? (
                <button
                  type="button"
                  onClick={eliminar}
                  className="flex h-9 items-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 text-[13px] font-semibold text-[#b42318] hover:bg-[#fdecec]"
                >
                  <Trash2 size={15} />
                  Eliminar
                </button>
              ) : null}
              <button
                type="submit"
                disabled={mutations.crearListaPrecio.isPending || mutations.actualizarListaPrecio.isPending}
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                <Save size={15} />
                Guardar
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-4">
            <section className="rounded border border-[#c4c6cd]">
              <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#041627]">
                <BadgePercent size={15} className="text-[#075E54]" />
                Datos comerciales
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <label className="text-[12px] font-semibold text-[#041627]">
                  Nombre
                  <input {...form.register('nombre', { required: true })} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Tipo
                  <select {...form.register('tipo_lista')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                    <option value="CONTADO">Contado efectivo</option>
                    <option value="TARJETA">Tarjeta/cuotas</option>
                    <option value="MAYORISTA">Mayorista</option>
                    <option value="PROMOCION">Promocion</option>
                    <option value="PERSONALIZADA">Personalizada</option>
                  </select>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Alcance
                  <select {...form.register('alcance')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                    <option value="SUCURSAL">Solo sucursal actual</option>
                    <option value="GLOBAL">Todas las sucursales</option>
                  </select>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Activa
                  <select {...form.register('activa')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                    <option value="true">Si</option>
                    <option value="false">No</option>
                  </select>
                </label>
                <label className="text-[12px] font-semibold text-[#041627] md:col-span-2">
                  Descripcion visible para el vendedor
                  <input {...form.register('descripcion')} placeholder="Ej: 3 cuotas sin interes / contado efectivo 10% menos" className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
              </div>
            </section>

            <section className="rounded border border-[#c4c6cd]">
              <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#041627]">
                <CreditCard size={15} className="text-[#075E54]" />
                Calculo de precio
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <label className="text-[12px] font-semibold text-[#041627]">
                  Ajuste
                  <select {...form.register('tipo_ajuste')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                    <option value="DESCUENTO">Descuento</option>
                    <option value="RECARGO">Recargo</option>
                  </select>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Porcentaje
                  <input type="number" min={0} max={100} step="0.01" {...form.register('porcentaje', { valueAsNumber: true })} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="flex h-9 items-center justify-between rounded border border-[#c4c6cd] px-3 text-[13px] font-semibold text-[#041627]">
                  Usar cuotas
                  <input type="checkbox" {...form.register('usa_cuotas')} className="h-4 w-4 accent-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Cantidad de cuotas
                  <input type="number" min={1} disabled={!usaCuotas} {...form.register('cuotas', { valueAsNumber: true })} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  IVA
                  <select {...form.register('modo_iva')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                    <option value="NO_APLICA">No aplicar IVA</option>
                    <option value="IVA_INCLUIDO">Precio con IVA incluido</option>
                    <option value="AGREGAR_IVA">Agregar IVA al precio</option>
                  </select>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Porcentaje IVA
                  <input type="number" min={0} max={100} step="0.01" disabled={modoIva === 'NO_APLICA'} {...form.register('porcentaje_iva', { valueAsNumber: true })} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]" />
                </label>
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListasPrecioAuxPage;
