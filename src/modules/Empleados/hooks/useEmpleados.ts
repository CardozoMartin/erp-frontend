import type { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { IErrorResponse } from "../../../type/api.response.type";
import { getErrorMessage } from "../../../api/ApiError";
import {
  getEmpleadosFn,
  getRolesFn,
  getSucursalesActivasFn,
  postEmpleadoFn,
} from "../api/empleadosApi";
import type { ICreateEmpleadoPayload } from "../types/empleado.type";

export const useGetRoles = () =>
  useQuery({
    queryKey: ["empleados", "roles"],
    queryFn: getRolesFn,
  });

export const useGetEmpleados = (page: number = 1, limit: number = 10) =>
  useQuery({
    queryKey: ["empleados", "list", page, limit],
    queryFn: () => getEmpleadosFn(page, limit),
  });

export const useGetSucursalesActivas = () =>
  useQuery({
    queryKey: ["empleados", "sucursales"],
    queryFn: () => getSucursalesActivasFn(),
  });

export const usePostEmpleado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateEmpleadoPayload) => postEmpleadoFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Empleado creado correctamente");
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};
