import { describe, expect, it } from "vitest";

import {
  createEmptyAuthFormValues,
  validateAuthForm,
} from "./login.utils";

describe("validateAuthForm", () => {
  it("exige correo y contraseña al iniciar sesión", () => {
    const errors = validateAuthForm("signIn", createEmptyAuthFormValues());

    expect(errors).toEqual({
      email: "Ingresá tu correo electrónico.",
      password: "Ingresá una contraseña.",
    });
  });

  it("exige datos completos y contraseña fuerte al crear cuenta", () => {
    const errors = validateAuthForm("signUp", {
      firstName: "",
      lastName: "",
      email: "mail-invalido",
      password: "abc123",
      confirmPassword: "otra",
    });

    expect(errors).toEqual({
      email: "Ingresá un correo electrónico válido.",
      firstName: "Ingresá tu nombre.",
      lastName: "Ingresá tu apellido.",
      password:
        "Usá al menos 8 caracteres, con una mayúscula, una minúscula y un número.",
      confirmPassword: "Las contraseñas no coinciden.",
    });
  });

  it("acepta un registro válido", () => {
    const errors = validateAuthForm("signUp", {
      firstName: "Tomas",
      lastName: "Pérez",
      email: "tomas@example.com",
      password: "Mentira123",
      confirmPassword: "Mentira123",
    });

    expect(errors).toEqual({});
  });
});
