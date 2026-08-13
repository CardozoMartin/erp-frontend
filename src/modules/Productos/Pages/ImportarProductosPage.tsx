import { useState, useRef } from 'react';
import { Download, Upload, CheckCircle2, XCircle, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import { descargarPlantillaFn, importarProductosFn } from '../api/importacion.api';
import type { ResultadoImportacion } from '../api/importacion.api';
import { toast } from 'sonner';

const ImportarProductosPage = () => {
  const tienePermiso = useAuthStore((s) => s.tienePermiso);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!tienePermiso('productos.crear')) return <AccessDenied />;

  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Solo se aceptan archivos Excel (.xlsx, .xls)');
      return;
    }
    setArchivo(file);
    setResultado(null);
  };

  const manejarDescargarPlantilla = async () => {
    setDescargando(true);
    try {
      await descargarPlantillaFn();
      toast.success('Plantilla descargada');
    } catch {
      toast.error('No se pudo descargar la plantilla');
    } finally {
      setDescargando(false);
    }
  };

  const manejarImportar = async () => {
    if (!archivo) return;
    setCargando(true);
    try {
      const res = await importarProductosFn(archivo);
      setResultado(res);
      if (res.creados > 0) {
        toast.success(`${res.creados} producto${res.creados !== 1 ? 's' : ''} importado${res.creados !== 1 ? 's' : ''} correctamente`);
      }
      if (res.errores.length > 0) {
        toast.warning(`${res.errores.length} fila${res.errores.length !== 1 ? 's' : ''} con error`);
      }
    } catch {
      toast.error('Error al procesar el archivo');
    } finally {
      setCargando(false);
    }
  };

  const manejarDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.match(/\.(xlsx|xls)$/i)) {
      setArchivo(file);
      setResultado(null);
    } else {
      toast.error('Solo se aceptan archivos Excel (.xlsx, .xls)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900">Importar productos desde Excel</h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Cargá un archivo Excel con los datos de los productos. Descargá la plantilla para ver el formato correcto.
          </p>
        </div>

        {/* Paso 1 — Descargar plantilla */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">1</span>
            <h2 className="text-[14px] font-semibold text-gray-800">Descargá la plantilla</h2>
          </div>
          <p className="mb-3 text-[12px] text-gray-500">
            La plantilla incluye los campos disponibles y una hoja de instrucciones con los valores válidos.
          </p>
          <button
            onClick={manejarDescargarPlantilla}
            disabled={descargando}
            className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-[13px] font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <Download size={15} />
            {descargando ? 'Descargando…' : 'Descargar plantilla Excel'}
          </button>
        </div>

        {/* Paso 2 — Subir archivo */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">2</span>
            <h2 className="text-[14px] font-semibold text-gray-800">Subí el archivo completado</h2>
          </div>

          <div
            onDrop={manejarDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className={`
              flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors
              ${archivo ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30'}
            `}
          >
            {archivo ? (
              <>
                <FileSpreadsheet size={32} className="text-emerald-500" />
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-emerald-700">{archivo.name}</p>
                  <p className="text-[11px] text-gray-400">{(archivo.size / 1024).toFixed(1)} KB · Hacé clic para cambiar</p>
                </div>
              </>
            ) : (
              <>
                <Upload size={28} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-[13px] font-medium text-gray-600">Arrastrá tu archivo aquí o hacé clic para seleccionar</p>
                  <p className="text-[11px] text-gray-400">Solo archivos .xlsx o .xls · Máximo 5 MB</p>
                </div>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={manejarSeleccionArchivo}
          />

          {archivo && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={manejarImportar}
                disabled={cargando}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-[13px] font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                <Upload size={14} />
                {cargando ? 'Importando…' : 'Importar productos'}
              </button>
              <button
                onClick={() => { setArchivo(null); setResultado(null); if (inputRef.current) inputRef.current.value = ''; }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-[14px] font-semibold text-gray-800">Resultado de la importación</h2>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-[22px] font-bold text-gray-700">{resultado.total}</p>
                <p className="text-[11px] text-gray-500">Total de filas</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <p className="text-[22px] font-bold text-emerald-700">{resultado.creados}</p>
                <p className="text-[11px] text-emerald-600">Importados</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${resultado.errores.length > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className={`text-[22px] font-bold ${resultado.errores.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>{resultado.errores.length}</p>
                <p className={`text-[11px] ${resultado.errores.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>Con error</p>
              </div>
            </div>

            {resultado.creados > 0 && resultado.errores.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                <CheckCircle2 size={16} />
                Todos los productos fueron importados correctamente.
              </div>
            )}

            {resultado.errores.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-red-700">
                  <AlertTriangle size={15} />
                  Filas con error ({resultado.errores.length})
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-red-200">
                  {resultado.errores.map((error) => (
                    <div key={error.fila} className="flex items-start gap-3 border-b border-red-100 px-4 py-2.5 last:border-0">
                      <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                      <div>
                        <span className="text-[11px] font-semibold text-gray-500">Fila {error.fila}</span>
                        {error.nombre && <span className="ml-1 text-[11px] text-gray-400">· {error.nombre}</span>}
                        <p className="text-[12px] text-red-700">{error.motivo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportarProductosPage;
