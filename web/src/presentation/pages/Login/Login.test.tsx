import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Login from "./Login";

describe("Login", () => {
  it("renderiza el estado inicial de ingreso con accesos secundarios", () => {
    const markup = renderToStaticMarkup(<Login />);

    expect(markup).toContain("Acceso institucional");
    expect(markup).toContain("Bienvenido de nuevo");
    expect(markup).toContain("Ingresar");
    expect(markup).toContain("Crear cuenta");
    expect(markup).toContain("Recordarme");
    expect(markup).toContain("¿Olvidaste tu contraseña?");
    expect(markup).toContain("Correo electrónico");
    expect(markup).toContain("Contraseña");
  });
});
