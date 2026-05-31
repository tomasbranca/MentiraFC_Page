import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { fetchAdminRoles, saveAdminRoleOverride } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import type { AdminRolesPayload } from "../../../types/admin";
import type { AppPermission, AppRole } from "../../../../shared/auth/permissions";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import AdminPageShell from "./AdminPageShell";

type PermissionDrafts = Partial<Record<AppRole, AppPermission[]>>;

const getPersistedPermissions = (
  payload: AdminRolesPayload,
  role: AppRole
): AppPermission[] =>
  payload.overrides.find((override) => override.role === role)?.permissions ??
  payload.defaults[role];

const createDrafts = (payload: AdminRolesPayload): PermissionDrafts =>
  Object.fromEntries(
    payload.roles.map((role) => [role, getPersistedPermissions(payload, role)])
  ) as PermissionDrafts;

const arePermissionListsEqual = (
  first: readonly AppPermission[],
  second: readonly AppPermission[]
): boolean => {
  if (first.length !== second.length) return false;

  const firstSet = new Set(first);
  return second.every((permission) => firstSet.has(permission));
};

const AdminRoles = () => {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<PermissionDrafts>({});
  const rolesQuery = useQuery({
    queryKey: queryKeys.admin.roles,
    queryFn: fetchAdminRoles,
  });
  const mutation = useMutation({
    mutationFn: ({
      role,
      permissions,
    }: {
      role: AppRole;
      permissions: AppPermission[];
    }) => saveAdminRoleOverride(role, permissions),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
      toast.success("Permisos actualizados.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar.");
    },
  });
  const payload = rolesQuery.data;

  useEffect(() => {
    if (!payload) return;
    setDrafts(createDrafts(payload));
  }, [payload]);

  const permissionLabels = useMemo(() => {
    if (!payload) return {} as Record<AppPermission, string>;

    return Object.fromEntries(
      payload.permissions.map((permission) => [
        permission,
        permission.replace(/_/g, " "),
      ])
    ) as Record<AppPermission, string>;
  }, [payload]);

  if (rolesQuery.isLoading) return <DashboardContentLoader />;

  if (rolesQuery.isError || !payload) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar roles"
          message="Los defaults siguen en codigo; los overrides dependen de Supabase."
          onRetry={() => void rolesQuery.refetch()}
        />
      </div>
    );
  }

  const togglePermission = (role: AppRole, permission: AppPermission) => {
    setDrafts((currentDrafts) => {
      const currentPermissions =
        currentDrafts[role] ?? getPersistedPermissions(payload, role);
      const selected = new Set(currentPermissions);

      if (selected.has(permission)) {
        selected.delete(permission);
      } else {
        selected.add(permission);
      }

      return {
        ...currentDrafts,
        [role]: payload.permissions.filter((item) => selected.has(item)),
      };
    });
  };

  const resetRoleDraft = (role: AppRole) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [role]: getPersistedPermissions(payload, role),
    }));
  };

  return (
    <AdminPageShell
      eyebrow="Autorizacion"
      title="Roles y permisos"
      description="Los defaults viven tipados en codigo. Los overrides operativos se guardan en Supabase."
    >
      <div className="grid gap-4">
        {payload.roles.map((role) => {
          const persistedPermissions = getPersistedPermissions(payload, role);
          const permissions = drafts[role] ?? persistedPermissions;
          const selected = new Set(permissions);
          const canOverride = role !== "admin";
          const hasChanges = !arePermissionListsEqual(
            permissions,
            persistedPermissions
          );

          return (
            <article
              key={role}
              className="rounded-md border border-[#ded7ef] bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-black uppercase text-[#17151d]">
                    {role}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {permissions.length} permisos activos
                  </p>
                </div>
                <Button
                  className="rounded-sm! px-3! py-2! text-xs!"
                  disabled={!canOverride || !hasChanges || mutation.isPending}
                  onClick={() =>
                    void mutation.mutate({
                      role,
                      permissions,
                    })
                  }
                >
                  {canOverride ? "Guardar cambios" : "Protegido"}
                </Button>
              </div>
              {canOverride && hasChanges ? (
                <div className="mt-3">
                  <Button
                    className="rounded-sm! px-3! py-2! text-xs!"
                    variant="light"
                    disabled={mutation.isPending}
                    onClick={() => resetRoleDraft(role)}
                  >
                    Descartar cambios
                  </Button>
                </div>
              ) : null}
              <div className="mt-4 grid max-h-90 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                {payload.permissions.map((permission) => (
                  <label
                    key={permission}
                    className={`flex min-h-11 items-center gap-2 rounded-sm border px-3 py-2 text-xs font-semibold ${
                      selected.has(permission)
                        ? "border-violet-200 bg-violet-50 text-violet-950"
                        : "border-neutral-200 bg-neutral-50 text-neutral-500"
                    } ${
                      canOverride ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-violet-700"
                      checked={selected.has(permission)}
                      disabled={!canOverride || mutation.isPending}
                      onChange={() => togglePermission(role, permission)}
                    />
                    <span className="break-all leading-snug">
                      {permissionLabels[permission]}
                    </span>
                  </label>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </AdminPageShell>
  );
};

export default AdminRoles;
