import { ChevronDown } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'select' | 'textarea';
  registration?: any;
  error?: { message?: string } | string | null;
  options?: string[];
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  rows?: number;
  small?: boolean;
  className?: string;
}

export function InputFormField({
  label,
  name,
  type = 'text',
  registration = {},
  error,
  options = [],
  prefix,
  suffix,
  placeholder,
  rows = 4,
  small = false,
  className = '',
}: FormFieldProps) {
  const baseInput = `
    w-full px-4 py-2 border rounded-sm bg-white text-[#1b1c1d] text-sm outline-none
    transition focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20
    placeholder:text-[#c4c6cd]
    ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-[#c4c6cd]'}
    ${prefix ? 'pl-8' : ''}
    ${suffix ? 'pr-8' : ''}
  `;

  const renderControl = () => {
    if (type === 'select') {
      return (
        <div className="relative">
          <select
            id={name}
            {...registration}
            className={`${baseInput} appearance-none pr-10 cursor-pointer`}
          >
            <option value="">Seleccionar…</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#595f66] w-5 h-5" />
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={name}
          rows={rows}
          placeholder={placeholder}
          {...registration}
          className={`${baseInput} resize-y`}
        />
      );
    }

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#595f66] text-sm pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          {...registration}
          className={baseInput}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595f66] text-sm pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={name}
        className={`text-[#44474c] font-medium tracking-wide ${small ? 'text-xs' : 'text-[13px]'}`}
      >
        {label}
      </label>

      {renderControl()}

      {error && (
        <span className="text-xs text-red-500 mt-0.5">
          {typeof error === 'string' ? error : error?.message}
        </span>
      )}
    </div>
  );
}
