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
import {
  FiArrowLeft,
  FiImage,
  FiStar,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";

import {
  buildDashboardGalleryDraftMutationInput,
  buildDashboardGalleryMutationInput,
  publishDashboardGallery,
  publishDashboardGalleryById,
  saveDashboardGalleryDraft,
} from "../../../data/dashboardGalleries";
import { getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import {
  DASHBOARD_GALLERY_IMAGE_ACCEPTED_EXTENSIONS,
  type DashboardGalleryGameOption,
  type DashboardGalleryInput,
  type DashboardGalleryItem,
  type DashboardGalleryMutationInput,
  type DashboardGalleryPhotoInput,
} from "../../../types/dashboard";
import { confirmDashboardAction } from "../../dashboard/DashboardConfirmDialog";
import DashboardErrorState from "../../dashboard/DashboardErrorState";
import DashboardFormActions from "../../dashboard/DashboardFormActions";
import DashboardLoadingState from "../../dashboard/DashboardLoadingState";
import DashboardUnsavedChangesNotice from "../../dashboard/DashboardUnsavedChangesNotice";
import { useUnsavedChangesGuard } from "../../dashboard/useUnsavedChangesGuard";
import { Field, SelectField } from "./DashboardGalleriesFields";
import {
  buildDashboardGalleryGameLabel,
  buildDashboardGallerySlugFromGame,
  createPhotoInputFromFile,
  getDashboardGalleryTitle,
  readDashboardGalleryImageDimensions,
  validateDashboardGalleryImageDimensions,
  validateDashboardGalleryImageFile,
  validateDashboardGalleryInput,
  type DashboardGalleryErrors,
} from "./dashboardGalleries.utils";
import {
  cacheDashboardGallery,
  dashboardGalleryDetailQueryOptions,
  dashboardGalleryOptionsQueryOptions,
  invalidateDashboardGalleriesList,
  invalidateDashboardGalleryPublishDependencies,
} from "./dashboardGalleries.queries";

const createInitialValues = (): DashboardGalleryInput => ({
  gameId: "",
  slug: "",
  photos: [],
});

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

const dirtyFieldLabels = {
  gameId: "Partido",
  slug: "Slug",
  photos: "Fotos",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;

type SavedGallerySnapshot = {
  valuesJson: string;
};

const serializePhoto = (photo: DashboardGalleryPhotoInput) => ({
  key: photo.key,
  imageAssetId: photo.imageAssetId,
  uploadKey: photo.uploadKey,
  alt: photo.alt,
  caption: photo.caption,
  isHero: photo.isHero,
  file: photo.file
    ? {
        name: photo.file.name,
        size: photo.file.size,
        type: photo.file.type,
      }
    : null,
});

const serializeValues = (values: DashboardGalleryInput): string =>
  JSON.stringify({
    ...values,
    photos: values.photos.map(serializePhoto),
  });

const createSavedSnapshot = (
  values: DashboardGalleryInput
): SavedGallerySnapshot => ({
  valuesJson: serializeValues(values),
});

const getValuesFromGallery = (
  gallery: DashboardGalleryItem
): DashboardGalleryInput => ({
  gameId: gallery.gameId ?? "",
  slug: gallery.slug,
  photos: gallery.photos.map((photo, index) => ({
    key: photo.key || `photo-${index + 1}`,
    imageAssetId: photo.imageAssetId ?? "",
    imageUrl: photo.imageUrl ?? "",
    uploadKey: "",
    alt: photo.alt ?? "",
    caption: photo.caption ?? "",
    isHero: Boolean(photo.isHero),
    file: null,
  })),
});

const createGameOptionFromGallery = (
  gallery: DashboardGalleryItem
): DashboardGalleryGameOption | null =>
  gallery.gameId
    ? {
        id: gallery.gameId,
        date: gallery.gameDate,
        state: gallery.gameState,
        location: gallery.gameLocation,
        competition: gallery.gameCompetition,
        tournamentId: gallery.gameTournamentId,
        tournamentName: gallery.gameTournamentName,
        tournamentOrganizationName: gallery.gameTournamentOrganizationName,
        rivalId: gallery.rivalId,
        rivalName: gallery.rivalName,
        rivalImageUrl: gallery.rivalImageUrl,
        goalsFor: gallery.goalsFor,
        goalsAgainst: gallery.goalsAgainst,
      }
    : null;

const DashboardGalleriesForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialValues] = useState(createInitialValues);
  const [values, setValues] = useState<DashboardGalleryInput>(initialValues);
  const [savedSnapshot, setSavedSnapshot] =
    useState<SavedGallerySnapshot>(createSavedSnapshot(initialValues));
  const [errors, setErrors] = useState<DashboardGalleryErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<
    Record<string, string>
  >({});

  const optionsQuery = useQuery(dashboardGalleryOptionsQueryOptions());
  const galleryQuery = useQuery({
    ...dashboardGalleryDetailQueryOptions(id ?? "new"),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!galleryQuery.data) {
      return;
    }

    const nextValues = getValuesFromGallery(galleryQuery.data);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setErrors({});
    setStatus(null);
  }, [galleryQuery.data]);

  const gameOptions = useMemo(() => {
    const games = optionsQuery.data?.games ?? [];
    const currentGame = galleryQuery.data
      ? createGameOptionFromGallery(galleryQuery.data)
      : null;

    if (!currentGame || games.some((game) => game.id === currentGame.id)) {
      return games;
    }

    return [currentGame, ...games];
  }, [galleryQuery.data, optionsQuery.data]);

  useEffect(() => {
    if (isEditing || values.gameId || gameOptions.length === 0) {
      return;
    }

    const firstGame = gameOptions[0];

    if (!firstGame) {
      return;
    }

    setValues((currentValues) => ({
      ...currentValues,
      gameId: firstGame.id,
      slug: currentValues.slug || buildDashboardGallerySlugFromGame(firstGame),
    }));
    setSavedSnapshot((currentSnapshot) => {
      const nextValues = {
        ...initialValues,
        gameId: firstGame.id,
        slug: buildDashboardGallerySlugFromGame(firstGame),
      };

      return currentSnapshot.valuesJson === serializeValues(initialValues)
        ? createSavedSnapshot(nextValues)
        : currentSnapshot;
    });
  }, [gameOptions, initialValues, isEditing, values.gameId]);

  useEffect(() => {
    const urls: Record<string, string> = {};

    values.photos.forEach((photo) => {
      if (photo.file) {
        urls[photo.key] = URL.createObjectURL(photo.file);
      }
    });

    setPhotoPreviewUrls(urls);

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [values.photos]);

  const applySavedGallery = (savedGallery: DashboardGalleryItem) => {
    const nextValues = getValuesFromGallery(savedGallery);

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
    setErrors({});
    setStatus(null);
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (
      input: ReturnType<typeof buildDashboardGalleryDraftMutationInput>
    ) => saveDashboardGalleryDraft(input, id),
    onSuccess: async (savedGallery) => {
      await invalidateDashboardGalleriesList(queryClient);
      cacheDashboardGallery(queryClient, savedGallery);
      applySavedGallery(savedGallery);

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_GALLERIES_EDIT(savedGallery.id), {
          replace: true,
        });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardGalleryMutationInput) =>
      isEditing && id
        ? publishDashboardGalleryById(id, input)
        : publishDashboardGallery(input),
    onSuccess: async (savedGallery) => {
      await invalidateDashboardGalleryPublishDependencies(queryClient);
      cacheDashboardGallery(queryClient, savedGallery);
      navigate(ROUTES.DASHBOARD_GALLERIES);
    },
  });

  const currentValuesJson = useMemo(() => serializeValues(values), [values]);
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    if (currentValuesJson === savedSnapshot.valuesJson) {
      return [];
    }

    const savedValues = JSON.parse(savedSnapshot.valuesJson) as DashboardGalleryInput;

    return (Object.keys(dirtyFieldLabels) as DirtyFieldKey[]).filter((field) => {
      if (field === "photos") {
        return (
          JSON.stringify(values.photos.map(serializePhoto)) !==
          JSON.stringify(savedValues.photos.map(serializePhoto))
        );
      }

      return values[field] !== savedValues[field];
    });
  }, [currentValuesJson, savedSnapshot.valuesJson, values]);
  const dirtyLabels = dirtyFields.map((field) => dirtyFieldLabels[field]);
  const isDirty = (field: DirtyFieldKey): boolean => dirtyFields.includes(field);
  const isSaving = saveDraftMutation.isPending || publishMutation.isPending;
  const hasUnsavedChanges = dirtyLabels.length > 0 && !isSaving;

  useUnsavedChangesGuard({ when: hasUnsavedChanges });

  if (optionsQuery.isLoading || galleryQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  if (optionsQuery.isError || galleryQuery.isError) {
    return (
      <DashboardErrorState
        title="No pudimos cargar la galeria"
        message="No se pudo cargar la pagina. Reintenta en unos segundos."
        onRetry={() => {
          void optionsQuery.refetch();
          void galleryQuery.refetch();
        }}
      />
    );
  }

  const selectedGame = gameOptions.find((game) => game.id === values.gameId);
  const heroPhoto =
    values.photos.find((photo) => photo.isHero) ?? values.photos[0] ?? null;
  const heroPreviewUrl = heroPhoto
    ? photoPreviewUrls[heroPhoto.key] || heroPhoto.imageUrl
    : "";
  const heroPreviewSrc = getImageUrl(heroPreviewUrl, {
    width: 720,
    height: 480,
    fit: "crop",
    quality: 78,
    autoFormat: true,
  });

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

  const handleGameChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const gameId = event.target.value;
    const game = gameOptions.find((option) => option.id === gameId);

    setValues((currentValues) => ({
      ...currentValues,
      gameId,
      slug: currentValues.slug || buildDashboardGallerySlugFromGame(game),
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      gameId: undefined,
    }));
    setStatus(null);
  };

  const handlePhotoFieldChange = (
    photoKey: string,
    field: "alt" | "caption",
    value: string
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      photos: currentValues.photos.map((photo) =>
        photo.key === photoKey
          ? {
              ...photo,
              [field]: value,
            }
          : photo
      ),
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      photos: undefined,
    }));
    setStatus(null);
  };

  const handleSetHero = (photoKey: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      photos: currentValues.photos.map((photo) => ({
        ...photo,
        isHero: photo.key === photoKey,
      })),
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      photos: undefined,
    }));
    setStatus(null);
  };

  const handleRemovePhoto = (photoKey: string) => {
    setValues((currentValues) => {
      const nextPhotos = currentValues.photos.filter(
        (photo) => photo.key !== photoKey
      );

      if (nextPhotos[0] && !nextPhotos.some((photo) => photo.isHero)) {
        nextPhotos[0] = {
          ...nextPhotos[0],
          isHero: true,
        };
      }

      return {
        ...currentValues,
        photos: nextPhotos,
      };
    });
    setErrors((currentErrors) => ({
      ...currentErrors,
      photos: undefined,
    }));
    setStatus(null);
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    setStatus(null);

    if (files.length === 0) {
      return;
    }

    const nextPhotos: DashboardGalleryPhotoInput[] = [];

    for (const file of files) {
      const fileError = validateDashboardGalleryImageFile(file);

      if (fileError) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          photos: fileError,
        }));
        return;
      }

      try {
        const dimensions = await readDashboardGalleryImageDimensions(file);
        const dimensionsError =
          validateDashboardGalleryImageDimensions(dimensions);

        if (dimensionsError) {
          setErrors((currentErrors) => ({
            ...currentErrors,
            photos: dimensionsError,
          }));
          return;
        }
      } catch (error) {
        reportError(error, {
          page: "DashboardGalleriesForm",
          action: "read_gallery_photo",
        });
        setErrors((currentErrors) => ({
          ...currentErrors,
          photos: "No pudimos leer una de las fotos seleccionadas.",
        }));
        return;
      }

      nextPhotos.push(createPhotoInputFromFile(file, values.photos.length + nextPhotos.length));
    }

    setValues((currentValues) => {
      const hasHero = currentValues.photos.some((photo) => photo.isHero);
      const normalizedNewPhotos = nextPhotos.map((photo, index) => ({
        ...photo,
        isHero: hasHero ? false : index === 0,
      }));

      return {
        ...currentValues,
        photos: [...currentValues.photos, ...normalizedNewPhotos],
      };
    });
    setErrors((currentErrors) => ({
      ...currentErrors,
      photos: undefined,
    }));
  };

  const handleSaveDraft = async () => {
    setStatus(null);
    setErrors({});

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(
          buildDashboardGalleryDraftMutationInput(values)
        ),
        {
          loading: values.photos.some((photo) => photo.file)
            ? "Subiendo fotos y guardando borrador..."
            : "Guardando borrador en Sanity...",
          success: "Borrador guardado correctamente.",
          error: "No pudimos guardar el borrador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardGalleriesForm",
        action: "save_gallery_draft",
      });
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos guardar el borrador. Intenta de nuevo."
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: DashboardGalleryInput = {
      gameId: values.gameId.trim(),
      slug: values.slug.trim(),
      photos: values.photos.map((photo) => ({
        ...photo,
        alt: photo.alt.trim(),
        caption: photo.caption.trim(),
      })),
    };
    const nextErrors = validateDashboardGalleryInput(normalizedValues);
    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("No se pudo guardar la galeria porque faltan datos obligatorios.");
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: isEditing ? "Publicar cambios" : "Publicar galeria",
      text: isEditing
        ? "El borrador se va a publicar en Sanity y actualizara la galeria visible en el sitio."
        : "La galeria se va a publicar en Sanity y quedara visible en el sitio.",
      confirmText: isEditing ? "Publicar cambios" : "Publicar",
      icon: isEditing ? "question" : "info",
    });

    if (!confirmed) {
      return;
    }

    try {
      await toast.promise(
        publishMutation.mutateAsync(
          buildDashboardGalleryMutationInput(normalizedValues)
        ),
        {
          loading: normalizedValues.photos.some((photo) => photo.file)
            ? "Subiendo fotos y publicando en Sanity..."
            : isEditing
              ? "Publicando cambios en Sanity..."
              : "Publicando galeria en Sanity...",
          success: isEditing
            ? "Cambios publicados correctamente."
            : "Galeria publicada correctamente.",
          error: "No pudimos publicar la galeria.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardGalleriesForm",
        action: isEditing ? "publish_gallery_changes" : "publish_gallery",
      });
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos publicar la galeria. Intenta de nuevo."
      );
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Galerias
            </p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {isEditing ? "Editar galeria" : "Nueva galeria"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Gestiona albumes de fotos asociados a partidos finalizados.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_GALLERIES}
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
            <SelectField
              id="dashboard-gallery-game"
              name="gameId"
              label="Partido finalizado"
              value={values.gameId}
              error={errors.gameId}
              dirty={isDirty("gameId")}
              onChange={handleGameChange}
            >
              <option value="">Elegir partido</option>
              {gameOptions.map((game) => (
                <option key={game.id} value={game.id}>
                  {buildDashboardGalleryGameLabel(game)}
                </option>
              ))}
            </SelectField>

            <Field
              id="dashboard-gallery-slug"
              name="slug"
              label="Slug publico"
              value={values.slug}
              error={errors.slug}
              dirty={isDirty("slug")}
              onChange={handleChange}
            />
          </div>

          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
                  <span>Fotos</span>
                  {isDirty("photos") && (
                    <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                      Editado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-violet-100/45">
                  Marca una sola foto como hero antes de publicar.
                </p>
              </div>

              <label
                htmlFor="dashboard-gallery-photos"
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-950 transition hover:bg-white"
              >
                <FiUpload className="size-4" aria-hidden="true" />
                Subir fotos
              </label>
              <input
                id="dashboard-gallery-photos"
                type="file"
                accept={DASHBOARD_GALLERY_IMAGE_ACCEPTED_EXTENSIONS}
                multiple
                className="sr-only"
                onChange={(event) => void handlePhotoUpload(event)}
              />
            </div>

            {errors.photos && (
              <p
                className="rounded-[3px] border border-red-300/20 bg-red-400/8 px-3 py-2 text-sm text-red-100"
                role="alert"
              >
                {errors.photos}
              </p>
            )}

            {values.photos.length === 0 ? (
              <div className="rounded-[3px] border border-dashed border-white/10 bg-[#0f0f13] px-4 py-8 text-center text-sm text-violet-100/55">
                Todavia no hay fotos cargadas.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {values.photos.map((photo, index) => {
                  const previewUrl =
                    photoPreviewUrls[photo.key] || photo.imageUrl;
                  const previewSrc = getImageUrl(previewUrl, {
                    width: 420,
                    height: 280,
                    fit: "crop",
                    quality: 74,
                    autoFormat: true,
                  });

                  return (
                    <article
                      key={photo.key}
                      className="overflow-hidden rounded-[3px] border border-white/10 bg-[#0f0f13]"
                    >
                      <div className="relative aspect-3/2 bg-black/25">
                        {previewSrc ? (
                          <img
                            src={previewSrc}
                            alt={photo.alt || `Foto ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-violet-100/45">
                            <FiImage className="size-6" aria-hidden="true" />
                          </div>
                        )}
                        {photo.isHero && (
                          <span className="absolute left-2 top-2 inline-flex rounded-[3px] border border-violet-100/25 bg-violet-100 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-violet-950">
                            Hero
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 p-3">
                        <input
                          type="text"
                          value={photo.alt}
                          placeholder="Texto alternativo"
                          className="min-h-10 w-full rounded-[3px] border border-white/10 bg-[#151518] px-3 py-2 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
                          aria-label={`Texto alternativo foto ${index + 1}`}
                          onChange={(event) =>
                            handlePhotoFieldChange(
                              photo.key,
                              "alt",
                              event.target.value
                            )
                          }
                        />
                        <input
                          type="text"
                          value={photo.caption}
                          placeholder="Epigrafe"
                          className="min-h-10 w-full rounded-[3px] border border-white/10 bg-[#151518] px-3 py-2 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
                          aria-label={`Epigrafe foto ${index + 1}`}
                          onChange={(event) =>
                            handlePhotoFieldChange(
                              photo.key,
                              "caption",
                              event.target.value
                            )
                          }
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[3px] border border-white/10 px-3 text-sm font-semibold text-white transition hover:border-violet-200/35 hover:bg-white/4.5 disabled:cursor-not-allowed disabled:opacity-45"
                            disabled={photo.isHero}
                            onClick={() => handleSetHero(photo.key)}
                          >
                            <FiStar className="size-4" aria-hidden="true" />
                            Hero
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-[3px] border border-red-300/20 text-red-100 transition hover:border-red-200/45 hover:bg-red-400/10"
                            aria-label="Quitar foto"
                            title="Quitar foto"
                            onClick={() => handleRemovePhoto(photo.key)}
                          >
                            <FiTrash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <DashboardFormActions
            isSaving={isSaving}
            isDraftSaving={saveDraftMutation.isPending}
            isPublishing={publishMutation.isPending}
            onSaveDraft={handleSaveDraft}
            submitLabel={isEditing ? "Publicar cambios" : "Publicar"}
            cancelTo={ROUTES.DASHBOARD_GALLERIES}
            error={status}
          />
        </form>

        <aside className="space-y-4">
          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Hero
            </h3>
            <div className="mt-4 overflow-hidden rounded-[3px] border border-white/10 bg-black/25">
              {heroPreviewSrc ? (
                <img
                  src={heroPreviewSrc}
                  alt={heroPhoto?.alt || "Hero de galeria"}
                  className="aspect-3/2 w-full object-cover"
                />
              ) : (
                <div className="flex aspect-3/2 w-full items-center justify-center bg-[#0f0f13] text-center text-xs font-black uppercase tracking-[0.2em] text-violet-100/45">
                  Sin hero
                </div>
              )}
            </div>
          </section>

          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Resumen
            </h3>
            <div className="mt-4 rounded-[3px] border border-white/10 bg-[#0f0f13] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-100/45">
                {selectedGame?.competition || "Partido"}
              </p>
              <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                {selectedGame
                  ? getDashboardGalleryTitle(selectedGame)
                  : "Galeria sin partido"}
              </p>
              <p className="mt-2 text-sm text-violet-100/65">
                {values.photos.length} fotos cargadas
              </p>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-violet-100/45">Slug</dt>
                <dd className="mt-1 wrap-break-word text-white">
                  {values.slug || "Sin slug"}
                </dd>
              </div>
              <div>
                <dt className="text-violet-100/45">Publicacion</dt>
                <dd className="mt-1 text-white">
                  {galleryQuery.data
                    ? galleryQuery.data.status === "draft"
                      ? "Borrador"
                      : "Publicado"
                    : "Sin publicar"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Publicacion
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-violet-100/60">
              Guardar borrador permite dejar datos incompletos. Publicar valida
              partido finalizado, slug, fotos y hero unico.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardGalleriesForm;
