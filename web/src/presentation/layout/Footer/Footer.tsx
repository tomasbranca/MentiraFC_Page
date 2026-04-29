// @ts-nocheck
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
    <footer className="bg-neutral-950 text-violet-50 px-6 py-12 border-t border-violet-800/40">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Marca */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <img
              src={SITE_LOGO_ASSETS.small}
              alt=""
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <p className="font-bold tracking-wide">Mentira FC</p>
          </div>
          <p className="text-violet-300 leading-relaxed max-w-xs">
            La mentira tiene patas cortas, pero la chot* larga.
          </p>
        </div>

        {/* Redes */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold uppercase tracking-widest text-violet-300">
            Redes sociales
          </h2>

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
          <h2 className="font-semibold uppercase tracking-widest text-violet-300">
            Sponsors
          </h2>

          <a
            href="https://www.neokings.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-40"
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
          <h2 className="font-semibold uppercase tracking-widest text-violet-300">
            Contacto
          </h2>

          <p className="flex gap-3 items-center text-violet-200">
            <MailIcon width={18} height={18} />
            mentirafc@gmail.com
          </p>

          <div className="mt-2 flex flex-col gap-4">
            <h3 className="font-semibold uppercase tracking-widest text-violet-300">
              Diseño web
            </h3>
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
      <div className="text-center text-xs text-violet-400 mt-12">
        &copy; {new Date().getFullYear()} Mentira FC. Todos los derechos
        inventados.
      </div>
    </footer>
  );
};

export default Footer;
