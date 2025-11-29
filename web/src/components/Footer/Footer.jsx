const Footer = () => {
  return (
    <footer className="bg-neutral-950 text-violet-50 px-6 py-10 border-t border-violet-800 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        <div className="flex flex-col gap-2">
          <img src="/logo.webp" alt="Mentira FC" className="w-12 h-12" />
          <h4 className="font-bold text-base">Mentira FC</h4>
          <p className="text-violet-200 text-xs">
            La mentira tiene patas cortas, pero la chot* larga.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h5 className="font-semibold uppercase">Redes sociales</h5>
          <ul className="flex gap-4 items-center">
            <li>
              <a
                href="https://instagram.com/mentira.fc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6 fill-violet-50 hover:fill-violet-300 transition">
                  <use xlinkHref="/sprite.svg#instagram" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://tiktok.com/@mentira.football"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <svg className="w-6 h-6 fill-violet-50 hover:fill-violet-300 transition">
                  <use xlinkHref="/sprite.svg#tiktok" />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h5 className="font-semibold uppercase">Contacto</h5>
          <p className="flex gap-2 text-center items-center">
            <svg className="w-6 h-6 fill-violet-50">
              <use xlinkHref="/sprite.svg#mail" />
            </svg>
            mentirafc@gmail.com</p>
          <h5 className="font-semibold uppercase mt-4">Diseño web</h5>
          <p>
            Hecho por{" "}
            <a
              href="https://instagram.com/tbcore.sys"
              className="underline hover:text-violet-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              @tbcore.sys
            </a>
          </p>
        </div>
      </div>

      {/* Pie de copyright */}
      <div className="text-center text-xs text-violet-400 mt-10">
        &copy; {new Date().getFullYear()} Mentira FC. Todos los derechos
        inventados.
      </div>
    </footer>
  );
};

export default Footer;
