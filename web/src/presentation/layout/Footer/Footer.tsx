import {
  InstagramIcon,
  MailIcon,
  TikTokIcon,
} from "../../components/icons/InlineIcons";
import {
  NEOKINGS_ASSET,
  SITE_LOGO_ASSETS,
} from "../../constants/assets.constants";

const Footer = () => {
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
        {/* Marca */}
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
            La mentira tiene patas cortas, pero la chot* larga.
          </p>
        </div>

        {/* Redes */}
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
            Redes sociales
          </p>

          <ul className="flex gap-5 items-center">
            <li>
              <a
                href="https://instagram.com/mentira.fc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-violet-200 hover:text-violet-50 transition"
              >
                <InstagramIcon width={18} height={18} />
              </a>
            </li>

            <li>
              <a
                href="https://tiktok.com/@mentira.football"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-violet-200 hover:text-violet-50 transition"
              >
                <TikTokIcon width={18} height={18} />
              </a>
            </li>
          </ul>
        </div>

        {/* Sponsors */}
        <div className="flex flex-col gap-4 items-start">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
            Sponsors
          </p>

          <a
            href="https://www.neokings.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-32 sm:max-w-36 lg:max-w-40"
          >
            <img
              src={NEOKINGS_ASSET.src}
              alt="NeoKings"
              width={NEOKINGS_ASSET.width}
              height={NEOKINGS_ASSET.height}
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
        </div>

        {/* Contacto */}
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
            Contacto
          </p>

          <p className="flex gap-3 items-center text-violet-200 text-sm sm:text-base break-all">
            <MailIcon width={18} height={18} />
            mentirafc@gmail.com
          </p>

          <div className="mt-2 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
              Diseño web
            </p>

            <p className="text-violet-200 text-sm">
              Hecho por{" "}
              <a
                href="https://instagram.com/bicore.erp"
                className="underline hover:text-violet-50 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                @bicore.erp
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-xs text-violet-400 mt-10 sm:mt-12">
        &copy; {new Date().getFullYear()} Mentira FC. Todos los derechos
        inventados.
      </div>
    </footer>
  );
};

export default Footer;
