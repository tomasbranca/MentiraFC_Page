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
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardNewsErrors } from "./dashboardNews.utils";
import type { DashboardNewsInput } from "../../../types/dashboard";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { ROUTES } from "../../constants/routes.constants";
import {
  buildNewsSlug,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  validateDashboardNewsInput,
} from "./dashboardNews.utils";

const createInitialValues = (): DashboardNewsInput => ({
  title: "",
  description: "",
  date: new Date().toISOString(),
  slug: "",
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
    });
    setSlugTouched(true);
  }, [newsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (input: DashboardNewsInput) =>
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

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    if (name === "title") {
      setValues((currentValues) => ({
        ...currentValues,
        title: value,
        slug: slugTouched ? currentValues.slug : buildNewsSlug(value),
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

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
    setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      slug: values.slug.trim(),
    };
    const nextErrors = validateDashboardNewsInput(normalizedValues);
    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await saveMutation.mutateAsync(normalizedValues);
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
          En esta primera versión podés editar los datos principales. El contenido
          y la imagen se completan con material de ejemplo hasta sumar el editor
          avanzado.
        </p>
      </header>

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
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
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Imagen
            </h3>
            <p className="mt-3 text-sm text-violet-100/75">
              Por ahora se usa una imagen de ejemplo del club.
            </p>
          </section>

          <section className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Contenido
            </h3>
            <p className="mt-3 text-sm text-violet-100/75">
              La noticia nace con un texto de ejemplo para mantenerla completa.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

type FieldProps = {
  id: string;
  name: keyof DashboardNewsInput;
  label: string;
  value: string;
  error?: string;
  type?: "text" | "datetime-local";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const Field = ({
  id,
  name,
  label,
  value,
  error,
  type = "text",
  onChange,
}: FieldProps) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-violet-100">
        {label}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
      />
      {error && (
        <span id={errorId} className="mt-2 block text-sm text-red-300">
          {error}
        </span>
      )}
    </label>
  );
};

type TextAreaFieldProps = {
  id: string;
  name: "description";
  label: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

const TextAreaField = ({
  id,
  name,
  label,
  value,
  error,
  onChange,
}: TextAreaFieldProps) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-violet-100">
        {label}
      </span>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        rows={5}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
      />
      {error && (
        <span id={errorId} className="mt-2 block text-sm text-red-300">
          {error}
        </span>
      )}
    </label>
  );
};

export default DashboardNewsForm;
