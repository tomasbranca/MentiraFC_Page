/**
 * Formatea una fecha a formato corto (default: es-AR)
 * Ej: 28/03/2026
 */
export const formatDate = (date, locale = "es-AR") => {
  if (!date) return "";

  return new Date(date).toLocaleDateString(locale);
};

/**
 * Formatea una fecha a formato largo
 * Ej: 28 de marzo de 2026
 */
export const formatLongDate = (date, locale = "es-AR") => {
  if (!date) return "";

  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * 🆕 Formatea fecha + hora
 * Ej: 28/03/2026 - 21:30
 * 👉 usar en Game / GameWidget
 */
export const formatDateTime = (date, locale = "es-AR") => {
  if (!date) return "";

  const d = new Date(date);

  const formattedDate = d.toLocaleDateString(locale);
  const formattedTime = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formattedDate} - ${formattedTime}`;
};

/**
 * Formato seguro para fechas tipo YYYY-MM-DD (evita problemas de timezone)
 * usar en PlayerDetail (birthDate)
 */
export const formatSafeDate = (date, locale = "es-AR") => {
  if (!date) return "";

  return new Date(date + "T00:00:00Z").toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

/**
 * Calcula edad a partir de fecha de nacimiento
 * usar en PlayerDetail
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};