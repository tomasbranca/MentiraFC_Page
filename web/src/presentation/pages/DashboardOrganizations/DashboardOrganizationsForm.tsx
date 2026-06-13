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
  publishDashboardOrganization,
  publishDashboardOrganizationById,
  saveDashboardOrganizationDraft,
} from "../../../data/dashboardOrganizations";
import { getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import {
  DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_EXTENSIONS,
  type DashboardOrganizationInput,
  type DashboardOrganizationItem,
  type DashboardOrganizationMutationInput,
} from "../../../types/dashboard";
import { confirmDashboardAction } from "../../dashboard/DashboardConfirmDialog";
import DashboardErrorState from "../../dashboard/DashboardErrorState";
import DashboardFormActions from "../../dashboard/DashboardFormActions";
import DashboardLoadingState from "../../dashboard/DashboardLoadingState";
import DashboardUnsavedChangesNotice from "../../dashboard/DashboardUnsavedChangesNotice";
import { useUnsavedChangesGuard } from "../../dashboard/useUnsavedChangesGuard";
import { Field } from "./DashboardOrganizationsFields";
import {
  DEFAULT_ORGANIZATION_COLOR,
  buildDashboardOrganizationDraftInput,
  buildDashboardOrganizationMutationInput,
  getOrganizationColorLabel,
  getOrganizationReferenceCount,
  readDashboardOrganizationImageDimensions,
  validateDashboardOrganizationImageDimensions,
  validateDashboardOrganizationImageFile,
  validateDashboardOrganizationInput,
  type DashboardOrganizationErrors,
} from "./dashboardOrganizations.utils";
import {
  cacheDashboardOrganization,
  dashboardOrganizationDetailQueryOptions,
  invalidateDashboardOrganizationsList,
  invalidateDashboardOrganizationPublishDependencies,
} from "./dashboardOrganizations.queries";

const createInitialValues = (): DashboardOrganizationInput => ({
  name: "",
  primaryColor: "",
});

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

const dirtyFieldLabels = {
  name: "Nombre",
  primaryColor: "Color",
  logo: "Logo",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;

type SavedOrganizationSnapshot = {
  valuesJson: string;
};

const serializeValues = (values: DashboardOrganizationInput): string =>
  JSON.stringify(values);

const createSavedSnapshot = (
  values: DashboardOrganizationInput
): SavedOrganizationSnapshot => ({
  valuesJson: serializeValues(values),
});

const getValuesFromOrganization = (
  organization: DashboardOrganizationItem
): DashboardOrganizationInput => ({
  name:
    organization.name === "Organizador sin nombre" ? "" : organization.name,
  primaryColor: organization.primaryColor ?? "",
});

const DashboardOrganizationsForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialValues] = useState(createInitialValues);
  const [values, setValues] =
    useState<DashboardOrganizationInput>(initialValues);
  const [savedSnapshot, setSavedSnapshot] =
    useState<SavedOrganizationSnapshot>(createSavedSnapshot(initialValues));
  const [errors, setErrors] = useState<DashboardOrganizationErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedLogoPreviewUrl, setSelectedLogoPreviewUrl] = useState<
    string | null
  >(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const organizationQuery = useQuery({
    ...dashboardOrganizationDetailQueryOptions(id ?? "new"),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!organizationQuery.data) {
      return;
    }

    const nextValues = getValuesFromOrganization(organizationQuery.data);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setErrors({});
    setStatus(null);
    setSelectedLogoFile(null);
    setLogoError(null);
    setRemoveLogo(false);
  }, [organizationQuery.data]);

  useEffect(() => {
    if (!selectedLogoFile) {
      setSelectedLogoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedLogoFile);
    setSelectedLogoPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedLogoFile]);

  const applySavedOrganization = (
    savedOrganization: DashboardOrganizationItem
  ) => {
    const nextValues = getValuesFromOrganization(savedOrganization);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setSelectedLogoFile(null);
    setRemoveLogo(false);
    setLogoError(null);
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (
      input: ReturnType<typeof buildDashboardOrganizationDraftInput>
    ) =>
      saveDashboardOrganizationDraft(
        {
          ...input,
          logoImage: selectedLogoFile,
          removeLogo,
        },
        id
      ),
    onSuccess: async (savedOrganization) => {
      await invalidateDashboardOrganizationsList(queryClient);
      cacheDashboardOrganization(queryClient, savedOrganization);
      applySavedOrganization(savedOrganization);

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_ORGANIZATIONS_EDIT(savedOrganization.id), {
          replace: true,
        });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardOrganizationMutationInput) =>
      isEditing && id
        ? publishDashboardOrganizationById(id, {
            ...input,
            logoImage: selectedLogoFile,
            removeLogo,
          })
        : publishDashboardOrganization({
            ...input,
            logoImage: selectedLogoFile,
            removeLogo,
          }),
    onSuccess: async (savedOrganization) => {
      await invalidateDashboardOrganizationPublishDependencies(queryClient);
      cacheDashboardOrganization(queryClient, savedOrganization);
      navigate(ROUTES.DASHBOARD_ORGANIZATIONS);
    },
  });

  const currentValuesJson = useMemo(() => serializeValues(values), [values]);
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    const savedValues = JSON.parse(
      savedSnapshot.valuesJson
    ) as DashboardOrganizationInput;
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
  const isDirty = (field: DirtyFieldKey): boolean =>
    dirtyFields.includes(field);
  const isSaving = saveDraftMutation.isPending || publishMutation.isPending;
  const hasUnsavedChanges = dirtyLabels.length > 0 && !isSaving;

  useUnsavedChangesGuard({ when: hasUnsavedChanges });

  if (organizationQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  if (organizationQuery.isError) {
    return (
      <DashboardErrorState
        title="No pudimos cargar el organizador"
        message="No se pudo cargar la pagina. Reintenta en unos segundos."
        onRetry={() => void organizationQuery.refetch()}
      />
    );
  }

  const existingLogoUrl = removeLogo ? null : organizationQuery.data?.logoUrl;
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
  const displayName = values.name.trim() || "Organizador";
  const colorPreview = values.primaryColor || DEFAULT_ORGANIZATION_COLOR;
  const referenceCount = organizationQuery.data
    ? getOrganizationReferenceCount(organizationQuery.data.referenceCounts)
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

  const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValues((currentValues) => ({
      ...currentValues,
      primaryColor: event.target.value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      primaryColor: undefined,
    }));
    setStatus(null);
  };

  const handleClearColor = () => {
    setValues((currentValues) => ({
      ...currentValues,
      primaryColor: "",
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      primaryColor: undefined,
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

    const fileError = validateDashboardOrganizationImageFile(file);

    if (fileError) {
      setLogoError(fileError);
      setSelectedLogoFile(null);
      return;
    }

    try {
      const dimensions = await readDashboardOrganizationImageDimensions(file);
      const dimensionsError =
        validateDashboardOrganizationImageDimensions(dimensions);

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
        page: "DashboardOrganizationsForm",
        action: "read_organization_logo",
      });
      setLogoError("No pudimos leer el logo seleccionado.");
      setSelectedLogoFile(null);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoPreviewSrc) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: "Quitar logo",
      text: "El organizador va a quedar sin logo al guardar.",
      confirmText: "Quitar logo",
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
      setStatus("No se pudo guardar el organizador porque el logo tiene errores.");
      return;
    }

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(
          buildDashboardOrganizationDraftInput(values)
        ),
        {
          loading: selectedLogoFile
            ? "Subiendo logo y guardando borrador..."
            : "Guardando borrador en Sanity...",
          success: "Borrador guardado correctamente.",
          error: "No pudimos guardar el borrador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardOrganizationsForm",
        action: "save_organization_draft",
      });
      setStatus("No pudimos guardar el borrador. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: DashboardOrganizationInput = {
      name: values.name.trim(),
      primaryColor: values.primaryColor.trim().toLowerCase(),
    };
    const nextErrors = validateDashboardOrganizationInput(normalizedValues);
    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0 || logoError) {
      setStatus(
        logoError
          ? "No se pudo guardar el organizador porque el logo tiene errores."
          : "No se pudo guardar el organizador porque faltan datos obligatorios."
      );
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: isEditing ? "Publicar cambios" : "Publicar organizador",
      text: isEditing
        ? "El borrador se va a publicar en Sanity y actualizara los torneos vinculados."
        : "El organizador se va a publicar en Sanity y podra usarse en torneos.",
      confirmText: isEditing ? "Publicar cambios" : "Publicar",
      icon: isEditing ? "question" : "info",
    });

    if (!confirmed) {
      return;
    }

    try {
      await toast.promise(
        publishMutation.mutateAsync(
          buildDashboardOrganizationMutationInput(normalizedValues)
        ),
        {
          loading: selectedLogoFile
            ? "Subiendo logo y publicando en Sanity..."
            : isEditing
              ? "Publicando cambios en Sanity..."
              : "Publicando organizador en Sanity...",
          success: isEditing
            ? "Cambios publicados correctamente."
            : "Organizador publicado correctamente.",
          error: "No pudimos publicar el organizador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardOrganizationsForm",
        action: isEditing
          ? "publish_organization_changes"
          : "publish_organization",
      });
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos publicar el organizador. Intenta de nuevo."
      );
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Organizadores
            </p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {isEditing ? "Editar organizador" : "Nuevo organizador"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Gestiona la marca que despues seleccionan los torneos.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_ORGANIZATIONS}
            className="order-first inline-flex min-h-10 w-fit items-center justify-center gap-2 self-start rounded-[3px] border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-violet-200/35 hover:bg-white/4.5 sm:order-0 sm:min-h-11 sm:self-auto sm:px-4 sm:py-3 sm:text-sm"
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
              id="dashboard-organization-name"
              name="name"
              label="Nombre"
              value={values.name}
              error={errors.name}
              dirty={isDirty("name")}
              onChange={handleChange}
            />

            <div className="block min-w-0">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-100">
                <span>Color principal</span>
                {isDirty("primaryColor") && (
                  <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                    Editado
                  </span>
                )}
              </span>
              <div className="grid min-h-11 grid-cols-[3.5rem_minmax(0,1fr)_3rem] overflow-hidden rounded-[3px] border border-white/10 bg-[#0f0f13]">
                <input
                  id="dashboard-organization-primary-color"
                  name="primaryColor"
                  type="color"
                  value={colorPreview}
                  onChange={handleColorChange}
                  aria-invalid={Boolean(errors.primaryColor)}
                  aria-describedby={
                    errors.primaryColor
                      ? "dashboard-organization-primary-color-error"
                      : undefined
                  }
                  className="h-11 w-full cursor-pointer border-0 bg-transparent p-1"
                />
                <div className="flex min-w-0 items-center px-3 text-sm text-violet-100/70">
                  {getOrganizationColorLabel(values.primaryColor)}
                </div>
                <button
                  type="button"
                  className="inline-flex h-full items-center justify-center border-l border-white/10 text-violet-100/75 transition hover:bg-white/5 hover:text-white"
                  onClick={handleClearColor}
                  aria-label="Quitar color"
                  title="Quitar color"
                >
                  <FiTrash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              {errors.primaryColor && (
                <span
                  id="dashboard-organization-primary-color-error"
                  className="mt-2 block text-sm text-red-300"
                >
                  {errors.primaryColor}
                </span>
              )}
            </div>
          </div>

          <DashboardFormActions
            isSaving={isSaving}
            isDraftSaving={saveDraftMutation.isPending}
            isPublishing={publishMutation.isPending}
            onSaveDraft={handleSaveDraft}
            submitLabel={isEditing ? "Publicar cambios" : "Publicar"}
            cancelTo={ROUTES.DASHBOARD_ORGANIZATIONS}
            error={status}
          />
        </form>

        <aside className="space-y-4">
          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
                  Logo
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
                  alt={`Logo de ${displayName}`}
                  className="aspect-square w-full object-contain p-5"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-[#0f0f13] text-center text-xs font-black uppercase tracking-[0.2em] text-violet-100/45">
                  Sin logo
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <label
                htmlFor="dashboard-organization-logo"
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-950 transition hover:bg-white"
              >
                <FiUpload className="size-4" aria-hidden="true" />
                Subir
              </label>
              <input
                id="dashboard-organization-logo"
                type="file"
                accept={DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_EXTENSIONS}
                className="sr-only"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-white/10 text-white transition hover:border-violet-200/35 hover:bg-white/4.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!logoPreviewSrc}
                aria-label="Quitar logo"
                title="Quitar logo"
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
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="size-4 rounded-[3px] border border-white/20"
                    style={{
                      backgroundColor: values.primaryColor || "transparent",
                    }}
                    aria-hidden="true"
                  />
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-100/45">
                    {getOrganizationColorLabel(values.primaryColor)}
                  </p>
                </div>
                <p className="text-xl font-black uppercase leading-tight text-white">
                  {displayName}
                </p>
              </div>
              <dl className="space-y-3 p-4 text-sm">
                <div>
                  <dt className="text-violet-100/45">Usos vinculados</dt>
                  <dd className="mt-1 text-white">{referenceCount}</dd>
                </div>
                <div>
                  <dt className="text-violet-100/45">Publicacion</dt>
                  <dd className="mt-1 text-white">
                    {organizationQuery.data?.status === "draft"
                      ? "Borrador"
                      : "Publicado"}
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
              que el organizador quede disponible para torneos.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardOrganizationsForm;
