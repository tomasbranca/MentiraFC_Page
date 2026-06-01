import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";

import {
  DEFAULT_FOOTER_SETTINGS,
  FOOTER_SOCIAL_PLATFORMS,
  type FooterSettings,
} from "../../../../shared/site/footerSettings";
import {
  fetchAdminFooterSettings,
  saveAdminFooterSettings,
} from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { confirmAdminAction } from "./adminConfirm";
import AdminPageShell from "./AdminPageShell";

const FOOTER_FORM_ID = "admin-footer-settings-form";

const makeId = (label: string, fallback: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;

const isSameSettings = (first: FooterSettings, second?: FooterSettings) =>
  Boolean(second) && JSON.stringify(first) === JSON.stringify(second);

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

const TextField = ({ label, value, placeholder, onChange }: FieldProps) => (
  <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
    {label}
    <input
      className="h-11 min-w-0 rounded-sm border border-neutral-200 px-3 text-sm normal-case tracking-normal text-[#17151d]"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const SectionHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h2 className="text-xl font-black uppercase leading-none text-[#17151d]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {description}
      </p>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

const AdminFooterSettings = () => {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: queryKeys.admin.footerSettings,
    queryFn: fetchAdminFooterSettings,
  });
  const [draft, setDraft] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const mutation = useMutation({
    mutationFn: saveAdminFooterSettings,
    onSuccess: async (settings) => {
      setDraft(settings);
      queryClient.setQueryData(queryKeys.footerSettings, settings);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.footerSettings,
      });
      toast.success("Footer actualizado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar.");
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  if (settingsQuery.isLoading) return <DashboardContentLoader />;

  if (settingsQuery.isError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar el footer"
          message="Sanity debe tener configuradas las variables y el write token para editar."
          onRetry={() => void settingsQuery.refetch()}
        />
      </div>
    );
  }

  const hasChanges = !isSameSettings(draft, settingsQuery.data);
  const handleSubmit = async () => {
    const confirmed = await confirmAdminAction({
      title: "Guardar footer",
      text: "Se actualizaran contacto, redes, links y sponsors visibles.",
      confirmButtonText: "Guardar",
    });

    if (confirmed) {
      mutation.mutate(draft);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Sanity"
      title="Footer y sponsors"
      description="Edita contacto, redes, links y sponsors. El nombre del club no forma parte de este formulario."
      actions={
        <Button
          type="submit"
          form={FOOTER_FORM_ID}
          className="w-full rounded-sm! px-3! py-2! text-xs! sm:size-10 sm:p-0!"
          disabled={!hasChanges || mutation.isPending}
          aria-label="Guardar footer"
          title="Guardar"
        >
          <FiSave className="size-4" aria-hidden="true" />
        </Button>
      }
      aside={
        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-2xl font-black leading-none">
                {draft.socials.length}
              </p>
              <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-violet-100/70">
                Redes
              </p>
            </div>
            <div>
              <p className="text-2xl font-black leading-none">
                {draft.links.length}
              </p>
              <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-violet-100/70">
                Links
              </p>
            </div>
            <div>
              <p className="text-2xl font-black leading-none">
                {draft.sponsors.length}
              </p>
              <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-violet-100/70">
                Sponsors
              </p>
            </div>
          </div>
          {hasChanges ? (
            <p className="mt-4 rounded-sm border border-amber-200/40 bg-amber-100/10 px-3 py-2 text-xs font-semibold text-amber-100">
              Hay cambios sin guardar.
            </p>
          ) : null}
        </div>
      }
    >
      <form
        id={FOOTER_FORM_ID}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <section className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]">
          <SectionHeader
            title="Contacto"
            description="Dato principal visible para consultas institucionales."
          />
          <div className="mt-4">
            <TextField
              label="Email de contacto"
              value={draft.contactEmail}
              placeholder="mentirafc@gmail.com"
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  contactEmail: value,
                }))
              }
            />
          </div>
        </section>

        <section className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]">
          <SectionHeader
            title="Redes sociales"
            description="Accesos externos que aparecen en el footer publico."
            action={
              <Button
                variant="light"
                className="w-full rounded-sm! px-3! py-2! text-xs! sm:size-10 sm:p-0!"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    socials: [
                      ...current.socials,
                      {
                        id: `social-${current.socials.length + 1}`,
                        label: "",
                        platform: "instagram",
                        url: "",
                      },
                    ],
                  }))
                }
                aria-label="Agregar red"
                title="Agregar"
              >
                <FiPlus className="size-4" aria-hidden="true" />
              </Button>
            }
          />
          <div className="mt-4 grid gap-3">
            {draft.socials.map((social, index) => (
              <article
                key={`${social.id}-${index}`}
                className="grid gap-3 rounded-sm border border-neutral-200 p-3 lg:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1.4fr)_7rem]"
              >
                <TextField
                  label="Nombre"
                  value={social.label}
                  placeholder="Instagram"
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      socials: current.socials.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              id: makeId(value, item.id),
                              label: value,
                            }
                          : item
                      ),
                    }))
                  }
                />
                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-neutral-500">
                  Plataforma
                  <select
                    className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-sm normal-case tracking-normal text-[#17151d]"
                    value={social.platform}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        socials: current.socials.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                platform:
                                  event.target.value as typeof social.platform,
                              }
                            : item
                        ),
                      }))
                    }
                  >
                    {FOOTER_SOCIAL_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="URL"
                  value={social.url}
                  placeholder="https://..."
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      socials: current.socials.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, url: value } : item
                      ),
                    }))
                  }
                />
                <Button
                  variant="light"
                  className="rounded-sm! px-3! py-2! text-xs! lg:size-10 lg:p-0! lg:self-end"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      socials: current.socials.filter(
                        (_item, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                  aria-label={`Quitar red ${social.label || index + 1}`}
                  title="Quitar"
                >
                  <FiTrash2 className="size-4" aria-hidden="true" />
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]">
          <SectionHeader
            title="Links"
            description="Enlaces secundarios del footer."
            action={
              <Button
                variant="light"
                className="w-full rounded-sm! px-3! py-2! text-xs! sm:size-10 sm:p-0!"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    links: [
                      ...current.links,
                      {
                        id: `link-${current.links.length + 1}`,
                        label: "",
                        url: "",
                      },
                    ],
                  }))
                }
                aria-label="Agregar link"
                title="Agregar"
              >
                <FiPlus className="size-4" aria-hidden="true" />
              </Button>
            }
          />
          <div className="mt-4 grid gap-3">
            {draft.links.map((link, index) => (
              <article
                key={`${link.id}-${index}`}
                className="grid gap-3 rounded-sm border border-neutral-200 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_7rem]"
              >
                <TextField
                  label="Texto"
                  value={link.label}
                  placeholder="Web design"
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      links: current.links.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              id: makeId(value, item.id),
                              label: value,
                            }
                          : item
                      ),
                    }))
                  }
                />
                <TextField
                  label="URL"
                  value={link.url}
                  placeholder="https://..."
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      links: current.links.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, url: value } : item
                      ),
                    }))
                  }
                />
                <Button
                  variant="light"
                  className="rounded-sm! px-3! py-2! text-xs! md:size-10 md:p-0! md:self-end"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      links: current.links.filter(
                        (_item, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                  aria-label={`Quitar link ${link.label || index + 1}`}
                  title="Quitar"
                >
                  <FiTrash2 className="size-4" aria-hidden="true" />
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)]">
          <SectionHeader
            title="Sponsors"
            description="Marcas visibles con logo y destino."
            action={
              <Button
                variant="light"
                className="w-full rounded-sm! px-3! py-2! text-xs! sm:size-10 sm:p-0!"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    sponsors: [
                      ...current.sponsors,
                      {
                        id: `sponsor-${current.sponsors.length + 1}`,
                        name: "",
                        url: "",
                        logoUrl: "",
                        logoAlt: "",
                      },
                    ],
                  }))
                }
                aria-label="Agregar sponsor"
                title="Agregar"
              >
                <FiPlus className="size-4" aria-hidden="true" />
              </Button>
            }
          />
          <div className="mt-4 grid gap-3">
            {draft.sponsors.map((sponsor, index) => (
              <article
                key={`${sponsor.id}-${index}`}
                className="grid gap-3 rounded-sm border border-neutral-200 p-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_7rem]"
              >
                <TextField
                  label="Nombre"
                  value={sponsor.name}
                  placeholder="Sponsor"
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              id: makeId(value, item.id),
                              name: value,
                            }
                          : item
                      ),
                    }))
                  }
                />
                <TextField
                  label="Link"
                  value={sponsor.url}
                  placeholder="https://..."
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, url: value } : item
                      ),
                    }))
                  }
                />
                <TextField
                  label="Logo URL"
                  value={sponsor.logoUrl}
                  placeholder="/sponsors/logo.webp"
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, logoUrl: value }
                          : item
                      ),
                    }))
                  }
                />
                <TextField
                  label="Alt"
                  value={sponsor.logoAlt}
                  placeholder="Nombre del sponsor"
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, logoAlt: value }
                          : item
                      ),
                    }))
                  }
                />
                <Button
                  variant="light"
                  className="rounded-sm! px-3! py-2! text-xs! xl:size-10 xl:p-0! xl:self-end"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.filter(
                        (_item, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                  aria-label={`Quitar sponsor ${sponsor.name || index + 1}`}
                  title="Quitar"
                >
                  <FiTrash2 className="size-4" aria-hidden="true" />
                </Button>
              </article>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-2 rounded-md border border-[#ded7ef] bg-white p-3 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            className="w-full rounded-sm! sm:size-10 sm:p-0!"
            disabled={!hasChanges || mutation.isPending}
            aria-label="Guardar footer"
            title="Guardar"
          >
            <FiSave className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
};

export default AdminFooterSettings;
