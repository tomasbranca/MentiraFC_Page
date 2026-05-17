import { describe, expect, it } from "vitest";

import {
  createEmptyAuthFormValues,
  getSignUpErrorMessage,
  SIGN_UP_INVALID_DATA_MESSAGE,
  SIGN_UP_RATE_LIMIT_MESSAGE,
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

describe("getSignUpErrorMessage", () => {
  it("muestra tráfico alto cuando Supabase limita el envío de emails", () => {
    expect(
      getSignUpErrorMessage({
        code: "over_email_send_rate_limit",
        status: 429,
      })
    ).toBe(SIGN_UP_RATE_LIMIT_MESSAGE);
  });

  it("muestra tráfico alto cuando Supabase limita solicitudes por IP", () => {
    expect(
      getSignUpErrorMessage({
        code: "over_request_rate_limit",
      })
    ).toBe(SIGN_UP_RATE_LIMIT_MESSAGE);
  });

  it("mantiene el mensaje de datos inválidos para otros errores", () => {
    expect(
      getSignUpErrorMessage({
        code: "email_exists",
        status: 400,
      })
    ).toBe(SIGN_UP_INVALID_DATA_MESSAGE);
  });
});
