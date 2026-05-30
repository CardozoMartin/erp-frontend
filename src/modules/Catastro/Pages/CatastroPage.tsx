import { RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type EstadoConcesion = '' | 'aprobado' | 'pendiente' | 'rechazado';
type TipoTramite =
  | ''
  | 'alta'
  | 'anulacion'
  | 'cambio_titular'
  | 'renovacion'
  | 'modificacion';

type FiltrosCatastro = {
  numeroConcesion: string;
  estado: EstadoConcesion;
  tipoTramite: TipoTramite;
  fechaDesde: string;
  fechaHasta: string;
  concesionDesde: string;
  concesionHasta: string;
};

const filtrosIniciales: FiltrosCatastro = {
  numeroConcesion: '',
  estado: '',
  tipoTramite: '',
  fechaDesde: '',
  fechaHasta: '',
  concesionDesde: '',
  concesionHasta: '',
};

const CatastroPage = () => {
  const [filtros, setFiltros] = useState<FiltrosCatastro>(filtrosIniciales);

  const filtrosActivos = useMemo(
    () => Object.values(filtros).filter((valor) => valor.trim() !== '').length,
    [filtros],
  );

  const handleChange = (field: keyof FiltrosCatastro, value: string) => {
    setFiltros((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLimpiar = () => {
    setFiltros(filtrosIniciales);
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-[#c4c6cd] bg-[#fbf9fa] px-6 py-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">Catastro</h2>
          <p className="mt-1 text-sm text-[#5f6771]">
            Consulta concesiones con filtros simples y claros para el usuario.
          </p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 py-6">
        <section className="overflow-hidden rounded-xl border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#c4c6cd] bg-[#fbf9fa] px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#041627]">Busqueda de concesiones</h3>
              <p className="mt-1 text-sm text-[#5f6771]">
                Filtra por numero, estado, tipo de tramite, fechas o rango de concesion.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d9dce3] bg-white px-3 py-1 text-xs font-medium text-[#5f6771]">
              <span className="h-2 w-2 rounded-full bg-[#075E54]" />
              {filtrosActivos} filtros activos
            </div>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#041627]">Numero de concesion</span>
              <input
                type="text"
                value={filtros.numeroConcesion}
                onChange={(event) => handleChange('numeroConcesion', event.target.value)}
                placeholder="Ej: 1520"
                className="rounded-md border border-[#c4c6cd] px-3 py-2 text-sm text-[#041627] outline-none transition-colors focus:border-[#041627]"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#041627]">Estado de concesion</span>
              <select
                value={filtros.estado}
                onChange={(event) => handleChange('estado', event.target.value)}
                className="rounded-md border border-[#c4c6cd] bg-white px-3 py-2 text-sm text-[#041627] outline-none transition-colors focus:border-[#041627]"
              >
                <option value="">Todos</option>
                <option value="aprobado">Aprobado</option>
                <option value="pendiente">Pendiente</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#041627]">Tipo de tramite</span>
              <select
                value={filtros.tipoTramite}
                onChange={(event) => handleChange('tipoTramite', event.target.value)}
                className="rounded-md border border-[#c4c6cd] bg-white px-3 py-2 text-sm text-[#041627] outline-none transition-colors focus:border-[#041627]"
              >
                <option value="">Todos</option>
                <option value="alta">Alta</option>
                <option value="anulacion">Anulacion</option>
                <option value="cambio_titular">Cambio de titular</option>
                <option value="renovacion">Renovacion</option>
                <option value="modificacion">Modificacion</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#041627]">Fecha desde</span>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(event) => handleChange('fechaDesde', event.target.value)}
                  className="rounded-md border border-[#c4c6cd] px-3 py-2 text-sm text-[#041627] outline-none transition-colors focus:border-[#041627]"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#041627]">Fecha hasta</span>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(event) => handleChange('fechaHasta', event.target.value)}
                  className="rounded-md border border-[#c4c6cd] px-3 py-2 text-sm text-[#041627] outline-none transition-colors focus:border-[#041627]"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#041627]">Concesion desde</span>
              <input
                type="text"
                value={filtros.concesionDesde}
                onChange={(event) => handleChange('concesionDesde', event.target.value)}
                placeholder="Desde"
                className="rounded-md border border-[#c4c6cd] px-3 py-2 text-sm text-[#041627] outline-none transition-colors focus:border-[#041627]"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#041627]">Concesion hasta</span>
              <input
                type="text"
                value={filtros.concesionHasta}
                onChange={(event) => handleChange('concesionHasta', event.target.value)}
                placeholder="Hasta"
                className="rounded-md border border-[#c4c6cd] px-3 py-2 text-sm text-[#041627] outline-none transition-colors focus:border-[#041627]"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#c4c6cd] px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[#5f6771]">
              Usa solo los campos que necesites para mantener una busqueda simple.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLimpiar}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-[#c4c6cd] px-4 py-2 text-sm font-medium text-[#44474c] transition-colors hover:bg-[#efedef]"
              >
                <RotateCcw size={16} />
                Limpiar
              </button>

              <button
                type="button"
                className="flex cursor-pointer items-center gap-2 rounded-md bg-[#075E54] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e8e4f]"
              >
                <Search size={16} />
                Buscar concesiones
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-[#c4c6cd] bg-white px-6 py-8 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-[#041627]">Resultados de la busqueda</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5f6771]">
            Esta seccion queda lista para conectar el listado de concesiones filtradas cuando se
            integre la consulta del modulo.
          </p>
        </section>
      </div>
    </>
  );
};

export default CatastroPage;
