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
    >
      <div className="grid gap-3">
        {authQuery.data.controls.map((control) => (
          <article
            key={control.id}
            className="rounded-md border border-[#ded7ef] bg-white p-4"
          >
            <h2 className="text-xl font-black uppercase text-[#17151d]">
              {control.label}
            </h2>
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
