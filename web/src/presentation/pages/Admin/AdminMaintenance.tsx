import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiRotateCcw, FiSave } from "react-icons/fi";

import {
  fetchMaintenanceSettings,
  saveMaintenanceSettings,
} from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { confirmAdminAction } from "./adminConfirm";
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

  const currentSettings = maintenanceQuery.data;
  const isDirty =
    enabled !== Boolean(currentSettings?.enabled) ||
    message !== (currentSettings?.message ?? "");
  const discardChanges = () => {
    setEnabled(Boolean(currentSettings?.enabled));
    setMessage(currentSettings?.message ?? "");
  };
  const handleSave = async () => {
    const confirmed = await confirmAdminAction({
      title: enabled ? "Activar mantenimiento" : "Desactivar mantenimiento",
      text: enabled
        ? "El sitio publico mostrara el mensaje de mantenimiento."
        : "El sitio publico volvera a estar disponible.",
      confirmButtonText: enabled ? "Activar" : "Desactivar",
      danger: enabled,
    });

    if (confirmed) {
      mutation.mutate({ enabled, message });
    }
  };

  return (
    <AdminPageShell
      eyebrow="Operaciones"
      title="Modo mantenimiento"
      description="Bloqueo app-level para el sitio publico. /admin queda disponible."
      aside={
        <div
          className={`rounded-md border p-4 ${
            enabled
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <p className="text-3xl font-black uppercase leading-none">
            {enabled ? "Activo" : "Online"}
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em]">
            Estado publico
          </p>
        </div>
      }
    >
      <form
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <section className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black uppercase text-[#17151d]">
                Control publico
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Cambia el estado solo cuando quieras bloquear el sitio publico.
              </p>
            </div>
            <label
              className={`flex min-h-12 items-center justify-between gap-4 rounded-sm border px-3 text-sm font-black uppercase ${
                enabled
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {enabled ? "Mantenimiento" : "Online"}
              <input
                type="checkbox"
                className="h-4 w-4 accent-violet-700"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
              />
            </label>
          </div>

          <label className="mt-5 grid gap-2 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
            Mensaje publico
            <textarea
              className="min-h-36 w-full rounded-sm border border-neutral-200 p-3 text-sm normal-case tracking-normal text-[#17151d]"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Mensaje que vera el visitante mientras el sitio este bloqueado."
            />
          </label>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              className="w-full rounded-sm! sm:size-10 sm:p-0!"
              disabled={!isDirty || mutation.isPending}
              aria-label="Guardar mantenimiento"
              title="Guardar"
            >
              <FiSave className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="light"
              className="w-full rounded-sm! sm:size-10 sm:p-0!"
              disabled={!isDirty || mutation.isPending}
              onClick={discardChanges}
              aria-label="Descartar cambios"
              title="Descartar"
            >
              <FiRotateCcw className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </section>

        <aside className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-violet-700">
            Preview
          </p>
          <div
            className={`mt-3 rounded-sm border p-3 ${
              enabled
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <p className="text-lg font-black uppercase leading-none">
              {enabled ? "Sitio en pausa" : "Sitio disponible"}
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              {message || "No hay mensaje configurado."}
            </p>
          </div>
        </aside>
      </form>
    </AdminPageShell>
  );
};

export default AdminMaintenance;
