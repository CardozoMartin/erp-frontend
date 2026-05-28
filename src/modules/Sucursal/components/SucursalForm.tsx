// SucursalForm.tsx
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { z } from "zod";
import { Card, Input, Label } from "../../Productos/components/FormComponents";
import { usePostSucursal } from "../hooks/useSucursal";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import AlertModal from "../../../components/modals/Permisos/NoAutorizado";
import { useAuthStore } from "../../../store/auth.store";
import { usePermisos } from "../../../store/usePermisos";

const DEFAULT_EMPRESA_ID =
  import.meta.env.VITE_DEMO_EMPRESA_ID ||
  "00000000-0000-0000-0000-000000000001";

// Schema de validación con Zod
const sucursalSchema = z.object({
  empresa_id: z.string().uuid("ID de empresa inválido"),
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  direccion: z.string().max(200, "Máximo 200 caracteres").optional(),
  telefono: z.string().max(20, "Máximo 20 caracteres").optional(),
  activa: z.boolean(),
});

type SucursalFormValues = z.infer<typeof sucursalSchema>;

export default function SucursalForm() {
  const navigate = useNavigate();
  const { tiene } = usePermisos();

  const { mutate, isPending } = usePostSucursal();
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  //ahora vamos a veriricar si tiene el permisos para crear y si no tiene mostrmoas el modal de no autorizado
  if (!tiene("sucursal.crear")) {
    return (
      <AlertModal
        isOpen={true}
        onClose={() => setShowUnauthorizedModal(false)}
        icon={ShieldAlert}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        title="Sin permisos"
        description="No tenés autorización para crear sucursales. Contactá a tu administrador si creés que es un error."
        actions={[
          {
            label: "Entendido",
            onClick: () => navigate("/sucursales"),
            variant: "primary",
          },
        ]}
      />
    );
  }
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SucursalFormValues>({
    defaultValues: {
      empresa_id: DEFAULT_EMPRESA_ID,
      nombre: "",
      direccion: "",
      telefono: "",
      activa: true,
    },
  });

  const onSubmit = (values: SucursalFormValues) => {
    //agregamos validacion de permisos antes de llamar a mutate
    if (!tiene("sucursal.crear")) {
      setShowUnauthorizedModal(true);
      return;
    }
    mutate(
      {
        empresa_id: values.empresa_id,
        nombre: values.nombre.trim(),
        direccion: values.direccion?.trim() || null,
        telefono: values.telefono?.trim() || null,
        activa: values.activa,
      },
      {
        onSuccess: () => navigate("/sucursales"),
        onError: (error) => {
          const status = error.response?.status;
          const serverMessage = error.response?.data?.message;

          if (status === 403) {
            // Seteamos error a nivel de root para mostrarlo en el form
            setShowUnauthorizedModal(true);
            setError("root.serverError", {
              message:
                serverMessage || "No tenés permisos para realizar esta acción",
            });
          } else if (status === 400) {
            setError("root.serverError", {
              message: serverMessage || "Datos inválidos",
            });
          } else {
            setError("root.serverError", {
              message: serverMessage || "Error inesperado. Intentá de nuevo.",
            });
          }
        },
      },
    );
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <AlertModal
        isOpen={showUnauthorizedModal}
        onClose={() => setShowUnauthorizedModal(false)}
        icon={ShieldAlert}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        title="Sin permisos"
        description="No tenés autorización para crear sucursales. Contactá a tu administrador si creés que es un error."
        actions={[
          {
            label: "Entendido",
            onClick: () => setShowUnauthorizedModal(false),
            variant: "primary",
          },
        ]}
      />
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-[#041627]">
          Crear nueva sucursal
        </h2>
        <p className="text-sm text-[#5f6771] mt-2">
          Registra una nueva sucursal para asignar stock y operaciones por
          ubicación.
        </p>
      </header>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          {/* Error global del servidor (403, 500, etc.) */}
          {errors.root?.serverError && (
            <div className="px-4 py-3 rounded-sm bg-red-50 border border-red-200 text-sm text-red-700">
              {errors.root.serverError.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Empresa ID</Label>
              <Input
                type="text"
                placeholder="ID de la empresa"
                {...register("empresa_id")}
              />
              {errors.empresa_id && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.empresa_id.message}
                </p>
              )}
            </div>
            <div>
              <Label>Nombre de la sucursal</Label>
              <Input
                type="text"
                placeholder="Ej. Casa Central"
                {...register("nombre")}
              />
              {errors.nombre && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.nombre.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Dirección</Label>
              <Input
                type="text"
                placeholder="Av. San Martín 1234"
                {...register("direccion")}
              />
              {errors.direccion && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.direccion.message}
                </p>
              )}
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                type="text"
                placeholder="381 123 4567"
                {...register("telefono")}
              />
              {errors.telefono && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.telefono.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="activa"
              type="checkbox"
              className="h-4 w-4 text-[#041627] border-gray-300 rounded"
              {...register("activa")}
            />
            <label
              htmlFor="activa"
              className="text-sm text-[#44474c] font-medium"
            >
              Sucursal activa
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/sucursales")}
              className="px-5 py-2 text-sm font-medium border border-[#c4c6cd] rounded-sm text-[#44474c] hover:bg-[#efedef] transition-colors"
            >
              Cancelar
            </button>
            {!tiene("sucursal.crear") ? (
              <button
                type="button"
                disabled
                className="px-5 py-2 text-sm font-medium bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm transition-colors disabled:opacity-50 cursor-not-allowed"
              >
                Guardar sucursal
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-sm font-medium bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Guardar sucursal"}
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
