import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import Game from "../../components/GameWidget/GameWidget";
import "./NavBar.css";

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
  
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
  
      if (currentScrollY < lastScrollY) {
        // scrolleando para ARRIBA
        setIsScrolled(false);
      } else if (currentScrollY > lastScrollY) {
        // scrolleando para ABAJO
        setIsScrolled(true);
      }
  
      lastScrollY = currentScrollY;
    };
  
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  return (
    <header
      className={`navbar navbar-transition ${
        isScrolled ? "navbar-scrolled" : "navbar-default"
      }`}
    >
      <nav className="navbar-inner" aria-label="Menú de navegación principal">
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
          <ul className="nav-list">
            <li>
              <Link
                to={ROUTES.NEWS}
                className={`text-transition ${
                  isScrolled ? "text-scrolled" : "text-default"
                }`}
              >
                NOTICIAS
              </Link>
            </li>
            <li>
              <Link
                to={ROUTES.TEAM}
                className={`text-transition ${
                  isScrolled ? "text-scrolled" : "text-default"
                }`}
              >
                PLANTEL
              </Link>
            </li>
            <li>
              <Link
                to={ROUTES.TABLE}
                className={`text-transition ${
                  isScrolled ? "text-scrolled" : "text-default"
                }`}
              >
                TABLA
              </Link>
            </li>
            <li>
              <Link
                to={ROUTES.RECORD}
                className={`text-transition ${
                  isScrolled ? "text-scrolled" : "text-default"
                }`}
              >
                HISTORIAL
              </Link>
            </li>
          </ul>
        </div>
        <div className="navbar-right">
          <Game />
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
