import type { AxiosError } from "axios";
import {
  AlertCircle,
  Briefcase,
  Check,
  ChevronRight,
  Gift,
  Key,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ElementType, InputHTMLAttributes, ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { getErrorMessage } from "../../../../api/ApiError";
import type { IErrorResponse } from "../../../../type/api.response.type";
import type { ISucursal } from "../../../Sucursal/types/sucursal.type";
import type { IEmpleadoRol } from "../../types/empleado.type";

export interface EmpleadoCreatePayload {
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
  cargo: string;
  password: string;
  rolesIds: string[];
  sucursalId: string;
  sucursalIds: string[];
  bono_ventas_activo: boolean;
  meta_mensual_ventas: number;
  bono_mensual_ventas: number;
}

interface Props {
  onSubmit: (data: EmpleadoCreatePayload) => Promise<void> | void;
  onCancel?: () => void;
  availableRoles: IEmpleadoRol[];
  availableSucursales: ISucursal[];
  loadingCatalogs?: boolean;
  submitError?: AxiosError<IErrorResponse> | null;
}

type FormFieldProps = {
  label: string;
  icon: ElementType;
  error?: string;
  children: ReactNode;
};

function Field({ label, icon: Icon, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-900">
        <Icon size={12} />
        {label}
      </label>
      {children}
      {error ? (
        <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
          <AlertCircle size={11} /> {error}
        </span>
      ) : null}
    </div>
  );
}

function TextInput({
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border px-3 py-2 text-sm font-medium text-[#01070e] outline-none transition-all placeholder:text-gray-500 focus:border-[#075E54] focus:bg-white focus:ring-1 focus:ring-[#075E54]/20 ${
        error ? "border-red-300 bg-red-50" : "border-gray-200 bg-slate-50"
      }`}
    />
  );
}

function getRoleColor(index: number) {
  const palette = [
    {
      bg: "bg-[#EAF3DE]",
      text: "text-[#3B6D11]",
      border: "border-[#C0DD97]",
      dot: "#639922",
    },
    {
      bg: "bg-[#FAEEDA]",
      text: "text-[#854F0B]",
      border: "border-[#FAC775]",
      dot: "#BA7517",
    },
    {
      bg: "bg-[#EEEDFE]",
      text: "text-[#534AB7]",
      border: "border-[#CECBF6]",
      dot: "#7F77DD",
    },
    {
      bg: "bg-[#E6F1FB]",
      text: "text-[#185FA5]",
      border: "border-[#B5D4F4]",
      dot: "#378ADD",
    },
  ];

  return palette[index % palette.length];
}

export default function FormEmployers({
  onSubmit,
  onCancel,
  availableRoles,
  availableSucursales,
  loadingCatalogs = false,
  submitError,
}: Props) {
  const [roleSearch, setRoleSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpleadoCreatePayload>({
    defaultValues: {
      nombreCompleto: "",
      email: "",
      telefono: "",
      direccion: "",
      cargo: "",
      password: "",
      rolesIds: [],
      sucursalId: "",
      sucursalIds: [],
      bono_ventas_activo: false,
      meta_mensual_ventas: 0,
      bono_mensual_ventas: 0,
    },
  });

  const selectedRoleIds = watch("rolesIds");
  const selectedSucursalId = watch("sucursalId");
  const selectedSucursalIds = watch("sucursalIds");
  const rolesActivos = useMemo(
    () => availableRoles.filter((role) => role.activo !== false),
    [availableRoles],
  );
  const selectedRoles = useMemo(
    () => rolesActivos.filter((role) => selectedRoleIds.includes(role.id)),
    [rolesActivos, selectedRoleIds],
  );

  const filteredRoles = useMemo(() => {
    const term = roleSearch.trim().toLowerCase();
    return rolesActivos.filter((role) => {
      if (selectedRoleIds.includes(role.id)) return false;
      if (!term) return true;
      return (
        role.nombre.toLowerCase().includes(term) ||
        role.descripcion?.toLowerCase().includes(term)
      );
    });
  }, [rolesActivos, roleSearch, selectedRoleIds]);

  const permisosActivos = useMemo(
    () =>
      Array.from(
        new Map(
          selectedRoles.flatMap((role) =>
            (role.permisos ?? []).map((permiso) => [
              permiso.clave,
              permiso.nombre || permiso.clave,
            ]),
          ),
        ).entries(),
      ),
    [selectedRoles],
  );

  const groupedPermisos = useMemo(() => {
    return permisosActivos.reduce<Record<string, Array<[string, string]>>>(
      (acc, permiso) => {
        const [clave] = permiso;
        const modulo = clave.split(".")[0] || "general";
        acc[modulo] ??= [];
        acc[modulo].push(permiso);
        return acc;
      },
      {},
    );
  }, [permisosActivos]);

  const selectedSucursal = availableSucursales.find(
    (sucursal) => sucursal.id === selectedSucursalId,
  );
  const bonoVentasActivo = watch("bono_ventas_activo");

  const handleSucursalPrincipalChange = (sucursalId: string) => {
    setValue("sucursalId", sucursalId, { shouldValidate: true });
    if (sucursalId && !selectedSucursalIds.includes(sucursalId)) {
      setValue("sucursalIds", [...selectedSucursalIds, sucursalId], {
        shouldValidate: true,
      });
    }
  };

  const submitForm = async (data: EmpleadoCreatePayload) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="border-b border-gray-200 bg-white px-8 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
              <span className="cursor-pointer font-semibold text-[#075E54]">
                Empleados
              </span>
              <ChevronRight size={14} className="text-gray-300" />
              <span className="font-bold text-[#041627]">Nuevo empleado</span>
            </div>
            <div className="text-xs text-gray-400">
              Alta completa con roles, permisos derivados y sucursal principal.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit(submitForm)}
              disabled={isSubmitting || loadingCatalogs}
              className="flex items-center gap-1.5 rounded-md bg-[#075E54] px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#064d44] disabled:opacity-60"
            >
              <Check size={13} />
              {isSubmitting ? "Guardando..." : "Crear empleado"}
            </button>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                <X size={13} />
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <form onSubmit={handleSubmit(submitForm)} noValidate>
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex flex-col gap-5 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-[#B5D4F4] bg-[#E6F1FB] text-2xl font-extrabold text-[#378ADD]">
                  {watch("nombreCompleto").trim()
                    ? watch("nombreCompleto")
                        .trim()
                        .split(" ")
                        .slice(0, 2)
                        .map((chunk) => chunk[0])
                        .join("")
                        .toUpperCase()
                    : "EM"}
                </div>

                <div className="flex-1">
                  <div className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                    Ficha de Empleado
                  </div>
                  <h1 className="text-2xl font-extrabold text-[#041627]">
                    {watch("nombreCompleto").trim() || "Nuevo empleado"}
                  </h1>
                  <div className="mt-1 text-sm text-gray-500">
                    {watch("cargo").trim() || "Cargo sin definir"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedRoles.length > 0 ? (
                      selectedRoles.map((role, index) => {
                        const color = getRoleColor(index);
                        return (
                          <span
                            key={role.id}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${color.bg} ${color.text} ${color.border}`}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: color.dot }}
                            />
                            {role.nombre}
                          </span>
                        );
                      })
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                        <AlertCircle size={12} />
                        Sin roles asignados
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {submitError ? (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{getErrorMessage(submitError)}</span>
                </div>
              ) : null}

              <div className="h-px bg-slate-100" />

              <section>
                <h2 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-black">
                  <User size={13} /> Datos personales
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ">
                  <Field
                    label="Nombre completo"
                    icon={User}
                    error={errors.nombreCompleto?.message}
                  >
                    <TextInput
                      placeholder="Ej: Valentina Rodriguez"
                      error={!!errors.nombreCompleto}
                      {...register("nombreCompleto", {
                        required: "El nombre es requerido",
                        minLength: {
                          value: 3,
                          message: "Minimo 3 caracteres",
                        },
                      })}
                    />
                  </Field>

                  <Field
                    label="Cargo"
                    icon={Briefcase}
                    error={errors.cargo?.message}
                  >
                    <TextInput
                      placeholder="Ej: Vendedora Senior"
                      error={!!errors.cargo}
                      {...register("cargo", {
                        required: "El cargo es requerido",
                      })}
                    />
                  </Field>

                  <Field
                    label="Email"
                    icon={Mail}
                    error={errors.email?.message}
                  >
                    <TextInput
                      type="email"
                      placeholder="usuario@empresa.com"
                      error={!!errors.email}
                      {...register("email", {
                        required: "El email es requerido",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Email invalido",
                        },
                      })}
                    />
                  </Field>

                  <Field
                    label="Telefono"
                    icon={Phone}
                    error={errors.telefono?.message}
                  >
                    <TextInput
                      placeholder="+54 9 381 555-0000"
                      error={!!errors.telefono}
                      {...register("telefono", {
                        required: "El telefono es requerido",
                      })}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field
                    label="Direccion"
                    icon={MapPin}
                    error={errors.direccion?.message}
                  >
                    <TextInput
                      placeholder="Av. Independencia 1452, Tucuman"
                      error={!!errors.direccion}
                      {...register("direccion", {
                        required: "La direccion es requerida",
                      })}
                    />
                  </Field>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              <section>
                <h2 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <Gift size={13} /> Bono por ventas
                </h2>
                <label className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#041627]">
                  Activar meta mensual para vendedor
                  <input
                    type="checkbox"
                    {...register("bono_ventas_activo")}
                    className="h-4 w-4 accent-[#075E54]"
                  />
                </label>
                {bonoVentasActivo ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Meta mensual de ventas" icon={Gift}>
                      <TextInput
                        type="number"
                        min={0}
                        placeholder="Ej: 5000000"
                        {...register("meta_mensual_ventas", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field label="Monto del bono" icon={Gift}>
                      <TextInput
                        type="number"
                        min={0}
                        placeholder="Ej: 150000"
                        {...register("bono_mensual_ventas", { valueAsNumber: true })}
                      />
                    </Field>
                  </div>
                ) : null}
              </section>

              <div className="h-px bg-slate-100" />

              <section>
                <h2 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <Key size={13} /> Acceso inicial
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Contrasena"
                    icon={Key}
                    error={errors.password?.message}
                  >
                    <TextInput
                      type="password"
                      placeholder="Minimo 8 caracteres"
                      error={!!errors.password}
                      {...register("password", {
                        required: "La contrasena es requerida",
                        minLength: {
                          value: 8,
                          message: "Minimo 8 caracteres",
                        },
                      })}
                    />
                  </Field>

                  <Field
                    label="Sucursal principal"
                    icon={MapPin}
                    error={errors.sucursalId?.message}
                  >
                    <Controller
                      name="sucursalId"
                      control={control}
                      rules={{ required: "Selecciona una sucursal principal" }}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(event) =>
                            handleSucursalPrincipalChange(event.target.value)
                          }
                          className={`w-full rounded-md border px-3 py-2 text-sm font-medium text-[#041627] outline-none transition-all focus:border-[#075E54] focus:bg-white focus:ring-1 focus:ring-[#075E54]/20 ${
                            errors.sucursalId
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 bg-slate-50"
                          }`}
                        >
                          <option value="">Selecciona una sucursal</option>
                          {availableSucursales.map((sucursal) => (
                            <option key={sucursal.id} value={sucursal.id}>
                              {sucursal.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </Field>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  El empleado se crea activo por defecto en backend. La ruta de
                  inicio se calcula segun el primer rol asignado.
                </p>
              </section>

              <section>
                <h2 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <MapPin size={13} /> Sucursales habilitadas
                </h2>
                <Controller
                  name="sucursalIds"
                  control={control}
                  rules={{
                    validate: (value) =>
                      value.length > 0 || "Selecciona al menos una sucursal",
                  }}
                  render={() => (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {availableSucursales.map((sucursal) => {
                        const selected = selectedSucursalIds.includes(
                          sucursal.id,
                        );
                        const isPrincipal = selectedSucursalId === sucursal.id;
                        return (
                          <label
                            key={sucursal.id}
                            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold ${
                              selected
                                ? "border-[#075E54] bg-[#EAF3DE] text-[#041627]"
                                : "border-gray-200 bg-slate-50 text-gray-600"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                value={sucursal.id}
                                {...register("sucursalIds")}
                                className="h-4 w-4"
                              />
                              {sucursal.nombre}
                            </span>
                            {isPrincipal ? (
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-[#075E54]">
                                Principal
                              </span>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.sucursalIds ? (
                  <span className="mt-2 flex items-center gap-1 text-[11px] font-medium text-red-500">
                    <AlertCircle size={11} /> {errors.sucursalIds.message}
                  </span>
                ) : null}
              </section>

              <div className="h-px bg-slate-100" />

              <section>
                <h2 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <Shield size={13} /> Roles y permisos
                </h2>

                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedRoles.length > 0 ? (
                    selectedRoles.map((role, index) => {
                      const color = getRoleColor(index);
                      return (
                        <span
                          key={role.id}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${color.bg} ${color.text} ${color.border}`}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: color.dot }}
                          />
                          {role.nombre}
                          <button
                            type="button"
                            onClick={() =>
                              setValue(
                                "rolesIds",
                                selectedRoleIds.filter((id) => id !== role.id),
                                { shouldValidate: true },
                              )
                            }
                            className="opacity-70"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      <AlertCircle size={14} />
                      Asigna al menos un rol para habilitar acceso.
                    </div>
                  )}
                </div>

                <Field
                  label="Buscar rol"
                  icon={Search}
                  error={errors.rolesIds?.message as string | undefined}
                >
                  <TextInput
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    placeholder="Buscar por nombre o descripcion"
                  />
                </Field>

                <Controller
                  name="rolesIds"
                  control={control}
                  rules={{
                    validate: (value) =>
                      value.length > 0 || "Debes asignar al menos un rol",
                  }}
                  render={() => (
                    <div className="mt-4 flex flex-col gap-3">
                      {loadingCatalogs ? (
                        <div className="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-500">
                          Cargando roles y sucursales...
                        </div>
                      ) : filteredRoles.length > 0 ? (
                        filteredRoles.map((role, index) => {
                          const color = getRoleColor(index);
                          return (
                            <div
                              key={role.id}
                              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: color.dot }}
                                  />
                                  <span className="text-sm font-bold text-[#041627]">
                                    {role.nombre}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {role.descripcion || "Sin descripcion"}
                                </div>
                                <div className="mt-1 text-[11px] font-mono text-gray-400">
                                  Inicio: {role.rutaInicio}
                                </div>
                                <div className="mt-2 text-[11px] font-medium text-gray-500">
                                  {role.permisos?.length ?? 0} permisos
                                  asignados
                                </div>
                                {role.permisos && role.permisos.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {role.permisos
                                      .slice(0, 4)
                                      .map((permiso) => (
                                        <span
                                          key={permiso.id}
                                          className="rounded-full border border-gray-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-gray-600"
                                        >
                                          {permiso.nombre}
                                        </span>
                                      ))}
                                    {role.permisos.length > 4 ? (
                                      <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-500">
                                        +{role.permisos.length - 4} mas
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setValue(
                                    "rolesIds",
                                    [...selectedRoleIds, role.id],
                                    { shouldValidate: true },
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-md bg-[#075E54] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#064d44]"
                              >
                                <Plus size={12} />
                                Asignar
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-500">
                          No hay mas roles disponibles para ese filtro.
                        </div>
                      )}
                    </div>
                  )}
                />

                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <div className="font-semibold">
                    {permisosActivos.length} permisos derivados de los roles
                    asignados
                  </div>
                  <div className="mt-1 text-xs">
                    Los permisos se calculan automaticamente segun los roles
                    elegidos.
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {Object.entries(groupedPermisos).map(([modulo, permisos]) => (
                    <div
                      key={modulo}
                      className="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                        {modulo}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {permisos.map(([clave, nombre]) => (
                          <span
                            key={clave}
                            className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700"
                          >
                            {nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {permisosActivos.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-500">
                      Todavia no hay permisos porque no se asignaron roles.
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <aside className="overflow-hidden rounded-lg border border-gray-200 bg-slate-50 shadow-sm">
              <div className="border-b border-gray-200 bg-white px-5 py-4">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#041627]">
                  Resumen del acceso
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Vista previa de la ficha al crear
                </p>
              </div>

              <div className="flex flex-col gap-3 p-4">
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Ruta de inicio estimada
                  </div>
                  <div className="font-mono text-sm font-bold text-[#075E54]">
                    {selectedRoles[0]?.rutaInicio || "/sin-acceso"}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Sucursal principal
                  </div>
                  <div className="text-sm font-semibold text-[#041627]">
                    {selectedSucursal?.nombre || "Sin seleccionar"}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Resumen rapido
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Roles</span>
                      <span className="font-bold text-[#041627]">
                        {selectedRoles.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Permisos</span>
                      <span className="font-bold text-[#041627]">
                        {permisosActivos.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Estado</span>
                      <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                        Activo al crear
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#B5D4F4] bg-[#E6F1FB] px-4 py-3 text-[11px] font-semibold leading-relaxed text-[#185FA5]">
                  Si asignas roles ahora, el empleado queda listo para entrar al
                  sistema apenas se cree.
                </div>
              </div>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
}
