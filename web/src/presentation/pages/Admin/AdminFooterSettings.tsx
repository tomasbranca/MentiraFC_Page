import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

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
import AdminPageShell from "./AdminPageShell";

const makeId = (label: string, fallback: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;

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

  return (
    <AdminPageShell
      eyebrow="Sanity"
      title="Footer y sponsors"
      description="Edita contacto, redes, links y sponsors. El nombre del club no forma parte de este formulario."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void mutation.mutate(draft);
        }}
      >
        <section className="rounded-md border border-[#ded7ef] bg-white p-4">
          <label
            className="text-sm font-bold text-[#17151d]"
            htmlFor="footer-contact-email"
          >
            Email de contacto
          </label>
          <input
            id="footer-contact-email"
            className="mt-2 h-11 w-full rounded-sm border border-neutral-200 px-3 text-sm"
            value={draft.contactEmail}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                contactEmail: event.target.value,
              }))
            }
          />
        </section>

        <section className="rounded-md border border-[#ded7ef] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black uppercase text-[#17151d]">
              Redes sociales
            </h2>
            <Button
              variant="secondary"
              className="rounded-sm! px-3! py-2! text-xs!"
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
            >
              Agregar
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {draft.socials.map((social, index) => (
              <div
                key={`${social.id}-${index}`}
                className="grid gap-2 rounded-sm border border-neutral-200 p-3 md:grid-cols-[1fr_10rem_1.5fr_auto]"
              >
                <input
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  placeholder="Nombre"
                  value={social.label}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      socials: current.socials.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              id: makeId(event.target.value, item.id),
                              label: event.target.value,
                            }
                          : item
                      ),
                    }))
                  }
                />
                <select
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  value={social.platform}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      socials: current.socials.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              platform: event.target.value as typeof social.platform,
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
                <input
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  placeholder="https://..."
                  value={social.url}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      socials: current.socials.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, url: event.target.value }
                          : item
                      ),
                    }))
                  }
                />
                <Button
                  variant="secondary"
                  className="rounded-sm! px-3! py-2! text-xs!"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      socials: current.socials.filter(
                        (_item, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#ded7ef] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black uppercase text-[#17151d]">
              Links
            </h2>
            <Button
              variant="secondary"
              className="rounded-sm! px-3! py-2! text-xs!"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  links: [
                    ...current.links,
                    { id: `link-${current.links.length + 1}`, label: "", url: "" },
                  ],
                }))
              }
            >
              Agregar
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {draft.links.map((link, index) => (
              <div
                key={`${link.id}-${index}`}
                className="grid gap-2 rounded-sm border border-neutral-200 p-3 md:grid-cols-[1fr_1.5fr_auto]"
              >
                <input
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  placeholder="Texto"
                  value={link.label}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      links: current.links.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              id: makeId(event.target.value, item.id),
                              label: event.target.value,
                            }
                          : item
                      ),
                    }))
                  }
                />
                <input
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  placeholder="https://..."
                  value={link.url}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      links: current.links.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, url: event.target.value }
                          : item
                      ),
                    }))
                  }
                />
                <Button
                  variant="secondary"
                  className="rounded-sm! px-3! py-2! text-xs!"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      links: current.links.filter(
                        (_item, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#ded7ef] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black uppercase text-[#17151d]">
              Sponsors
            </h2>
            <Button
              variant="secondary"
              className="rounded-sm! px-3! py-2! text-xs!"
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
            >
              Agregar
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {draft.sponsors.map((sponsor, index) => (
              <div
                key={`${sponsor.id}-${index}`}
                className="grid gap-2 rounded-sm border border-neutral-200 p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
              >
                <input
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  placeholder="Nombre"
                  value={sponsor.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              id: makeId(event.target.value, item.id),
                              name: event.target.value,
                            }
                          : item
                      ),
                    }))
                  }
                />
                <input
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  placeholder="Link"
                  value={sponsor.url}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, url: event.target.value }
                          : item
                      ),
                    }))
                  }
                />
                <input
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  placeholder="Logo URL"
                  value={sponsor.logoUrl}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, logoUrl: event.target.value }
                          : item
                      ),
                    }))
                  }
                />
                <input
                  className="h-11 rounded-sm border border-neutral-200 px-3 text-sm"
                  placeholder="Alt"
                  value={sponsor.logoAlt}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, logoAlt: event.target.value }
                          : item
                      ),
                    }))
                  }
                />
                <Button
                  variant="secondary"
                  className="rounded-sm! px-3! py-2! text-xs!"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      sponsors: current.sponsors.filter(
                        (_item, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar footer"}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
};

export default AdminFooterSettings;
