import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import GameWidget from "../../components/GameWidget/GameWidget";
import { FiMenu, FiX } from "react-icons/fi";
import "./NavBar.css";

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        setIsScrolled(true); // bajando
      } else if (currentScrollY < lastScrollY) {
        setIsScrolled(false); // subiendo
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`navbar navbar-transition ${
          isScrolled ? "navbar-scrolled" : "navbar-default"
        }`}
      >
        <nav className="navbar-inner">
          {/* IZQUIERDA: LOGO (DESKTOP) + LINKS/ LOGO (MOBILE) */}
          <div className="navbar-left">
            <Link to={ROUTES.HOME} className="logo-link">
              <img
                src="/logo.webp"
                alt="Logo de Mentira FC"
                className={`logo-transition ${
                  isScrolled ? "logo-scrolled" : "logo-default"
                }`}
              />
            </Link>
            <ul className="nav-list desktop-only">
              <li><Link to={ROUTES.NEWS}>NOTICIAS</Link></li>
              <li><Link to={ROUTES.TEAM}>PLANTEL</Link></li>
              <li><Link to={ROUTES.TABLE}>TABLA</Link></li>
              <li><Link to={ROUTES.RECORD}>HISTORIAL</Link></li>
            </ul>
          </div>

          {/* GAME WIDGET CENTRADO EN MOBILE */}
          <div className="mobile-game-center mobile-only">
            <GameWidget compact />
          </div>

          {/* DERECHA */}
          <div className="navbar-right">
            <div className="desktop-only">
              <GameWidget />
            </div>

            <button
              className="burger-button mobile-only"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <FiMenu size={26} />
            </button>
          </div>
        </nav>
      </header>

      {/* OVERLAY */}
      {menuOpen && (
        <div
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* MENÚ MOBILE */}
      <aside className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <button
          className="close-menu"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          <FiX size={28} />
        </button>

        <nav className="mobile-menu-links">
          <Link to={ROUTES.NEWS} onClick={() => setMenuOpen(false)}>NOTICIAS</Link>
          <Link to={ROUTES.TEAM} onClick={() => setMenuOpen(false)}>PLANTEL</Link>
          <Link to={ROUTES.TABLE} onClick={() => setMenuOpen(false)}>TABLA</Link>
          <Link to={ROUTES.RECORD} onClick={() => setMenuOpen(false)}>HISTORIAL</Link>
        </nav>
      </aside>
    </>
  );
};

export default NavBar;
