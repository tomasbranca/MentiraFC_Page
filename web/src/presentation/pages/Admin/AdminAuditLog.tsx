import { useQuery } from "@tanstack/react-query";

import { fetchAdminAuditLog } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { formatDateTime } from "../../utils/date.utils";
import AdminPageShell from "./AdminPageShell";

const AdminAuditLog = () => {
  const auditQuery = useQuery({
    queryKey: queryKeys.admin.auditLog,
    queryFn: fetchAdminAuditLog,
  });

  if (auditQuery.isLoading) return <DashboardContentLoader />;

  if (auditQuery.isError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar el audit log"
          message="La tabla private.audit_log debe existir en Supabase."
          onRetry={() => void auditQuery.refetch()}
        />
      </div>
    );
  }

  const items = auditQuery.data ?? [];

  return (
    <AdminPageShell
      eyebrow="Trazabilidad"
      title="Audit log"
      description="Registro append-only de acciones sensibles del panel."
      aside={
        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <p className="text-3xl font-black leading-none">{items.length}</p>
          <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100/70">
            Eventos
          </p>
          <p className="mt-4 rounded-sm border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-violet-50/80">
            Ultimos movimientos sensibles del panel.
          </p>
        </div>
      }
    >
      <div className="overflow-hidden rounded-md border border-[#ded7ef] bg-white shadow-[0_10px_28px_rgba(23,21,29,0.05)]">
        {items.length === 0 ? (
          <div className="flex min-h-[22rem] flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-black uppercase text-[#17151d]">
              Todavia no hay eventos
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Cuando se registren acciones sensibles van a aparecer aca.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#ede8f5]">
            {items.map((item) => (
              <li key={item.id} className="p-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem] md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-900">
                        {item.resource}
                      </span>
                      <span className="text-sm font-black uppercase text-[#17151d]">
                        {item.action}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-xs text-neutral-500">
                      Actor {item.actorUserId} ({item.actorRole})
                      {item.targetId ? ` - Target ${item.targetId}` : ""}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-neutral-500 md:text-right">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>

                {item.changes ? (
                  <details className="mt-3 rounded-sm border border-neutral-200 bg-neutral-50">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-neutral-600">
                      Ver cambios
                    </summary>
                    <pre className="max-h-72 overflow-auto border-t border-neutral-200 bg-neutral-950 p-3 text-xs text-violet-50">
                      {JSON.stringify(item.changes, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminPageShell>
  );
};

export default AdminAuditLog;
