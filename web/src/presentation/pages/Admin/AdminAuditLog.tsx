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
    >
      <div className="overflow-hidden rounded-md border border-[#ded7ef] bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-neutral-600">Todavia no hay eventos.</p>
        ) : (
          <ul className="divide-y divide-[#ede8f5]">
            {items.map((item) => (
              <li key={item.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-sm border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-900">
                    {item.resource}
                  </span>
                  <span className="text-sm font-black text-[#17151d]">
                    {item.action}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Actor {item.actorUserId} ({item.actorRole})
                  {item.targetId ? ` · Target ${item.targetId}` : ""}
                </p>
                {item.changes ? (
                  <pre className="mt-3 overflow-x-auto rounded-sm bg-neutral-950 p-3 text-xs text-violet-50">
                    {JSON.stringify(item.changes, null, 2)}
                  </pre>
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
