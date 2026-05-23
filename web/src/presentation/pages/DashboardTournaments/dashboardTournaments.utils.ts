import type {
  DashboardTournamentDraftMutationInput,
  DashboardTournamentInput,
  DashboardTournamentMutationInput,
  DashboardTournamentParticipantStatus,
  DashboardTournamentReferenceCounts,
} from "../../../types/dashboard";

export type DashboardTournamentErrors = Partial<
  Record<
    | keyof Omit<DashboardTournamentInput, "participants">
    | "participants"
    | `participant-${string}`,
    string
  >
>;

export const TOURNAMENT_PARTICIPANT_STATUS_OPTIONS: Array<{
  value: DashboardTournamentParticipantStatus;
  label: string;
}> = [
  { value: "active", label: "Activo" },
  { value: "replaced", label: "Reemplazado" },
  { value: "withdrawn", label: "Retirado" },
];

const isValidNonNegativeInteger = (value: string): boolean => {
  const numericValue = Number(value);

  return (
    value.trim() !== "" &&
    Number.isInteger(numericValue) &&
    numericValue >= 0
  );
};

const isValidPositiveInteger = (value: string): boolean => {
  const numericValue = Number(value);

  return (
    value.trim() !== "" &&
    Number.isInteger(numericValue) &&
    numericValue >= 1
  );
};

const parseOptionalPositiveInteger = (
  value: string
): number | undefined =>
  isValidPositiveInteger(value) ? Number(value) : undefined;

export const getTournamentParticipantStatusLabel = (
  status?: string | null
): string =>
  TOURNAMENT_PARTICIPANT_STATUS_OPTIONS.find((item) => item.value === status)
    ?.label ?? "Sin estado";

export const getTournamentReferenceCount = (
  referenceCounts: DashboardTournamentReferenceCounts
): number =>
  referenceCounts.matches + referenceCounts.tables + referenceCounts.snapshots;

export const validateDashboardTournamentInput = (
  values: DashboardTournamentInput
): DashboardTournamentErrors => {
  const errors: DashboardTournamentErrors = {};

  if (!values.name.trim()) {
    errors.name = "Escribi el nombre del torneo.";
  }

  if (!values.organizationId.trim()) {
    errors.organizationId = "Elegi el organizador.";
  }

  if (!isValidNonNegativeInteger(values.primaryPrizeSlots)) {
    errors.primaryPrizeSlots = "Carga un numero valido.";
  }

  if (!isValidNonNegativeInteger(values.secondaryPrizeSlots)) {
    errors.secondaryPrizeSlots = "Carga un numero valido.";
  }

  if (values.participants.length === 0) {
    errors.participants = "Carga al menos un participante.";
  }

  const selectedTeams = values.participants
    .map((participant) => participant.teamId.trim())
    .filter(Boolean);
  const duplicateTeam = selectedTeams.find(
    (teamId, index) => selectedTeams.indexOf(teamId) !== index
  );

  if (duplicateTeam) {
    errors.participants = "No repitas equipos participantes.";
  }

  values.participants.forEach((participant) => {
    const rowErrors = [
      !participant.teamId.trim() ? "equipo" : null,
      participant.activeFromMatchday.trim() &&
      !isValidPositiveInteger(participant.activeFromMatchday)
        ? "desde"
        : null,
      participant.activeUntilMatchday.trim() &&
      !isValidPositiveInteger(participant.activeUntilMatchday)
        ? "hasta"
        : null,
      participant.status !== "active" &&
      !participant.activeUntilMatchday.trim()
        ? "hasta"
        : null,
    ].filter(Boolean);
    const from = Number(participant.activeFromMatchday);
    const until = Number(participant.activeUntilMatchday);

    if (
      Number.isInteger(from) &&
      Number.isInteger(until) &&
      from >= 1 &&
      until >= 1 &&
      from > until
    ) {
      rowErrors.push("rango");
    }

    if (rowErrors.length > 0) {
      errors[
        `participant-${participant.key}`
      ] = `Revisa: ${rowErrors.join(", ")}.`;
    }
  });

  return errors;
};

export const buildDashboardTournamentMutationInput = (
  values: DashboardTournamentInput
): DashboardTournamentMutationInput => ({
  name: values.name.trim(),
  organizationId: values.organizationId.trim(),
  active: values.active,
  primaryPrizeSlots: Number(values.primaryPrizeSlots),
  secondaryPrizeSlots: Number(values.secondaryPrizeSlots),
  participants: values.participants.map((participant) => ({
    key: participant.key,
    teamId: participant.teamId.trim(),
    status: participant.status,
    activeFromMatchday: parseOptionalPositiveInteger(
      participant.activeFromMatchday
    ),
    activeUntilMatchday: parseOptionalPositiveInteger(
      participant.activeUntilMatchday
    ),
    notes: participant.notes.trim() || undefined,
  })),
});

export const buildDashboardTournamentDraftInput = (
  values: DashboardTournamentInput
): DashboardTournamentDraftMutationInput => ({
  name: values.name.trim() || undefined,
  organizationId: values.organizationId.trim() || undefined,
  active: values.active,
  primaryPrizeSlots: isValidNonNegativeInteger(values.primaryPrizeSlots)
    ? Number(values.primaryPrizeSlots)
    : undefined,
  secondaryPrizeSlots: isValidNonNegativeInteger(values.secondaryPrizeSlots)
    ? Number(values.secondaryPrizeSlots)
    : undefined,
  participants: values.participants.map((participant) => ({
    key: participant.key,
    teamId: participant.teamId.trim() || undefined,
    status: participant.status,
    activeFromMatchday: parseOptionalPositiveInteger(
      participant.activeFromMatchday
    ),
    activeUntilMatchday: parseOptionalPositiveInteger(
      participant.activeUntilMatchday
    ),
    notes: participant.notes.trim() || undefined,
  })),
});

export const createDashboardTournamentParticipant = (
  key: string
): DashboardTournamentInput["participants"][number] => ({
  key,
  teamId: "",
  status: "active",
  activeFromMatchday: "",
  activeUntilMatchday: "",
  notes: "",
});
