import { matchPath } from 'react-router-dom';

interface RutaUsuario {
  path: string;
}

export const getRutaInicioPermitida = (
  rutaInicio: string | null | undefined,
  rutas: RutaUsuario[],
  fallback = '/sin-acceso',
) => {
  const rutaValida = rutas.find((ruta) =>
    matchPath({ path: ruta.path, end: true }, rutaInicio || ''),
  );

  return rutaValida?.path ?? rutas[0]?.path ?? fallback;
};
