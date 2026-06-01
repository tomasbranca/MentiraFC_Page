import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiRotateCcw, FiSave } from "react-icons/fi";

import { APP_ROLES, type AppRole } from "../../../../shared/auth/permissions";
import { fetchAdminUsers, updateAdminUser } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import type { AdminUser } from "../../../types/admin";
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

const getUserName = (user: Pick<AdminUser, "firstName" | "lastName" | "email">) =>
  `${user.firstName} ${user.lastName}`.replace(/\s+/g, " ").trim() ||
  user.email ||
  "Usuario";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: fetchAdminUsers,
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

  const users = usersQuery.data ?? [];
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = users.length - activeUsers;

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
                Total
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
            {inactiveUsers} cuentas suspendidas.
          </p>
        </div>
      }
    >
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
    </AdminPageShell>
  );
};

export default AdminUsers;
