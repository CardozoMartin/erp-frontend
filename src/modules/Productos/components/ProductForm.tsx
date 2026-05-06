import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  Input,
  Label,
  SectionHeader,
  Select,
  Toggle,
} from "./FormComponents";
import { InputFormField } from "./InputFormField";
import { CATEGORIAS, COLORES, DEPOSITOS, TALLES, UNIDADES } from "./constants";
import {
  BadgeDollarSign,
  DollarSign,
  Info,
  MapPin,
  PackageSearch,
  Plus,
} from "lucide-react";
import "../../../index.css";

interface ProductFormProps {
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export default function ProductForm({ onSave, onCancel }: ProductFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagen, setImagen] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: "",
      referencia: "",
      cod_barra: "",
      categoria: "",
      unidad: "Unidad (Ud)",
      descripcion: "",
      precio: "",
      cantidad: "0",
      venc: "",
      deposito: "Depósito Central (A1)",
      seccion: "",
      enOferta: false,
      posPOS: true,
      posWeb: false,
      activo: true,
      selColor: 0,
      selTalle: "M",
    },
  });

  const watched = watch();

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImagen(URL.createObjectURL(f));
  };

  const onSubmit = (data: any) => {
    onSave?.({
      ...data,
      imagen,
    });
  };

  return (
    <form
      className="max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6 text_color"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* ── Información Básica ── */}
      <Card>
        <div className="flex items-center gap-2 text-[#041627] mb-3">
          <Info className="text-blue-600" />
          <p>Información básica del producto</p>
        </div>
        <div className="flex gap-10">
          {/* Imagen */}
          <div className="w-64 flex-shrink-0">
            <Label>Imagen del Producto</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="aspect-square border-2 border-dashed border-[#c4c6cd] rounded-sm bg-[#fbf9fa] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:bg-[#f5f3f4] transition-colors"
            >
              {imagen ? (
                <>
                  <img
                    src={imagen}
                    alt="producto"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-4xl">
                      upload
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[#c4c6cd] text-4xl">
                    image
                  </span>
                  <span className="text-xs text-[#c4c6cd]">Subir imagen</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImg}
            />
          </div>

          {/* Campos */}
          <div className="flex-1 flex flex-col gap-6">
            <InputFormField
              label="Nombre del Producto"
              name="nombre"
              registration={register("nombre", {
                required: "El nombre es obligatorio",
              })}
              error={errors.nombre?.message}
              placeholder="Ej: Taladro Inalámbrico XYZ"
            />

            <div className="grid grid-cols-2 gap-6">
              <InputFormField
                label="Categoría"
                name="categoria"
                type="select"
                registration={register("categoria", {
                  required: "La categoría es obligatoria",
                })}
                error={errors.categoria?.message}
                options={CATEGORIAS}
              />
              <InputFormField
                label="Unidad de Medida"
                name="unidad"
                type="select"
                registration={register("unidad", {
                  required: "La unidad es obligatoria",
                })}
                error={errors.unidad?.message}
                options={UNIDADES}
              />
            </div>

            <InputFormField
              label="Descripción"
              name="descripcion"
              type="textarea"
              registration={register("descripcion")}
              placeholder="Ej: Taladro inalámbrico con batería de larga duración, ideal para trabajos de bricolaje y profesionales."
              rows={4}
            />
          </div>
        </div>
      </Card>

      {/* ── Variantes ── */}
      <Card>
        <button className="flex items-center gap-1 text-[13px] font-medium text-[#4A90E2] hover:underline">
          <Plus size={15} />
          Añadir Variante
        </button>

        <div className="grid grid-cols-3 gap-10">
          {/* Color */}
          <div>
            <Label small>Color</Label>
            <div className="flex gap-2 items-center">
              {COLORES.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setValue("selColor", i)}
                  className={`w-8 h-8 rounded-full border cursor-pointer transition-shadow
                      ${watched.selColor === i ? "border-[#c4c6cd] ring-2 ring-[#4A90E2]" : "border-[#c4c6cd] hover:ring-2 hover:ring-[#4A90E2]"}`}
                  style={{ background: c }}
                />
              ))}
              <Input className="flex-1" placeholder="Ej: Azul Marino" />
            </div>
          </div>

          {/* Talle */}
          <div>
            <Label small>Talle</Label>
            <div className="flex gap-2">
              {TALLES.map((t) => (
                <button
                  key={t}
                  onClick={() => setValue("selTalle", t)}
                  className={`w-10 h-10 border rounded-sm text-[13px] font-medium tracking-wide transition-colors
                      ${
                        watched.selTalle === t
                          ? "bg-[#041627] text-white border-[#041627]"
                          : "bg-white text-[#1b1c1d] border-[#c4c6cd] hover:bg-[#f5f3f4]"
                      }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Galería */}
          <div>
            <Label small>Galería de Variante</Label>
            <div className="flex gap-4">
              <div className="w-16 h-16 border border-[#c4c6cd] rounded-sm overflow-hidden bg-[#fbf9fa]">
                <img
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=128&q=80"
                  alt="variante"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-16 h-16 border-2 border-dashed border-[#c4c6cd] rounded-sm flex items-center justify-center text-[#c4c6cd] cursor-pointer hover:bg-[#f5f3f4] transition-colors">
                <span className="material-symbols-outlined text-xl">
                  add_a_photo
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Grid inferior ── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Precios */}
        <Card>
          <div className="flex items-center gap-2 text-[#041627] mb-3">
            <DollarSign size={15} />
            Precios
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <Label small>Precio Regular</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#595f66] text-sm">
                  $
                </span>
                <Input
                  type="number"
                  className="pl-8"
                  placeholder="0.00"
                  {...register("precio")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#fbf9fa] rounded-sm">
              <span className="text-[13px] font-medium tracking-wide text-[#041627]">
                En Oferta
              </span>
              <Toggle
                checked={watched.enOferta}
                onChange={(val) => setValue("enOferta", val)}
              />
            </div>

            <div className="pt-2">
              <Label small>Canales</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1b1c1d]">
                  <input
                    type="checkbox"
                    checked={watched.posPOS}
                    onChange={(e) => setValue("posPOS", e.target.checked)}
                    className="w-4 h-4 rounded border-[#c4c6cd] accent-[#4A90E2] cursor-pointer"
                  />
                  POS
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1b1c1d]">
                  <input
                    type="checkbox"
                    checked={watched.posWeb}
                    onChange={(e) => setValue("posWeb", e.target.checked)}
                    className="w-4 h-4 rounded border-[#c4c6cd] accent-[#4A90E2] cursor-pointer"
                  />
                  Web
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Stock */}
        <Card>
          <div className="flex items-center gap-2 text-[#041627] mb-3">
            <PackageSearch size={15} />
            Stock
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-2 bg-[#fbf9fa] rounded-sm">
              <span className="text-[13px] font-medium tracking-wide text-[#041627]">
                Estado: Activo
              </span>
              <Toggle
                checked={watched.activo}
                onChange={(val) => setValue("activo", val)}
                dark
              />
            </div>
            <div>
              <Label small>Cantidad</Label>
              <Input type="number" {...register("cantidad")} />
            </div>
            <div>
              <Label small>Vencimiento</Label>
              <Input type="date" {...register("venc")} />
            </div>
          </div>
        </Card>

        {/* Ubicación */}
        <Card>
          <div className="flex items-center gap-2 text-[#041627] mb-3">
            <MapPin size={15} />
            Ubicación
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <Label small>Depósito</Label>
              <Select
                value={watched.deposito}
                onChange={(e) => setValue("deposito", e.target.value)}
              >
                {DEPOSITOS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label small>Sección / Pasillo</Label>
              <Input
                placeholder="Ej: Pasillo 3, Estante B"
                {...register("seccion")}
              />
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
