// @ts-nocheck
import { useState } from "react";
import { Link } from "react-router-dom";
import GameWidget from "../../components/GameWidget/GameWidget";
import { FiMenu, FiX } from "react-icons/fi";

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
                src="/logo.webp"
                alt="Logo de Mentira FC"
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

      {/* MENU MOBILE */}
      <aside className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <button
          className="close-menu"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          <FiX size={28} />
        </button>

        <nav className="mobile-menu-links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default NavBar;