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
import { FiArrowLeft, FiSave, FiTrash2, FiUpload } from "react-icons/fi";

import {
  fetchDashboardStaffById,
  publishDashboardStaff,
  publishDashboardStaffById,
  saveDashboardStaffDraft,
} from "../../../data/dashboardStaff";
import { getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import {
  DASHBOARD_STAFF_IMAGE_ACCEPTED_EXTENSIONS,
  type DashboardStaffInput,
  type DashboardStaffItem,
  type DashboardStaffMutationInput,
} from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { formatDate } from "../../utils/date.utils";
import { Field } from "./DashboardPlayersFields";
import {
  buildDashboardStaffDraftInput,
  buildDashboardStaffMutationInput,
  type DashboardStaffErrors,
  getDashboardStaffRoleLabel,
  readDashboardStaffImageDimensions,
  validateDashboardStaffImageDimensions,
  validateDashboardStaffImageFile,
  validateDashboardStaffInput,
} from "./dashboardStaff.utils";

const createInitialValues = (): DashboardStaffInput => ({
  name: "",
  lastName: "",
  role: "",
  birthDate: "",
});

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

const dirtyFieldLabels = {
  name: "Nombre",
  lastName: "Apellido",
  role: "Rol",
  birthDate: "Nacimiento",
  photo: "Foto",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;

type SavedStaffSnapshot = {
  valuesJson: string;
};

const serializeValues = (values: DashboardStaffInput): string =>
  JSON.stringify(values);

const createSavedSnapshot = (
  values: DashboardStaffInput
): SavedStaffSnapshot => ({
  valuesJson: serializeValues(values),
});

const getValuesFromStaff = (staffMember: DashboardStaffItem): DashboardStaffInput => ({
  name: staffMember.name,
  lastName: staffMember.lastName,
  role: staffMember.role ?? "",
  birthDate: staffMember.birthDate ?? "",
});

const DashboardStaffForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialValues] = useState(createInitialValues);
  const [values, setValues] = useState<DashboardStaffInput>(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedStaffSnapshot>(
    createSavedSnapshot(initialValues)
  );
  const [errors, setErrors] = useState<DashboardStaffErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [selectedPhotoPreviewUrl, setSelectedPhotoPreviewUrl] = useState<
    string | null
  >(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const staffQuery = useQuery({
    queryKey: queryKeys.dashboard.staff.byId(id ?? "new"),
    enabled: isEditing,
    queryFn: async () => {
      try {
        return await fetchDashboardStaffById(id ?? "");
      } catch (error) {
        reportError(error, {
          page: "DashboardStaffForm",
          action: "load_staff",
          id,
        });
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!staffQuery.data) {
      return;
    }

    const nextValues = getValuesFromStaff(staffQuery.data);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setErrors({});
    setStatus(null);
    setSelectedPhotoFile(null);
    setPhotoError(null);
    setRemovePhoto(false);
  }, [staffQuery.data]);

  useEffect(() => {
    if (!selectedPhotoFile) {
      setSelectedPhotoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedPhotoFile);
    setSelectedPhotoPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedPhotoFile]);

  const applySavedStaff = (savedStaff: DashboardStaffItem) => {
    const nextValues = getValuesFromStaff(savedStaff);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setSelectedPhotoFile(null);
    setRemovePhoto(false);
    setPhotoError(null);
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (input: ReturnType<typeof buildDashboardStaffDraftInput>) =>
      saveDashboardStaffDraft(
        {
          ...input,
          photoImage: selectedPhotoFile,
          removePhoto,
        },
        id
      ),
    onSuccess: async (savedStaff) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.staff.all,
      });
      queryClient.setQueryData(
        queryKeys.dashboard.staff.byId(savedStaff.id),
        savedStaff
      );
      applySavedStaff(savedStaff);

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_STAFF_EDIT(savedStaff.id), {
          replace: true,
        });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardStaffMutationInput) =>
      isEditing && id
        ? publishDashboardStaffById(id, {
            ...input,
            photoImage: selectedPhotoFile,
            removePhoto,
          })
        : publishDashboardStaff({
            ...input,
            photoImage: selectedPhotoFile,
            removePhoto,
          }),
    onSuccess: async (savedStaff) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.staff.all,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
      ]);
      queryClient.setQueryData(
        queryKeys.dashboard.staff.byId(savedStaff.id),
        savedStaff
      );
      navigate(ROUTES.DASHBOARD_PLAYERS);
    },
  });

  const currentValuesJson = useMemo(() => serializeValues(values), [values]);
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    const savedValues = JSON.parse(savedSnapshot.valuesJson) as DashboardStaffInput;
    const nextDirtyFields = (
      Object.keys(dirtyFieldLabels) as DirtyFieldKey[]
    ).filter((field) => {
      if (field === "photo") {
        return Boolean(selectedPhotoFile) || removePhoto;
      }

      return values[field] !== savedValues[field];
    });

    return currentValuesJson === savedSnapshot.valuesJson &&
      !selectedPhotoFile &&
      !removePhoto
      ? []
      : nextDirtyFields;
  }, [
    currentValuesJson,
    removePhoto,
    savedSnapshot.valuesJson,
    selectedPhotoFile,
    values,
  ]);
  const dirtyLabels = dirtyFields.map((field) => dirtyFieldLabels[field]);
  const isDirty = (field: DirtyFieldKey): boolean =>
    dirtyFields.includes(field);
  const isSaving = saveDraftMutation.isPending || publishMutation.isPending;

  if (staffQuery.isLoading) {
    return <Loader />;
  }

  if (staffQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar el integrante"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => void staffQuery.refetch()}
      />
    );
  }

  const existingPhotoUrl = removePhoto ? null : staffQuery.data?.imageUrl;
  const photoPreviewUrl = selectedPhotoPreviewUrl ?? existingPhotoUrl ?? null;
  const photoPreviewSrc = photoPreviewUrl
    ? getImageUrl(photoPreviewUrl, {
        width: 640,
        height: 800,
        fit: "crop",
        quality: 78,
        autoFormat: true,
      })
    : "";
  const displayName =
    [values.name.trim(), values.lastName.trim()].filter(Boolean).join(" ") ||
    "Integrante";

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

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setStatus(null);

    if (!file) {
      return;
    }

    const fileError = validateDashboardStaffImageFile(file);

    if (fileError) {
      setPhotoError(fileError);
      setSelectedPhotoFile(null);
      return;
    }

    try {
      const dimensions = await readDashboardStaffImageDimensions(file);
      const dimensionsError =
        validateDashboardStaffImageDimensions(dimensions);

      if (dimensionsError) {
        setPhotoError(dimensionsError);
        setSelectedPhotoFile(null);
        return;
      }

      setSelectedPhotoFile(file);
      setRemovePhoto(false);
      setPhotoError(null);
    } catch (error) {
      reportError(error, {
        page: "DashboardStaffForm",
        action: "read_staff_photo",
      });
      setPhotoError("No pudimos leer la foto seleccionada.");
      setSelectedPhotoFile(null);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoPreviewSrc) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: "Quitar foto",
      text: "La ficha del plantel va a quedar sin foto al guardar.",
      confirmText: "Quitar foto",
      icon: "warning",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    setSelectedPhotoFile(null);
    setRemovePhoto(true);
    setPhotoError(null);
  };

  const handleSaveDraft = async () => {
    setStatus(null);
    setErrors({});

    if (photoError) {
      return;
    }

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(buildDashboardStaffDraftInput(values)),
        {
          loading: selectedPhotoFile
            ? "Subiendo foto y guardando borrador..."
            : "Guardando borrador en Sanity...",
          success: "Borrador guardado correctamente.",
          error: "No pudimos guardar el borrador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardStaffForm",
        action: "save_staff_draft",
      });
      setStatus("No pudimos guardar el borrador. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: DashboardStaffInput = {
      name: values.name.trim(),
      lastName: values.lastName.trim(),
      role: values.role.trim(),
      birthDate: values.birthDate.trim(),
    };
    const nextErrors = validateDashboardStaffInput(normalizedValues);
    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0 || photoError) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: isEditing ? "Publicar cambios" : "Publicar integrante",
      text: isEditing
        ? "El borrador se va a publicar en Sanity y actualizara la ficha visible en el sitio."
        : "La ficha se va a publicar en Sanity y quedara visible en el sitio.",
      confirmText: isEditing ? "Publicar cambios" : "Publicar",
      icon: isEditing ? "question" : "info",
    });

    if (!confirmed) {
      return;
    }

    try {
      await toast.promise(
        publishMutation.mutateAsync(
          buildDashboardStaffMutationInput(normalizedValues)
        ),
        {
          loading: selectedPhotoFile
            ? "Subiendo foto y publicando en Sanity..."
            : isEditing
              ? "Publicando cambios en Sanity..."
              : "Publicando integrante en Sanity...",
          success: isEditing
            ? "Cambios publicados correctamente."
            : "Integrante publicado correctamente.",
          error: "No pudimos publicar el integrante.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardStaffForm",
        action: isEditing ? "publish_staff_changes" : "publish_staff",
      });
      setStatus("No pudimos publicar el integrante. Intenta de nuevo.");
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Plantel
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              {isEditing ? "Editar integrante" : "Nuevo integrante"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Carga la ficha del cuerpo tecnico y publicala en el sitio.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_PLAYERS}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/10 px-4 py-3 text-sm text-white transition hover:border-violet-200/35 hover:bg-white/4.5"
          >
            <FiArrowLeft className="size-4" aria-hidden="true" />
            Volver
          </Link>
        </div>
      </header>

      <div className="grid gap-4 p-3 sm:gap-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          className="space-y-4 rounded-sm border border-white/10 bg-[#16161a] p-3 sm:space-y-5 sm:p-6"
          onSubmit={handleSubmit}
          noValidate
        >
          {dirtyLabels.length > 0 && (
            <div className="rounded-sm border border-amber-200/20 bg-amber-200/6 p-3 text-sm text-amber-50">
              <p className="font-semibold">Cambios sin guardar</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-50/75">
                Campos editados: {dirtyLabels.join(", ")}.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <Field
              id="dashboard-staff-name"
              name="name"
              label="Nombre"
              value={values.name}
              error={errors.name}
              dirty={isDirty("name")}
              onChange={handleChange}
            />
            <Field
              id="dashboard-staff-last-name"
              name="lastName"
              label="Apellido"
              value={values.lastName}
              error={errors.lastName}
              dirty={isDirty("lastName")}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <Field
              id="dashboard-staff-role"
              name="role"
              label="Rol"
              value={values.role}
              error={errors.role}
              dirty={isDirty("role")}
              onChange={handleChange}
            />
            <Field
              id="dashboard-staff-birth-date"
              name="birthDate"
              type="date"
              label="Fecha de nacimiento"
              value={values.birthDate}
              error={errors.birthDate}
              dirty={isDirty("birthDate")}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-200/35 hover:bg-white/4.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-55"
              onClick={() => void handleSaveDraft()}
            >
              <FiSave className="size-4" aria-hidden="true" />
              {saveDraftMutation.isPending ? "Guardando..." : "Guardar borrador"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-5 py-3 text-sm font-semibold text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <FiSave className="size-4" aria-hidden="true" />
              {publishMutation.isPending
                ? "Publicando..."
                : isEditing
                  ? "Publicar cambios"
                  : "Publicar"}
            </button>
          </div>

          <div
            className="min-h-6 text-sm text-red-300"
            aria-live="polite"
            role={status ? "alert" : undefined}
          >
            {status}
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
                  Foto
                </h3>
                {isDirty("photo") && (
                  <span className="mt-2 inline-flex rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                    Editado
                  </span>
                )}
              </div>
              <span className="rounded-[3px] border border-violet-300/15 bg-violet-300/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-100/70">
                4:5
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-[3px] border border-white/10 bg-black/25">
              {photoPreviewSrc ? (
                <img
                  src={photoPreviewSrc}
                  alt={`Foto de ${displayName}`}
                  className="aspect-[4/5] w-full object-cover object-top"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#0f0f13] text-center text-xs font-black uppercase tracking-[0.2em] text-violet-100/45">
                  Sin foto
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <label
                htmlFor="dashboard-staff-photo"
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-950 transition hover:bg-white"
              >
                <FiUpload className="size-4" aria-hidden="true" />
                Subir
              </label>
              <input
                id="dashboard-staff-photo"
                type="file"
                accept={DASHBOARD_STAFF_IMAGE_ACCEPTED_EXTENSIONS}
                className="sr-only"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-white/10 text-white transition hover:border-violet-200/35 hover:bg-white/4.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!photoPreviewSrc}
                aria-label="Quitar foto"
                title="Quitar foto"
                onClick={() => void handleRemovePhoto()}
              >
                <FiTrash2 className="size-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-violet-100/55">
              JPG, PNG o WebP. Maximo 4 MB.
            </p>

            {photoError && (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {photoError}
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
                  Cuerpo tecnico
                </p>
                <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                  {displayName}
                </p>
              </div>
              <dl className="space-y-3 p-4 text-sm">
                <div>
                  <dt className="text-violet-100/45">Rol</dt>
                  <dd className="mt-1 text-white">
                    {getDashboardStaffRoleLabel(values.role)}
                  </dd>
                </div>
                <div>
                  <dt className="text-violet-100/45">Nacimiento</dt>
                  <dd className="mt-1 text-white">
                    {values.birthDate ? formatDate(values.birthDate) : "Sin fecha"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardStaffForm;
