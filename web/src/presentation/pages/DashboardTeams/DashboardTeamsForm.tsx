import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiTrash2, FiUpload } from "react-icons/fi";

import {
  publishDashboardTeam,
  publishDashboardTeamById,
  saveDashboardTeamDraft,
} from "../../../data/dashboardTeams";
import { getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import {
  DASHBOARD_TEAM_IMAGE_ACCEPTED_EXTENSIONS,
  type DashboardTeamInput,
  type DashboardTeamItem,
  type DashboardTeamMutationInput,
} from "../../../types/dashboard";
import { confirmDashboardAction } from "../../dashboard/DashboardConfirmDialog";
import DashboardErrorState from "../../dashboard/DashboardErrorState";
import DashboardFormActions from "../../dashboard/DashboardFormActions";
import DashboardLoadingState from "../../dashboard/DashboardLoadingState";
import DashboardUnsavedChangesNotice from "../../dashboard/DashboardUnsavedChangesNotice";
import { useUnsavedChangesGuard } from "../../dashboard/useUnsavedChangesGuard";
import { Field } from "./DashboardTeamsFields";
import {
  buildDashboardTeamDraftInput,
  buildDashboardTeamMutationInput,
  getTeamReferenceCount,
  getTeamUsageLabel,
  readDashboardTeamImageDimensions,
  validateDashboardTeamImageDimensions,
  validateDashboardTeamImageFile,
  validateDashboardTeamInput,
  type DashboardTeamErrors,
} from "./dashboardTeams.utils";
import {
  cacheDashboardTeam,
  dashboardTeamDetailQueryOptions,
  invalidateDashboardTeamsList,
  invalidateDashboardTeamPublishDependencies,
} from "./dashboardTeams.queries";

const createInitialValues = (): DashboardTeamInput => ({
  name: "",
  isMain: false,
});

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

const dirtyFieldLabels = {
  name: "Nombre",
  isMain: "Tipo",
  logo: "Escudo",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;

type SavedTeamSnapshot = {
  valuesJson: string;
};

const serializeValues = (values: DashboardTeamInput): string =>
  JSON.stringify(values);

const createSavedSnapshot = (values: DashboardTeamInput): SavedTeamSnapshot => ({
  valuesJson: serializeValues(values),
});

const getValuesFromTeam = (team: DashboardTeamItem): DashboardTeamInput => ({
  name: team.name === "Club sin nombre" ? "" : team.name,
  isMain: team.isMain,
});

const DashboardTeamsForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialValues] = useState(createInitialValues);
  const [values, setValues] = useState<DashboardTeamInput>(initialValues);
  const [savedSnapshot, setSavedSnapshot] =
    useState<SavedTeamSnapshot>(createSavedSnapshot(initialValues));
  const [errors, setErrors] = useState<DashboardTeamErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedLogoPreviewUrl, setSelectedLogoPreviewUrl] = useState<
    string | null
  >(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const teamQuery = useQuery({
    ...dashboardTeamDetailQueryOptions(id ?? "new"),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!teamQuery.data) {
      return;
    }

    const nextValues = getValuesFromTeam(teamQuery.data);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setErrors({});
    setStatus(null);
    setSelectedLogoFile(null);
    setLogoError(null);
    setRemoveLogo(false);
  }, [teamQuery.data]);

  useEffect(() => {
    if (!selectedLogoFile) {
      setSelectedLogoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedLogoFile);
    setSelectedLogoPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedLogoFile]);

  const applySavedTeam = (savedTeam: DashboardTeamItem) => {
    const nextValues = getValuesFromTeam(savedTeam);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setSelectedLogoFile(null);
    setRemoveLogo(false);
    setLogoError(null);
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (input: ReturnType<typeof buildDashboardTeamDraftInput>) =>
      saveDashboardTeamDraft(
        {
          ...input,
          logoImage: selectedLogoFile,
          removeLogo,
        },
        id
      ),
    onSuccess: async (savedTeam) => {
      await invalidateDashboardTeamsList(queryClient);
      cacheDashboardTeam(queryClient, savedTeam);
      applySavedTeam(savedTeam);

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_TEAMS_EDIT(savedTeam.id), {
          replace: true,
        });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardTeamMutationInput) =>
      isEditing && id
        ? publishDashboardTeamById(id, {
            ...input,
            logoImage: selectedLogoFile,
            removeLogo,
          })
        : publishDashboardTeam({
            ...input,
            logoImage: selectedLogoFile,
            removeLogo,
          }),
    onSuccess: async (savedTeam) => {
      await invalidateDashboardTeamPublishDependencies(queryClient);
      cacheDashboardTeam(queryClient, savedTeam);
      navigate(ROUTES.DASHBOARD_TEAMS);
    },
  });

  const currentValuesJson = useMemo(() => serializeValues(values), [values]);
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    const savedValues = JSON.parse(savedSnapshot.valuesJson) as DashboardTeamInput;
    const nextDirtyFields = (
      Object.keys(dirtyFieldLabels) as DirtyFieldKey[]
    ).filter((field) => {
      if (field === "logo") {
        return Boolean(selectedLogoFile) || removeLogo;
      }

      return values[field] !== savedValues[field];
    });

    return currentValuesJson === savedSnapshot.valuesJson &&
      !selectedLogoFile &&
      !removeLogo
      ? []
      : nextDirtyFields;
  }, [
    currentValuesJson,
    removeLogo,
    savedSnapshot.valuesJson,
    selectedLogoFile,
    values,
  ]);
  const dirtyLabels = dirtyFields.map((field) => dirtyFieldLabels[field]);
  const isDirty = (field: DirtyFieldKey): boolean => dirtyFields.includes(field);
  const isSaving = saveDraftMutation.isPending || publishMutation.isPending;
  const hasUnsavedChanges = dirtyLabels.length > 0 && !isSaving;

  useUnsavedChangesGuard({ when: hasUnsavedChanges });

  if (teamQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  if (teamQuery.isError) {
    return (
      <DashboardErrorState
        title="No pudimos cargar el club"
        message="No se pudo cargar la pagina. Reintenta en unos segundos."
        onRetry={() => void teamQuery.refetch()}
      />
    );
  }

  const existingLogoUrl = removeLogo ? null : teamQuery.data?.logoUrl;
  const logoPreviewUrl = selectedLogoPreviewUrl ?? existingLogoUrl ?? null;
  const logoPreviewSrc = logoPreviewUrl
    ? getImageUrl(logoPreviewUrl, {
        width: 640,
        height: 640,
        fit: "max",
        quality: 78,
        autoFormat: true,
      })
    : "";
  const displayName = values.name.trim() || "Club";
  const referenceCount = teamQuery.data
    ? getTeamReferenceCount(teamQuery.data.referenceCounts)
    : 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
    setStatus(null);
  };

  const handleMainChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValues((currentValues) => ({
      ...currentValues,
      isMain: event.target.checked,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      isMain: undefined,
    }));
    setStatus(null);
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setStatus(null);

    if (!file) {
      return;
    }

    const fileError = validateDashboardTeamImageFile(file);

    if (fileError) {
      setLogoError(fileError);
      setSelectedLogoFile(null);
      return;
    }

    try {
      const dimensions = await readDashboardTeamImageDimensions(file);
      const dimensionsError = validateDashboardTeamImageDimensions(dimensions);

      if (dimensionsError) {
        setLogoError(dimensionsError);
        setSelectedLogoFile(null);
        return;
      }

      setSelectedLogoFile(file);
      setRemoveLogo(false);
      setLogoError(null);
    } catch (error) {
      reportError(error, {
        page: "DashboardTeamsForm",
        action: "read_team_logo",
      });
      setLogoError("No pudimos leer el escudo seleccionado.");
      setSelectedLogoFile(null);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoPreviewSrc) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: "Quitar escudo",
      text: "El club va a quedar sin escudo al guardar. Para publicar, vas a tener que cargar uno nuevo.",
      confirmText: "Quitar escudo",
      icon: "warning",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    setSelectedLogoFile(null);
    setRemoveLogo(true);
    setLogoError(null);
  };

  const handleSaveDraft = async () => {
    setStatus(null);
    setErrors({});

    if (logoError) {
      setStatus("No se pudo guardar el club porque el escudo tiene errores.");
      return;
    }

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(buildDashboardTeamDraftInput(values)),
        {
          loading: selectedLogoFile
            ? "Subiendo escudo y guardando borrador..."
            : "Guardando borrador en Sanity...",
          success: "Borrador guardado correctamente.",
          error: "No pudimos guardar el borrador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTeamsForm",
        action: "save_team_draft",
      });
      setStatus("No pudimos guardar el borrador. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: DashboardTeamInput = {
      name: values.name.trim(),
      isMain: values.isMain,
    };
    const nextErrors = validateDashboardTeamInput(normalizedValues);
    const nextLogoError =
      logoPreviewSrc || selectedLogoFile
        ? logoError
        : "Carga el escudo del club antes de publicar.";
    setErrors(nextErrors);
    setLogoError(nextLogoError);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0 || nextLogoError) {
      setStatus(
        nextLogoError
          ? "No se pudo guardar el club porque el escudo tiene errores."
          : "No se pudo guardar el club porque faltan datos obligatorios."
      );
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: isEditing ? "Publicar cambios" : "Publicar club",
      text: isEditing
        ? "El borrador se va a publicar en Sanity y actualizara partidos, torneos y tablas vinculadas."
        : "El club se va a publicar en Sanity y podra usarse en partidos, torneos y tablas.",
      confirmText: isEditing ? "Publicar cambios" : "Publicar",
      icon: isEditing ? "question" : "info",
    });

    if (!confirmed) {
      return;
    }

    try {
      await toast.promise(
        publishMutation.mutateAsync(buildDashboardTeamMutationInput(normalizedValues)),
        {
          loading: selectedLogoFile
            ? "Subiendo escudo y publicando en Sanity..."
            : isEditing
              ? "Publicando cambios en Sanity..."
              : "Publicando club en Sanity...",
          success: isEditing
            ? "Cambios publicados correctamente."
            : "Club publicado correctamente.",
          error: "No pudimos publicar el club.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTeamsForm",
        action: isEditing ? "publish_team_changes" : "publish_team",
      });
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos publicar el club. Intenta de nuevo."
      );
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Clubes
            </p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {isEditing ? "Editar club" : "Nuevo club"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Gestiona rivales, escudos y el club principal de Sanity.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_TEAMS}
            className="order-first inline-flex min-h-10 w-fit items-center justify-center gap-2 self-start rounded-[3px] border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-violet-200/35 hover:bg-white/4.5 sm:order-none sm:min-h-11 sm:self-auto sm:px-4 sm:py-3 sm:text-sm"
          >
            <FiArrowLeft className="size-4" aria-hidden="true" />
            Volver a la lista
          </Link>
        </div>
      </header>

      <div className="grid gap-4 p-3 sm:gap-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          className="space-y-4 rounded-sm border border-white/10 bg-[#16161a] p-3 sm:space-y-5 sm:p-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <DashboardUnsavedChangesNotice labels={dirtyLabels} />

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <Field
              id="dashboard-team-name"
              name="name"
              label="Nombre"
              value={values.name}
              error={errors.name}
              dirty={isDirty("name")}
              onChange={handleChange}
            />

            <label
              htmlFor="dashboard-team-is-main"
              className="block min-w-0 rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-3.5"
            >
              <span className="flex items-start gap-3">
                <input
                  id="dashboard-team-is-main"
                  type="checkbox"
                  checked={values.isMain}
                  onChange={handleMainChange}
                  className="mt-1 size-4 rounded border-white/20 bg-black text-violet-500 focus:ring-violet-500/40"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium text-violet-100">
                    Club principal
                    {isDirty("isMain") && (
                      <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                        Editado
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-violet-100/55">
                    Marca a Mentira FC. Los rivales deben quedar sin activar.
                  </span>
                </span>
              </span>
            </label>
          </div>

          <DashboardFormActions
            isSaving={isSaving}
            isDraftSaving={saveDraftMutation.isPending}
            isPublishing={publishMutation.isPending}
            onSaveDraft={handleSaveDraft}
            submitLabel={isEditing ? "Publicar cambios" : "Publicar"}
            cancelTo={ROUTES.DASHBOARD_TEAMS}
            error={status}
          />
        </form>

        <aside className="space-y-4">
          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
                  Escudo
                </h3>
                {isDirty("logo") && (
                  <span className="mt-2 inline-flex rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                    Editado
                  </span>
                )}
              </div>
              <span className="rounded-[3px] border border-violet-300/15 bg-violet-300/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-100/70">
                1:1
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-[3px] border border-white/10 bg-black/25">
              {logoPreviewSrc ? (
                <img
                  src={logoPreviewSrc}
                  alt={`Escudo de ${displayName}`}
                  className="aspect-square w-full object-contain p-5"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-[#0f0f13] text-center text-xs font-black uppercase tracking-[0.2em] text-violet-100/45">
                  Sin escudo
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <label
                htmlFor="dashboard-team-logo"
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-950 transition hover:bg-white"
              >
                <FiUpload className="size-4" aria-hidden="true" />
                Subir
              </label>
              <input
                id="dashboard-team-logo"
                type="file"
                accept={DASHBOARD_TEAM_IMAGE_ACCEPTED_EXTENSIONS}
                className="sr-only"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-white/10 text-white transition hover:border-violet-200/35 hover:bg-white/4.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!logoPreviewSrc}
                aria-label="Quitar escudo"
                title="Quitar escudo"
                onClick={() => void handleRemoveLogo()}
              >
                <FiTrash2 className="size-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-violet-100/55">
              JPG, PNG o WebP. Maximo 4 MB.
            </p>

            {logoError && (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {logoError}
              </p>
            )}
          </section>

          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Resumen
            </h3>
            <div className="mt-4 overflow-hidden rounded-[3px] border border-white/10 bg-[#0f0f13]">
              <div className="border-b border-white/8 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-100/45">
                  {values.isMain ? "Club principal" : "Rival"}
                </p>
                <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                  {displayName}
                </p>
              </div>
              <dl className="space-y-3 p-4 text-sm">
                <div>
                  <dt className="text-violet-100/45">Usos vinculados</dt>
                  <dd className="mt-1 text-white">
                    {teamQuery.data
                      ? getTeamUsageLabel(teamQuery.data.referenceCounts)
                      : referenceCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-violet-100/45">Publicacion</dt>
                  <dd className="mt-1 text-white">
                    {teamQuery.data?.status === "draft" ? "Borrador" : "Publicado"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Publicacion
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-violet-100/60">
              Guardar borrador permite dejar datos incompletos. Publicar valida
              nombre y escudo para que el club pueda usarse en partidos.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardTeamsForm;
