import { randomUUID } from "node:crypto";

import type {
  DashboardTournamentDraftMutationInput,
  DashboardTournamentItem,
  DashboardTournamentMutationInput,
  DashboardTournamentOptions,
  DashboardTournamentParticipantItem,
  DashboardTournamentReferenceCounts,
} from "../../../src/types/dashboard";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  dashboardTournamentActiveSiblingsQuery,
  dashboardTournamentByIdQuery,
  dashboardTournamentListQuery,
  dashboardTournamentOptionsQuery,
  dashboardTournamentReferenceUsageQuery,
  dashboardTournamentValidationOptionsQuery,
} from "./queries.js";
import {
  adaptDashboardTournamentItem,
  adaptDashboardTournamentOptions,
} from "./validation.js";

const DRAFT_PREFIX = "drafts.";
const PUBLIC_TOURNAMENT_PREFIX = "tournaments-";

export class DashboardTournamentValidationError extends Error {}

type DashboardTournamentDocumentParticipant = {
  key?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  teamImageUrl?: string | null;
  teamIsMain?: boolean | null;
  status?: string | null;
  activeFromMatchday?: number | null;
  activeUntilMatchday?: number | null;
  notes?: string | null;
};

type DashboardTournamentDocument = {
  id: string;
  updatedAt?: string | null;
  name?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationImageUrl?: string | null;
  active?: boolean | null;
  primaryPrizeSlots?: number | null;
  secondaryPrizeSlots?: number | null;
  participants?: DashboardTournamentDocumentParticipant[] | null;
  referenceCounts?: DashboardTournamentReferenceCounts | null;
};

type DashboardTournamentDocumentPair = {
  canonicalId: string;
  published?: DashboardTournamentDocument;
  draft?: DashboardTournamentDocument;
};

type DashboardTournamentOptionsSource = {
  organizations?: Array<{
    id: string;
    name?: string | null;
    imageUrl?: string | null;
  }>;
  teams?: Array<{
    id: string;
    name?: string | null;
    isMain?: boolean;
    imageUrl?: string | null;
  }>;
};

type DashboardTournamentValidationSource = {
  organizations?: Array<{
    id: string;
  }>;
  teams?: Array<{
    id: string;
    name?: string | null;
    isMain?: boolean;
  }>;
};

type DashboardTournamentReferenceUsage = {
  matches?: Array<{ id: string }>;
  tables?: Array<{ id: string }>;
  snapshots?: Array<{ id: string }>;
};

type DashboardActiveTournament = {
  id: string;
};

const emptyReferenceCounts = (): DashboardTournamentReferenceCounts => ({
  matches: 0,
  tables: 0,
  snapshots: 0,
});

const getCanonicalTournamentId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftTournamentId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalTournamentId(id)}`;

export const createCanonicalTournamentId = (): string =>
  `${PUBLIC_TOURNAMENT_PREFIX}${randomUUID()}`;

const normalizeString = (value?: string | null): string =>
  value?.trim() ?? "";

const normalizeOptionalNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.floor(numberValue) : null;
};

const getSelectedDocument = ({
  draft,
  published,
}: DashboardTournamentDocumentPair): DashboardTournamentDocument | undefined =>
  draft ?? published;

const groupDashboardTournamentDocuments = (
  documents: DashboardTournamentDocument[]
): DashboardTournamentDocumentPair[] => {
  const pairs = new Map<string, DashboardTournamentDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalTournamentId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardTournamentDocumentPair);

    if (document.id.startsWith(DRAFT_PREFIX)) {
      pair.draft = document;
    } else {
      pair.published = document;
    }

    pairs.set(canonicalId, pair);
  }

  return [...pairs.values()];
};

const combineReferenceCounts = (
  pair: DashboardTournamentDocumentPair
): DashboardTournamentReferenceCounts => {
  const counts = emptyReferenceCounts();

  for (const item of [pair.published?.referenceCounts, pair.draft?.referenceCounts]) {
    counts.matches += item?.matches ?? 0;
    counts.tables += item?.tables ?? 0;
    counts.snapshots += item?.snapshots ?? 0;
  }

  return counts;
};

const adaptParticipant = (
  participant: DashboardTournamentDocumentParticipant
): DashboardTournamentParticipantItem => ({
  key: participant.key ?? null,
  teamId: participant.teamId ?? null,
  teamName: participant.teamName ?? null,
  teamImageUrl: participant.teamImageUrl ?? null,
  status: participant.status ?? null,
  activeFromMatchday: normalizeOptionalNumber(participant.activeFromMatchday),
  activeUntilMatchday: normalizeOptionalNumber(participant.activeUntilMatchday),
  notes: participant.notes ?? null,
});

const adaptDashboardTournamentPair = (
  pair: DashboardTournamentDocumentPair
): DashboardTournamentItem => {
  const selectedDocument = getSelectedDocument(pair);

  return adaptDashboardTournamentItem({
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status: pair.draft ? "draft" : "published",
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    name: normalizeString(selectedDocument?.name) || "Torneo sin nombre",
    organizationId: selectedDocument?.organizationId ?? null,
    organizationName: selectedDocument?.organizationName ?? null,
    organizationImageUrl: selectedDocument?.organizationImageUrl ?? null,
    active: selectedDocument?.active ?? null,
    primaryPrizeSlots: normalizeOptionalNumber(
      selectedDocument?.primaryPrizeSlots
    ),
    secondaryPrizeSlots: normalizeOptionalNumber(
      selectedDocument?.secondaryPrizeSlots
    ),
    updatedAt: selectedDocument?.updatedAt ?? null,
    participants: (selectedDocument?.participants ?? []).map(adaptParticipant),
    referenceCounts: combineReferenceCounts(pair),
  });
};

const sortDashboardTournamentItems = (
  items: DashboardTournamentItem[]
): DashboardTournamentItem[] =>
  [...items].sort((left, right) => {
    if (Boolean(left.active) !== Boolean(right.active)) {
      return left.active ? -1 : 1;
    }

    return left.name.localeCompare(right.name, "es");
  });

const queryDashboardTournamentDocuments = async (
  query: string,
  params?: Record<string, string>
): Promise<DashboardTournamentDocument[]> =>
  querySanity<DashboardTournamentDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardTournamentPairById = async (
  id: string
): Promise<DashboardTournamentDocumentPair | null> => {
  const canonicalId = getCanonicalTournamentId(id);
  const result = await queryDashboardTournamentDocuments(
    dashboardTournamentByIdQuery,
    {
      id: canonicalId,
      draftId: getDraftTournamentId(canonicalId),
    }
  );
  const [pair] = groupDashboardTournamentDocuments(result);

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
  value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || "team";

const createParticipantKey = (
  participant:
    | DashboardTournamentMutationInput["participants"][number]
    | NonNullable<DashboardTournamentDraftMutationInput["participants"]>[number],
  index: number
): string => sanitizeKey(participant.key || participant.teamId || `team-${index + 1}`);

const buildTournamentParticipants = (
  participants:
    | DashboardTournamentMutationInput["participants"]
    | DashboardTournamentDraftMutationInput["participants"] = []
) =>
  participants.map((participant, index) => ({
    _key: createParticipantKey(participant, index),
    _type: "tournamentParticipant",
    team: buildReference(participant.teamId),
    status: participant.status,
    activeFromMatchday: participant.activeFromMatchday,
    activeUntilMatchday: participant.activeUntilMatchday,
    notes: participant.notes?.trim() || undefined,
  }));

const buildTournamentDocument = (
  id: string,
  input:
    | DashboardTournamentMutationInput
    | DashboardTournamentDraftMutationInput
) => ({
  _id: id,
  _type: "tournaments",
  name: input.name?.trim() || undefined,
  organization: buildReference(input.organizationId),
  active: input.active,
  primaryPrizeSlots: input.primaryPrizeSlots,
  secondaryPrizeSlots: input.secondaryPrizeSlots,
  participants: buildTournamentParticipants(input.participants),
});

const getDocumentIdsToDelete = (
  pair: DashboardTournamentDocumentPair | null,
  canonicalId: string
): string[] => [
  pair?.published?.id ?? canonicalId,
  pair?.draft?.id ?? getDraftTournamentId(canonicalId),
];

const getDashboardTournamentReferenceUsage = async (
  canonicalId: string
): Promise<DashboardTournamentReferenceUsage> =>
  querySanity<DashboardTournamentReferenceUsage>(
    dashboardTournamentReferenceUsageQuery,
    {
      params: {
        id: canonicalId,
        draftId: getDraftTournamentId(canonicalId),
      },
      perspective: "raw",
      useToken: true,
    }
  );

const getReferenceUsageCount = (
  usage: DashboardTournamentReferenceUsage
): number =>
  (usage.matches?.length ?? 0) +
  (usage.tables?.length ?? 0) +
  (usage.snapshots?.length ?? 0);

const getDashboardTournamentValidationSource =
  async (): Promise<DashboardTournamentValidationSource> =>
    querySanity<DashboardTournamentValidationSource>(
      dashboardTournamentValidationOptionsQuery,
      {
        perspective: "raw",
        useToken: true,
      }
    );

const validateTournamentReferences = async (
  input: DashboardTournamentMutationInput
): Promise<string | null> => {
  const source = await getDashboardTournamentValidationSource();
  const organizationIds = new Set(
    (source.organizations ?? []).map((organization) => organization.id)
  );
  const teamsById = new Map(
    (source.teams ?? []).map((team) => [team.id, team])
  );

  if (!organizationIds.has(input.organizationId)) {
    return "El organizador seleccionado no existe.";
  }

  for (const participant of input.participants) {
    const team = teamsById.get(participant.teamId);

    if (!team) {
      return "Uno de los equipos participantes no existe.";
    }

    if (team.isMain) {
      return "Mentira FC no debe estar cargado como participante del torneo.";
    }
  }

  return null;
};

const getActiveSiblingMutations = async (
  canonicalId: string,
  input: DashboardTournamentMutationInput
): Promise<unknown[]> => {
  if (!input.active) return [];

  const activeSiblings = await querySanity<DashboardActiveTournament[]>(
    dashboardTournamentActiveSiblingsQuery,
    {
      params: {
        id: canonicalId,
      },
      perspective: "raw",
      useToken: true,
    }
  );

  return activeSiblings.map((tournament) => ({
    patch: {
      id: tournament.id,
      set: {
        active: false,
      },
    },
  }));
};

export const listDashboardTournaments =
  async (): Promise<DashboardTournamentItem[]> => {
    const result = await queryDashboardTournamentDocuments(
      dashboardTournamentListQuery
    );

    return sortDashboardTournamentItems(
      groupDashboardTournamentDocuments(result).map(adaptDashboardTournamentPair)
    );
  };

export const getDashboardTournamentById = async (
  id: string
): Promise<DashboardTournamentItem | null> => {
  const pair = await getDashboardTournamentPairById(id);

  return pair ? adaptDashboardTournamentPair(pair) : null;
};

export const getDashboardTournamentOptions =
  async (): Promise<DashboardTournamentOptions> => {
    const result = await querySanity<DashboardTournamentOptionsSource>(
      dashboardTournamentOptionsQuery,
      {
        perspective: "raw",
        useToken: true,
      }
    );

    return adaptDashboardTournamentOptions({
      organizations: (result.organizations ?? []).map((organization) => ({
        id: organization.id,
        name: normalizeString(organization.name) || "Organizador sin nombre",
        imageUrl: organization.imageUrl ?? null,
      })),
      teams: (result.teams ?? []).map((team) => ({
        id: team.id,
        name: normalizeString(team.name) || "Equipo sin nombre",
        isMain: team.isMain,
        imageUrl: team.imageUrl ?? null,
      })),
    });
  };

export const saveDashboardTournamentDraft = async (
  id: string | null,
  input: DashboardTournamentDraftMutationInput
): Promise<DashboardTournamentItem> => {
  const canonicalId = id
    ? getCanonicalTournamentId(id)
    : createCanonicalTournamentId();

  await mutateSanity<unknown>([
    {
      createOrReplace: buildTournamentDocument(
        getDraftTournamentId(canonicalId),
        input
      ),
    },
  ]);

  const tournament = await getDashboardTournamentById(canonicalId);

  if (!tournament) {
    throw new Error("Saved draft tournament could not be reloaded.");
  }

  return tournament;
};

export const publishDashboardTournament = async (
  id: string | null,
  input: DashboardTournamentMutationInput
): Promise<DashboardTournamentItem> => {
  const referenceError = await validateTournamentReferences(input);

  if (referenceError) {
    throw new DashboardTournamentValidationError(referenceError);
  }

  const canonicalId = id
    ? getCanonicalTournamentId(id)
    : createCanonicalTournamentId();
  const activeSiblingMutations = await getActiveSiblingMutations(
    canonicalId,
    input
  );

  await mutateSanity<unknown>([
    ...activeSiblingMutations,
    {
      createOrReplace: buildTournamentDocument(canonicalId, input),
    },
    {
      delete: {
        id: getDraftTournamentId(canonicalId),
      },
    },
  ]);

  const tournament = await getDashboardTournamentById(canonicalId);

  if (!tournament) {
    throw new Error("Published tournament could not be reloaded.");
  }

  return tournament;
};

export const deleteDashboardTournament = async (id: string): Promise<void> => {
  const canonicalId = getCanonicalTournamentId(id);
  const pair = await getDashboardTournamentPairById(canonicalId);
  const usage = await getDashboardTournamentReferenceUsage(canonicalId);

  if (getReferenceUsageCount(usage) > 0) {
    throw new DashboardTournamentValidationError(
      "No se puede eliminar el torneo porque tiene partidos, tablas o historial vinculados."
    );
  }

  await mutateSanity<unknown>(
    getDocumentIdsToDelete(pair, canonicalId).map((documentId) => ({
      delete: {
        id: documentId,
      },
    }))
  );
};
