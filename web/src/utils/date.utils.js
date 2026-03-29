// ===============================
// PARSER CENTRAL (LA CLAVE DE TODO)
// ===============================

const meses = {
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

export const parseDate = (date) => {
  if (!date) return null;

  // Ya es Date válido
  if (date instanceof Date) return date;

  // ===============================
  // YYYY-MM-DD (FORMATO IDEAL)
  // ===============================
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day); // LOCAL → evita bug de timezone
  }

  // ===============================
  // "3 de marzo de 2003"
  // ===============================
  if (typeof date === "string" && date.toLowerCase().includes("de")) {
    const parts = date.toLowerCase().split(" ");

    if (parts.length >= 5) {
      const dia = Number(parts[0]);
      const mes = meses[parts[2]];
      const anio = Number(parts[4]);

      if (!isNaN(dia) && mes !== undefined && !isNaN(anio)) {
        return new Date(anio, mes, dia);
      }
    }
  }

  // ===============================
  // FALLBACK (ÚLTIMO RECURSO)
  // ===============================
  const fallback = new Date(date);
  return isNaN(fallback.getTime()) ? null : fallback;
};



// ===============================
// FORMATTERS
// ===============================

export const formatDate = (date, locale = "es-AR") => {
  const d = parseDate(date);
  if (!d) return "";

  return d.toLocaleDateString(locale);
};

export const formatLongDate = (date, locale = "es-AR") => {
  const d = parseDate(date);
  if (!d) return "";

  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatDateTime = (date, locale = "es-AR") => {
  const d = parseDate(date);
  if (!d) return "";

  const formattedDate = d.toLocaleDateString(locale);
  const formattedTime = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formattedDate} - ${formattedTime}`;
};

// ===============================
// EDAD
// ===============================

export const calculateAge = (birthDate) => {
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