import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { fetchFeatureFlags, saveFeatureFlag } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
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

  return (
    <AdminPageShell
      eyebrow="Operaciones"
      title="Feature flags"
      description="Activadores operativos guardados en Supabase."
    >
      <form
        className="grid gap-3 rounded-md border border-[#ded7ef] bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void mutation.mutate(draft);
        }}
      >
        <input
          className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
          placeholder="key"
          value={draft.key}
          onChange={(event) => setDraft({ ...draft, key: event.target.value })}
        />
        <input
          className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
          placeholder="Nombre"
          value={draft.label}
          onChange={(event) => setDraft({ ...draft, label: event.target.value })}
        />
        <input
          className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
          placeholder="Descripcion"
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
        />
        <label className="flex h-11 items-center gap-2 text-sm font-semibold text-[#17151d]">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) =>
              setDraft({ ...draft, enabled: event.target.checked })
            }
          />
          Activa
        </label>
        <Button type="submit" disabled={mutation.isPending}>
          Guardar
        </Button>
      </form>

      <div className="grid gap-3">
        {(flagsQuery.data ?? []).map((flag) => (
          <article
            key={flag.key}
            className="rounded-md border border-[#ded7ef] bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase text-[#17151d]">
                  {flag.label}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{flag.key}</p>
              </div>
              <Button
                variant={flag.enabled ? "secondary" : "primary"}
                className="rounded-sm! px-3! py-2! text-xs!"
                disabled={mutation.isPending}
                onClick={() =>
                  void mutation.mutate({
                    key: flag.key,
                    label: flag.label,
                    description: flag.description,
                    enabled: !flag.enabled,
                  })
                }
              >
                {flag.enabled ? "Desactivar" : "Activar"}
              </Button>
            </div>
            {flag.description ? (
              <p className="mt-2 text-sm text-neutral-600">{flag.description}</p>
            ) : null}
          </article>
        ))}
      </div>
    </AdminPageShell>
  );
};

export default AdminFeatureFlags;
