import { useQuery } from "@tanstack/react-query";
import { FiExternalLink } from "react-icons/fi";

import { getFooterSettings } from "../../../data/footerSettings";
import { queryKeys } from "../../../data/queryKeys";
import { DEFAULT_FOOTER_SETTINGS } from "../../../../shared/site/footerSettings";
import {
  InstagramIcon,
  MailIcon,
  TikTokIcon,
} from "../../components/icons/InlineIcons";
import { SITE_LOGO_ASSETS } from "../../constants/assets.constants";
import { useInitialData } from "../../context/useInitialData";

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case "instagram":
      return InstagramIcon;
    case "tiktok":
      return TikTokIcon;
    default:
      return FiExternalLink;
  }
};

const Footer = () => {
  const { initialData } = useInitialData();
  const footerSettingsQuery = useQuery({
    queryKey: queryKeys.footerSettings,
    queryFn: getFooterSettings,
    initialData: initialData.footerSettings,
    staleTime: 1000 * 60 * 5,
  });
  const settings = footerSettingsQuery.data ?? DEFAULT_FOOTER_SETTINGS;
  const socials = settings.socials.length
    ? settings.socials
    : DEFAULT_FOOTER_SETTINGS.socials;
  const links = settings.links.length
    ? settings.links
    : DEFAULT_FOOTER_SETTINGS.links;
  const sponsors = settings.sponsors.length
    ? settings.sponsors
    : DEFAULT_FOOTER_SETTINGS.sponsors;

  return (
    <footer className="bg-neutral-950 text-violet-50 px-4 sm:px-6 py-10 sm:py-12 border-t border-violet-800/40">
      <div
        className="
          max-w-7xl mx-auto
          grid grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-4
          gap-10 sm:gap-8
        "
      >
        <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <img
              src={SITE_LOGO_ASSETS.small}
              alt="Logo Mentira FC"
              width={48}
              height={48}
              className="w-11 h-11 sm:w-12 sm:h-12"
            />

            <p className="font-bold tracking-wide text-base sm:text-lg">
              Mentira FC
            </p>
          </div>

          <p className="text-violet-300 leading-relaxed text-sm sm:text-base max-w-xs">
            Sitio oficial del club amateur.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
            Redes sociales
          </p>

          <ul className="flex flex-wrap gap-5 items-center">
            {socials.map((social) => {
              const Icon = getSocialIcon(social.platform);

              return (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-violet-200 hover:text-violet-50 transition"
                  >
                    <Icon width={18} height={18} />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-4 items-start">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
            Sponsors
          </p>

          <ul className="flex flex-wrap items-center gap-4">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id}>
                <a
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block max-w-32 sm:max-w-36 lg:max-w-40"
                >
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.logoAlt || sponsor.name}
                    width={160}
                    height={107}
                    loading="lazy"
                    decoding="async"
                    className="
                      w-full
                      object-contain
                      opacity-80
                      hover:opacity-100
                      hover:scale-105
                      transition
                      duration-300
                    "
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
            Contacto
          </p>

          <a
            href={`mailto:${settings.contactEmail}`}
            className="flex gap-3 items-center text-violet-200 text-sm sm:text-base break-all transition hover:text-violet-50"
          >
            <MailIcon width={18} height={18} />
            {settings.contactEmail}
          </a>

          <div className="mt-2 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
              Links
            </p>

            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    className="inline-flex items-center gap-2 text-sm text-violet-200 underline transition hover:text-violet-50"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <FiExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-violet-400 mt-10 sm:mt-12">
        &copy; {new Date().getFullYear()} Mentira FC. Todos los derechos
        reservados.
      </div>
    </footer>
  );
};

export default Footer;
