import { CheckCircle2, Loader2, Save } from 'lucide-react';
import type { ArcaAmbiente, IArcaResumen } from '../types/arca.type';
import ArcaArchivoInput from './ArcaArchivoInput';

interface Props {
  resumen?: IArcaResumen;
  cuit: string;
  puntoVenta: string;
  ambiente: ArcaAmbiente;
  guardando: boolean;
  probando: boolean;
  puedeGuardar: boolean;
  alCambiarCuit: (valor: string) => void;
  alCambiarPuntoVenta: (valor: string) => void;
  alCambiarAmbiente: (valor: ArcaAmbiente) => void;
  alLeerCertificado: (contenido: string) => void;
  alLeerClave: (contenido: string) => void;
  alGuardar: () => void;
  alProbar: () => void;
}

const ArcaForm = ({
  resumen,
  cuit,
  puntoVenta,
  ambiente,
  guardando,
  probando,
  puedeGuardar,
  alCambiarCuit,
  alCambiarPuntoVenta,
  alCambiarAmbiente,
  alLeerCertificado,
  alLeerClave,
  alGuardar,
  alProbar,
}: Props) => (
  <div className="grid gap-4 p-4 md:grid-cols-2">
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">CUIT del emisor</span>
      <input
        value={cuit}
        onChange={(event) => alCambiarCuit(event.target.value)}
        placeholder="20-35256076-7"
        className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
      />
      <span className="mt-1 block text-[11px] text-[#6b7280]">Formato XX-XXXXXXXX-X</span>
    </label>

    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Punto de venta</span>
      <input
        value={puntoVenta}
        onChange={(event) => alCambiarPuntoVenta(event.target.value.replace(/\D/g, ''))}
        placeholder="1"
        maxLength={4}
        className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
      />
      <span className="mt-1 block text-[11px] text-[#6b7280]">
        El dado de alta en ARCA como tipo WebServices
      </span>
    </label>

    <ArcaArchivoInput
      etiqueta="Certificado (.crt)"
      accept=".crt,.pem,.cer"
      encabezadoEsperado="BEGIN CERTIFICATE"
      ayuda="El archivo descargado desde WSASS"
      yaConfigurado={resumen?.configurado}
      alLeer={alLeerCertificado}
    />

    <ArcaArchivoInput
      etiqueta="Clave privada (.key)"
      accept=".key,.pem"
      encabezadoEsperado="PRIVATE KEY"
      ayuda="La generada con openssl — nunca se comparte"
      yaConfigurado={resumen?.configurado}
      alLeer={alLeerClave}
    />

    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Ambiente</span>
      <select
        value={ambiente}
        onChange={(event) => alCambiarAmbiente(event.target.value as ArcaAmbiente)}
        className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
      >
        <option value="testing">Homologacion (pruebas)</option>
        <option value="produccion">Produccion (comprobantes reales)</option>
      </select>
      {ambiente === 'produccion' ? (
        <span className="mt-1 block text-[11px] font-semibold text-[#b42318]">
          Los comprobantes tendran validez fiscal real
        </span>
      ) : (
        <span className="mt-1 block text-[11px] text-[#6b7280]">
          Sin validez fiscal — para probar
        </span>
      )}
    </label>

    <div className="flex flex-wrap items-center gap-2 md:col-span-2">
      <button
        type="button"
        onClick={alGuardar}
        disabled={guardando || !puedeGuardar}
        className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
      >
        {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Guardar credenciales
      </button>

      <button
        type="button"
        onClick={alProbar}
        disabled={probando || !resumen?.configurado}
        className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
      >
        {probando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        Probar conexion
      </button>

      {!puedeGuardar ? (
        <span className="text-[12px] text-[#6b7280]">
          Completá CUIT, punto de venta y ambos archivos para guardar.
        </span>
      ) : null}
    </div>
  </div>
);

export default ArcaForm;
