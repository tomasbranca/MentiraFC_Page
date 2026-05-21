import type { InitialDataPayload } from "../../../../data/getInitialData";
import type { BootstrapScope } from "../../../../types/models";
import {
  getHybridTournamentTable,
  getTopScorersFromGoalEvents,
} from "../../../../domain/stats";
import { sortNews } from "../../../utils/news.utils";

export const DEFERRED_HOME_STALE_TIME = 1000 * 60 * 5;

export type DeferredHomeData = Pick<
  InitialDataPayload,
  "players" | "goalEvents" | "tournament" | "tournamentGames"
>;

export const hasCompleteDeferredHomeData = (
  payload: unknown
): payload is DeferredHomeData => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<DeferredHomeData>;

  return (
    Array.isArray(candidate.players) &&
    Array.isArray(candidate.goalEvents) &&
    Array.isArray(candidate.tournamentGames) &&
    Object.prototype.hasOwnProperty.call(candidate, "tournament")
  );
};

export const isDeferredHomeDataPending = (
  bootstrapScope: BootstrapScope,
  hasDeferredData: boolean,
  hasQueryError: boolean
) => {
  if (bootstrapScope !== "home-critical") {
    return false;
  }

  if (hasDeferredData || hasQueryError) {
    return false;
  }

  return true;
};

export const getDeferredHomeQueryBehavior = (cachedData: unknown) => {
  const hasCompleteData = hasCompleteDeferredHomeData(cachedData);

  return {
    hasCompleteData,
    staleTime: hasCompleteData ? DEFERRED_HOME_STALE_TIME : 0,
    refetchOnMount: hasCompleteData ? true : "always",
  } as const;
};

export const resolveHomeData = (
  initialData: InitialDataPayload,
  deferredData: DeferredHomeData | null,
  year: number
) => {
  const players = deferredData?.players ?? initialData.players;
  const goalEvents = deferredData?.goalEvents ?? initialData.goalEvents;
  const tournamentSource = deferredData?.tournament ?? initialData.tournament;
  const tournamentGames =
    deferredData?.tournamentGames ?? initialData.tournamentGames;

  const topScorers = getTopScorersFromGoalEvents(goalEvents, players, {
    year,
  });

  const mainTeam = tournamentSource?.mainTeam ?? null;

  const gamesFromActiveTournament = tournamentGames.filter(
    (nextGame) => nextGame.tournamentId === tournamentSource?.id
  );

  const tournament = tournamentSource
    ? {
        ...tournamentSource,
        standings: getHybridTournamentTable({
          manualStandings: tournamentSource.currentSnapshot?.standings ?? [],
          previousManualStandings:
            tournamentSource.previousSnapshot?.standings,
          games: gamesFromActiveTournament,
          mainTeam,
          primaryPrizeSlots: tournamentSource.primaryPrizeSlots,
          secondaryPrizeSlots: tournamentSource.secondaryPrizeSlots,
          gamesThroughDate: tournamentSource.currentSnapshot?.gamesThroughDate,
          previousGamesThroughDate:
            tournamentSource.previousSnapshot?.gamesThroughDate,
        }),
      }
    : null;

  return {
    news: sortNews(initialData.news),
    topScorers,
    tournament,
  };
};
