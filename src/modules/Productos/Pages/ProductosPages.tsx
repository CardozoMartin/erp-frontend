import { History, Printer, Save, X } from 'lucide-react';
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

               className="px-6 py-2 text-[13px] font-medium tracking-wide border bg-red-600 border-[#f33333] text-[#ffffff] rounded-sm hover:bg-[#cc0505] hover:text-[#111111] transition-colors cursor-pointer flex items-center gap-1"
             >
               Cancelar
               <X size={15} className='' />
             </button>
             <button

               className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#075E54] hover:bg-[#1e8e4f] text-white hover:text-[#111111] rounded-sm hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
             >
               Guardar Producto
               <Save size={15} />
             </button>
             <div className="w-px h-8 bg-[#c4c6cd] mx-2" />
             <button className="p-2 text-[#595f66] hover:text-[#041627] hover:bg-[#DCF8C6] transition-colors cursor-pointer">
              <History />
             </button>
             <button className="p-2 text-[#595f66] hover:text-[#041627] hover:bg-[#DCF8C6] transition-colors cursor-pointer">
              <Printer />
             </button>
           </div>
         </header>

         {/* Formulario de Producto */}
          <ProductForm/>
       </div>
  );
};

export default ProductosPages;
