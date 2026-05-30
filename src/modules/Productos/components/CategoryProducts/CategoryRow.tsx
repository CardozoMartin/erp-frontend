import { useState } from 'react';
import { useToggleProductCategoryStatus } from '../../hooks/useProductCategory';
import { useCategoryStore } from '../../store/useStoreCategoryProducts';
import { Toggle } from '../FormComponents';

interface Category {
  id: number;
  name: string;
  store: string;
  storeColor: 'primary' | 'tertiary' | 'secondary' | 'error';
  description: string;
  products: number;
  icon: string;
  activo?: boolean;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function MaterialIcon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontFamily: "'Material Symbols Outlined'" }}
    >
      {name}
    </span>
  );
}

interface ICategoryRowProps {
  category: Category;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const CategoryRow = ({ category, onEdit, onDelete }: ICategoryRowProps) => {
  //Zustand store
  const { setCategory } = useCategoryStore();
  const [isActive, setIsActive] = useState(category.activo ?? true);

  //Tquery--------------------------------------
  const { mutate: toggleCategoryStatusMutation } = useToggleProductCategoryStatus(category.id);

  //Handlers --------------------------------------
  const handleEdit = (category: Category) => {
    //guardamos la categoria seleccionada en el store para pasarla al modal
    setCategory(category);
    //Llamamos al onEdit callback para abrir el modal
    onEdit(category.id);
  };

  const handleToggle = (val: boolean) => {
    setIsActive(val);
    // Acá iría la llamada a la API para cambiar el estado de la categoría
    toggleCategoryStatusMutation();
  };
  return (
    <tr className="hover:bg-[#f5f3f4] transition-colors border-b border-[#c4c6cd] last:border-b-0">
      {/* Name */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconWrapperColors[category.storeColor]}`}
          >
            <MaterialIcon
              name={category.icon}
              className={`text-[22px] ${iconColors[category.storeColor]}`}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[16px] leading-6 font-semibold text-[#041627]">{category.name}</p>
            <span
              className={`text-[11px] px-1 rounded font-bold uppercase tracking-wide ${badgeBgColors[category.storeColor]}`}
            >
              {category.store}
            </span>
          </div>
        </div>
      </td>

      {/* Description */}
      <td className="px-6 py-4 text-[14px] leading-5 text-[#44474c]">{category.description}</td>

      {/* Products */}
      <td className="px-6 py-4 text-center">
        <span className="text-[14px] leading-5 px-3 py-1 bg-[#efedef] rounded-full text-[#1b1c1d]">
          {category.products.toLocaleString()}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleEdit(category)}
            className="p-1 text-[#595f66] hover:text-[#fd9308] cursor-pointer transition-colors rounded"
            aria-label={`Edit ${category.name}`}
          >
            <MaterialIcon name="edit" className="text-[20px]" />
          </button>
          <div className="flex items-center justify-center gap-2 px-3 border-l border-[#efedef]">
            <Toggle checked={isActive} onChange={handleToggle} />
          </div>
        </div>
      </td>
    </tr>
  );
};

const iconWrapperColors: Record<string, string> = {
  primary: 'bg-[#e8f5ff]',
  secondary: 'bg-[#fce4ec]',
  tertiary: 'bg-[#f3e5f5]',
  error: 'bg-[#ffebee]',
};

const iconColors: Record<string, string> = {
  primary: 'text-[#0d47a1]',
  secondary: 'text-[#880e4f]',
  tertiary: 'text-[#4a148c]',
  error: 'text-[#b71c1c]',
};

const badgeBgColors: Record<string, string> = {
  primary: 'bg-[#e8f5ff] text-[#0d47a1]',
  secondary: 'bg-[#fce4ec] text-[#880e4f]',
  tertiary: 'bg-[#f3e5f5] text-[#4a148c]',
  error: 'bg-[#ffebee] text-[#b71c1c]',
};

export default CategoryRow;
