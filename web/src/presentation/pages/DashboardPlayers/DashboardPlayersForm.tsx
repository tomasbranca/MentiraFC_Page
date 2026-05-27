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
  publishDashboardPlayer,
  publishDashboardPlayerById,
  saveDashboardPlayerDraft,
} from "../../../data/dashboardPlayers";
import { getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import {
  DASHBOARD_PLAYER_IMAGE_ACCEPTED_EXTENSIONS,
  type DashboardPlayerFieldRatingsInput,
  type DashboardPlayerGoalkeeperRatingsInput,
  type DashboardPlayerInput,
  type DashboardPlayerItem,
  type DashboardPlayerMutationInput,
} from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { formatDate } from "../../utils/date.utils";
import { Field, SelectField } from "./DashboardPlayersFields";
import {
  cacheDashboardPlayer,
  dashboardPlayerDetailQueryOptions,
  invalidateDashboardPlayerPublishDependencies,
  invalidateDashboardPlayersList,
} from "./dashboardPlayers.queries";
import {
  FIELD_RATING_FIELDS,
  GOALKEEPER_RATING_FIELDS,
  PLAYER_DOMINANT_FOOT_OPTIONS,
  PLAYER_POSITION_OPTIONS,
  buildDashboardPlayerDraftInput,
  buildDashboardPlayerMutationInput,
  type DashboardPlayerErrors,
  getDashboardPlayerDominantFootLabel,
  getDashboardPlayerPositionLabel,
  readDashboardPlayerImageDimensions,
  validateDashboardPlayerImageDimensions,
  validateDashboardPlayerImageFile,
  validateDashboardPlayerInput,
  validateDashboardPlayerRatings,
} from "./dashboardPlayers.utils";

const createFieldRatings = (): DashboardPlayerFieldRatingsInput => ({
  speed: "",
  shooting: "",
  passing: "",
  dribbling: "",
  defense: "",
  physical: "",
});

const createGoalkeeperRatings = (): DashboardPlayerGoalkeeperRatingsInput => ({
  jumping: "",
  saving: "",
  kicking: "",
  reflexes: "",
  speed: "",
  positioning: "",
});

const createInitialValues = (): DashboardPlayerInput => ({
  name: "",
  lastName: "",
  number: "",
  position: "",
  dominantFoot: "",
  birthDate: "",
  fieldRatings: createFieldRatings(),
  goalkeeperRatings: createGoalkeeperRatings(),
});

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

const dirtyFieldLabels = {
  name: "Nombre",
  lastName: "Apellido",
  number: "Numero",
  position: "Posicion",
  dominantFoot: "Pie habil",
  birthDate: "Nacimiento",
  fieldRatings: "Valoraciones de campo",
  goalkeeperRatings: "Valoraciones de arquero",
  photo: "Foto",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;

type SavedPlayerSnapshot = {
  valuesJson: string;
};

const serializeValues = (values: DashboardPlayerInput): string =>
  JSON.stringify(values);

const createSavedSnapshot = (
  values: DashboardPlayerInput
): SavedPlayerSnapshot => ({
  valuesJson: serializeValues(values),
});

const getKnownPosition = (
  position?: string | null
): DashboardPlayerInput["position"] =>
  PLAYER_POSITION_OPTIONS.some((option) => option.value === position)
    ? (position as DashboardPlayerInput["position"])
    : "";

const getRatingInputValue = (value?: number | null): string =>
  typeof value === "number" ? String(value) : "";

const getValuesFromPlayer = (player: DashboardPlayerItem): DashboardPlayerInput => ({
  name: player.name,
  lastName: player.lastName,
  number: player.number == null ? "" : String(player.number),
  position: getKnownPosition(player.position),
  dominantFoot: player.dominantFoot ?? "",
  birthDate: player.birthDate ?? "",
  fieldRatings: {
    speed: getRatingInputValue(player.fieldRatings?.speed),
    shooting: getRatingInputValue(player.fieldRatings?.shooting),
    passing: getRatingInputValue(player.fieldRatings?.passing),
    dribbling: getRatingInputValue(player.fieldRatings?.dribbling),
    defense: getRatingInputValue(player.fieldRatings?.defense),
    physical: getRatingInputValue(player.fieldRatings?.physical),
  },
  goalkeeperRatings: {
    jumping: getRatingInputValue(player.goalkeeperRatings?.jumping),
    saving: getRatingInputValue(player.goalkeeperRatings?.saving),
    kicking: getRatingInputValue(player.goalkeeperRatings?.kicking),
    reflexes: getRatingInputValue(player.goalkeeperRatings?.reflexes),
    speed: getRatingInputValue(player.goalkeeperRatings?.speed),
    positioning: getRatingInputValue(player.goalkeeperRatings?.positioning),
  },
});

const DashboardPlayersForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialValues] = useState(createInitialValues);
  const [values, setValues] = useState<DashboardPlayerInput>(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedPlayerSnapshot>(
    createSavedSnapshot(initialValues)
  );
  const [errors, setErrors] = useState<DashboardPlayerErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [selectedPhotoPreviewUrl, setSelectedPhotoPreviewUrl] = useState<
    string | null
  >(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const playerQuery = useQuery({
    ...dashboardPlayerDetailQueryOptions(id ?? "new"),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!playerQuery.data) {
      return;
    }

    const nextValues = getValuesFromPlayer(playerQuery.data);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setErrors({});
    setStatus(null);
    setRatingError(null);
    setSelectedPhotoFile(null);
    setPhotoError(null);
    setRemovePhoto(false);
  }, [playerQuery.data]);

  useEffect(() => {
    if (!selectedPhotoFile) {
      setSelectedPhotoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedPhotoFile);
    setSelectedPhotoPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedPhotoFile]);

  const applySavedPlayer = (savedPlayer: DashboardPlayerItem) => {
    const nextValues = getValuesFromPlayer(savedPlayer);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setSelectedPhotoFile(null);
    setRemovePhoto(false);
    setPhotoError(null);
    setRatingError(null);
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (input: ReturnType<typeof buildDashboardPlayerDraftInput>) =>
      saveDashboardPlayerDraft(
        {
          ...input,
          photoImage: selectedPhotoFile,
          removePhoto,
        },
        id
      ),
    onSuccess: async (savedPlayer) => {
      await invalidateDashboardPlayersList(queryClient);
      cacheDashboardPlayer(queryClient, savedPlayer);
      applySavedPlayer(savedPlayer);

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_PLAYERS_EDIT(savedPlayer.id), {
          replace: true,
        });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardPlayerMutationInput) =>
      isEditing && id
        ? publishDashboardPlayerById(id, {
            ...input,
            photoImage: selectedPhotoFile,
            removePhoto,
          })
        : publishDashboardPlayer({
            ...input,
            photoImage: selectedPhotoFile,
            removePhoto,
          }),
    onSuccess: async (savedPlayer) => {
      await invalidateDashboardPlayerPublishDependencies(queryClient);
      cacheDashboardPlayer(queryClient, savedPlayer);
      navigate(ROUTES.DASHBOARD_PLAYERS);
    },
  });

  const currentValuesJson = useMemo(() => serializeValues(values), [values]);
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    const savedValues = JSON.parse(savedSnapshot.valuesJson) as DashboardPlayerInput;
    const nextDirtyFields = (
      Object.keys(dirtyFieldLabels) as DirtyFieldKey[]
    ).filter((field) => {
      if (field === "photo") {
        return Boolean(selectedPhotoFile) || removePhoto;
      }

      if (field === "fieldRatings" || field === "goalkeeperRatings") {
        return JSON.stringify(values[field]) !== JSON.stringify(savedValues[field]);
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

  if (playerQuery.isLoading) {
    return <DashboardContentLoader />;
  }

  if (playerQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar el integrante"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => void playerQuery.refetch()}
      />
    );
  }

  const existingPhotoUrl = removePhoto ? null : playerQuery.data?.imageUrl;
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

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
    setRatingError(null);
  };

  const handleRatingChange = (
    group: "fieldRatings" | "goalkeeperRatings",
    name: string,
    value: string
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [group]: {
        ...currentValues[group],
        [name]: value,
      },
    }));
    setStatus(null);
    setRatingError(null);
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setStatus(null);

    if (!file) {
      return;
    }

    const fileError = validateDashboardPlayerImageFile(file);

    if (fileError) {
      setPhotoError(fileError);
      setSelectedPhotoFile(null);
      return;
    }

    try {
      const dimensions = await readDashboardPlayerImageDimensions(file);
      const dimensionsError =
        validateDashboardPlayerImageDimensions(dimensions);

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
        page: "DashboardPlayersForm",
        action: "read_player_photo",
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

    const nextRatingError = validateDashboardPlayerRatings(values);
    setRatingError(nextRatingError);

    if (photoError || nextRatingError) {
      return;
    }

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(buildDashboardPlayerDraftInput(values)),
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
        page: "DashboardPlayersForm",
        action: "save_player_draft",
      });
      setStatus("No pudimos guardar el borrador. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: DashboardPlayerInput = {
      ...values,
      name: values.name.trim(),
      lastName: values.lastName.trim(),
      number: values.number.trim(),
      birthDate: values.birthDate.trim(),
    };
    const nextErrors = validateDashboardPlayerInput(normalizedValues);
    const nextRatingError = validateDashboardPlayerRatings(normalizedValues);
    setErrors(nextErrors);
    setStatus(null);
    setRatingError(nextRatingError);

    if (
      Object.keys(nextErrors).length > 0 ||
      photoError ||
      nextRatingError
    ) {
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
          buildDashboardPlayerMutationInput(normalizedValues)
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
        page: "DashboardPlayersForm",
        action: isEditing ? "publish_player_changes" : "publish_player",
      });
      setStatus("No pudimos publicar el integrante. Intenta de nuevo.");
    }
  };

  const ratingFields =
    values.position === "arq" ? GOALKEEPER_RATING_FIELDS : FIELD_RATING_FIELDS;
  const ratingGroup =
    values.position === "arq" ? "goalkeeperRatings" : "fieldRatings";
  const activeRatings = values[ratingGroup] as Record<string, string>;

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Plantel
            </p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {isEditing ? "Editar jugador" : "Nuevo jugador"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Carga la ficha del plantel y publicala en el sitio.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_PLAYERS}
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
              id="dashboard-player-name"
              name="name"
              label="Nombre"
              value={values.name}
              error={errors.name}
              dirty={isDirty("name")}
              onChange={handleChange}
            />
            <Field
              id="dashboard-player-last-name"
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
              id="dashboard-player-number"
              name="number"
              type="number"
              min={0}
              label="Numero de camiseta"
              value={values.number}
              error={errors.number}
              dirty={isDirty("number")}
              onChange={handleChange}
            />
            <Field
              id="dashboard-player-birth-date"
              name="birthDate"
              type="date"
              label="Fecha de nacimiento"
              value={values.birthDate}
              error={errors.birthDate}
              dirty={isDirty("birthDate")}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <SelectField
              id="dashboard-player-position"
              name="position"
              label="Posicion"
              value={values.position}
              error={errors.position}
              dirty={isDirty("position")}
              onChange={handleChange}
            >
              <option value="">Elegir posicion</option>
              {PLAYER_POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <SelectField
              id="dashboard-player-dominant-foot"
              name="dominantFoot"
              label="Pie habil"
              value={values.dominantFoot}
              error={errors.dominantFoot}
              dirty={isDirty("dominantFoot")}
              onChange={handleChange}
            >
              <option value="">Sin definir</option>
              {PLAYER_DOMINANT_FOOT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </div>

          <section className="space-y-4 rounded-sm border border-white/10 bg-[#0f0f13] p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
                  Valoraciones
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-violet-100/55">
                  {values.position === "arq"
                    ? "Perfil de arquero."
                    : "Perfil de jugador de campo."}
                </p>
              </div>
              {isDirty(ratingGroup) && (
                <span className="w-fit rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                  Editado
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ratingFields.map((field) => (
                <Field
                  key={`${ratingGroup}-${field.name}`}
                  id={`dashboard-player-${ratingGroup}-${field.name}`}
                  name={field.name}
                  type="number"
                  min={1}
                  max={10}
                  label={field.label}
                  value={activeRatings[field.name] ?? ""}
                  onChange={(event) =>
                    handleRatingChange(ratingGroup, field.name, event.target.value)
                  }
                />
              ))}
            </div>

            {ratingError && (
              <p className="text-sm text-red-300" role="alert">
                {ratingError}
              </p>
            )}
          </section>

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
                  className="aspect-4/5 w-full object-cover object-top"
                />
              ) : (
                <div className="flex aspect-4/5 w-full items-center justify-center bg-[#0f0f13] text-center text-xs font-black uppercase tracking-[0.2em] text-violet-100/45">
                  Sin foto
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <label
                htmlFor="dashboard-player-photo"
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-950 transition hover:bg-white"
              >
                <FiUpload className="size-4" aria-hidden="true" />
                Subir
              </label>
              <input
                id="dashboard-player-photo"
                type="file"
                accept={DASHBOARD_PLAYER_IMAGE_ACCEPTED_EXTENSIONS}
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
                  {values.number.trim() ? `#${values.number.trim()}` : "Plantel"}
                </p>
                <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                  {displayName}
                </p>
              </div>
              <dl className="space-y-3 p-4 text-sm">
                <div>
                  <dt className="text-violet-100/45">Posicion</dt>
                  <dd className="mt-1 text-white">
                    {getDashboardPlayerPositionLabel(values.position)}
                  </dd>
                </div>
                <div>
                  <dt className="text-violet-100/45">Pie habil</dt>
                  <dd className="mt-1 text-white">
                    {getDashboardPlayerDominantFootLabel(values.dominantFoot)}
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

export default DashboardPlayersForm;
