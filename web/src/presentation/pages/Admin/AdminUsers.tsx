import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiChevronLeft, FiChevronRight, FiRotateCcw, FiSave } from "react-icons/fi";

import { APP_ROLES, type AppRole } from "../../../../shared/auth/permissions";
import { fetchAdminUsersPage, updateAdminUser } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import type {
  AdminUser,
  AdminUsersPageSortBy,
  AdminUsersPageStatusFilter,
} from "../../../types/admin";
import type { SortDirection } from "../../../../shared/pagination";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { confirmAdminAction } from "./adminConfirm";
import AdminPageShell from "./AdminPageShell";

const ROLE_LABELS = {
  user: "Usuario",
  team_member: "Equipo",
  editor: "Editor",
  moderator: "Moderador",
  admin: "Admin",
} as const satisfies Record<AppRole, string>;

const ADMIN_USERS_PAGE_LIMIT = 20;
const ADMIN_USERS_SEARCH_MAX_LENGTH = 80;

const ADMIN_USERS_SORT_OPTIONS = [
  { value: "createdAt", label: "Alta" },
  { value: "email", label: "Email" },
  { value: "lastSignInAt", label: "Ultimo acceso" },
  { value: "role", label: "Rol" },
] as const satisfies Array<{ value: AdminUsersPageSortBy; label: string }>;

type AdminUsersFilters = {
  search: string;
  role: AppRole | "";
  status: AdminUsersPageStatusFilter | "";
  sortBy: AdminUsersPageSortBy;
  direction: SortDirection;
};

const defaultAdminUsersFilters: AdminUsersFilters = {
  search: "",
  role: "",
  status: "",
  sortBy: "createdAt",
  direction: "desc",
};

const getUserName = (user: Pick<AdminUser, "firstName" | "lastName" | "email">) =>
  `${user.firstName} ${user.lastName}`.replace(/\s+/g, " ").trim() ||
  user.email ||
  "Usuario";

const adminUsersPaginationButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[#ded7ef] bg-white px-3 py-2 text-sm font-bold text-[#17151d] transition hover:border-violet-300 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-45";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultAdminUsersFilters);
  const search = filters.search.trim();
  const usersPageParams = {
    page,
    limit: ADMIN_USERS_PAGE_LIMIT,
    sortBy: filters.sortBy,
    direction: filters.direction,
    search: search || null,
    role: filters.role || null,
    status: filters.status || null,
  };
  const usersQuery = useQuery({
    queryKey: queryKeys.admin.usersPage(usersPageParams),
    queryFn: () => fetchAdminUsersPage(usersPageParams),
    placeholderData: keepPreviousData,
  });
  const [editing, setEditing] = useState<Record<string, AdminUser>>({});
  const mutation = useMutation({
    mutationFn: updateAdminUser,
    onSuccess: async (updatedUser) => {
      setEditing((current) => {
        const next = { ...current };
        delete next[updatedUser.id];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success("Usuario actualizado.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No pudimos actualizar."
      );
    },
  });

  const pageData = usersQuery.data;
  const totalPages = pageData?.totalPages;

  useEffect(() => {
    if (totalPages != null && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (usersQuery.isLoading) return <DashboardContentLoader />;

  if (usersQuery.isError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar usuarios"
          message="Revisa la configuracion de Supabase y la migracion admin."
          onRetry={() => void usersQuery.refetch()}
        />
      </div>
    );
  }

  const users = pageData?.items ?? [];
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = users.length - activeUsers;
  const hasPreviousPage = pageData?.hasPreviousPage ?? page > 1;
  const hasNextPage = pageData?.hasNextPage ?? false;
  const pageLabel =
    pageData?.totalPages != null
      ? `Pagina ${page} de ${pageData.totalPages}`
      : `Pagina ${page}`;

  const resetPageAndSetFilters = (nextFilters: Partial<AdminUsersFilters>) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
  };

  const getDraft = (user: AdminUser) => editing[user.id] ?? user;
  const discardDraft = (userId: string) => {
    setEditing((current) => {
      const next = { ...current };
      delete next[userId];
      return next;
    });
  };
  const handleSaveUser = async (draft: AdminUser) => {
    const confirmed = await confirmAdminAction({
      title: "Guardar cambios de usuario",
      text: `Se actualizara ${getUserName(draft)}.`,
      confirmButtonText: "Guardar",
    });

    if (confirmed) {
      mutation.mutate(draft);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Seguridad"
      title="Usuarios"
      description="Gestion de perfiles operativos, roles y suspension de acceso."
      aside={
        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-3xl font-black leading-none">{users.length}</p>
              <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100/70">
                En pagina
              </p>
            </div>
            <div>
              <p className="text-3xl font-black leading-none">{activeUsers}</p>
              <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100/70">
                Activos
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-sm border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-violet-50/80">
            {inactiveUsers} cuentas suspendidas en esta pagina.
          </p>
        </div>
      }
    >
      <div className="mb-4 grid gap-3 rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)] lg:grid-cols-[minmax(12rem,1.3fr)_repeat(4,minmax(9rem,0.7fr))]">
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          Buscar
          <input
            className="h-11 rounded-sm border border-neutral-200 px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.search}
            maxLength={ADMIN_USERS_SEARCH_MAX_LENGTH}
            onChange={(event) =>
              resetPageAndSetFilters({
                search: event.target.value.slice(0, ADMIN_USERS_SEARCH_MAX_LENGTH),
              })
            }
            placeholder="Email, nombre o rol"
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
          Estado
          <select
            className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.status}
            onChange={(event) =>
              resetPageAndSetFilters({
                status: event.target.value as AdminUsersPageStatusFilter | "",
              })
            }
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Suspendidos</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
          Orden
          <select
            className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
            value={filters.sortBy}
            onChange={(event) =>
              resetPageAndSetFilters({
                sortBy: event.target.value as AdminUsersPageSortBy,
              })
            }
          >
            {ADMIN_USERS_SORT_OPTIONS.map((option) => (
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
      <div className="grid gap-3">
        {users.length === 0 ? (
          <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-md border border-[#ded7ef] bg-white p-8 text-center shadow-[0_10px_28px_rgba(23,21,29,0.05)]">
            <h2 className="text-xl font-black uppercase text-[#17151d]">
              No hay usuarios
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Cuando existan cuentas, vas a poder revisarlas aca.
            </p>
          </div>
        ) : (
          users.map((user) => {
            const draft = getDraft(user);
            const isDirty = JSON.stringify(draft) !== JSON.stringify(user);

            return (
              <article
                key={user.id}
                className={`rounded-md border bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)] ${
                  isDirty ? "border-amber-200" : "border-[#ded7ef]"
                }`}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(14rem,0.8fr)_minmax(0,1.4fr)_12rem] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-black uppercase leading-tight text-[#17151d]">
                        {getUserName(user)}
                      </h2>
                      <span
                        className={`rounded-sm border px-2 py-1 text-[0.65rem] font-black uppercase ${
                          user.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Activo" : "Suspendido"}
                      </span>
                      {isDirty ? (
                        <span className="rounded-sm border border-amber-200 bg-amber-50 px-2 py-1 text-[0.65rem] font-black uppercase text-amber-800">
                          Sin guardar
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-xs text-neutral-500">
                      {user.email ?? user.id}
                    </p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-violet-700">
                      Rol actual: {ROLE_LABELS[user.role]}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
                      Nombre
                      <input
                        className="h-11 rounded-sm border border-neutral-200 px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
                        value={draft.firstName}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            [user.id]: {
                              ...draft,
                              firstName: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
                      Apellido
                      <input
                        className="h-11 rounded-sm border border-neutral-200 px-3 text-sm normal-case tracking-normal text-[#17151d]"
                        value={draft.lastName}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            [user.id]: {
                              ...draft,
                              lastName: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
                      Rol
                      <select
                        className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#17151d]"
                        value={draft.role}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            [user.id]: {
                              ...draft,
                              role: event.target.value as AppRole,
                            },
                          }))
                        }
                      >
                        {APP_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-h-11 items-center justify-between gap-3 rounded-sm border border-neutral-200 px-3 text-sm font-bold text-[#17151d] sm:self-end">
                      Cuenta activa
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-violet-700"
                        checked={draft.isActive}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            [user.id]: {
                              ...draft,
                              isActive: event.target.checked,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                    <Button
                      className="w-full rounded-sm! px-3! py-2! text-xs! xl:min-h-11"
                      disabled={!isDirty || mutation.isPending}
                      onClick={() => void handleSaveUser(draft)}
                      aria-label={`Guardar ${getUserName(user)}`}
                      title="Guardar"
                    >
                      <FiSave className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="light"
                      className="w-full rounded-sm! px-3! py-2! text-xs! xl:min-h-11"
                      disabled={!isDirty || mutation.isPending}
                      onClick={() => discardDraft(user.id)}
                      aria-label={`Descartar cambios de ${getUserName(user)}`}
                      title="Descartar"
                    >
                      <FiRotateCcw className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
      {(hasPreviousPage || hasNextPage || usersQuery.isFetching) && (
        <nav
          className="mt-4 flex flex-col gap-3 rounded-md border border-[#ded7ef] bg-white p-4 text-sm text-neutral-600 shadow-[0_10px_28px_rgba(23,21,29,0.05)] sm:flex-row sm:items-center sm:justify-between"
          aria-label="Paginacion de usuarios admin"
        >
          <p aria-live="polite">
            {pageLabel}
            {usersQuery.isFetching ? " - Actualizando..." : ""}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              className={adminUsersPaginationButtonClassName}
              disabled={!hasPreviousPage || usersQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <FiChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </button>
            <button
              type="button"
              className={adminUsersPaginationButtonClassName}
              disabled={!hasNextPage || usersQuery.isFetching}
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

export default AdminUsers;
