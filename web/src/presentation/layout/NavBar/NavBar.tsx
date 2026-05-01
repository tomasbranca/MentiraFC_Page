import { useState } from "react";
import { Link } from "react-router-dom";
import GameWidget from "../../components/GameWidget/GameWidget";
import { CloseIcon, MenuIcon } from "../../components/icons/InlineIcons";
import {
  SITE_LOGO_ASSETS,
  SITE_LOGO_SIZES,
  SITE_LOGO_SRC_SET,
} from "../../constants/assets.constants";

import { NAV_LINKS } from "./navbar.constants";
import { useNavBarScroll } from "./hooks/useNavBarScroll";

import "./NavBar.css";

const NavBar = () => {
  const isScrolled = useNavBarScroll();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className={`navbar navbar-transition ${
          isScrolled ? "navbar-scrolled" : "navbar-default"
        }`}
      >
        <nav className="navbar-inner">
          {/* IZQUIERDA */}
          <div className="navbar-left">
            <Link to="/" className="logo-link">
              <img
                src={SITE_LOGO_ASSETS.large}
                srcSet={SITE_LOGO_SRC_SET}
                sizes={SITE_LOGO_SIZES}
                alt="Logo de Mentira FC"
                width={160}
                height={160}
                className={`logo-transition ${
                  isScrolled ? "logo-scrolled" : "logo-default"
                }`}
              />
            </Link>

            <ul className="nav-list desktop-only">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* MOBILE GAME */}
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
              <MenuIcon width={26} height={26} />
            </button>
          </div>
        </nav>
      </header>

      {/* OVERLAY */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* MENU MOBILE */}
      <aside className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <button
          className="close-menu"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          <CloseIcon width={28} height={28} />
        </button>

        <nav className="mobile-menu-links">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default NavBar;
