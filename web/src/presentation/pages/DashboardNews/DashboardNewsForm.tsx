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
  fetchDashboardNewsById,
  publishDashboardNews,
  publishDashboardNewsById,
  saveDashboardNewsDraft,
} from "../../../data/dashboardNews";
import { getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import { confirmDashboardAction } from "../../app/confirmDialog";
import {
  DASHBOARD_NEWS_IMAGE_ACCEPTED_EXTENSIONS,
  type DashboardNewsDraftMutationInput,
  type DashboardNewsInput,
  type DashboardNewsItem,
  type DashboardNewsMutationInput,
} from "../../../types/dashboard";
import type { DashboardNewsErrors } from "./dashboardNews.utils";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { ROUTES } from "../../../shared/routing";
import {
  buildNewsSlug,
  fromDatetimeLocalValue,
  readDashboardNewsImageDimensions,
  toDatetimeLocalValue,
  validateDashboardNewsImageDimensions,
  validateDashboardNewsImageFile,
  validateDashboardNewsInput,
} from "./dashboardNews.utils";
import DashboardNewsContentEditor from "./DashboardNewsContentEditor";
import { Field, TextAreaField } from "./DashboardNewsFields";
import {
  getDashboardNewsContentImageFiles,
  serializeDashboardNewsEditorBlocks,
  toDashboardNewsEditorBlocks,
  type DashboardNewsEditorBlock,
  validateDashboardNewsEditorBlocks,
} from "./dashboardNewsContent.utils";

const createInitialValues = (): DashboardNewsInput => ({
  title: "",
  description: "",
  date: new Date().toISOString(),
  slug: "",
  imageAlt: "",
});

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

type SavedNewsSnapshot = {
  values: DashboardNewsInput;
  contentJson: string;
  useDefaultImage: boolean;
};

const dirtyFieldLabels = {
  title: "Titulo",
  description: "Descripcion",
  date: "Fecha",
  slug: "Slug",
  content: "Contenido",
  coverImage: "Portada",
  imageAlt: "Texto alternativo",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;

const serializeContentForDirtyCheck = (
  blocks: DashboardNewsEditorBlock[]
): string => JSON.stringify(serializeDashboardNewsEditorBlocks(blocks));

const createSavedSnapshot = ({
  values,
  contentBlocks,
  useDefaultImage,
}: {
  values: DashboardNewsInput;
  contentBlocks: DashboardNewsEditorBlock[];
  useDefaultImage: boolean;
}): SavedNewsSnapshot => ({
  values,
  contentJson: serializeContentForDirtyCheck(contentBlocks),
  useDefaultImage,
});

const getSavedUseDefaultImage = (news: DashboardNewsItem): boolean =>
  !news.imageAssetId && !news.imageUrl;

const getValuesFromNews = (news: DashboardNewsItem): DashboardNewsInput => ({
  title: news.title,
  description: news.description,
  date: news.date ?? "",
  slug: news.slug,
  imageAlt: news.imageAlt || news.title,
});

const createSnapshotFromNews = (news: DashboardNewsItem): SavedNewsSnapshot =>
  createSavedSnapshot({
    values: getValuesFromNews(news),
    contentBlocks: toDashboardNewsEditorBlocks(news.content ?? []),
    useDefaultImage: getSavedUseDefaultImage(news),
  });

const DashboardNewsForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialFormState] = useState(() => {
    const initialValues = createInitialValues();

    return {
      values: initialValues,
      snapshot: createSavedSnapshot({
        values: initialValues,
        contentBlocks: [],
        useDefaultImage: true,
      }),
    };
  });
  const [values, setValues] = useState<DashboardNewsInput>(
    initialFormState.values
  );
  const [savedSnapshot, setSavedSnapshot] = useState<SavedNewsSnapshot>(
    initialFormState.snapshot
  );
  const [errors, setErrors] = useState<DashboardNewsErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageAltTouched, setImageAltTouched] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<
    string | null
  >(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [useDefaultImage, setUseDefaultImage] = useState(!isEditing);
  const [contentBlocks, setContentBlocks] = useState<DashboardNewsEditorBlock[]>(
    []
  );
  const [contentError, setContentError] = useState<string | null>(null);

  const newsQuery = useQuery({
    queryKey: queryKeys.dashboard.news.byId(id ?? "new"),
    enabled: isEditing,
    queryFn: async () => {
      try {
        return await fetchDashboardNewsById(id ?? "");
      } catch (error) {
        reportError(error, {
          page: "DashboardNewsForm",
          action: "load_news",
          id,
        });
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!newsQuery.data) {
      return;
    }

    const nextValues = getValuesFromNews(newsQuery.data);
    const nextContentBlocks = toDashboardNewsEditorBlocks(
      newsQuery.data.content ?? []
    );
    const nextUseDefaultImage = getSavedUseDefaultImage(newsQuery.data);

    setValues(nextValues);
    setSlugTouched(true);
    setImageAltTouched(Boolean(newsQuery.data.imageAlt));
    setSelectedImageFile(null);
    setUseDefaultImage(nextUseDefaultImage);
    setImageError(null);
    setContentBlocks(nextContentBlocks);
    setContentError(null);
    setSavedSnapshot(
      createSavedSnapshot({
        values: nextValues,
        contentBlocks: nextContentBlocks,
        useDefaultImage: nextUseDefaultImage,
      })
    );
  }, [newsQuery.data]);

  useEffect(() => {
    if (!selectedImageFile) {
      setSelectedImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedImageFile);
    setSelectedImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImageFile]);

  const applySavedNews = (savedNews: DashboardNewsItem) => {
    const nextValues = getValuesFromNews(savedNews);
    const nextContentBlocks = toDashboardNewsEditorBlocks(
      savedNews.content ?? []
    );
    const nextUseDefaultImage = getSavedUseDefaultImage(savedNews);

    setValues(nextValues);
    setSlugTouched(true);
    setImageAltTouched(Boolean(savedNews.imageAlt));
    setSelectedImageFile(null);
    setUseDefaultImage(nextUseDefaultImage);
    setImageError(null);
    setContentBlocks(nextContentBlocks);
    setContentError(null);
    setSavedSnapshot(createSnapshotFromNews(savedNews));
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (input: DashboardNewsDraftMutationInput) =>
      saveDashboardNewsDraft(input, id),
    onSuccess: async (savedNews) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.news.all,
      });
      queryClient.setQueryData(
        queryKeys.dashboard.news.byId(savedNews.id),
        savedNews
      );
      applySavedNews(savedNews);

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_NEWS_EDIT(savedNews.id), { replace: true });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardNewsMutationInput) =>
      isEditing && id
        ? publishDashboardNewsById(id, input)
        : publishDashboardNews(input),
    onSuccess: async (savedNews) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.news.all,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.news.all }),
      ]);
      queryClient.setQueryData(
        queryKeys.dashboard.news.byId(savedNews.id),
        savedNews
      );
      navigate(ROUTES.DASHBOARD_NEWS);
    },
  });

  const currentContentJson = useMemo(
    () => serializeContentForDirtyCheck(contentBlocks),
    [contentBlocks]
  );
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    const nextDirtyFields: DirtyFieldKey[] = [];

    if (values.title !== savedSnapshot.values.title) {
      nextDirtyFields.push("title");
    }

    if (values.description !== savedSnapshot.values.description) {
      nextDirtyFields.push("description");
    }

    if (values.date !== savedSnapshot.values.date) {
      nextDirtyFields.push("date");
    }

    if (values.slug !== savedSnapshot.values.slug) {
      nextDirtyFields.push("slug");
    }

    if (currentContentJson !== savedSnapshot.contentJson) {
      nextDirtyFields.push("content");
    }

    if (selectedImageFile || useDefaultImage !== savedSnapshot.useDefaultImage) {
      nextDirtyFields.push("coverImage");
    }

    if (values.imageAlt !== savedSnapshot.values.imageAlt) {
      nextDirtyFields.push("imageAlt");
    }

    return nextDirtyFields;
  }, [
    currentContentJson,
    savedSnapshot,
    selectedImageFile,
    useDefaultImage,
    values,
  ]);
  const dirtyLabels = dirtyFields.map((field) => dirtyFieldLabels[field]);
  const isDirty = (field: DirtyFieldKey): boolean =>
    dirtyFields.includes(field);
  const isSaving = saveDraftMutation.isPending || publishMutation.isPending;

  if (newsQuery.isLoading) {
    return <Loader />;
  }

  if (newsQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar la noticia"
        message="Intentá nuevamente en unos minutos."
        onRetry={() => void newsQuery.refetch()}
      />
    );
  }

  const existingImageUrl = useDefaultImage ? null : newsQuery.data?.imageUrl;
  const coverPreviewUrl = selectedImagePreviewUrl ?? existingImageUrl ?? null;
  const coverPreviewSrc = coverPreviewUrl
    ? getImageUrl(coverPreviewUrl, {
        width: 640,
        height: 360,
        fit: "crop",
        quality: 72,
        autoFormat: true,
      })
    : "";

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    if (name === "title") {
      setValues((currentValues) => ({
        ...currentValues,
        title: value,
        slug: slugTouched ? currentValues.slug : buildNewsSlug(value),
        imageAlt: imageAltTouched ? currentValues.imageAlt : value,
      }));
    } else if (name === "date") {
      setValues((currentValues) => ({
        ...currentValues,
        date: fromDatetimeLocalValue(value),
      }));
    } else {
      setValues((currentValues) => ({
        ...currentValues,
        [name]: value,
      }));
    }

    if (name === "slug") {
      setSlugTouched(true);
    }

    if (name === "imageAlt") {
      setImageAltTouched(true);
    }

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
    setStatus(null);
    setContentError(null);
  };

  const handleCoverImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setStatus(null);

    if (!file) {
      return;
    }

    const fileError = validateDashboardNewsImageFile(file);

    if (fileError) {
      setImageError(fileError);
      setSelectedImageFile(null);
      return;
    }

    try {
      const dimensions = await readDashboardNewsImageDimensions(file);
      const dimensionsError = validateDashboardNewsImageDimensions(dimensions);

      if (dimensionsError) {
        setImageError(dimensionsError);
        setSelectedImageFile(null);
        return;
      }

      setSelectedImageFile(file);
      setUseDefaultImage(false);
      setImageError(null);

      if (!imageAltTouched) {
        setValues((currentValues) => ({
          ...currentValues,
          imageAlt: currentValues.title.trim() || file.name.replace(/\.[^.]+$/, ""),
        }));
      }
    } catch (error) {
      reportError(error, {
        page: "DashboardNewsForm",
        action: "read_cover_image",
      });
      setImageError("No pudimos leer la imagen seleccionada.");
      setSelectedImageFile(null);
    }
  };

  const handleRemoveCoverImage = async () => {
    if (!coverPreviewSrc) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: "Quitar portada",
      text: "La noticia va a usar la portada por defecto del club. Podés subir otra imagen antes de guardar.",
      confirmText: "Quitar imagen",
      icon: "warning",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    setSelectedImageFile(null);
    setUseDefaultImage(true);
    setImageError(null);

    if (!imageAltTouched) {
      setValues((currentValues) => ({
        ...currentValues,
        imageAlt: currentValues.title.trim() || "Imagen principal de Mentira FC",
      }));
    }
  };

  const buildDraftInput = (): DashboardNewsDraftMutationInput => {
    const contentImageFiles = getDashboardNewsContentImageFiles(contentBlocks);

    return {
      title: values.title.trim(),
      description: values.description.trim(),
      date: values.date.trim(),
      slug: values.slug.trim(),
      imageAlt: values.imageAlt.trim(),
      coverImage: selectedImageFile,
      useDefaultImage,
      content: serializeDashboardNewsEditorBlocks(contentBlocks),
      contentImageFiles,
    };
  };

  const handleSaveDraft = async () => {
    setStatus(null);
    setErrors({});
    setContentError(null);

    if (imageError) {
      return;
    }

    const draftInput = buildDraftInput();
    const hasPendingUploads =
      Boolean(selectedImageFile) ||
      Object.keys(draftInput.contentImageFiles ?? {}).length > 0;

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(draftInput),
        {
          loading: hasPendingUploads
            ? "Subiendo archivos y guardando borrador..."
            : "Guardando borrador en Sanity...",
          success: "Borrador guardado correctamente.",
          error: "No pudimos guardar el borrador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardNewsForm",
        action: "save_news_draft",
      });
      setStatus("No pudimos guardar el borrador. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      slug: values.slug.trim(),
      imageAlt: (values.imageAlt || values.title).trim(),
    };
    const nextErrors = validateDashboardNewsInput(normalizedValues);
    setErrors(nextErrors);
    setStatus(null);
    setContentError(null);

    const nextContentError = validateDashboardNewsEditorBlocks(contentBlocks);
    setContentError(nextContentError);

    if (Object.keys(nextErrors).length > 0 || imageError || nextContentError) {
      return;
    }

    const contentImageFiles = getDashboardNewsContentImageFiles(contentBlocks);
    const hasPendingUploads =
      Boolean(selectedImageFile) || Object.keys(contentImageFiles).length > 0;
    const confirmed = await confirmDashboardAction({
      title: isEditing ? "Publicar cambios" : "Publicar noticia",
      text: isEditing
        ? "El borrador se va a publicar en Sanity y actualizará la noticia visible en el sitio."
        : "La noticia se va a publicar en Sanity y quedará visible en el sitio.",
      confirmText: isEditing ? "Publicar cambios" : "Publicar",
      icon: isEditing ? "question" : "info",
    });

    if (!confirmed) {
      return;
    }

    try {
      await toast.promise(
        publishMutation.mutateAsync({
          ...normalizedValues,
          coverImage: selectedImageFile,
          useDefaultImage,
          content: serializeDashboardNewsEditorBlocks(contentBlocks),
          contentImageFiles,
        }),
        {
          loading: hasPendingUploads
            ? "Subiendo archivos y guardando en Sanity..."
            : isEditing
              ? "Publicando cambios en Sanity..."
              : "Publicando noticia en Sanity...",
          success: isEditing
            ? "Cambios publicados correctamente."
            : "Noticia publicada correctamente.",
          error: "No pudimos publicar la noticia.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardNewsForm",
        action: isEditing ? "publish_news_changes" : "publish_news",
      });
      setStatus("No pudimos publicar la noticia. Intentá de nuevo.");
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Noticias
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              {isEditing ? "Editar noticia" : "Nueva noticia"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Cargá los datos principales y definí una portada para publicar la
              noticia directamente en el sitio.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_NEWS}
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

          <Field
            id="dashboard-news-title"
            name="title"
            label="Título"
            value={values.title}
            error={errors.title}
            dirty={isDirty("title")}
            onChange={handleChange}
          />

          <TextAreaField
            id="dashboard-news-description"
            name="description"
            label="Descripción corta"
            value={values.description}
            error={errors.description}
            dirty={isDirty("description")}
            onChange={handleChange}
          />

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 *:min-w-0">
            <Field
              id="dashboard-news-date"
              name="date"
              type="datetime-local"
              label="Fecha"
              value={toDatetimeLocalValue(values.date)}
              error={errors.date}
              dirty={isDirty("date")}
              onChange={handleChange}
            />
            <Field
              id="dashboard-news-slug"
              name="slug"
              label="Slug"
              value={values.slug}
              error={errors.slug}
              dirty={isDirty("slug")}
              onChange={handleChange}
            />
          </div>

          <DashboardNewsContentEditor
            title={values.title}
            blocks={contentBlocks}
            error={contentError ?? undefined}
            dirty={isDirty("content")}
            onChange={(blocks) => {
              setContentBlocks(blocks);
              setContentError(null);
              setStatus(null);
            }}
          />

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
                  Imagen de portada
                </h3>
                {isDirty("coverImage") && (
                  <span className="mt-2 inline-flex rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                    Editado
                  </span>
                )}
                <p className="mt-2 text-xs leading-relaxed text-violet-100/65">
                  Obligatoria. Si quitás la imagen, se usa la portada por
                  defecto del club.
                </p>
              </div>
              <span className="rounded-[3px] border border-violet-300/15 bg-violet-300/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-100/70">
                16:9
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-[3px] border border-white/10 bg-black/25">
              {coverPreviewSrc ? (
                <img
                  src={coverPreviewSrc}
                  alt={values.imageAlt || values.title || "Portada de la noticia"}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-[radial-gradient(circle,rgba(124,58,237,0.22),transparent_60%),linear-gradient(135deg,#211336,#060608)] text-center text-xs font-black uppercase tracking-[0.2em] text-violet-100/55">
                  Portada por defecto
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <label
                htmlFor="dashboard-news-cover-image"
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-950 transition hover:bg-white"
              >
                <FiUpload className="size-4" aria-hidden="true" />
                Subir
              </label>
              <input
                id="dashboard-news-cover-image"
                type="file"
                accept={DASHBOARD_NEWS_IMAGE_ACCEPTED_EXTENSIONS}
                className="sr-only"
                onChange={handleCoverImageChange}
              />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-white/10 text-white transition hover:border-violet-200/35 hover:bg-white/4.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!coverPreviewSrc}
                aria-label="Quitar imagen"
                title="Quitar imagen"
                onClick={() => void handleRemoveCoverImage()}
              >
                <FiTrash2 className="size-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-violet-100/55">
              Formatos: JPG, PNG o WebP. Máximo 4 MB por el límite de Vercel y
              hasta 256 megapíxeles como Sanity.
            </p>

            {imageError && (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {imageError}
              </p>
            )}
          </section>

          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <Field
              id="dashboard-news-image-alt"
              name="imageAlt"
              label="Texto alternativo"
              value={values.imageAlt}
              error={errors.imageAlt}
              dirty={isDirty("imageAlt")}
              onChange={handleChange}
            />
            <p className="mt-3 text-xs leading-relaxed text-violet-100/55">
              Se autocompleta con el título, pero conviene ajustarlo si la imagen
              muestra algo más específico.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardNewsForm;
