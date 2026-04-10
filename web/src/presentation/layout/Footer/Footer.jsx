import { FaInstagram, FaTiktok, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-neutral-950 text-violet-50 px-6 py-12 border-t border-violet-800/40">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Marca */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.webp" alt="Mentira FC" className="w-12 h-12" />
            <h6 className="font-bold tracking-wide">Mentira FC</h6>
          </div>
          <p className="text-violet-300 leading-relaxed max-w-xs">
            La mentira tiene patas cortas, pero la chot* larga.
          </p>
        </div>

        {/* Redes */}
        <div className="flex flex-col gap-4">
          <h6 className="font-semibold uppercase tracking-widest text-violet-300">
            Redes sociales
          </h6>

          <ul className="flex gap-5 items-center">
            <li>
              <a
                href="https://instagram.com/mentira.fc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-violet-200 hover:text-violet-50 transition"
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
                className="text-violet-200 hover:text-violet-50 transition"
              >
                <FaTiktok />
              </a>
            </li>
          </ul>
        </div>

        {/* Sponsors */}
        <div className="flex flex-col gap-4 items-start">
          <h6 className="font-semibold uppercase tracking-widest text-violet-300">
            Sponsors
          </h6>

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
          <h6 className="font-semibold uppercase tracking-widest text-violet-300">
            Contacto
          </h6>

          <p className="flex gap-3 items-center text-violet-200">
            <FaEnvelope className="text-lg" />
            mentirafc@gmail.com
          </p>

          <div className="mt-2 flex flex-col gap-4">
            <h6 className="font-semibold uppercase tracking-widest text-violet-300">
              Diseño web
            </h6>
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
