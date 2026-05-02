import type { InitialDataPayload } from "../../../../data/getInitialData";
import {
  getHybridTournamentTable,
  getTopScorers,
} from "../../../../domain/stats";
import { sortNews } from "../../../utils/news.utils";

export const DEFERRED_HOME_STALE_TIME = 1000 * 60 * 5;

export type DeferredHomeData = Pick<
  InitialDataPayload,
  "players" | "games" | "tournament" | "teams" | "tournamentGames"
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
    Array.isArray(candidate.games) &&
    Array.isArray(candidate.teams) &&
    Array.isArray(candidate.tournamentGames) &&
    Object.prototype.hasOwnProperty.call(candidate, "tournament")
  );
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
  const games = deferredData?.games ?? initialData.games;
  const tournamentSource = deferredData?.tournament ?? initialData.tournament;
  const teams = deferredData?.teams ?? initialData.teams;
  const tournamentGames =
    deferredData?.tournamentGames ?? initialData.tournamentGames;

  const topScorers = getTopScorers(games, players, {
    year,
  });

  const mainTeam = teams.find((team) => team.isMain) || null;

  const gamesFromActiveTournament = tournamentGames.filter(
    (nextGame) => nextGame.tournamentId === tournamentSource?.id
  );

  const tournament = tournamentSource
    ? {
        ...tournamentSource,
        standings: getHybridTournamentTable({
          manualStandings: tournamentSource.standings,
          games: gamesFromActiveTournament,
          mainTeam,
          primaryPrizeSlots: tournamentSource.primaryPrizeSlots,
          secondaryPrizeSlots: tournamentSource.secondaryPrizeSlots,
        }),
      }
    : null;

  return {
    news: sortNews(initialData.news),
    topScorers,
    tournament,
  };
};
