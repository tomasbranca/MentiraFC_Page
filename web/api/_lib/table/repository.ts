import { randomUUID } from "node:crypto";

import type {
  DashboardTableDraftMutationInput,
  DashboardTableItem,
  DashboardTableMutationInput,
  DashboardTableOptions,
  DashboardTableTeamOption,
} from "../../../src/types/dashboard";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  dashboardTableByIdQuery,
  dashboardTableListQuery,
  dashboardTableOptionsQuery,
  dashboardTableTournamentValidationQuery,
} from "./queries.js";
import {
  adaptDashboardTableItem,
  adaptDashboardTableOptions,
} from "./validation.js";

const DRAFT_PREFIX = "drafts.";
const PUBLIC_TABLE_PREFIX = "standings-state-";

export class DashboardTableValidationError extends Error {}

type DashboardTableDocumentRow = {
  key?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  teamImageUrl?: string | null;
  wins?: number | null;
  draws?: number | null;
  losses?: number | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
};

type DashboardTableDocument = {
  id: string;
  updatedAt?: string | null;
  tournamentId?: string | null;
  tournamentName?: string | null;
  tournamentOrganizationName?: string | null;
  tournamentImageUrl?: string | null;
  matchdayNumber?: number | null;
  label?: string | null;
  snapshotDate?: string | null;
  gamesThroughDate?: string | null;
  rows?: DashboardTableDocumentRow[] | null;
};

type DashboardTableDocumentPair = {
  canonicalId: string;
  published?: DashboardTableDocument;
  draft?: DashboardTableDocument;
};

type DashboardTableOptionsSource = {
  tournaments?: Array<{
    id: string;
    name?: string | null;
    organizationName?: string | null;
    active?: boolean;
    imageUrl?: string | null;
    participants?: Array<{
      status?: string | null;
      activeFromMatchday?: number | null;
      activeUntilMatchday?: number | null;
      team?: {
        id?: string | null;
        name?: string | null;
        isMain?: boolean;
        imageUrl?: string | null;
      } | null;
    }> | null;
  }>;
};

type DashboardTableValidationSource = {
  mainTeam?: {
    id?: string | null;
    name?: string | null;
    isMain?: boolean;
  } | null;
  tournament?: {
    id?: string | null;
    name?: string | null;
    participants?: Array<{
      status?: string | null;
      activeFromMatchday?: number | null;
      activeUntilMatchday?: number | null;
      team?: {
        id?: string | null;
        name?: string | null;
        isMain?: boolean;
      } | null;
    }> | null;
  } | null;
};

const getCanonicalTableId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftTableId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalTableId(id)}`;

export const createCanonicalTableId = (): string =>
  `${PUBLIC_TABLE_PREFIX}${randomUUID()}`;

const normalizeString = (value?: string | null): string =>
  value?.trim() ?? "";

const normalizeOptionalNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.floor(numberValue) : null;
};

const normalizePositiveInteger = (value: unknown): number | null => {
  const normalized = normalizeOptionalNumber(value);
  return normalized && normalized > 0 ? normalized : null;
};

const getSelectedDocument = ({
  draft,
  published,
}: DashboardTableDocumentPair): DashboardTableDocument | undefined =>
  draft ?? published;

const groupDashboardTableDocuments = (
  documents: DashboardTableDocument[]
): DashboardTableDocumentPair[] => {
  const pairs = new Map<string, DashboardTableDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalTableId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardTableDocumentPair);

    if (document.id.startsWith(DRAFT_PREFIX)) {
      pair.draft = document;
    } else {
      pair.published = document;
    }

    pairs.set(canonicalId, pair);
  }

  return [...pairs.values()];
};

const adaptDashboardTablePair = (
  pair: DashboardTableDocumentPair
): DashboardTableItem => {
  const selectedDocument = getSelectedDocument(pair);

  return adaptDashboardTableItem({
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status: pair.draft ? "draft" : "published",
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    tournamentId: selectedDocument?.tournamentId ?? null,
    tournamentName: normalizeString(selectedDocument?.tournamentName),
    tournamentOrganizationName:
      selectedDocument?.tournamentOrganizationName ?? null,
    tournamentImageUrl: selectedDocument?.tournamentImageUrl ?? null,
    matchdayNumber: normalizePositiveInteger(selectedDocument?.matchdayNumber),
    label: selectedDocument?.label ?? null,
    snapshotDate: selectedDocument?.snapshotDate ?? null,
    gamesThroughDate: selectedDocument?.gamesThroughDate ?? null,
    updatedAt: selectedDocument?.updatedAt ?? null,
    rows: (selectedDocument?.rows ?? []).map((row) => ({
      key: row.key ?? null,
      teamId: row.teamId ?? null,
      teamName: row.teamName ?? null,
      teamImageUrl: row.teamImageUrl ?? null,
      wins: normalizeOptionalNumber(row.wins),
      draws: normalizeOptionalNumber(row.draws),
      losses: normalizeOptionalNumber(row.losses),
      goalsFor: normalizeOptionalNumber(row.goalsFor),
      goalsAgainst: normalizeOptionalNumber(row.goalsAgainst),
    })),
  });
};

const sortDashboardTableItems = (
  items: DashboardTableItem[]
): DashboardTableItem[] =>
  [...items].sort((left, right) => {
    const leftTime =
      new Date(left.snapshotDate ?? left.updatedAt ?? "").getTime() || 0;
    const rightTime =
      new Date(right.snapshotDate ?? right.updatedAt ?? "").getTime() || 0;

    return rightTime - leftTime;
  });

const queryDashboardTableDocuments = async (
  query: string,
  params?: Record<string, string>
): Promise<DashboardTableDocument[]> =>
  querySanity<DashboardTableDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardTablePairById = async (
  id: string
): Promise<DashboardTableDocumentPair | null> => {
  const canonicalId = getCanonicalTableId(id);
  const result = await queryDashboardTableDocuments(dashboardTableByIdQuery, {
    id: canonicalId,
    draftId: getDraftTableId(canonicalId),
  });
  const [pair] = groupDashboardTableDocuments(result);

  return pair ?? null;
};

const buildReference = (id?: string | null) =>
  id
    ? {
        _type: "reference",
        _ref: id,
      }
    : undefined;

const sanitizeKey = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || "row";

type DashboardTableWritableRow =
  | DashboardTableMutationInput["rows"][number]
  | NonNullable<DashboardTableDraftMutationInput["rows"]>[number];

const createRowKey = (row: DashboardTableWritableRow, index: number): string =>
  sanitizeKey(row.key || row.teamId || `row-${index + 1}`);

const buildTableRows = (
  rows:
    | DashboardTableMutationInput["rows"]
    | DashboardTableDraftMutationInput["rows"] = []
) =>
  rows.map((row, index) => ({
    _key: createRowKey(row, index),
    _type: "standingStateRow",
    team: buildReference(row.teamId),
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
  }));

const buildTableDocument = (
  id: string,
  input: DashboardTableMutationInput | DashboardTableDraftMutationInput
) => ({
  _id: id,
  _type: "standingsState",
  tournament: buildReference(input.tournamentId),
  matchdayNumber: input.matchdayNumber,
  label: input.label?.trim() || undefined,
  snapshotDate: input.snapshotDate,
  gamesThroughDate: input.gamesThroughDate,
  rows: buildTableRows(input.rows),
});

const getDocumentIdsToDelete = (
  pair: DashboardTableDocumentPair | null,
  canonicalId: string
): string[] => [
  pair?.published?.id ?? canonicalId,
  pair?.draft?.id ?? getDraftTableId(canonicalId),
];

const normalizeParticipant = (
  participant: NonNullable<
    NonNullable<DashboardTableOptionsSource["tournaments"]>[number]["participants"]
  >[number]
): DashboardTableTeamOption | null => {
  if (!participant.team?.id) return null;

  return {
    id: participant.team.id,
    name: normalizeString(participant.team.name) || "Equipo sin nombre",
    isMain: participant.team.isMain,
    imageUrl: participant.team.imageUrl ?? null,
    status: participant.status ?? null,
    activeFromMatchday: normalizeOptionalNumber(participant.activeFromMatchday),
    activeUntilMatchday: normalizeOptionalNumber(participant.activeUntilMatchday),
  };
};

const normalizeMatchdayBoundary = (value: unknown): number | null => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 1
    ? Math.floor(numberValue)
    : null;
};

export const isParticipantActiveForMatchday = (
  participant: Pick<
    DashboardTableTeamOption,
    "status" | "activeFromMatchday" | "activeUntilMatchday"
  >,
  matchdayNumber: unknown
): boolean => {
  const matchday = normalizeMatchdayBoundary(matchdayNumber);
  const from = normalizeMatchdayBoundary(participant.activeFromMatchday);
  const until = normalizeMatchdayBoundary(participant.activeUntilMatchday);
  const status = participant.status || "active";

  if (!matchday) return false;
  if (from && matchday < from) return false;
  if (until && matchday > until) return false;
  if (status !== "active" && !until) return false;

  return true;
};

const getTeamLabel = (
  team?: { id?: string | null; name?: string | null } | null
) =>
  normalizeString(team?.name) || team?.id || "Equipo sin referencia";

const validateRowsAgainstTournament = async (
  input: DashboardTableMutationInput
): Promise<string | null> => {
  const result = await querySanity<DashboardTableValidationSource>(
    dashboardTableTournamentValidationQuery,
    {
      params: {
        tournamentId: input.tournamentId,
      },
      perspective: "raw",
      useToken: true,
    }
  );
  const tournament = result.tournament;

  if (!tournament?.id) {
    return "El torneo seleccionado no existe.";
  }

  const mainTeamId = result.mainTeam?.id ?? null;
  const participants = (tournament.participants ?? []).map((participant) => ({
    ...participant,
    team: participant.team?.id
      ? {
          id: participant.team.id,
          name: normalizeString(participant.team.name),
          isMain: Boolean(participant.team.isMain),
        }
      : null,
  }));
  const invalidMainParticipant = participants.find(
    (participant) =>
      participant.team?.isMain || participant.team?.id === mainTeamId
  );

  if (invalidMainParticipant) {
    return "Mentira FC no debe estar cargado como participante del torneo.";
  }

  const activeParticipants = participants.filter(
    (participant) =>
      participant.team?.id &&
      isParticipantActiveForMatchday(participant, input.matchdayNumber)
  );
  const activeParticipantIds = activeParticipants.map(
    (participant) => participant.team?.id
  );

  if (activeParticipants.length === 0) {
    return "El torneo no tiene participantes activos para esta fecha.";
  }

  const duplicateParticipantId = activeParticipantIds.find(
    (teamId, index) => teamId && activeParticipantIds.indexOf(teamId) !== index
  );

  if (duplicateParticipantId) {
    const duplicateParticipant = activeParticipants.find(
      (participant) => participant.team?.id === duplicateParticipantId
    );
    return `Participante activo repetido: ${getTeamLabel(
      duplicateParticipant?.team
    )}.`;
  }

  const activeParticipantIdSet = new Set(activeParticipantIds);
  const rowTeamIds = input.rows.map((row) => row.teamId);
  const duplicateRowId = rowTeamIds.find(
    (teamId, index) => rowTeamIds.indexOf(teamId) !== index
  );

  if (duplicateRowId) {
    return "No se puede repetir un equipo en la tabla actual.";
  }

  const invalidRow = input.rows.find(
    (row) => row.teamId === mainTeamId || !activeParticipantIdSet.has(row.teamId)
  );

  if (invalidRow) {
    return "La tabla solo puede incluir participantes activos del torneo, sin Mentira FC.";
  }

  const rowTeamIdSet = new Set(rowTeamIds);
  const missingParticipant = activeParticipants.find(
    (participant) =>
      participant.team?.id && !rowTeamIdSet.has(participant.team.id)
  );

  if (missingParticipant) {
    return `Falta cargar en Tabla actual: ${getTeamLabel(
      missingParticipant.team
    )}.`;
  }

  return null;
};

export const listDashboardTables = async (): Promise<DashboardTableItem[]> => {
  const result = await queryDashboardTableDocuments(dashboardTableListQuery);

  return sortDashboardTableItems(
    groupDashboardTableDocuments(result).map(adaptDashboardTablePair)
  );
};

export const getDashboardTableById = async (
  id: string
): Promise<DashboardTableItem | null> => {
  const pair = await getDashboardTablePairById(id);

  return pair ? adaptDashboardTablePair(pair) : null;
};

export const getDashboardTableOptions =
  async (): Promise<DashboardTableOptions> => {
    const result = await querySanity<DashboardTableOptionsSource>(
      dashboardTableOptionsQuery,
      {
        perspective: "raw",
        useToken: true,
      }
    );

    return adaptDashboardTableOptions({
      tournaments: (result.tournaments ?? []).map((tournament) => ({
        id: tournament.id,
        name: normalizeString(tournament.name) || "Torneo sin nombre",
        organizationName: tournament.organizationName ?? null,
        active: tournament.active,
        imageUrl: tournament.imageUrl ?? null,
        participants: (tournament.participants ?? [])
          .map(normalizeParticipant)
          .filter((team): team is DashboardTableTeamOption => Boolean(team)),
      })),
    });
  };

export const saveDashboardTableDraft = async (
  id: string | null,
  input: DashboardTableDraftMutationInput
): Promise<DashboardTableItem> => {
  const canonicalId = id ? getCanonicalTableId(id) : createCanonicalTableId();

  await mutateSanity<unknown>([
    {
      createOrReplace: buildTableDocument(getDraftTableId(canonicalId), input),
    },
  ]);

  const table = await getDashboardTableById(canonicalId);

  if (!table) {
    throw new Error("Saved draft table could not be reloaded.");
  }

  return table;
};

export const publishDashboardTable = async (
  id: string | null,
  input: DashboardTableMutationInput
): Promise<DashboardTableItem> => {
  const participantError = await validateRowsAgainstTournament(input);

  if (participantError) {
    throw new DashboardTableValidationError(participantError);
  }

  const canonicalId = id ? getCanonicalTableId(id) : createCanonicalTableId();

  await mutateSanity<unknown>([
    {
      createOrReplace: buildTableDocument(canonicalId, input),
    },
    {
      delete: {
        id: getDraftTableId(canonicalId),
      },
    },
  ]);

  const table = await getDashboardTableById(canonicalId);

  if (!table) {
    throw new Error("Published table could not be reloaded.");
  }

  return table;
};

export const deleteDashboardTable = async (id: string): Promise<void> => {
  const canonicalId = getCanonicalTableId(id);
  const pair = await getDashboardTablePairById(canonicalId);

  await mutateSanity<unknown>(
    getDocumentIdsToDelete(pair, canonicalId).map((documentId) => ({
      delete: {
        id: documentId,
      },
    }))
  );
};
