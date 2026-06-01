import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiPower, FiSave } from "react-icons/fi";

import { fetchFeatureFlags, saveFeatureFlag } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import type { AdminFeatureFlag } from "../../../types/admin";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { confirmAdminAction } from "./adminConfirm";
import AdminPageShell from "./AdminPageShell";

const AdminFeatureFlags = () => {
  const queryClient = useQueryClient();
  const flagsQuery = useQuery({
    queryKey: queryKeys.admin.featureFlags,
    queryFn: fetchFeatureFlags,
  });
  const [draft, setDraft] = useState({
    key: "",
    label: "",
    description: "",
    enabled: false,
  });
  const mutation = useMutation({
    mutationFn: saveFeatureFlag,
    onSuccess: async () => {
      setDraft({ key: "", label: "", description: "", enabled: false });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.featureFlags,
      });
      toast.success("Feature flag guardada.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar.");
    },
  });

  if (flagsQuery.isLoading) return <DashboardContentLoader />;

  if (flagsQuery.isError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar feature flags"
          message="Las flags operativas viven en Supabase, no en Sanity."
          onRetry={() => void flagsQuery.refetch()}
        />
      </div>
    );
  }

  const flags = flagsQuery.data ?? [];
  const enabledCount = flags.filter((flag) => flag.enabled).length;
  const handleSaveDraft = async () => {
    const confirmed = await confirmAdminAction({
      title: "Guardar feature flag",
      text: `Se guardara ${draft.label || draft.key}.`,
      confirmButtonText: "Guardar",
    });

    if (confirmed) {
      mutation.mutate(draft);
    }
  };
  const handleToggleFlag = async (flag: AdminFeatureFlag) => {
    const nextEnabled = !flag.enabled;
    const confirmed = await confirmAdminAction({
      title: nextEnabled ? "Activar flag" : "Desactivar flag",
      text: `${flag.label} pasara a estar ${
        nextEnabled ? "activa" : "inactiva"
      }.`,
      confirmButtonText: nextEnabled ? "Activar" : "Desactivar",
      danger: flag.enabled,
    });

    if (confirmed) {
      mutation.mutate({
        key: flag.key,
        label: flag.label,
        description: flag.description,
        enabled: nextEnabled,
      });
    }
  };

  return (
    <AdminPageShell
      eyebrow="Operaciones"
      title="Feature flags"
      description="Activadores operativos guardados en Supabase."
      aside={
        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-3xl font-black leading-none">{enabledCount}</p>
              <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100/70">
                Activas
              </p>
            </div>
            <div>
              <p className="text-3xl font-black leading-none">
                {flags.length - enabledCount}
              </p>
              <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100/70">
                Inactivas
              </p>
            </div>
          </div>
        </div>
      }
    >
      <form
        className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSaveDraft();
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black uppercase text-[#17151d]">
              Nueva flag
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Usala para habilitar o apagar comportamiento operativo sin deploy.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full rounded-sm! px-3! py-2! text-xs! sm:size-10 sm:p-0!"
            disabled={mutation.isPending || !draft.key.trim() || !draft.label.trim()}
            aria-label="Guardar flag"
            title="Guardar"
          >
            <FiSave className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)_11rem]">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
            Key
            <input
              className="h-11 rounded-sm border border-neutral-200 px-3 text-sm normal-case tracking-normal text-[#17151d]"
              placeholder="feature_key"
              value={draft.key}
              onChange={(event) =>
                setDraft({ ...draft, key: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
            Nombre
            <input
              className="h-11 rounded-sm border border-neutral-200 px-3 text-sm normal-case tracking-normal text-[#17151d]"
              placeholder="Nombre visible"
              value={draft.label}
              onChange={(event) =>
                setDraft({ ...draft, label: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
            Descripcion
            <input
              className="h-11 rounded-sm border border-neutral-200 px-3 text-sm normal-case tracking-normal text-[#17151d]"
              placeholder="Contexto operativo"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-sm border border-neutral-200 px-3 text-sm font-bold text-[#17151d] lg:self-end">
            Activa
            <input
              type="checkbox"
              className="h-4 w-4 accent-violet-700"
              checked={draft.enabled}
              onChange={(event) =>
                setDraft({ ...draft, enabled: event.target.checked })
              }
            />
          </label>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {flags.length === 0 ? (
          <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-md border border-[#ded7ef] bg-white p-8 text-center shadow-[0_10px_28px_rgba(23,21,29,0.05)] md:col-span-2">
            <h2 className="text-xl font-black uppercase text-[#17151d]">
              No hay flags configuradas
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Crea la primera desde el formulario superior.
            </p>
          </div>
        ) : null}
        {flags.map((flag) => (
          <article
            key={flag.key}
            className="flex min-h-44 flex-col rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-black uppercase text-[#17151d]">
                  {flag.label}
                </h2>
                <p className="mt-1 truncate text-sm text-neutral-500">
                  {flag.key}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-sm border px-2.5 py-1 text-xs font-black uppercase ${
                  flag.enabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600"
                }`}
              >
                {flag.enabled ? "Activa" : "Off"}
              </span>
            </div>
            {flag.description ? (
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                {flag.description}
              </p>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">
                Sin descripcion operativa.
              </p>
            )}
            <div className="mt-auto pt-4">
              <Button
                variant="light"
                className={`w-full rounded-sm! px-3! py-2! text-xs! ${
                  flag.enabled
                    ? "border-red-200! bg-red-50! text-red-800! hover:bg-red-100!"
                    : "border-emerald-200! bg-emerald-50! text-emerald-800! hover:bg-emerald-100!"
                }`}
                disabled={mutation.isPending}
                onClick={() => void handleToggleFlag(flag)}
                aria-label={flag.enabled ? "Desactivar flag" : "Activar flag"}
                title={flag.enabled ? "Desactivar" : "Activar"}
              >
                <FiPower className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AdminPageShell>
  );
};

export default AdminFeatureFlags;
