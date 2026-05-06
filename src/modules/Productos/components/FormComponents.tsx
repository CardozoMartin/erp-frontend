import { ChevronDown } from 'lucide-react';

interface LabelProps {
  children: React.ReactNode;
  small?: boolean;
}

export function Label({ children, small }: LabelProps) {
  return (
    <label
      className={`block text-[#44474c] font-medium tracking-wide ${small ? 'text-xs mb-1' : 'text-[13px] mb-2'}`}
    >
      {children}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-4 py-2 border border-[#c4c6cd] rounded-sm bg-white text-[#1b1c1d] text-sm font-[Inter] outline-none transition focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 placeholder:text-[#c4c6cd] ${className}`}
      {...props}
    />
  );
}

interface SelectProps {
  children: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({ children, value, onChange }: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 pr-10 border border-[#c4c6cd] rounded-sm bg-white text-[#1b1c1d] text-sm outline-none cursor-pointer appearance-none transition focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#595f66] w-5 h-5" />
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  dark?: boolean;
}

export function Toggle({ checked, onChange, dark }: ToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`w-11 h-6 rounded-full transition-colors duration-200
        bg-[#c1c7cf]
        peer-checked:${dark ? 'bg-[#041627]' : 'bg-[#4A90E2]'}
        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
        after:bg-white after:rounded-full after:h-5 after:w-5
        after:transition-all peer-checked:after:translate-x-5
        after:shadow-sm`}
      />
    </label>
  );
}

interface SectionHeaderProps {
  icon: string;
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ icon, title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#efedef]">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#041627] text-xl">{icon}</span>
        <h3 className="text-xl font-semibold text-[#041627]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`bg-white border border-[#c4c6cd] rounded-sm p-6 shadow-[0_4px_12px_rgba(26,43,60,0.08)] ${className}`}
    >
      {children}
    </section>
  );
}
