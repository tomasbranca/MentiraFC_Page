import type {
  DashboardTableDraftMutationInput,
  DashboardTableInput,
  DashboardTableMutationInput,
  DashboardTableTeamOption,
  DashboardTableTournamentOption,
} from "../../../types/dashboard";

export type DashboardTableErrors = Partial<
  Record<
    | keyof Omit<DashboardTableInput, "rows">
    | "rows"
    | `row-${string}`,
    string
  >
>;

const ARGENTINA_UTC_OFFSET = "-03:00";
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export const toDatetimeLocalValue = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const parts = Object.fromEntries(
    dateParts.map(({ type, value: partValue }) => [type, partValue])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const fromDatetimeLocalValue = (value: string): string => {
  const date = new Date(`${value}:00${ARGENTINA_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

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

const parseOptionalNonNegativeInteger = (
  value: string
): number | undefined =>
  isValidNonNegativeInteger(value) ? Number(value) : undefined;

const isValidDateTime = (value: string): boolean =>
  value.trim() !== "" && !Number.isNaN(Date.parse(value));

export const isParticipantActiveForMatchday = (
  participant: Pick<
    DashboardTableTeamOption,
    "status" | "activeFromMatchday" | "activeUntilMatchday"
  >,
  matchdayNumber: string | number
): boolean => {
  const matchday = Number(matchdayNumber);
  const from = Number(participant.activeFromMatchday);
  const until = Number(participant.activeUntilMatchday);
  const status = participant.status || "active";

  if (!Number.isInteger(matchday) || matchday < 1) return false;
  if (Number.isInteger(from) && from >= 1 && matchday < from) return false;
  if (Number.isInteger(until) && until >= 1 && matchday > until) return false;
  if (status !== "active" && !(Number.isInteger(until) && until >= 1)) {
    return false;
  }

  return true;
};

export const getActiveTournamentParticipants = (
  tournament: DashboardTableTournamentOption | undefined,
  matchdayNumber: string
): DashboardTableTeamOption[] =>
  (tournament?.participants ?? []).filter(
    (participant) =>
      !participant.isMain &&
      isParticipantActiveForMatchday(participant, matchdayNumber)
  );

export const validateDashboardTableInput = (
  values: DashboardTableInput,
  options: { minimumMatchdayNumber?: number | null } = {}
): DashboardTableErrors => {
  const errors: DashboardTableErrors = {};
  const minimumMatchdayNumber = options.minimumMatchdayNumber ?? 1;

  if (!values.tournamentId.trim()) {
    errors.tournamentId = "Elegi el torneo.";
  }

  if (!isValidPositiveInteger(values.matchdayNumber)) {
    errors.matchdayNumber = "Carga un numero de fecha valido.";
  } else if (Number(values.matchdayNumber) < minimumMatchdayNumber) {
    errors.matchdayNumber = `La fecha no puede ser menor que ${minimumMatchdayNumber}.`;
  }

  if (!isValidDateTime(values.snapshotDate)) {
    errors.snapshotDate = "Elegi una fecha de actualizacion valida.";
  }

  if (values.rows.length === 0) {
    errors.rows = "Carga al menos un equipo.";
  }

  const selectedTeams = values.rows
    .map((row) => row.teamId.trim())
    .filter(Boolean);
  const duplicateTeam = selectedTeams.find(
    (teamId, index) => selectedTeams.indexOf(teamId) !== index
  );

  if (duplicateTeam) {
    errors.rows = "No repitas equipos en la tabla.";
  }

  values.rows.forEach((row) => {
    const rowErrors = [
      !row.teamId.trim() ? "equipo" : null,
      !isValidNonNegativeInteger(row.wins) ? "G" : null,
      !isValidNonNegativeInteger(row.draws) ? "E" : null,
      !isValidNonNegativeInteger(row.losses) ? "P" : null,
      !isValidNonNegativeInteger(row.goalsFor) ? "GF" : null,
      !isValidNonNegativeInteger(row.goalsAgainst) ? "GC" : null,
    ].filter(Boolean);

    if (rowErrors.length > 0) {
      errors[`row-${row.key}`] = `Revisa: ${rowErrors.join(", ")}.`;
    }
  });

  return errors;
};

export const buildDashboardTableMutationInput = (
  values: DashboardTableInput
): DashboardTableMutationInput => ({
  tournamentId: values.tournamentId.trim(),
  matchdayNumber: Number(values.matchdayNumber),
  label: values.label.trim() || undefined,
  snapshotDate: values.snapshotDate.trim(),
  rows: values.rows.map((row) => ({
    key: row.key,
    teamId: row.teamId.trim(),
    wins: Number(row.wins),
    draws: Number(row.draws),
    losses: Number(row.losses),
    goalsFor: Number(row.goalsFor),
    goalsAgainst: Number(row.goalsAgainst),
  })),
});

export const buildDashboardTableDraftInput = (
  values: DashboardTableInput
): DashboardTableDraftMutationInput => ({
  tournamentId: values.tournamentId.trim() || undefined,
  matchdayNumber: isValidPositiveInteger(values.matchdayNumber)
    ? Number(values.matchdayNumber)
    : undefined,
  label: values.label.trim() || undefined,
  snapshotDate: isValidDateTime(values.snapshotDate)
    ? values.snapshotDate.trim()
    : undefined,
  rows: values.rows.map((row) => ({
    key: row.key,
    teamId: row.teamId.trim() || undefined,
    wins: parseOptionalNonNegativeInteger(row.wins),
    draws: parseOptionalNonNegativeInteger(row.draws),
    losses: parseOptionalNonNegativeInteger(row.losses),
    goalsFor: parseOptionalNonNegativeInteger(row.goalsFor),
    goalsAgainst: parseOptionalNonNegativeInteger(row.goalsAgainst),
  })),
});

export const createDashboardTableRow = (
  key: string,
  participant?: DashboardTableTeamOption
): DashboardTableInput["rows"][number] => ({
  key,
  teamId: participant?.id ?? "",
  wins: "0",
  draws: "0",
  losses: "0",
  goalsFor: "0",
  goalsAgainst: "0",
});

export const getTournamentLabel = (
  tournament?: Pick<
    DashboardTableTournamentOption,
    "organizationName" | "name" | "active"
  > | null
): string =>
  tournament
    ? [tournament.organizationName, tournament.name, tournament.active ? "Activo" : null]
        .filter(Boolean)
        .join(" - ")
    : "Sin torneo";
