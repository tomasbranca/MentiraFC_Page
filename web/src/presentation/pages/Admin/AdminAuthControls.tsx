import { useQuery } from "@tanstack/react-query";

import { fetchAdminAuthControls } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import AdminPageShell from "./AdminPageShell";

const AdminAuthControls = () => {
  const authQuery = useQuery({
    queryKey: queryKeys.admin.authControls,
    queryFn: fetchAdminAuthControls,
  });

  if (authQuery.isLoading) return <DashboardContentLoader />;

  if (authQuery.isError || !authQuery.data) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar controles auth"
          message="Supabase Auth sigue siendo la autoridad de identidad."
          onRetry={() => void authQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Supabase Auth"
      title="Control de autenticacion"
      description="Estado operativo de identidad, sesiones y suspension de cuentas."
      aside={
        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <p className="text-3xl font-black uppercase leading-none">
            {authQuery.data.provider}
          </p>
          <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100/70">
            Proveedor
          </p>
          <p className="mt-4 rounded-sm border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-violet-50/80">
            La identidad se administra fuera de Sanity.
          </p>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        {authQuery.data.controls.map((control) => (
          <article
            key={control.id}
            className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 text-xl font-black uppercase leading-tight text-[#17151d]">
                {control.label}
              </h2>
              <span className="shrink-0 rounded-sm border border-violet-100 bg-violet-50 px-2 py-1 text-[0.65rem] font-black uppercase text-violet-900">
                Auth
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {control.description}
            </p>
          </article>
        ))}
      </div>
    </AdminPageShell>
  );
};

export default AdminAuthControls;
