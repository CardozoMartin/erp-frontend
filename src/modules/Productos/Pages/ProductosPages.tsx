import ProductForm from '../components/ProductForm';
//
const ProductosPages = () => {
  return (
    <div className="min-h-screen bg-[#fbf9fa] text-[#1b1c1d] font-[Inter] antialiased">
         {/* ── Header ── */}
         <header className="top-16 z-10 bg-[#fbf9fa] border-b border-[#c4c6cd] px-6 py-3 flex items-center justify-between">
           <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">
             Añadir Nuevo Producto
           </h2>
           <div className="flex items-center gap-4">
             <button

               className="px-6 py-2 text-[13px] font-medium tracking-wide border border-[#041627] text-[#041627] rounded-sm hover:bg-[#f5f3f4] transition-colors"
             >
               Cancelar
             </button>
             <button

               className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#4A90E2] text-white rounded-sm hover:opacity-90 transition-opacity"
             >
               Guardar Producto
             </button>
             <div className="w-px h-8 bg-[#c4c6cd] mx-2" />
             <button className="p-2 text-[#595f66] hover:text-[#041627] transition-colors">
               <span className="material-symbols-outlined">history</span>
             </button>
             <button className="p-2 text-[#595f66] hover:text-[#041627] transition-colors">
               <span className="material-symbols-outlined">print</span>
             </button>
           </div>
         </header>

         {/* Formulario de Producto */}
          <ProductForm/>
       </div>
  );
};

export default ProductosPages;
