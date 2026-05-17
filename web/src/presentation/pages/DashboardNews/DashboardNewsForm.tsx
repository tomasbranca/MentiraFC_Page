import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  createDashboardNews,
  fetchDashboardNewsById,
  updateDashboardNews,
} from "../../../data/dashboardNews";
import { getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import {
  DASHBOARD_NEWS_IMAGE_ACCEPTED_EXTENSIONS,
  type DashboardNewsInput,
  type DashboardNewsMutationInput,
} from "../../../types/dashboard";
import type { DashboardNewsErrors } from "./dashboardNews.utils";
import Button from "../../components/Button/Button";
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

const DashboardNewsForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<DashboardNewsInput>(createInitialValues);
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

    setValues({
      title: newsQuery.data.title,
      description: newsQuery.data.description,
      date: newsQuery.data.date,
      slug: newsQuery.data.slug,
      imageAlt: newsQuery.data.imageAlt || newsQuery.data.title,
    });
    setSlugTouched(true);
    setImageAltTouched(Boolean(newsQuery.data.imageAlt));
    setSelectedImageFile(null);
    setUseDefaultImage(false);
    setImageError(null);
    setContentBlocks(toDashboardNewsEditorBlocks(newsQuery.data.content ?? []));
    setContentError(null);
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

  const saveMutation = useMutation({
    mutationFn: async (input: DashboardNewsMutationInput) =>
      isEditing && id
        ? updateDashboardNews(id, input)
        : createDashboardNews(input),
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

  const handleRemoveCoverImage = () => {
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

    try {
      await saveMutation.mutateAsync({
        ...normalizedValues,
        coverImage: selectedImageFile,
        useDefaultImage,
        content: serializeDashboardNewsEditorBlocks(contentBlocks),
        contentImageFiles: getDashboardNewsContentImageFiles(contentBlocks),
      });
    } catch (error) {
      reportError(error, {
        page: "DashboardNewsForm",
        action: isEditing ? "update_news" : "create_news",
      });
      setStatus("No pudimos guardar la noticia. Intentá de nuevo.");
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200">
          Noticias
        </p>
        <h2 className="mt-3 text-3xl font-black text-white">
          {isEditing ? "Editar noticia" : "Nueva noticia"}
        </h2>
        <p className="mt-2 text-sm text-violet-100/75">
          Cargá los datos principales y definí una portada para publicar la
          noticia directamente en el sitio.
        </p>
      </header>

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          className="space-y-5 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <Field
            id="dashboard-news-title"
            name="title"
            label="Título"
            value={values.title}
            error={errors.title}
            onChange={handleChange}
          />

          <TextAreaField
            id="dashboard-news-description"
            name="description"
            label="Descripción corta"
            value={values.description}
            error={errors.description}
            onChange={handleChange}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="dashboard-news-date"
              name="date"
              type="datetime-local"
              label="Fecha"
              value={toDatetimeLocalValue(values.date)}
              error={errors.date}
              onChange={handleChange}
            />
            <Field
              id="dashboard-news-slug"
              name="slug"
              label="Slug"
              value={values.slug}
              error={errors.slug}
              onChange={handleChange}
            />
          </div>

          <DashboardNewsContentEditor
            title={values.title}
            blocks={contentBlocks}
            error={contentError ?? undefined}
            onChange={(blocks) => {
              setContentBlocks(blocks);
              setContentError(null);
              setStatus(null);
            }}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="submit"
              variant="cta"
              disabled={saveMutation.isPending}
              className="rounded-full px-5 py-3"
            >
              {saveMutation.isPending ? "Guardando..." : "Guardar noticia"}
            </Button>
            <Link
              to={ROUTES.DASHBOARD_NEWS}
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-violet-200/35 hover:bg-white/[0.045]"
            >
              Cancelar
            </Link>
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
          <section className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
                  Imagen de portada
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-violet-100/65">
                  Obligatoria. Si quitás la imagen, se usa la portada por
                  defecto del club.
                </p>
              </div>
              <span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-100/70">
                16:9
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
              {coverPreviewSrc ? (
                <img
                  src={coverPreviewSrc}
                  alt={values.imageAlt || values.title || "Portada de la noticia"}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-[radial-gradient(circle,_rgba(124,58,237,0.22),_transparent_60%),linear-gradient(135deg,_#211336,_#060608)] text-center text-xs font-black uppercase tracking-[0.2em] text-violet-100/55">
                  Portada por defecto
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-2">
              <label
                htmlFor="dashboard-news-cover-image"
                className="inline-flex cursor-pointer items-center justify-center rounded-full border border-violet-200/20 bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-950 transition hover:bg-white"
              >
                Subir imagen
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
                className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white transition hover:border-violet-200/35 hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!coverPreviewSrc && useDefaultImage}
                onClick={handleRemoveCoverImage}
              >
                Quitar imagen
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

          <section className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
            <Field
              id="dashboard-news-image-alt"
              name="imageAlt"
              label="Texto alternativo"
              value={values.imageAlt}
              error={errors.imageAlt}
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

