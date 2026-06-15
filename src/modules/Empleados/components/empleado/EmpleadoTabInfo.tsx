import { User, Mail, Phone, MapPin, Briefcase, Key, ToggleLeft, ToggleRight } from 'lucide-react';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { EmpleadoDetailFormValues } from '../../types/empleado.type';

interface Props {
  emp: EmpleadoDetailFormValues;
  isEditing: boolean;
  form: EmpleadoDetailFormValues;
  register: UseFormRegister<EmpleadoDetailFormValues>;
  setValue: UseFormSetValue<EmpleadoDetailFormValues>;
  errors: FieldErrors<EmpleadoDetailFormValues>;
}

type TextFieldKey = 'nombreCompleto' | 'email' | 'telefono' | 'cargo';

const getRules = (key: TextFieldKey) => ({
  nombreCompleto: { required: 'El nombre es requerido' },
  email: { required: 'El email es requerido', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalido' } },
  telefono: { required: 'El telefono es requerido' },
  cargo: { required: 'El cargo es requerido' },
}[key]);

export function EmpleadoTabInfo({ emp, isEditing, form, register, setValue, errors }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {([
          { label: 'Nombre completo', key: 'nombreCompleto', icon: User },
          { label: 'Email',           key: 'email',          icon: Mail },
          { label: 'Teléfono',        key: 'telefono',       icon: Phone },
          { label: 'Cargo',           key: 'cargo',          icon: Briefcase },
        ] as Array<{ label: string; key: TextFieldKey; icon: typeof User }>).map(({ label, key, icon: Icon }) => (
          <div key={key}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Icon size={12} /> {label}
            </label>
            {isEditing ? (
              <>
                <input
                  {...register(key, getRules(key))}
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: 14, fontWeight: 500,
                    border: `1.5px solid ${errors[key] ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 6, outline: 'none',
                    color: '#041627', background: errors[key] ? '#fef2f2' : '#f8fafc', fontFamily: 'inherit',
                    borderBottom: '2px solid #075E54',
                  }}
                />
                {errors[key]?.message && (
                  <div style={{ marginTop: 4, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                    {errors[key].message as string}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, color: '#041627', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                {emp[key] || <span style={{ color: '#ccc', fontWeight: 400 }}>Sin datos</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <MapPin size={12} /> Dirección
        </label>
        {isEditing ? (
          <>
            <input
              {...register('direccion', { required: 'La direccion es requerida' })}
              style={{
                width: '100%', padding: '8px 12px', fontSize: 14, fontWeight: 500,
                border: `1.5px solid ${errors.direccion ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 6, outline: 'none',
                color: '#041627', background: errors.direccion ? '#fef2f2' : '#f8fafc', fontFamily: 'inherit',
                borderBottom: '2px solid #075E54',
              }}
            />
            {errors.direccion?.message && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                {errors.direccion.message as string}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 600, color: '#041627', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            {emp.direccion}
          </div>
        )}
      </div>

      {isEditing && (
        <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <Key size={12} /> Nueva contraseña (opcional)
          </label>
          <input
            type="password"
            placeholder="Dejar vacío para no cambiar"
            {...register('contrasena', { minLength: { value: 8, message: 'Minimo 8 caracteres' } })}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 14,
              border: `1.5px solid ${errors.contrasena ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 6, outline: 'none',
              color: '#041627', background: errors.contrasena ? '#fef2f2' : '#fff', fontFamily: 'inherit',
              borderBottom: '2px solid #075E54',
            }}
          />
          {errors.contrasena?.message && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
              {errors.contrasena.message as string}
            </div>
          )}
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Mínimo 8 caracteres. Solo completar si se desea cambiar.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {([
          { label: 'Activo General', key: 'activo' },
          { label: 'Activo en POS',  key: 'activo_pos' },
          { label: 'Activo en Web',  key: 'activo_web' },
        ] as Array<{ label: string; key: 'activo' | 'activo_pos' | 'activo_web' }>).map(({ label, key }) => {
          const val = form[key] ?? false;
          return (
            <label key={key} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8, cursor: isEditing ? 'pointer' : 'default',
              border: `1px solid ${val ? '#C0DD97' : '#e2e8f0'}`,
              background: val ? '#EAF3DE' : '#f8fafc',
              transition: 'all .15s',
            }}>
              <div
                onClick={() => isEditing && setValue(key, !val, { shouldDirty: true })}
                style={{ color: val ? '#3B6D11' : '#ccc', cursor: isEditing ? 'pointer' : 'default' }}
              >
                {val ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: val ? '#3B6D11' : '#888' }}>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
