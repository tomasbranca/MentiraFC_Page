import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEdit2, FiFlag, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  deleteDashboardOrganization,
  fetchDashboardOrganizations,
} from "../../../data/dashboardOrganizations";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type { DashboardOrganizationItem } from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { formatDateTime } from "../../utils/date.utils";
import {
  getOrganizationColorLabel,
  getOrganizationReferenceCount,
} from "./dashboardOrganizations.utils";

const OrganizationThumbnail = ({
  item,
}: {
  item: DashboardOrganizationItem;
}) => {
  const imageUrl = getImageUrl(item.logoUrl, {
    width: 120,
    height: 120,
    fit: "max",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(item.logoUrl, [80, 120, 180], {
    height: (width) => width,
    fit: "max",
    quality: 72,
  });

  if (!imageUrl) {
    return (
      <div
        aria-label="Organizador sin logo"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-violet-100/55"
      >
        <FiFlag className="size-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      srcSet={imageSrcSet || undefined}
      sizes="56px"
      alt={`Logo de ${item.name}`}
      loading="lazy"
      decoding="async"
      className="h-14 w-14 shrink-0 rounded-[3px] border border-white/10 object-contain"
    />
  );
};

const OrganizationColorSwatch = ({
  primaryColor,
}: {
  primaryColor?: string | null;
}) => (
  <span className="inline-flex items-center gap-2 text-sm text-violet-100/70">
    <span
      className="size-4 rounded-[3px] border border-white/20"
      style={{ backgroundColor: primaryColor ?? "transparent" }}
      aria-hidden="true"
    />
    {getOrganizationColorLabel(primaryColor)}
  </span>
);

const getOrganizationDateLabel = (item: DashboardOrganizationItem): string =>
  item.updatedAt ? `Actualizado ${formatDateTime(item.updatedAt)}` : "Sin fecha";

const OrganizationStatusBadge = ({
  item,
}: {
  item: DashboardOrganizationItem;
}) => {
  if (item.status === "draft") {
    return (
      <span className="inline-flex rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-xs font-medium text-amber-100">
        {item.hasPublishedVersion ? "Borrador" : "Borrador sin publicar"}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-[3px] border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
      Publicado
    </span>
  );
};

const actionButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-[3px] border text-white transition hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45";

const deleteToastOptions = {
  style: {
    minWidth: "16rem",
  },
} as const;

const DeleteOrganizationButton = ({
  item,
  isDeleting,
  onDelete,
}: {
  item: DashboardOrganizationItem;
  isDeleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => {
  const referenceCount = getOrganizationReferenceCount(item.referenceCounts);
  const isDisabled = isDeleting || referenceCount > 0;

  return (
    <button
      type="button"
      className={`${actionButtonClassName} border-red-300/20 text-red-100 hover:border-red-200/45 hover:bg-red-400/10`}
      disabled={isDisabled}
      aria-label="Borrar organizador"
      title={
        referenceCount > 0
          ? "No se puede borrar un organizador con torneos vinculados"
          : "Borrar organizador"
      }
      onClick={() => {
        void (async () => {
          const confirmed = await confirmDashboardAction({
            title: "Borrar organizador",
            text: `Vas a eliminar "${item.name}" de Sanity. Esta accion solo esta disponible si no tiene torneos vinculados.`,
            confirmText: "Borrar",
            icon: "warning",
            variant: "danger",
          });

          if (confirmed) {
            await onDelete(item.id);
          }
        })();
      }}
    >
      <FiTrash2 className="size-4" aria-hidden="true" />
    </button>
  );
};

const DashboardOrganizationsList = () => {
  const queryClient = useQueryClient();
  const organizationsQuery = useQuery({
    queryKey: queryKeys.dashboard.organizations.all,
    queryFn: async () => {
      try {
        return await fetchDashboardOrganizations();
      } catch (error) {
        reportError(error, {
          page: "DashboardOrganizationsList",
          action: "load_organizations",
        });
        throw error;
      }
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardOrganization,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.organizations.all,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.tournaments.options,
        }),
      ]);
    },
  });

  const handleDeleteOrganization = async (itemId: string) => {
    try {
      await toast.promise(
        deleteMutation.mutateAsync(itemId),
        {
          loading: "Eliminando organizador de Sanity...",
          success: "Organizador eliminado correctamente.",
          error: (error) =>
            error instanceof Error
              ? error.message
              : "No pudimos borrar el organizador.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardOrganizationsList",
        action: "delete_organization",
        id: itemId,
      });
    }
  };

  if (organizationsQuery.isLoading) {
    return <Loader />;
  }

  if (organizationsQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar los organizadores"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => void organizationsQuery.refetch()}
      />
    );
  }

  const organizations = organizationsQuery.data ?? [];

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Competencia
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <h2 className="text-3xl font-black text-white">
                Organizadores
              </h2>
              <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
                {organizations.length} cargados
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-100/65">
              Administra marcas, logos y colores que usan los torneos oficiales.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_ORGANIZATIONS_NEW}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            aria-label="Crear organizador"
            title="Crear organizador"
          >
            <FiPlus className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {organizations.length === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavia no hay organizadores ni borradores cargados.
        </div>
      ) : (
        <div className="p-3 sm:p-5">
          <div className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
            <div className="divide-y divide-white/8 md:hidden">
              {organizations.map((item) => (
                <article key={item.id} className="p-3 text-sm text-violet-50 sm:p-4">
                  <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-violet-100/50">
                      {getOrganizationDateLabel(item)}
                    </p>
                    <p className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-violet-100/45">
                      {getOrganizationReferenceCount(item.referenceCounts)} usos
                    </p>
                  </div>

                  <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
                    <OrganizationThumbnail item={item} />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                        {item.name}
                      </h3>
                      <div className="mt-1">
                        <OrganizationColorSwatch
                          primaryColor={item.primaryColor}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <OrganizationStatusBadge item={item} />
                    <div className="flex gap-2">
                      <Link
                        to={ROUTES.DASHBOARD_ORGANIZATIONS_EDIT(item.id)}
                        className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                        aria-label="Editar organizador"
                        title="Editar organizador"
                      >
                        <FiEdit2 className="size-4" aria-hidden="true" />
                      </Link>
                      <DeleteOrganizationButton
                        item={item}
                        isDeleting={deleteMutation.isPending}
                        onDelete={handleDeleteOrganization}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden w-full border-collapse text-left md:table">
              <thead className="bg-white/2.5 text-xs uppercase tracking-[0.16em] text-violet-100/60">
                <tr>
                  <th className="px-5 py-4">Organizador</th>
                  <th className="px-5 py-4">Color</th>
                  <th className="px-5 py-4">Uso</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/4"
                  >
                    <td className="max-w-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <OrganizationThumbnail item={item} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {item.name}
                          </p>
                          <p className="truncate text-xs text-violet-100/55">
                            {getOrganizationDateLabel(item)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <OrganizationColorSwatch
                        primaryColor={item.primaryColor}
                      />
                    </td>
                    <td className="px-5 py-4 text-violet-100/70">
                      {getOrganizationReferenceCount(item.referenceCounts)}
                    </td>
                    <td className="px-5 py-4">
                      <OrganizationStatusBadge item={item} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={ROUTES.DASHBOARD_ORGANIZATIONS_EDIT(item.id)}
                          className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                          aria-label="Editar organizador"
                          title="Editar organizador"
                        >
                          <FiEdit2 className="size-4" aria-hidden="true" />
                        </Link>
                        <DeleteOrganizationButton
                          item={item}
                          isDeleting={deleteMutation.isPending}
                          onDelete={handleDeleteOrganization}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOrganizationsList;
