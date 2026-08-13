// modules/Auth/pages/LoginPage.tsx
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { postLoginFn } from '../api/auth.api';
import { useAuthStore } from '../../../store/auth.store';
import { useState } from 'react';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const { mutate, isPending } = useMutation({
    mutationFn: postLoginFn,
    onSuccess: (data) => {
      setSession(data);
      navigate(data.rutaInicio);
    },
    onError: (error: any) => {
      // el error queda guardado en estado local, no se resetea
      const data = error?.response?.data;

      // Sin respuesta del servidor: backend caido, CORS o URL mal configurada.
      if (!error?.response) {
        setError(
          'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.',
        );
        return;
      }

      // Errores de validacion (400): el detalle util esta en `errores[]`,
      // no en `message`, que solo dice "Error de validacion".
      if (Array.isArray(data?.errores) && data.errores.length > 0) {
        const detalles = data.errores
          .flatMap((e: any) => Object.values(e?.errores ?? {}))
          .join('. ');
        setError(detalles || data.message || 'Datos inválidos');
        return;
      }

      const mensaje = Array.isArray(data?.message)
        ? data.message.join('. ')
        : data?.message;
      setError(mensaje ?? 'Email o contraseña incorrectos');
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white text-gray-500 max-w-[340px] w-full mx-4 md:p-6 p-4 py-8 text-left text-sm rounded-xl shadow-[0px_0px_10px_0px] shadow-black/10"
      >
        <h2 className="text-2xl font-bold mb-9 text-center text-gray-800">Welcome Back</h2>

        {/* Error del servidor */}
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-1">
          <div
            className={`flex items-center border bg-indigo-500/5 rounded gap-1 pl-2 ${errors.email ? 'border-red-300' : 'border-gray-500/10'}`}
          >
            <svg width="18" height="18" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path
                d="m2.5 4.375 3.875 2.906c.667.5 1.583.5 2.25 0L12.5 4.375"
                stroke="#6B7280"
                strokeOpacity=".6"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.875 3.125h-8.75c-.69 0-1.25.56-1.25 1.25v6.25c0 .69.56 1.25 1.25 1.25h8.75c.69 0 1.25-.56 1.25-1.25v-6.25c0-.69-.56-1.25-1.25-1.25Z"
                stroke="#6B7280"
                strokeOpacity=".6"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <input
              {...register('email', {
                required: 'El email es requerido',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              })}
              className="w-full outline-none bg-transparent py-2.5"
              type="email"
              placeholder="Email"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="mt-2 mb-6">
          <div
            className={`flex items-center border bg-indigo-500/5 rounded gap-1 pl-2 ${errors.password ? 'border-red-300' : 'border-gray-500/10'}`}
          >
            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" aria-hidden="true">
              <path
                d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
                fill="#6B7280"
              />
            </svg>
            <input
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'Mínimo 6 caracteres',
                },
              })}
              className="w-full outline-none bg-transparent py-2.5"
              type="password"
              placeholder="Password"
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mb-3 bg-indigo-500 hover:bg-indigo-600/90 transition py-2.5 rounded text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Ingresando...' : 'Log In'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
