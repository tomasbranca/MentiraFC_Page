const meses: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

export const parseDate = (
  date: string | Date | null | undefined
): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;

  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (typeof date === "string" && date.toLowerCase().includes("de")) {
    const parts = date.toLowerCase().split(" ");

    if (parts.length >= 5) {
      const dia = Number(parts[0]);
      const mes = meses[parts[2]];
      const anio = Number(parts[4]);

      if (!Number.isNaN(dia) && mes !== undefined && !Number.isNaN(anio)) {
        return new Date(anio, mes, dia);
      }
    }
  }

  const fallback = new Date(date);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const formatDate = (
  date: string | Date | null | undefined,
  locale = "es-AR"
): string => {
  const d = parseDate(date);
  if (!d) return "";

  return d.toLocaleDateString(locale);
};

export const formatLongDate = (
  date: string | Date | null | undefined,
  locale = "es-AR"
): string => {
  const d = parseDate(date);
  if (!d) return "";

  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatCommentRelativeDate = (
  date: string | Date | null | undefined,
  locale = "es-AR"
): string => {
  const parsed = parseDate(date);

  if (!parsed) {
    return "";
  }

  const diffMs = Date.now() - parsed.getTime();

  if (diffMs < 0) {
    return "ahora";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "ahora";
  }

  if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `hace ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return diffDays === 1 ? "hace 1 dia" : `hace ${diffDays} dias`;
  }

  return parsed.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: parsed.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
};

export const formatDateTime = (
  date: string | Date | null | undefined,
  locale = "es-AR"
): string => {
  const d = parseDate(date);
  if (!d) return "";

  const formattedDate = d.toLocaleDateString(locale);
  const formattedTime = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formattedDate} - ${formattedTime}`;
};

export const calculateAge = (
  birthDate: string | Date | null | undefined
): number | null => {
  const birth = parseDate(birthDate);
  if (!birth) return null;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};
