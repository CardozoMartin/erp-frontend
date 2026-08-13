import { CheckCircle2, FileKey, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

interface Props {
  etiqueta: string;
  /** Extensiones aceptadas, ej: '.crt,.pem' */
  accept: string;
  /** Texto que debe contener la primera línea del PEM para considerarlo válido */
  encabezadoEsperado: string;
  ayuda: string;
  yaConfigurado?: boolean;
  alLeer: (contenido: string) => void;
}

/** Lee un archivo PEM del disco y devuelve su contenido en texto plano */
const ArcaArchivoInput = ({
  etiqueta,
  accept,
  encabezadoEsperado,
  ayuda,
  yaConfigurado,
  alLeer,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [error, setError] = useState('');

  const manejarSeleccion = async (archivo: File | undefined) => {
    if (!archivo) return;
    setError('');

    const contenido = await archivo.text();

    // Validamos el encabezado PEM acá para avisar antes de mandarlo al servidor
    if (!contenido.includes(encabezadoEsperado)) {
      setError(`El archivo no parece válido: falta "${encabezadoEsperado}"`);
      setNombreArchivo('');
      alLeer('');
      return;
    }

    setNombreArchivo(archivo.name);
    alLeer(contenido);
  };

  return (
    <div className="block">
      <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">{etiqueta}</span>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => void manejarSeleccion(event.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-10 w-full items-center gap-2 rounded border border-dashed border-[#c4c6cd] bg-[#fafbfc] px-3 text-left text-[13px] text-[#44474c] hover:border-[#075E54] hover:bg-[#f3fbf9]"
      >
        {nombreArchivo ? (
          <>
            <CheckCircle2 size={15} className="shrink-0 text-[#075E54]" />
            <span className="truncate font-medium text-[#041627]">{nombreArchivo}</span>
          </>
        ) : (
          <>
            <Upload size={15} className="shrink-0" />
            <span className="truncate">
              {yaConfigurado ? 'Ya configurado — subir uno nuevo para reemplazar' : 'Seleccionar archivo'}
            </span>
          </>
        )}
      </button>

      {error ? (
        <span className="mt-1 block text-[11px] font-semibold text-[#b42318]">{error}</span>
      ) : (
        <span className="mt-1 flex items-center gap-1 text-[11px] text-[#6b7280]">
          <FileKey size={11} />
          {ayuda}
        </span>
      )}
    </div>
  );
};

export default ArcaArchivoInput;
