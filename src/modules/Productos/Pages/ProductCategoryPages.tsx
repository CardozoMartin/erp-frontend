import { Plus } from 'lucide-react';
import CategoryTable from '../components/CategoryProducts/CategoryTable';
import ModalCategory from '../components/CategoryProducts/ModalCategory';
import { useCategoryStore } from '../store/useStoreCategoryProducts';

const ProductCategoryPages = () => {
  const { isModalOpen, openModal, closeModal } = useCategoryStore();

  //handlers--------------------------
  const handleOpenModal = () => {
    openModal();
  };
  return (
    <>
      {/* ── Header ── */}
      <header className="top-16 z-10 bg-[#fbf9fa] border-b border-[#c4c6cd] px-6 py-3 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">
          Categorías de Productos
        </h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
            onClick={handleOpenModal}
          >
            <Plus size={15} />
            Nueva Categoría
          </button>
        </div>
      </header>

      <div
        className="max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <CategoryTable />
      </div>

      {/* Modal */}
      {isModalOpen && <ModalCategory isActive={isModalOpen} onClose={closeModal} />}
    </>
  );
};

export default ProductCategoryPages;
