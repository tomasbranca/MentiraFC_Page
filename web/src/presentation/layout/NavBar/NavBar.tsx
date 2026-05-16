import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import GameWidget from "../../components/GameWidget/GameWidget";
import {
  ChevronDownIcon,
  CloseIcon,
  MenuIcon,
} from "../../components/icons/InlineIcons";
import {
  SITE_LOGO_ASSETS,
  SITE_LOGO_SIZES,
  SITE_LOGO_SRC_SET,
} from "../../constants/assets.constants";
import { ROUTES } from "../../constants/routes.constants";
import { useAuth } from "../../context/useAuth";

import {
  ACCOUNT_MENU_ITEMS,
  AUTH_LINK,
  NAV_LINKS,
} from "./navbar.constants";
import { useNavBarScroll } from "./hooks/useNavBarScroll";

import "./NavBar.css";

const getDisplayName = (user: ReturnType<typeof useAuth>["user"]): string => {
  const metadata = user?.user_metadata;
  const firstName =
    typeof metadata?.first_name === "string" ? metadata.first_name.trim() : "";

  if (firstName) {
    return firstName;
  }

  const emailName = user?.email?.split("@")[0]?.trim();

  return emailName || "Cuenta";
};

const NavBar = () => {
  const isScrolled = useNavBarScroll();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const displayName = getDisplayName(user);

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    await signOut();
    setAccountMenuOpen(false);
    setMenuOpen(false);
    navigate(ROUTES.HOME);
  };

  return (
    <>
      <header
        className={`navbar navbar-transition ${
          isScrolled ? "navbar-scrolled" : "navbar-default"
        }`}
      >
        <nav className="navbar-inner">
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

          <div className="mobile-game-center mobile-only">
            <GameWidget compact />
          </div>

          <div className="navbar-right">
            <div className="desktop-only">
              <GameWidget />
            </div>

            {isAuthLoading ? (
              <div
                aria-hidden="true"
                className="account-placeholder desktop-only"
              />
            ) : user ? (
              <div
                ref={accountMenuRef}
                className="account-menu-shell desktop-only"
              >
                <button
                  type="button"
                  className="account-trigger"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() =>
                    setAccountMenuOpen((currentValue) => !currentValue)
                  }
                >
                  <span className="account-trigger-label">{displayName}</span>
                  <ChevronDownIcon width={16} height={16} />
                </button>

                {accountMenuOpen && (
                  <div className="account-dropdown" role="menu">
                    {ACCOUNT_MENU_ITEMS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        disabled={!item.enabled}
                        className="account-dropdown-item"
                        role="menuitem"
                      >
                        {item.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="account-dropdown-item account-dropdown-logout"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to={AUTH_LINK.to} className="login-link desktop-only">
                {AUTH_LINK.label}
              </Link>
            )}

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

      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
      )}

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

        {isAuthLoading ? (
          <div aria-hidden="true" className="mobile-account-placeholder" />
        ) : user ? (
          <div className="mobile-account-section">
            <p className="mobile-account-name">{displayName}</p>
            <button
              type="button"
              className="mobile-account-action"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link
            to={AUTH_LINK.to}
            className="mobile-login-link"
            onClick={() => setMenuOpen(false)}
          >
            {AUTH_LINK.label}
          </Link>
        )}
      </aside>
    </>
  );
};

export default NavBar;
