import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Game from "../Game/Game";
import "./NavBar.css";

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 2);
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
      <nav className="navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="logo-link">
            <img
              src="/logo.webp"
              alt="Logo"
              className={`logo-transition ${
                isScrolled ? "logo-scrolled" : "logo-default"
              }`}
            />
          </Link>
          <ul className="nav-list">
            <li>
              <Link
                to="/noticias"
                className={`text-transition ${
                  isScrolled ? "text-scrolled" : "text-default"
                }`}
              >
                NOTICIAS
              </Link>
            </li>
            <li>
              <Link
                to="/plantel"
                className={`text-transition ${
                  isScrolled ? "text-scrolled" : "text-default"
                }`}
              >
                PLANTEL
              </Link>
            </li>
            <li>
              <Link
                to="/tabla"
                className={`text-transition ${
                  isScrolled ? "text-scrolled" : "text-default"
                }`}
              >
                TABLA
              </Link>
            </li>
            <li>
              <Link
                to="/historial"
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
