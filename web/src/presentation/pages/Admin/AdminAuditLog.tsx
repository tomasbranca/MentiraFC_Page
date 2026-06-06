import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { APP_ROLES, type AppRole } from "../../../../shared/auth/permissions";
import { fetchAdminAuditLogPage } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import type {
  AdminAuditLogPageSortBy,
  AdminAuditLogResultFilter,
} from "../../../types/admin";
import type { SortDirection } from "../../../../shared/pagination";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { formatDateTime } from "../../utils/date.utils";
import AdminPageShell from "./AdminPageShell";

const ADMIN_AUDIT_LOG_PAGE_LIMIT = 20;
const ADMIN_AUDIT_LOG_SEARCH_MAX_LENGTH = 80;
const ADMIN_AUDIT_LOG_RESOURCE_MAX_LENGTH = 80;

const ROLE_LABELS = {
  user: "Usuario",
  team_member: "Equipo",
  editor: "Editor",
  moderator: "Moderador",
  admin: "Admin",
} as const satisfies Record<AppRole, string>;

const AUDIT_LOG_SORT_OPTIONS = [
  { value: "createdAt", label: "Fecha" },
  { value: "resource", label: "Recurso" },
  { value: "action", label: "Accion" },
  { value: "actorRole", label: "Rol" },
  { value: "result", label: "Resultado" },
] as const satisfies Array<{ value: AdminAuditLogPageSortBy; label: string }>;

type AuditLogFilters = {
  search: string;
  role: AppRole | "";
  result: AdminAuditLogResultFilter | "";
  resource: string;
  sortBy: AdminAuditLogPageSortBy;
  direction: SortDirection;
};

const defaultAuditLogFilters: AuditLogFilters = {
  search: "",
  role: "",
  result: "",
  resource: "",
  sortBy: "createdAt",
  direction: "desc",
};

const paginationButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[#ded7ef] bg-white px-3 py-2 text-sm font-bold text-[#17151d] transition hover:border-violet-300 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-45";

const AdminAuditLog = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultAuditLogFilters);
  const search = filters.search.trim();
  const resource = filters.resource.trim();
  const auditLogPageParams = {
    page,
    limit: ADMIN_AUDIT_LOG_PAGE_LIMIT,
    sortBy: filters.sortBy,
    direction: filters.direction,
    search: search || null,
    role: filters.role || null,
    result: filters.result || null,
    resource: resource || null,
  };
  const auditQuery = useQuery({
    queryKey: queryKeys.admin.auditLogPage(auditLogPageParams),
    queryFn: () => fetchAdminAuditLogPage(auditLogPageParams),
    placeholderData: keepPreviousData,
  });
  const pageData = auditQuery.data;
  const totalPages = pageData?.totalPages;

  useEffect(() => {
    if (totalPages != null && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

  const items = pageData?.items ?? [];
  const hasPreviousPage = pageData?.hasPreviousPage ?? page > 1;
  const hasNextPage = pageData?.hasNextPage ?? false;
  const pageLabel =
    pageData?.totalPages != null
      ? `Pagina ${page} de ${pageData.totalPages}`
      : `Pagina ${page}`;

  const resetPageAndSetFilters = (nextFilters: Partial<AuditLogFilters>) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
  };

  return (
    <AdminPageShell
      eyebrow="Trazabilidad"
      title="Audit log"
      description="Registro append-only de acciones sensibles del panel."
      aside={
        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <p className="text-3xl font-black leading-none">{items.length}</p>
          <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100/70">
            En pagina
          </p>
          <p className="mt-4 rounded-sm border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-violet-50/80">
            Ultimos movimientos sensibles del panel.
          </p>
        </div>
      }
    >
      <div className="mb-4 grid gap-3 rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)] xl:grid-cols-[minmax(12rem,1.2fr)_minmax(10rem,0.9fr)_repeat(4,minmax(8rem,0.7fr))]">
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          Buscar
          <input
            className="h-11 rounded-sm border border-neutral-200 px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.search}
            maxLength={ADMIN_AUDIT_LOG_SEARCH_MAX_LENGTH}
            onChange={(event) =>
              resetPageAndSetFilters({
                search: event.target.value.slice(
                  0,
                  ADMIN_AUDIT_LOG_SEARCH_MAX_LENGTH
                ),
              })
            }
            placeholder="Accion, actor o target"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          Recurso
          <input
            className="h-11 rounded-sm border border-neutral-200 px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.resource}
            maxLength={ADMIN_AUDIT_LOG_RESOURCE_MAX_LENGTH}
            onChange={(event) =>
              resetPageAndSetFilters({
                resource: event.target.value.slice(
                  0,
                  ADMIN_AUDIT_LOG_RESOURCE_MAX_LENGTH
                ),
              })
            }
            placeholder="users"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          Rol
          <select
            className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.role}
            onChange={(event) =>
              resetPageAndSetFilters({
                role: event.target.value as AppRole | "",
              })
            }
          >
            <option value="">Todos</option>
            {APP_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          Resultado
          <select
            className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.result}
            onChange={(event) =>
              resetPageAndSetFilters({
                result: event.target.value as AdminAuditLogResultFilter | "",
              })
            }
          >
            <option value="">Todos</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          Orden
          <select
            className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.sortBy}
            onChange={(event) =>
              resetPageAndSetFilters({
                sortBy: event.target.value as AdminAuditLogPageSortBy,
              })
            }
          >
            {AUDIT_LOG_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          Direccion
          <select
            className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.direction}
            onChange={(event) =>
              resetPageAndSetFilters({
                direction: event.target.value as SortDirection,
              })
            }
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>
      </div>
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
      {(hasPreviousPage || hasNextPage || auditQuery.isFetching) && (
        <nav
          className="mt-4 flex flex-col gap-3 rounded-md border border-[#ded7ef] bg-white p-4 text-sm text-neutral-600 shadow-[0_10px_28px_rgba(23,21,29,0.05)] sm:flex-row sm:items-center sm:justify-between"
          aria-label="Paginacion del audit log"
        >
          <p aria-live="polite">
            {pageLabel}
            {auditQuery.isFetching ? " - Actualizando..." : ""}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              className={paginationButtonClassName}
              disabled={!hasPreviousPage || auditQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <FiChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </button>
            <button
              type="button"
              className={paginationButtonClassName}
              disabled={!hasNextPage || auditQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
              <FiChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </AdminPageShell>
  );
};

export default AdminAuditLog;
