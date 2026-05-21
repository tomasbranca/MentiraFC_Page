import { randomUUID } from "node:crypto";

import type {
  DashboardMatchDraftMutationInput,
  DashboardMatchItem,
  DashboardMatchMutationInput,
  DashboardMatchOptions,
  DashboardMatchPlayerOption,
} from "../../../src/types/dashboard";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  dashboardMatchByIdQuery,
  dashboardMatchGoalEventsQuery,
  dashboardMatchListQuery,
  dashboardMatchOptionsQuery,
  dashboardMatchRelatedEventsQuery,
} from "./queries.js";
import {
  adaptDashboardMatchItem,
  adaptDashboardMatchOptions,
} from "./validation.js";

const DRAFT_PREFIX = "drafts.";
const PRIVATE_MATCH_PREFIX = "games.";
const PUBLIC_MATCH_PREFIX = "games-";

type DashboardMatchDocumentPlayer = {
  id?: string | null;
  name?: string | null;
  lastName?: string | null;
  number?: number | null;
  position?: string | null;
};

type DashboardMatchDocument = {
  id: string;
  updatedAt?: string | null;
  date?: string | null;
  state?: string | null;
  location?: string | null;
  competition?: string | null;
  tournamentId?: string | null;
  tournamentName?: string | null;
  tournamentOrganizationName?: string | null;
  rivalId?: string | null;
  rivalName?: string | null;
  rivalImageUrl?: string | null;
  result?: {
    goalsFor?: number | null;
    goalsAgainst?: number | null;
  } | null;
  playedPlayers?: DashboardMatchDocumentPlayer[] | null;
  goalEvents?: Array<{
    id?: string | null;
    order?: number | null;
    player?: DashboardMatchDocumentPlayer | null;
  }> | null;
};

type DashboardMatchDocumentPair = {
  canonicalId: string;
  published?: DashboardMatchDocument;
  draft?: DashboardMatchDocument;
};

type DashboardMatchOptionSource = {
  id: string;
  name?: string | null;
  lastName?: string | null;
  number?: number | null;
  position?: string | null;
};

type DashboardMatchOptionsSource = {
  teams?: Array<{
    id: string;
    name?: string | null;
    isMain?: boolean;
    imageUrl?: string | null;
  }>;
  tournaments?: Array<{
    id: string;
    name?: string | null;
    organizationName?: string | null;
    active?: boolean;
  }>;
  players?: DashboardMatchOptionSource[];
};

type DashboardRelatedEvent = {
  id: string;
  type?: string | null;
};

type DashboardGoalEvent = {
  id: string;
};

const getCanonicalMatchId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftMatchId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalMatchId(id)}`;

export const getPublicMatchId = (id: string): string => {
  const canonicalId = getCanonicalMatchId(id);

  return canonicalId.startsWith(PRIVATE_MATCH_PREFIX)
    ? `${PUBLIC_MATCH_PREFIX}${canonicalId.slice(PRIVATE_MATCH_PREFIX.length)}`
    : canonicalId;
};

export const createCanonicalMatchId = (): string => {
  // Sanity treats path-style IDs containing dots as private for unauthenticated
  // public queries, so dashboard-created matches must use a dash namespace.
  return `${PUBLIC_MATCH_PREFIX}${randomUUID()}`;
};

const getSelectedDocument = ({
  draft,
  published,
}: DashboardMatchDocumentPair): DashboardMatchDocument | undefined =>
  draft ?? published;

const normalizeString = (value?: string | null): string =>
  value?.trim() ?? "";

const getTournamentLabel = (
  document?: DashboardMatchDocument
): string | null => {
  const organizationName = normalizeString(document?.tournamentOrganizationName);
  const tournamentName = normalizeString(document?.tournamentName);
  const label = [organizationName, tournamentName].filter(Boolean).join(" - ");

  return label || null;
};

const adaptPlayerOption = (
  player: DashboardMatchOptionSource
): DashboardMatchPlayerOption => {
  const name = normalizeString(player.name);
  const lastName = normalizeString(player.lastName);
  const fullName = [name, lastName].filter(Boolean).join(" ").trim();

  return {
    id: player.id,
    name,
    lastName,
    fullName: fullName || "Jugador sin nombre",
    number: player.number ?? null,
    position: player.position ?? null,
  };
};

const adaptGoalScorers = (
  goalEvents: DashboardMatchDocument["goalEvents"] = []
) => {
  const scorers = new Map<
    string,
    DashboardMatchPlayerOption & { goals: number }
  >();

  for (const event of goalEvents ?? []) {
    if (!event?.player?.id) {
      continue;
    }

    const player = adaptPlayerOption({
      ...event.player,
      id: event.player.id,
    });
    const current = scorers.get(player.id);

    scorers.set(player.id, {
      ...(current ?? player),
      goals: (current?.goals ?? 0) + 1,
    });
  }

  return [...scorers.values()];
};

const groupDashboardMatchDocuments = (
  documents: DashboardMatchDocument[]
): DashboardMatchDocumentPair[] => {
  const pairs = new Map<string, DashboardMatchDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalMatchId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardMatchDocumentPair);

    if (document.id.startsWith(DRAFT_PREFIX)) {
      pair.draft = document;
    } else {
      pair.published = document;
    }

    pairs.set(canonicalId, pair);
  }

  return [...pairs.values()];
};

const adaptDashboardMatchPair = (
  pair: DashboardMatchDocumentPair
): DashboardMatchItem => {
  const selectedDocument = getSelectedDocument(pair);
  const status = pair.draft ? "draft" : "published";
  const rawItem = {
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status,
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    date: selectedDocument?.date ?? null,
    updatedAt: selectedDocument?.updatedAt ?? null,
    state: selectedDocument?.state ?? null,
    location: selectedDocument?.location ?? null,
    competition: selectedDocument?.competition ?? null,
    tournamentId: selectedDocument?.tournamentId ?? null,
    tournamentName: selectedDocument?.tournamentName ?? null,
    tournamentLabel: getTournamentLabel(selectedDocument),
    rivalId: selectedDocument?.rivalId ?? null,
    rivalName: selectedDocument?.rivalName ?? null,
    rivalImageUrl: selectedDocument?.rivalImageUrl ?? null,
    result: selectedDocument?.result ?? null,
    playedPlayers: (selectedDocument?.playedPlayers ?? [])
      .filter((player): player is DashboardMatchOptionSource =>
        Boolean(player?.id)
      )
      .map(adaptPlayerOption),
    goalScorers: adaptGoalScorers(selectedDocument?.goalEvents),
  };

  return adaptDashboardMatchItem(rawItem);
};

const sortDashboardMatchItems = (
  items: DashboardMatchItem[]
): DashboardMatchItem[] =>
  [...items].sort((left, right) => {
    const leftTime = new Date(left.date ?? left.updatedAt ?? "").getTime() || 0;
    const rightTime =
      new Date(right.date ?? right.updatedAt ?? "").getTime() || 0;

    return rightTime - leftTime;
  });

const queryDashboardMatchDocuments = async (
  query: string,
  params?: Record<string, string>
): Promise<DashboardMatchDocument[]> =>
  querySanity<DashboardMatchDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardMatchPairById = async (
  id: string
): Promise<DashboardMatchDocumentPair | null> => {
  const canonicalId = getCanonicalMatchId(id);
  const result = await queryDashboardMatchDocuments(dashboardMatchByIdQuery, {
    id: canonicalId,
    draftId: getDraftMatchId(canonicalId),
  });
  const [pair] = groupDashboardMatchDocuments(result);

  return pair ?? null;
};

const buildReference = (id?: string | null) =>
  id
    ? {
        _type: "reference",
        _ref: id,
      }
    : undefined;

const buildReferenceArray = (ids: string[] | undefined = []) =>
  ids.map((id, index) => ({
    _key: `${index}-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    _type: "reference",
    _ref: id,
  }));

const buildResult = (
  input: DashboardMatchMutationInput | DashboardMatchDraftMutationInput
) =>
  input.state === "finalizado" &&
  typeof input.goalsFor === "number" &&
  typeof input.goalsAgainst === "number"
    ? {
        goalsFor: input.goalsFor,
        goalsAgainst: input.goalsAgainst,
      }
    : undefined;

const buildMatchDocument = (
  id: string,
  input: DashboardMatchMutationInput | DashboardMatchDraftMutationInput
) => {
  const isTournament = input.competition === "Torneo";
  const isFinished = input.state === "finalizado";

  return {
    _id: id,
    _type: "games",
    rival: buildReference(input.rivalId),
    date: input.date?.trim() || undefined,
    location: input.location?.trim() || undefined,
    competition: input.competition,
    tournament:
      isTournament && input.tournamentId
        ? buildReference(input.tournamentId)
        : undefined,
    state: input.state,
    result: buildResult(input),
    playedPlayers: isFinished
      ? buildReferenceArray(input.playedPlayerIds)
      : [],
  };
};

const createGoalEventId = (): string => `events-${randomUUID()}`;

const buildGoalEventDocuments = (
  matchId: string,
  scorers: DashboardMatchMutationInput["goalScorers"] = []
) => {
  let order = 1;

  return scorers.flatMap((scorer) =>
    Array.from({ length: scorer.goals }).map(() => ({
      _id: createGoalEventId(),
      _type: "events",
      game: buildReference(matchId),
      type: "goal",
      player: buildReference(scorer.playerId),
      order: order++,
    }))
  );
};

const queryDashboardMatchGoalEvents = async ({
  id,
  draftId,
  publicId,
}: {
  id: string;
  draftId: string;
  publicId: string;
}): Promise<DashboardGoalEvent[]> =>
  querySanity<DashboardGoalEvent[]>(dashboardMatchGoalEventsQuery, {
    params: {
      id,
      draftId,
      publicId,
    },
    perspective: "raw",
    useToken: true,
  });

const buildGoalEventSyncMutations = async ({
  canonicalId,
  publicCanonicalId,
  input,
}: {
  canonicalId: string;
  publicCanonicalId: string;
  input: DashboardMatchMutationInput;
}) => {
  const previousGoalEvents = await queryDashboardMatchGoalEvents({
    id: canonicalId,
    draftId: getDraftMatchId(canonicalId),
    publicId: publicCanonicalId,
  });
  const nextGoalEvents =
    input.state === "finalizado"
      ? buildGoalEventDocuments(publicCanonicalId, input.goalScorers)
      : [];

  return [
    ...previousGoalEvents.map((event) => ({
      delete: {
        id: event.id,
      },
    })),
    ...nextGoalEvents.map((event) => ({
      create: event,
    })),
  ];
};

export const listDashboardMatches = async (): Promise<DashboardMatchItem[]> => {
  const result = await queryDashboardMatchDocuments(dashboardMatchListQuery);

  return sortDashboardMatchItems(
    groupDashboardMatchDocuments(result).map(adaptDashboardMatchPair)
  );
};

export const getDashboardMatchById = async (
  id: string
): Promise<DashboardMatchItem | null> => {
  const pair = await getDashboardMatchPairById(id);

  return pair ? adaptDashboardMatchPair(pair) : null;
};

export const getDashboardMatchOptions =
  async (): Promise<DashboardMatchOptions> => {
    const result = await querySanity<DashboardMatchOptionsSource>(
      dashboardMatchOptionsQuery
    );

    return adaptDashboardMatchOptions({
      teams: (result.teams ?? []).map((team) => ({
        id: team.id,
        name: normalizeString(team.name),
        isMain: team.isMain,
        imageUrl: team.imageUrl ?? null,
      })),
      tournaments: (result.tournaments ?? []).map((tournament) => ({
        id: tournament.id,
        name: normalizeString(tournament.name),
        organizationName: tournament.organizationName ?? null,
        active: tournament.active,
      })),
      players: (result.players ?? []).map(adaptPlayerOption),
    });
  };

export const saveDashboardMatchDraft = async (
  id: string | null,
  input: DashboardMatchDraftMutationInput
): Promise<DashboardMatchItem> => {
  const canonicalId = id ? getCanonicalMatchId(id) : createCanonicalMatchId();

  await mutateSanity<unknown>([
    {
      createOrReplace: buildMatchDocument(getDraftMatchId(canonicalId), input),
    },
  ]);

  const match = await getDashboardMatchById(canonicalId);

  if (!match) {
    throw new Error("Saved draft match could not be reloaded.");
  }

  return match;
};

export const publishDashboardMatch = async (
  id: string | null,
  input: DashboardMatchMutationInput
): Promise<DashboardMatchItem> => {
  const canonicalId = id ? getCanonicalMatchId(id) : createCanonicalMatchId();
  const publicCanonicalId = getPublicMatchId(canonicalId);
  const relatedEvents =
    canonicalId === publicCanonicalId
      ? []
      : await querySanity<DashboardRelatedEvent[]>(
          dashboardMatchRelatedEventsQuery,
          {
            params: {
              id: canonicalId,
              draftId: getDraftMatchId(canonicalId),
            },
            perspective: "raw",
            useToken: true,
          }
        );
  const goalEventMutations = await buildGoalEventSyncMutations({
    canonicalId,
    publicCanonicalId,
    input,
  });

  await mutateSanity<unknown>([
    {
      createOrReplace: buildMatchDocument(publicCanonicalId, input),
    },
    ...relatedEvents.map((event) => ({
      patch: {
        id: event.id,
        set: {
          game: buildReference(publicCanonicalId),
        },
      },
    })),
    ...goalEventMutations,
    {
      delete: {
        id: getDraftMatchId(canonicalId),
      },
    },
    ...(canonicalId === publicCanonicalId
      ? []
      : [
          {
            delete: {
              id: canonicalId,
            },
          },
          {
            delete: {
              id: getDraftMatchId(publicCanonicalId),
            },
          },
        ]),
  ]);

  const match = await getDashboardMatchById(publicCanonicalId);

  if (!match) {
    throw new Error("Published match could not be reloaded.");
  }

  return match;
};

export const deleteDashboardMatch = async (id: string): Promise<void> => {
  const pair = await getDashboardMatchPairById(id);
  const canonicalId = getCanonicalMatchId(id);
  const draftId = getDraftMatchId(canonicalId);
  const relatedEvents = await querySanity<DashboardRelatedEvent[]>(
    dashboardMatchRelatedEventsQuery,
    {
      params: {
        id: canonicalId,
        draftId,
      },
      perspective: "raw",
      useToken: true,
    }
  );
  const documentIdsToDelete = [
    pair?.published?.id ?? canonicalId,
    pair?.draft?.id ?? draftId,
    ...relatedEvents.map((event) => event.id),
  ];

  await mutateSanity<unknown>(
    documentIdsToDelete.map((documentId) => ({
      delete: {
        id: documentId,
      },
    }))
  );
};
