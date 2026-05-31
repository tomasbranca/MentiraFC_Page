import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  fetchMaintenanceSettings,
  saveMaintenanceSettings,
} from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import AdminPageShell from "./AdminPageShell";

const AdminMaintenance = () => {
  const queryClient = useQueryClient();
  const maintenanceQuery = useQuery({
    queryKey: queryKeys.admin.maintenance,
    queryFn: fetchMaintenanceSettings,
  });
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: saveMaintenanceSettings,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.maintenance,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.publicMaintenance,
        }),
      ]);
      toast.success("Modo mantenimiento actualizado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar.");
    },
  });

  useEffect(() => {
    if (maintenanceQuery.data) {
      setEnabled(maintenanceQuery.data.enabled);
      setMessage(maintenanceQuery.data.message);
    }
  }, [maintenanceQuery.data]);

  if (maintenanceQuery.isLoading) return <DashboardContentLoader />;

  if (maintenanceQuery.isError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar mantenimiento"
          message="El singleton operativo vive en Supabase."
          onRetry={() => void maintenanceQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Operaciones"
      title="Modo mantenimiento"
      description="Bloqueo app-level para el sitio publico. /admin queda disponible."
    >
      <form
        className="space-y-4 rounded-md border border-[#ded7ef] bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void mutation.mutate({ enabled, message });
        }}
      >
        <label className="flex items-center gap-3 text-sm font-bold text-[#17151d]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Activar modo mantenimiento
        </label>
        <textarea
          className="min-h-28 w-full rounded-sm border border-neutral-200 p-3 text-sm"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button type="submit" disabled={mutation.isPending}>
          Guardar mantenimiento
        </Button>
      </form>
    </AdminPageShell>
  );
};

export default AdminMaintenance;
