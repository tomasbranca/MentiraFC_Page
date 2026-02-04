import { FaInstagram, FaTiktok, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-neutral-950 text-violet-50 px-6 py-12 border-t border-violet-800/40 text-sm">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Marca */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.webp" alt="Mentira FC" className="w-12 h-12" />
            <h4 className="font-bold text-base tracking-wide">Mentira FC</h4>
          </div>
          <p className="text-violet-300 text-xs leading-relaxed max-w-xs">
            La mentira tiene patas cortas, pero la chot* larga.
          </p>
        </div>

        {/* Redes */}
        <div className="flex flex-col gap-4">
          <h5 className="font-semibold uppercase tracking-widest text-xs text-violet-300">
            Redes sociales
          </h5>

          <ul className="flex gap-5 items-center">
            <li>
              <a
                href="https://instagram.com/mentira.fc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-violet-200 hover:text-violet-50 transition text-xl"
              >
                <FaInstagram />
              </a>
            </li>

            <li>
              <a
                href="https://tiktok.com/@mentira.football"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-violet-200 hover:text-violet-50 transition text-xl"
              >
                <FaTiktok />
              </a>
            </li>
          </ul>
        </div>

        {/* Sponsors */}
        <div className="flex flex-col gap-4 items-start">
          <h5 className="font-semibold uppercase tracking-widest text-xs text-violet-300">
            Sponsors
          </h5>

          <a
            href="https://www.neokings.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-[160px]"
          >
            <img
              src="/sponsors/neokings.webp"
              alt="NeoKings"
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
          <h5 className="font-semibold uppercase tracking-widest text-xs text-violet-300">
            Contacto
          </h5>

          <p className="flex gap-3 items-center text-violet-200 text-sm">
            <FaEnvelope className="text-lg" />
            mentirafc@gmail.com
          </p>

          <div className="mt-2 flex flex-col gap-4">
            <h5 className="font-semibold uppercase tracking-widest text-xs text-violet-300">
              Diseño web
            </h5>
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
