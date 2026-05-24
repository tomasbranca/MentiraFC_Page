import {
  DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_PLAYER_IMAGE_MAX_BYTES,
  DASHBOARD_PLAYER_IMAGE_MAX_MEGAPIXELS,
  type DashboardPlayerDraftMutationInput,
  type DashboardPlayerFieldRatingsInput,
  type DashboardPlayerGoalkeeperRatingsInput,
  type DashboardPlayerInput,
  type DashboardPlayerItem,
  type DashboardPlayerMutationInput,
  type DashboardPlayerPosition,
} from "../../../types/dashboard";

export type DashboardPlayerErrors = Partial<
  Record<keyof Omit<DashboardPlayerInput, "fieldRatings" | "goalkeeperRatings">, string>
>;

export const PLAYER_POSITION_OPTIONS: Array<{
  value: DashboardPlayerPosition;
  label: string;
}> = [
  { value: "arq", label: "Arquero" },
  { value: "def", label: "Defensa" },
  { value: "med", label: "Mediocampista" },
  { value: "del", label: "Delantero" },
];

export const PLAYER_DOMINANT_FOOT_OPTIONS = [
  { value: "right", label: "Derecho" },
  { value: "left", label: "Zurdo" },
] as const;

export const FIELD_RATING_FIELDS: Array<{
  name: keyof DashboardPlayerFieldRatingsInput;
  label: string;
}> = [
  { name: "speed", label: "Velocidad" },
  { name: "shooting", label: "Tiro" },
  { name: "passing", label: "Pase" },
  { name: "dribbling", label: "Regate" },
  { name: "defense", label: "Defensa" },
  { name: "physical", label: "Fisico" },
];

export const GOALKEEPER_RATING_FIELDS: Array<{
  name: keyof DashboardPlayerGoalkeeperRatingsInput;
  label: string;
}> = [
  { name: "jumping", label: "Salto" },
  { name: "saving", label: "Parada" },
  { name: "kicking", label: "Saque" },
  { name: "reflexes", label: "Reflejos" },
  { name: "speed", label: "Velocidad" },
  { name: "positioning", label: "Posicionamiento" },
];

const isValidRating = (value: string): boolean => {
  const numericValue = Number(value);

  return (
    value.trim() !== "" &&
    Number.isInteger(numericValue) &&
    numericValue >= 1 &&
    numericValue <= 10
  );
};

const hasInvalidRating = (ratings: Record<string, string>): boolean =>
  Object.values(ratings).some(
    (value) => value.trim() !== "" && !isValidRating(value)
  );

const parseRatings = <T extends Record<string, string>>(
  ratings: T
): Partial<Record<keyof T, number>> | undefined => {
  const parsedRatings = Object.fromEntries(
    Object.entries(ratings)
      .filter(([, value]) => isValidRating(value))
      .map(([name, value]) => [name, Number(value)])
  ) as Partial<Record<keyof T, number>>;

  return Object.keys(parsedRatings).length > 0 ? parsedRatings : undefined;
};

const isValidPlayerNumber = (value: string): boolean => {
  const numericValue = Number(value);

  return (
    value.trim() !== "" &&
    Number.isInteger(numericValue) &&
    numericValue >= 0
  );
};

export const validateDashboardPlayerInput = (
  values: DashboardPlayerInput
): DashboardPlayerErrors => {
  const errors: DashboardPlayerErrors = {};

  if (!values.name.trim()) {
    errors.name = "Escribi el nombre.";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Escribi el apellido.";
  }

  if (!isValidPlayerNumber(values.number)) {
    errors.number = "Carga un numero valido.";
  }

  if (!values.position) {
    errors.position = "Elegi la posicion.";
  }

  return errors;
};

export const validateDashboardPlayerRatings = (
  values: DashboardPlayerInput
): string | null => {
  const ratings =
    values.position === "arq" ? values.goalkeeperRatings : values.fieldRatings;

  return hasInvalidRating(ratings)
    ? "Las valoraciones deben ser numeros enteros del 1 al 10."
    : null;
};

export const buildDashboardPlayerMutationInput = (
  values: DashboardPlayerInput
): DashboardPlayerMutationInput => ({
  name: values.name.trim(),
  lastName: values.lastName.trim(),
  number: Number(values.number),
  position: values.position as DashboardPlayerPosition,
  dominantFoot: values.dominantFoot || undefined,
  birthDate: values.birthDate.trim() || undefined,
  fieldRatings:
    values.position === "arq" ? undefined : parseRatings(values.fieldRatings),
  goalkeeperRatings:
    values.position === "arq"
      ? parseRatings(values.goalkeeperRatings)
      : undefined,
});

export const buildDashboardPlayerDraftInput = (
  values: DashboardPlayerInput
): DashboardPlayerDraftMutationInput => ({
  name: values.name.trim(),
  lastName: values.lastName.trim(),
  number: isValidPlayerNumber(values.number) ? Number(values.number) : undefined,
  position: values.position || undefined,
  dominantFoot: values.dominantFoot || undefined,
  birthDate: values.birthDate.trim() || undefined,
  fieldRatings:
    values.position === "arq" ? undefined : parseRatings(values.fieldRatings),
  goalkeeperRatings:
    values.position === "arq"
      ? parseRatings(values.goalkeeperRatings)
      : undefined,
});

export const getDashboardPlayerPositionLabel = (
  position?: string | null
): string =>
  PLAYER_POSITION_OPTIONS.find((option) => option.value === position)?.label ??
  "Sin posicion";

export const getDashboardPlayerDominantFootLabel = (
  dominantFoot?: string | null
): string =>
  PLAYER_DOMINANT_FOOT_OPTIONS.find((option) => option.value === dominantFoot)
    ?.label ?? "Sin definir";

export const validateDashboardPlayerImageFile = (
  file?: Pick<File, "size" | "type"> | null
): string | null => {
  if (!file) {
    return null;
  }

  if (
    !DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES.includes(
      file.type as (typeof DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "La foto debe ser JPG, PNG o WebP.";
  }

  if (file.size > DASHBOARD_PLAYER_IMAGE_MAX_BYTES) {
    return "La foto no puede superar 4 MB en produccion.";
  }

  return null;
};

export const validateDashboardPlayerImageDimensions = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): string | null => {
  const megapixels = (width * height) / 1_000_000;

  if (megapixels > DASHBOARD_PLAYER_IMAGE_MAX_MEGAPIXELS) {
    return "La foto supera el limite de 256 megapixeles de Sanity.";
  }

  return null;
};

export const readDashboardPlayerImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(previewUrl);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error("Invalid image file."));
    };
    image.src = previewUrl;
  });

export const affectsPublicRosterVisibility = (
  item: Pick<DashboardPlayerItem, "canManageActiveStatus" | "isActive">
): boolean => item.canManageActiveStatus;

export const shouldConfirmDashboardPlayerActiveStatusChange = (
  item: DashboardPlayerItem,
  nextIsActive: boolean
): boolean =>
  affectsPublicRosterVisibility(item) && item.isActive !== nextIsActive;

export const getDashboardPlayerActiveStatusConfirmCopy = (
  item: DashboardPlayerItem,
  nextIsActive: boolean
): { title: string; text: string; confirmText: string } => {
  if (nextIsActive) {
    return {
      title: "Activar jugador en el plantel",
      text: `"${item.fullName}" volvera a mostrarse en el plantel publico del sitio.`,
      confirmText: "Activar",
    };
  }

  return {
    title: "Desactivar jugador del plantel",
    text: `"${item.fullName}" dejara de mostrarse en el plantel publico, pero conservara referencias en partidos y estadisticas.`,
    confirmText: "Desactivar",
  };
};
