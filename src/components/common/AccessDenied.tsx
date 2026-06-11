import { Lock } from 'lucide-react';

type Props = {
  title?: string;
  message?: string;
};

const AccessDenied = ({
  title = 'Sin permisos para esta seccion',
  message = 'Tu usuario no tiene habilitada esta operacion. Pedile a un administrador que revise tus permisos.',
}: Props) => (
  <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
    <section className="mx-auto flex min-h-[360px] max-w-[760px] flex-col items-center justify-center rounded-lg border border-[#f1c7c7] bg-white px-6 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f1c7c7] bg-[#fff5f5]">
        <Lock size={22} className="text-[#b42318]" />
      </div>
      <h1 className="mt-4 text-[18px] font-bold text-[#041627]">{title}</h1>
      <p className="mt-2 max-w-md text-[14px] text-[#44474c]">{message}</p>
    </section>
  </div>
);

export default AccessDenied;
