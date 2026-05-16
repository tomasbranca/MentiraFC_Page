import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import Login from "./Login";

describe("Login", () => {
  it("renderiza el estado inicial de ingreso con accesos secundarios", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(markup).toContain("Acceso institucional");
    expect(markup).toContain("Bienvenido de nuevo");
    expect(markup).toContain("Ingresar");
    expect(markup).toContain("Crear cuenta");
    expect(markup).toContain("Recordarme");
    expect(markup).toContain("¿Olvidaste tu contraseña?");
    expect(markup).toContain("Correo electrónico");
    expect(markup).toContain("Contraseña");
    expect(markup).toContain("Volver al sitio");
  });

  it("incluye nombre y apellido al crear una cuenta", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <Login initialMode="signUp" />
      </MemoryRouter>
    );

    expect(markup).toContain("Nombre");
    expect(markup).toContain("Apellido");
    expect(markup).toContain('autoComplete="given-name"');
    expect(markup).toContain('autoComplete="family-name"');
  });
});
