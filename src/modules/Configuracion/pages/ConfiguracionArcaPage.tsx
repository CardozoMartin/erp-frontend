import { AlertTriangle, Loader2, Receipt, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import { dateTime } from '../../POSAuxiliares/utils/format';
import ArcaEstadoBadge from '../components/ArcaEstadoBadge';
import ArcaForm from '../components/ArcaForm';
import { useArcaMutations, useArcaResumen } from '../hooks/useArca';
import type { ArcaAmbiente } from '../types/arca.type';

const ConfiguracionArcaPage = () => {
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const resumenQuery = useArcaResumen(sucursalActiva?.id);
  const mutations = useArcaMutations();

  const [cuit, setCuit] = useState('');
  const [puntoVenta, setPuntoVenta] = useState('');
  const [ambiente, setAmbiente] = useState<ArcaAmbiente>('testing');
  const [certificado, setCertificado] = useState('');
  const [clavePrivada, setClavePrivada] = useState('');

  useEffect(() => {
    if (!resumenQuery.data?.configurado) return;
    setCuit(resumenQuery.data.cuit ?? '');
    setPuntoVenta(String(Number(resumenQuery.data.puntoVenta ?? '0')));
    setAmbiente(resumenQuery.data.ambiente ?? 'testing');
  }, [resumenQuery.data]);

  const resumen = resumenQuery.data;
  const puedeGuardar = !!cuit && !!puntoVenta && !!certificado && !!clavePrivada;

  const manejarGuardar = () => {
    if (!sucursalActiva?.id || !puedeGuardar) return;
    mutations.guardarCredenciales.mutate(
      { sucursalId: sucursalActiva.id, cuit, puntoVenta, certificado, clavePrivada, ambiente },
      // Limpiamos los PEM del estado apenas se guardan: no deben quedar en memoria del navegador
      { onSuccess: () => { setCertificado(''); setClavePrivada(''); } },
    );
  };

  const manejarProbar = () => {
    if (!sucursalActiva?.id) return;
    mutations.probarConexion.mutate(sucursalActiva.id);
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[900px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <Receipt size={17} className="text-[#075E54]" />
              Facturacion electronica ARCA
            </div>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-[#44474c]">
              <Store size={14} />
              {sucursalActiva?.nombre ?? 'Sin sucursal seleccionada'}
            </div>
          </div>
          <ArcaEstadoBadge estado={resumen?.estado} configurado={!!resumen?.configurado} />
        </div>

        {!sucursalActiva?.id ? (
          <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
            Seleccione una sucursal para configurar ARCA.
          </div>
        ) : resumenQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-[14px] text-[#44474c]">
            <Loader2 size={17} className="animate-spin" />
            Cargando configuracion
          </div>
        ) : (
          <>
            {resumen?.ultimoError ? (
              <div className="mx-4 mt-4 flex items-start gap-2 rounded border border-[#f3b4ae] bg-[#fef3f2] px-3 py-2">
                <AlertTriangle size={15} className="mt-[2px] shrink-0 text-[#b42318]" />
                <div>
                  <div className="text-[12px] font-bold text-[#b42318]">Ultimo error de ARCA</div>
                  <div className="mt-[2px] text-[12px] text-[#7a271a]">{resumen.ultimoError}</div>
                </div>
              </div>
            ) : null}

            <ArcaForm
              resumen={resumen}
              cuit={cuit}
              puntoVenta={puntoVenta}
              ambiente={ambiente}
              guardando={mutations.guardarCredenciales.isPending}
              probando={mutations.probarConexion.isPending}
              puedeGuardar={puedeGuardar}
              alCambiarCuit={setCuit}
              alCambiarPuntoVenta={setPuntoVenta}
              alCambiarAmbiente={setAmbiente}
              alLeerCertificado={setCertificado}
              alLeerClave={setClavePrivada}
              alGuardar={manejarGuardar}
              alProbar={manejarProbar}
            />

            <div className="border-t border-[#c4c6cd] px-4 py-3 text-[12px] text-[#44474c]">
              {resumen?.ticketVigente
                ? 'Ticket de acceso vigente — no hace falta reconectar.'
                : resumen?.configurado
                  ? 'Sin ticket vigente. Se renueva solo al emitir el proximo comprobante.'
                  : 'Al guardar queda pendiente hasta probar la conexion.'}
              {resumen?.ultimoTest ? ` · Ultima prueba ${dateTime(resumen.ultimoTest)}` : ''}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ConfiguracionArcaPage;
