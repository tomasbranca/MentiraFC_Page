import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { APP_ROLES, type AppRole } from "../../../../shared/auth/permissions";
import { fetchAdminUsers, updateAdminUser } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import type { AdminUser } from "../../../types/admin";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import AdminPageShell from "./AdminPageShell";

const ROLE_LABELS = {
  user: "Usuario",
  team_member: "Equipo",
  editor: "Editor",
  moderator: "Moderador",
  admin: "Admin",
} as const satisfies Record<AppRole, string>;

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: fetchAdminUsers,
  });
  const [editing, setEditing] = useState<Record<string, AdminUser>>({});
  const mutation = useMutation({
    mutationFn: updateAdminUser,
    onSuccess: async () => {
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

  const getDraft = (user: AdminUser) => editing[user.id] ?? user;

  return (
    <AdminPageShell
      eyebrow="Seguridad"
      title="Usuarios"
      description="Gestion de perfiles operativos, roles y suspension de acceso."
      aside={
        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <p className="text-3xl font-black leading-none">{users.length}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">
            Usuarios registrados
          </p>
        </div>
      }
    >
      <div className="overflow-hidden rounded-md border border-[#ded7ef] bg-white">
        <div className="grid gap-3 border-b border-[#ede8f5] bg-[#fbfaff] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 md:grid-cols-[minmax(12rem,1fr)_9rem_9rem_8rem]">
          <span>Cuenta</span>
          <span>Rol</span>
          <span>Estado</span>
          <span>Accion</span>
        </div>
        <div className="divide-y divide-[#ede8f5]">
          {users.map((user) => {
            const draft = getDraft(user);
            const isDirty = JSON.stringify(draft) !== JSON.stringify(user);

            return (
              <article
                key={user.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(12rem,1fr)_9rem_9rem_8rem] md:items-center"
              >
                <div className="min-w-0">
                  <input
                    className="w-full rounded-sm border border-neutral-200 px-3 py-2 text-sm font-semibold text-[#17151d]"
                    value={draft.firstName}
                    aria-label="Nombre"
                    onChange={(event) =>
                      setEditing((current) => ({
                        ...current,
                        [user.id]: { ...draft, firstName: event.target.value },
                      }))
                    }
                  />
                  <input
                    className="mt-2 w-full rounded-sm border border-neutral-200 px-3 py-2 text-sm text-[#17151d]"
                    value={draft.lastName}
                    aria-label="Apellido"
                    onChange={(event) =>
                      setEditing((current) => ({
                        ...current,
                        [user.id]: { ...draft, lastName: event.target.value },
                      }))
                    }
                  />
                  <p className="mt-2 truncate text-xs text-neutral-500">
                    {user.email ?? user.id}
                  </p>
                </div>
                <select
                  className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm font-semibold text-[#17151d]"
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
                <label className="flex items-center gap-2 text-sm font-semibold text-[#17151d]">
                  <input
                    type="checkbox"
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
                  Activo
                </label>
                <Button
                  className="rounded-sm! px-3! py-2! text-xs!"
                  disabled={!isDirty || mutation.isPending}
                  onClick={() => void mutation.mutate(draft)}
                >
                  Guardar
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AdminUsers;
