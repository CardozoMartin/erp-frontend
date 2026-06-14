import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  paginaActual: number;
  totalPaginas: number;
  totalProductos: number;
  cantidadFiltrada: number;
  onCambiarPagina: (pagina: number) => void;
}

export const PaginadorTabla = ({
  paginaActual,
  totalPaginas,
  totalProductos,
  cantidadFiltrada,
  onCambiarPagina,
}: Props) => {
  return (
    <div className="px-4 py-3 bg-white border-t border-[#d7d9de] flex justify-between items-center">
      <span className="text-[13px] leading-[18px] font-medium text-[#44474c]">
        Mostrando {cantidadFiltrada} de {totalProductos} productos
      </span>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onCambiarPagina(Math.max(1, paginaActual - 1))}
          disabled={paginaActual === 1}
          className="w-8 h-8 flex items-center justify-center border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={17} />
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
          <button
            key={pagina}
            type="button"
            onClick={() => onCambiarPagina(pagina)}
            className={`w-8 h-8 flex items-center justify-center border text-[13px] font-medium transition-colors ${
              paginaActual === pagina
                ? 'bg-[#041627] border-[#041627] text-white'
                : 'bg-white border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef]'
            }`}
          >
            {pagina}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onCambiarPagina(Math.min(totalPaginas, paginaActual + 1))}
          disabled={paginaActual === totalPaginas || totalPaginas === 0}
          className="w-8 h-8 flex items-center justify-center border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
};
