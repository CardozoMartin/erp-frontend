import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ImageUp, ShieldAlert, X } from "lucide-react";
import AlertModal from "../../../components/modals/Permisos/NoAutorizado";
import { usePermisos } from "../../../store/usePermisos";
import { Card, Input, Label } from "../../Productos/components/FormComponents";
import { useGetSucursal, usePostSucursal, useUpdateSucursal } from "../hooks/useSucursal";

const DEFAULT_EMPRESA_ID =
  import.meta.env.VITE_DEMO_EMPRESA_ID ||
  "00000000-0000-0000-0000-000000000001";

type SucursalFormValues = {
  empresa_id: string;
  nombre: string;
  nombreFantasia: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  cuit: string;
  razonSocial: string;
  condicionIva: string;
  puntoVentaArca: string;
  ingresosBrutos: string;
  inicioActividades: string;
  logoUrl: string;
  mensajePieTicket: string;
  emailComprobantes: string;
  tipoImpresora: "TERMICA" | "FISCAL_HASAR" | "FISCAL_EPSON" | "PDF";
  anchoTicket: "58mm" | "80mm";
  activa: boolean;
};

const condicionIvaOptions = [
  { value: "", label: "Sin especificar" },
  { value: "RESPONSABLE_INSCRIPTO", label: "Responsable inscripto" },
  { value: "MONOTRIBUTISTA", label: "Monotributista" },
  { value: "EXENTO", label: "Exento" },
  { value: "CONSUMIDOR_FINAL", label: "Consumidor final" },
];

const tipoImpresoraOptions = [
  { value: "TERMICA", label: "Termica" },
  { value: "FISCAL_HASAR", label: "Fiscal Hasar" },
  { value: "FISCAL_EPSON", label: "Fiscal Epson" },
  { value: "PDF", label: "PDF" },
];

const cleanText = (value?: string) => value?.trim() || null;

export default function SucursalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { tiene } = usePermisos();
  const createMutation = usePostSucursal();
  const updateMutation = useUpdateSucursal();
  const sucursalQuery = useGetSucursal(id);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SucursalFormValues>({
    defaultValues: {
      empresa_id: DEFAULT_EMPRESA_ID,
      nombre: "",
      nombreFantasia: "",
      direccion: "",
      localidad: "",
      provincia: "",
      codigoPostal: "",
      telefono: "",
      email: "",
      cuit: "",
      razonSocial: "",
      condicionIva: "",
      puntoVentaArca: "",
      ingresosBrutos: "",
      inicioActividades: "",
      logoUrl: "",
      mensajePieTicket: "",
      emailComprobantes: "",
      tipoImpresora: "TERMICA",
      anchoTicket: "80mm",
      activa: true,
    },
  });
  const logoUrl = watch("logoUrl");

  useEffect(() => {
    if (!sucursalQuery.data) return;
    const sucursal = sucursalQuery.data;
    reset({
      empresa_id: sucursal.empresa_id,
      nombre: sucursal.nombre ?? "",
      nombreFantasia: sucursal.nombreFantasia ?? "",
      direccion: sucursal.direccion ?? "",
      localidad: sucursal.localidad ?? "",
      provincia: sucursal.provincia ?? "",
      codigoPostal: sucursal.codigoPostal ?? "",
      telefono: sucursal.telefono ?? "",
      email: sucursal.email ?? "",
      cuit: sucursal.cuit ?? "",
      razonSocial: sucursal.razonSocial ?? "",
      condicionIva: sucursal.condicionIva ?? "",
      puntoVentaArca: sucursal.puntoVentaArca ?? "",
      ingresosBrutos: sucursal.ingresosBrutos ?? "",
      inicioActividades: sucursal.inicioActividades ?? "",
      logoUrl: sucursal.logoUrl ?? "",
      mensajePieTicket: sucursal.mensajePieTicket ?? "",
      emailComprobantes: sucursal.emailComprobantes ?? "",
      tipoImpresora: sucursal.tipoImpresora ?? "TERMICA",
      anchoTicket: sucursal.anchoTicket ?? "80mm",
      activa: sucursal.activa,
    });
  }, [reset, sucursalQuery.data]);

  const permisoNecesario = isEditing ? "sucursales.editar" : "sucursales.crear";

  if (!tiene(permisoNecesario)) {
    return (
      <AlertModal
        isOpen={true}
        onClose={() => setShowUnauthorizedModal(false)}
        icon={ShieldAlert}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        title="Sin permisos"
        description={`No tenes autorizacion para ${isEditing ? "editar" : "crear"} sucursales. Contacta a tu administrador si crees que es un error.`}
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

  const onSubmit = (values: SucursalFormValues) => {
    if (!tiene(permisoNecesario)) {
      setShowUnauthorizedModal(true);
      return;
    }

    const payload = {
      empresa_id: values.empresa_id,
      nombre: values.nombre.trim(),
      nombreFantasia: cleanText(values.nombreFantasia),
      direccion: cleanText(values.direccion),
      localidad: cleanText(values.localidad),
      provincia: cleanText(values.provincia),
      codigoPostal: cleanText(values.codigoPostal),
      telefono: cleanText(values.telefono),
      email: cleanText(values.email),
      cuit: cleanText(values.cuit),
      razonSocial: cleanText(values.razonSocial),
      condicionIva: (values.condicionIva || null) as
        | "RESPONSABLE_INSCRIPTO"
        | "MONOTRIBUTISTA"
        | "EXENTO"
        | "CONSUMIDOR_FINAL"
        | null,
      puntoVentaArca: cleanText(values.puntoVentaArca),
      ingresosBrutos: cleanText(values.ingresosBrutos),
      inicioActividades: values.inicioActividades || null,
      logoUrl: cleanText(values.logoUrl),
      mensajePieTicket: cleanText(values.mensajePieTicket),
      emailComprobantes: cleanText(values.emailComprobantes),
      tipoImpresora: values.tipoImpresora,
      anchoTicket: values.anchoTicket,
      activa: values.activa,
    };

    const options = {
      onSuccess: () => navigate("/sucursales"),
      onError: (error: any) => {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        if (status === 403) setShowUnauthorizedModal(true);
        setError("root.serverError", {
          message:
            serverMessage ||
            (status === 400
              ? "Datos invalidos"
              : "Error inesperado. Intenta de nuevo."),
        });
      },
    };

    if (isEditing) {
      updateMutation.mutate({ id: id!, data: payload }, options);
      return;
    }

    createMutation.mutate(payload, options);
  };

  const handleLogoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("logoUrl", { message: "Seleccione una imagen valida" });
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("logoUrl", { message: "El logo no debe superar 1 MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue("logoUrl", String(reader.result), { shouldDirty: true });
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <AlertModal
        isOpen={showUnauthorizedModal}
        onClose={() => setShowUnauthorizedModal(false)}
        icon={ShieldAlert}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        title="Sin permisos"
        description={`No tenes autorizacion para ${isEditing ? "editar" : "crear"} sucursales. Contacta a tu administrador si crees que es un error.`}
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
          {isEditing ? "Editar sucursal" : "Crear nueva sucursal"}
        </h2>
        <p className="mt-2 text-sm text-[#5f6771]">
          Registra los datos operativos, fiscales, logo y datos de comprobantes por sucursal.
        </p>
      </header>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-7">
          {errors.root?.serverError && (
            <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.root.serverError.message}
            </div>
          )}

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#041627]">
              Datos operativos
            </h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <Label>Empresa ID</Label>
                <Input {...register("empresa_id", { required: true })} />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input
                  placeholder="Casa Central"
                  {...register("nombre", { required: "El nombre es obligatorio" })}
                />
                {errors.nombre && (
                  <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <Label>Nombre fantasia</Label>
                <Input placeholder="Local Centro" {...register("nombreFantasia")} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <Label>Direccion</Label>
                <Input placeholder="Av. San Martin 1234" {...register("direccion")} />
              </div>
              <div>
                <Label>Localidad</Label>
                <Input placeholder="San Miguel de Tucuman" {...register("localidad")} />
              </div>
              <div>
                <Label>Provincia</Label>
                <Input placeholder="Tucuman" {...register("provincia")} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              <div>
                <Label>Codigo postal</Label>
                <Input placeholder="4000" {...register("codigoPostal")} />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input placeholder="381 123 4567" {...register("telefono")} />
              </div>
              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input type="email" placeholder="sucursal@empresa.com" {...register("email")} />
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#041627]">
              Datos fiscales
            </h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <Label>CUIT</Label>
                <Input placeholder="20-12345678-9" {...register("cuit")} />
              </div>
              <div>
                <Label>Razon social</Label>
                <Input placeholder="Empresa SRL" {...register("razonSocial")} />
              </div>
              <div>
                <Label>Condicion IVA</Label>
                <select
                  {...register("condicionIva")}
                  className="h-10 w-full rounded-sm border border-[#c4c6cd] bg-white px-3 text-sm"
                >
                  {condicionIvaOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <Label>Punto venta ARCA</Label>
                <Input placeholder="0001" {...register("puntoVentaArca")} />
              </div>
              <div>
                <Label>Ingresos brutos</Label>
                <Input {...register("ingresosBrutos")} />
              </div>
              <div>
                <Label>Inicio actividades</Label>
                <Input type="date" {...register("inicioActividades")} />
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#041627]">
              Ticket y comprobantes
            </h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <Label>Tipo impresora</Label>
                <select
                  {...register("tipoImpresora")}
                  className="h-10 w-full rounded-sm border border-[#c4c6cd] bg-white px-3 text-sm"
                >
                  {tipoImpresoraOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Ancho ticket</Label>
                <select
                  {...register("anchoTicket")}
                  className="h-10 w-full rounded-sm border border-[#c4c6cd] bg-white px-3 text-sm"
                >
                  <option value="80mm">80mm</option>
                  <option value="58mm">58mm</option>
                </select>
              </div>
              <div>
                <Label>Email comprobantes</Label>
                <Input type="email" {...register("emailComprobantes")} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="grid gap-3">
                <Label>Logo</Label>
                <div className="grid gap-3 rounded-sm border border-[#c4c6cd] bg-[#fbfbfc] p-3">
                  <Input placeholder="https://... o imagen cargada" {...register("logoUrl")} />
                  {errors.logoUrl ? (
                    <p className="text-xs text-red-600">{errors.logoUrl.message}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]">
                      <ImageUp size={15} />
                      Subir imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFile}
                        className="hidden"
                      />
                    </label>
                    {logoUrl ? (
                      <button
                        type="button"
                        onClick={() => setValue("logoUrl", "", { shouldDirty: true })}
                        className="inline-flex h-9 items-center gap-2 rounded-sm border border-[#f1c7c7] bg-[#fff5f5] px-3 text-[13px] font-semibold text-[#b42318] hover:bg-[#fdecec]"
                      >
                        <X size={14} />
                        Quitar
                      </button>
                    ) : null}
                  </div>
                  {logoUrl ? (
                    <div className="flex items-center gap-3 rounded-sm border border-[#e5e7eb] bg-white p-3">
                      <img
                        src={logoUrl}
                        alt="Logo de sucursal"
                        className="h-16 w-24 rounded-sm border border-[#e5e7eb] object-contain"
                      />
                      <div className="text-[12px] text-[#44474c]">
                        Este logo quedara guardado para usarlo luego en PDFs, facturas y comprobantes.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div>
                <Label>Mensaje pie ticket</Label>
                <Input placeholder="Gracias por su compra" {...register("mensajePieTicket")} />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <input
              id="activa"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-[#041627]"
              {...register("activa")}
            />
            <label htmlFor="activa" className="text-sm font-medium text-[#44474c]">
              Sucursal activa
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/sucursales")}
              className="rounded-sm border border-[#c4c6cd] px-5 py-2 text-sm font-medium text-[#44474c] transition-colors hover:bg-[#efedef]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-sm bg-[#075E54] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e8e4f] disabled:opacity-50"
            >
              {isPending ? "Guardando..." : isEditing ? "Actualizar sucursal" : "Guardar sucursal"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
