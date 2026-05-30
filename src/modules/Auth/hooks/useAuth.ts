// modules/Auth/hooks/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postLoginFn } from '../api/auth.api';
import { useAuthStore } from '../../../store/auth.store';


export const useLogin = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: postLoginFn,
    onSuccess: (data) => {
      setSession(data);
      navigate(data.rutaInicio);
    },
  });
};
