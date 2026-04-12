// @ts-nocheck
import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

import { NAV_LINKS } from "./navbar.constants";
import { useNavBarScroll } from "./hooks/useNavBarScroll";

import "./NavBar.css";

const GameWidget = lazy(() => import("../../components/GameWidget/GameWidget"));

const GameWidgetFallback = ({ compact = false }) => (
  <div
    className={compact ? "h-10 w-28 rounded bg-violet-700/40" : "h-12 w-56 rounded bg-violet-700/40"}
    aria-hidden="true"
  />
);

const NavBar = () => {
  const isScrolled = useNavBarScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGameWidget, setShowGameWidget] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowGameWidget(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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
            {showGameWidget ? (
              <Suspense fallback={<GameWidgetFallback compact />}>
                <GameWidget compact />
              </Suspense>
            ) : (
              <GameWidgetFallback compact />
            )}
          </div>

          {/* DERECHA */}
          <div className="navbar-right">
            <div className="desktop-only">
              {showGameWidget ? (
                <Suspense fallback={<GameWidgetFallback />}>
                  <GameWidget />
                </Suspense>
              ) : (
                <GameWidgetFallback />
              )}
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
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}

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
