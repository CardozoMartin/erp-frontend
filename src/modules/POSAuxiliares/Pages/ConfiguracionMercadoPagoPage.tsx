import { CheckCircle2, ExternalLink, Loader2, QrCode, Save, Search, Store, TerminalSquare } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/auth.store';
import type { IErrorResponse } from '../../../type/api.response.type';
import {
  buscarMpStoreFn,
  buscarMpPosFn,
  crearMpPosFn,
  crearMpStoreFn,
  getMpConfiguracionResumenFn,
  guardarMpCredencialesFn,
  obtenerMpUsuarioFn,
  testMpCredencialesFn,
  type MpPosResponse,
  type MpStoreResponse,
  type MpTestResponse,
  type MpUsuarioResponse,
} from '../api/posAux.api';

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 10);

const errorMessage = (error: AxiosError<IErrorResponse & { detalle?: { message?: string } }>) => {
  const data = error.response?.data;
  const message = data?.message || data?.mensaje || data?.detalle?.message;
  return Array.isArray(message) ? message.join(', ') : message || 'No se pudo completar la operacion';
};

const ConfiguracionMercadoPagoPage = () => {
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const baseCode = useMemo(
    () => slug(sucursalActiva?.nombre || 'SUCURSAL') || 'SUC001',
    [sucursalActiva?.nombre],
  );

  const [accessToken, setAccessToken] = useState('');
  const [mpUserId, setMpUserId] = useState('');
  const [mpNickname, setMpNickname] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeExternalId, setStoreExternalId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [streetName, setStreetName] = useState('Av. San Martin');
  const [streetNumber, setStreetNumber] = useState('1234');
  const [cityName, setCityName] = useState('La Plata');
  const [stateName, setStateName] = useState('Buenos Aires');
  const [latitude, setLatitude] = useState('-34.92145');
  const [longitude, setLongitude] = useState('-57.95453');
  const [reference, setReference] = useState('Sucursal de prueba');
  const [openHour, setOpenHour] = useState('08:00');
  const [closeHour, setCloseHour] = useState('18:00');
  const [posName, setPosName] = useState('');
  const [posExternalId, setPosExternalId] = useState('');
  const [category, setCategory] = useState(621102);
  const [fixedAmount, setFixedAmount] = useState(true);
  const [storeResult, setStoreResult] = useState<MpStoreResponse | null>(null);
  const [posResult, setPosResult] = useState<MpPosResponse | null>(null);
  const [testResult, setTestResult] = useState<MpTestResponse | null>(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);

  const resumenQuery = useQuery({
    queryKey: ['pos-aux', 'configuracion-mercadopago', sucursalActiva?.id],
    queryFn: () => getMpConfiguracionResumenFn(sucursalActiva!.id),
    enabled: !!sucursalActiva?.id,
    retry: false,
  });

  const configExistente = resumenQuery.data?.configurado ? resumenQuery.data : null;

  useEffect(() => {
    const sucursalNombre = sucursalActiva?.nombre || 'Sucursal Centro';
    const nextStoreCode = baseCode.startsWith('SUC') ? baseCode : `SUC${baseCode.slice(0, 7)}`;
    setStoreName(sucursalNombre);
    setStoreExternalId(nextStoreCode);
    setPosName(`Caja 1 - ${sucursalNombre}`);
    setPosExternalId(`${nextStoreCode}POS001`);
    setStoreId('');
    setStoreResult(null);
    setPosResult(null);
    setTestResult(null);
    setMostrarAlta(false);
  }, [baseCode, sucursalActiva?.id, sucursalActiva?.nombre]);

  useEffect(() => {
    if (!configExistente) return;
    setMpUserId(configExistente.mpUserId ?? '');
    setPosExternalId(configExistente.mpPosId ?? '');
    setPosName(configExistente.mpPosNombre || `Caja 1 - ${sucursalActiva?.nombre || 'Sucursal'}`);
  }, [configExistente, sucursalActiva?.nombre]);

  const usuarioMutation = useMutation({
    mutationFn: obtenerMpUsuarioFn,
    onSuccess: (data: MpUsuarioResponse) => {
      setMpUserId(String(data.id));
      setMpNickname(data.nickname || data.email || '');
      toast.success('Usuario Mercado Pago validado');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(errorMessage(error)),
  });

  const storeMutation = useMutation({
    mutationFn: crearMpStoreFn,
    onSuccess: (data) => {
      setStoreResult(data);
      setStoreId(String(data.id));
      setStoreExternalId(data.external_id || storeExternalId);
      toast.success('Tienda Mercado Pago creada');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      const mensaje = errorMessage(error);
      if (mensaje.toLowerCase().includes('already assigned')) {
        buscarStoreMutation.mutate({
          accessToken: accessToken.trim(),
          userId: mpUserId.trim(),
          externalId: storeExternalId.trim(),
        });
        toast.info('La tienda ya existe. Buscando datos guardados en Mercado Pago');
        return;
      }
      toast.error(mensaje);
    },
  });

  const buscarStoreMutation = useMutation({
    mutationFn: buscarMpStoreFn,
    onSuccess: (data) => {
      const store = data.results?.[0];
      if (!store) {
        toast.warning('No se encontro una tienda con ese external_id');
        return;
      }
      setStoreResult(store);
      setStoreId(String(store.id));
      setStoreName(store.name || storeName);
      setStoreExternalId(store.external_id || storeExternalId);
      toast.success('Tienda encontrada');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(errorMessage(error)),
  });

  const guardarCredencialesDirecto = async (finalPosId: string, finalPosNombre: string) => {
    if (!sucursalActiva?.id || !accessToken.trim() || !mpUserId.trim() || !finalPosId.trim()) {
      return false;
    }

    await guardarMpCredencialesFn({
      sucursalId: sucursalActiva.id,
      accessToken: accessToken.trim(),
      mpUserId: mpUserId.trim(),
      mpPosId: finalPosId.trim(),
      mpPosNombre: finalPosNombre.trim(),
    });
    return true;
  };

  const posMutation = useMutation({
    mutationFn: crearMpPosFn,
    onSuccess: async (data) => {
      const finalPosId = data.external_id || posExternalId;
      const finalPosNombre = data.name || posName;
      setPosResult(data);
      setPosName(finalPosNombre);
      setPosExternalId(finalPosId);

      try {
        const guardado = await guardarCredencialesDirecto(finalPosId, finalPosNombre);
        toast.success(
          guardado
            ? 'POS creado y configuracion guardada en el ERP'
            : 'POS Mercado Pago creado',
        );
      } catch (error) {
        toast.warning(
          `POS creado, pero falta guardar en el ERP: ${errorMessage(error as AxiosError<IErrorResponse>)}`,
        );
      }
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(errorMessage(error)),
  });

  const buscarPosMutation = useMutation({
    mutationFn: buscarMpPosFn,
    onSuccess: (data) => {
      const pos = data.results?.[0];
      if (!pos) {
        toast.warning('No se encontro un POS con ese external_id');
        return;
      }
      setPosResult(pos);
      setPosName(pos.name || posName);
      setPosExternalId(pos.external_id || posExternalId);

      guardarCredencialesDirecto(pos.external_id || posExternalId, pos.name || posName)
        .then((guardado) => {
          toast.success(guardado ? 'POS encontrado y configuracion guardada' : 'POS encontrado');
        })
        .catch((error) => {
          toast.warning(
            `POS encontrado, pero falta guardar en el ERP: ${errorMessage(error as AxiosError<IErrorResponse>)}`,
          );
        });
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(errorMessage(error)),
  });

  const guardarMutation = useMutation({
    mutationFn: guardarMpCredencialesFn,
    onSuccess: () => {
      toast.success('Credenciales guardadas en el ERP');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(errorMessage(error)),
  });

  const testMutation = useMutation({
    mutationFn: testMpCredencialesFn,
    onSuccess: (data) => {
      setTestResult(data);
      if (data.ok) toast.success('Mercado Pago activo para la sucursal');
      else toast.error(data.error || 'La prueba devolvio error');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(errorMessage(error)),
  });

  const canUseToken = accessToken.trim().length > 10;
  const canCreateStore = canUseToken && !!mpUserId && !!storeName.trim() && !!storeExternalId.trim();
  const canSearchStore = canUseToken && !!mpUserId && !!storeExternalId.trim();
  const canCreatePos = canUseToken && !!storeId.trim() && !!storeExternalId.trim() && !!posExternalId.trim();
  const canSave = !!sucursalActiva?.id && canUseToken && !!mpUserId && !!posExternalId.trim();

  const handleCrearStore = () => {
    storeMutation.mutate({
      accessToken: accessToken.trim(),
      userId: mpUserId.trim(),
      name: storeName.trim(),
      externalId: storeExternalId.trim(),
      businessHours: {
        monday: [{ open: openHour, close: closeHour }],
      },
      location: {
        street_number: streetNumber.trim(),
        street_name: streetName.trim(),
        city_name: cityName.trim(),
        state_name: stateName.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        reference: reference.trim() || undefined,
      },
    });
  };

  const handleCrearPos = () => {
    posMutation.mutate({
      accessToken: accessToken.trim(),
      name: posName.trim(),
      fixedAmount,
      storeId: storeId.trim(),
      externalStoreId: storeExternalId.trim(),
      externalId: posExternalId.trim(),
      category: Number(category),
    });
  };

  const handleGuardar = () => {
    if (!sucursalActiva?.id) return;
    guardarMutation.mutate({
      sucursalId: sucursalActiva.id,
      accessToken: accessToken.trim(),
      mpUserId: mpUserId.trim(),
      mpPosId: posExternalId.trim(),
      mpPosNombre: posName.trim(),
    });
  };

  const busy =
    usuarioMutation.isPending ||
    storeMutation.isPending ||
    buscarStoreMutation.isPending ||
    posMutation.isPending ||
    buscarPosMutation.isPending ||
    guardarMutation.isPending ||
    testMutation.isPending;
  const altaBloqueada = !!configExistente && !mostrarAlta;

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[1240px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <QrCode size={17} className="text-[#075E54]" />
              Configuracion Mercado Pago
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#44474c]">
              <Store size={14} />
              {sucursalActiva?.nombre ?? 'Sin sucursal seleccionada'}
              {testResult?.ok ? (
                <span className="inline-flex items-center gap-1 rounded border border-[#cfe2de] bg-[#f3fbf9] px-2 py-0.5 text-[12px] font-semibold text-[#075E54]">
                  <CheckCircle2 size={13} />
                  Activo
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={altaBloqueada || !canSave || guardarMutation.isPending}
              className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
            >
              {guardarMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Guardar configuracion
            </button>
            <button
              type="button"
              onClick={() => sucursalActiva?.id && testMutation.mutate(sucursalActiva.id)}
              disabled={!sucursalActiva?.id || testMutation.isPending}
              className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
            >
              {testMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <TerminalSquare size={15} />}
              Probar conexion
            </button>
          </div>
        </div>

        {!sucursalActiva?.id ? (
          <div className="px-4 py-12 text-center text-[14px] text-[#44474c]">
            Seleccione una sucursal para configurar Mercado Pago.
          </div>
        ) : (
          <div className="grid gap-4 p-4 xl:grid-cols-[1fr_0.9fr]">
            {configExistente ? (
              <div className="xl:col-span-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[14px] font-bold text-[#075E54]">
                      <CheckCircle2 size={16} />
                      Mercado Pago ya esta configurado para esta sucursal
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#44474c]">
                      <span>Estado: <strong>{configExistente.estado}</strong></span>
                      <span>Usuario: <strong>{configExistente.mpUserId}</strong></span>
                      <span>POS: <strong>{configExistente.mpPosId}</strong></span>
                      {configExistente.mpPosNombre ? (
                        <span>Caja: <strong>{configExistente.mpPosNombre}</strong></span>
                      ) : null}
                    </div>
                    {configExistente.ultimoError ? (
                      <div className="mt-2 text-[12px] font-semibold text-[#b42318]">
                        Ultimo error: {configExistente.ultimoError}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sucursalActiva?.id && testMutation.mutate(sucursalActiva.id)}
                      disabled={testMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
                    >
                      {testMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <TerminalSquare size={15} />}
                      Probar
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarAlta((value) => !value)}
                      className="h-9 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                    >
                      {mostrarAlta ? 'Ocultar alta' : 'Modificar configuracion'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                  Credencial
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Access token
                    </span>
                    <input
                      type="password"
                      autoComplete="off"
                      value={accessToken}
                      onChange={(event) => setAccessToken(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                      placeholder="APP_USR-..."
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => usuarioMutation.mutate(accessToken.trim())}
                    disabled={altaBloqueada || !canUseToken || usuarioMutation.isPending}
                    className="mt-5 flex h-10 items-center justify-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                  >
                    {usuarioMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                    Leer usuario
                  </button>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      MP user id
                    </span>
                    <input
                      value={mpUserId}
                      onChange={(event) => setMpUserId(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Usuario
                    </span>
                    <input
                      value={mpNickname}
                      onChange={(event) => setMpNickname(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                  Tienda
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Nombre
                    </span>
                    <input
                      value={storeName}
                      onChange={(event) => setStoreName(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      External id tienda
                    </span>
                    <input
                      value={storeExternalId}
                      onChange={(event) => setStoreExternalId(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Calle
                    </span>
                    <input
                      value={streetName}
                      onChange={(event) => setStreetName(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Numero
                    </span>
                    <input
                      value={streetNumber}
                      onChange={(event) => setStreetNumber(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Ciudad
                    </span>
                    <input
                      value={cityName}
                      onChange={(event) => setCityName(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Provincia
                    </span>
                    <input
                      value={stateName}
                      onChange={(event) => setStateName(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Latitud
                    </span>
                    <input
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Longitud
                    </span>
                    <input
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Apertura lunes
                    </span>
                    <input
                      type="time"
                      value={openHour}
                      onChange={(event) => setOpenHour(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Cierre lunes
                    </span>
                    <input
                      type="time"
                      value={closeHour}
                      onChange={(event) => setCloseHour(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Referencia
                    </span>
                    <input
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                    <button
                      type="button"
                      onClick={handleCrearStore}
                      disabled={altaBloqueada || !canCreateStore || storeMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                    >
                      {storeMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Store size={15} />}
                      Crear tienda
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        buscarStoreMutation.mutate({
                          accessToken: accessToken.trim(),
                          userId: mpUserId.trim(),
                          externalId: storeExternalId.trim(),
                        })
                      }
                      disabled={altaBloqueada || !canSearchStore || buscarStoreMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
                    >
                      {buscarStoreMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                      Buscar tienda
                    </button>
                    <input
                      value={storeId}
                      onChange={(event) => setStoreId(event.target.value)}
                      className="h-9 min-w-[220px] rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]"
                      placeholder="Store id"
                    />
                    {storeResult?.status ? (
                      <span className="text-[12px] font-semibold text-[#075E54]">
                        {storeResult.status}
                      </span>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                  POS y QR
                </div>
                <div className="space-y-4 p-4">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Nombre POS
                    </span>
                    <input
                      value={posName}
                      onChange={(event) => setPosName(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      External id POS
                    </span>
                    <input
                      value={posExternalId}
                      onChange={(event) => setPosExternalId(event.target.value)}
                      disabled={altaBloqueada}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                        Categoria
                      </span>
                      <input
                        type="number"
                        value={category}
                        onChange={(event) => setCategory(Number(event.target.value))}
                        disabled={altaBloqueada}
                        className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                      />
                    </label>
                    <label className="mt-5 flex h-10 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
                      <input
                        type="checkbox"
                        checked={fixedAmount}
                        onChange={(event) => setFixedAmount(event.target.checked)}
                        disabled={altaBloqueada}
                        className="h-4 w-4 accent-[#075E54]"
                      />
                      Monto fijo
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCrearPos}
                      disabled={altaBloqueada || !canCreatePos || posMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                    >
                      {posMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
                      Crear POS
                    </button>
                    <button
                      type="button"
                      onClick={() => buscarPosMutation.mutate({ accessToken: accessToken.trim(), externalId: posExternalId.trim() })}
                      disabled={altaBloqueada || !canUseToken || !posExternalId.trim() || buscarPosMutation.isPending}
                      className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
                    >
                      {buscarPosMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                      Buscar POS
                    </button>
                  </div>

                  {posResult ? (
                    <div className="rounded border border-[#cfe2de] bg-white p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold text-[#041627]">
                        <span>{posResult.name}</span>
                        <span className="text-[#075E54]">{posResult.external_id}</span>
                      </div>
                      {posResult.qr?.image ? (
                        <div className="flex flex-wrap items-start gap-3">
                          <img
                            src={posResult.qr.image}
                            alt="QR Mercado Pago"
                            className="h-40 w-40 rounded border border-[#c4c6cd] bg-white object-contain"
                          />
                          <div className="space-y-2">
                            <a
                              href={posResult.qr.image}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                            >
                              <ExternalLink size={14} />
                              Abrir imagen
                            </a>
                            {posResult.qr.template_document ? (
                              <a
                                href={posResult.qr.template_document}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                              >
                                <ExternalLink size={14} />
                                Abrir PDF
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                  Estado
                </div>
                <div className="space-y-2 p-4 text-[13px]">
                  <div className="flex justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-2">
                    <span className="text-[#44474c]">Usuario</span>
                    <span className="font-semibold text-[#041627]">{mpNickname || mpUserId || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-2">
                    <span className="text-[#44474c]">Tienda</span>
                    <span className="font-semibold text-[#041627]">{storeId || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-2">
                    <span className="text-[#44474c]">POS</span>
                    <span className="font-semibold text-[#041627]">{posExternalId || '-'}</span>
                  </div>
                  <div
                    className={`rounded border px-3 py-2 font-semibold ${
                      testResult?.ok
                        ? 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]'
                        : 'border-[#f3d19b] bg-[#fff7e8] text-[#7a4f00]'
                    }`}
                  >
                    {testResult
                      ? testResult.ok
                        ? `Activo: ${testResult.mpUser || ''} - ${testResult.posNombre || ''}`
                        : `Error: ${testResult.error || testResult.estado}`
                      : busy
                        ? 'Procesando'
                        : 'Pendiente de prueba'}
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
};

export default ConfiguracionMercadoPagoPage;
