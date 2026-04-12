// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getNews } from "../../../../data/news";
import { queryKeys } from "../../../../data/queryKeys";
import { reportError } from "../../../../lib/errors/errorLogger";

import { sortNews } from "../../../utils/news.utils";

export const useHomeData = () => {
  const year = new Date().getFullYear();
  const [deferredQueriesEnabled, setDeferredQueriesEnabled] = useState(false);
  const [secondaryData, setSecondaryData] = useState({
    topScorers: [],
    tournament: null,
  });
  const [secondaryError, setSecondaryError] = useState(false);
  const [loadingSecondary, setLoadingSecondary] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDeferredQueriesEnabled(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const newsQuery = useQuery({
    queryKey: queryKeys.news.all,
    queryFn: async () => {
      try {
        return await getNews();
      } catch (error) {
        reportError(error, { page: "Home", action: "load_home_news" });
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!deferredQueriesEnabled) return;

    let cancelled = false;

    const fetchSecondaryData = async () => {
      setLoadingSecondary(true);
      setSecondaryError(false);

      try {
        const [playersModule, gamesModule, tournamentModule, teamsModule, statsModule] =
          await Promise.all([
            import("../../../../data/players"),
            import("../../../../data/games"),
            import("../../../../data/tournament"),
            import("../../../../data/teams"),
            import("../../../../domain/stats"),
          ]);

        const [players, finishedGames, tournament, teams, finishedTournamentGames] =
          await Promise.all([
            playersModule.getPlayers(),
            gamesModule.getAllGames(),
            tournamentModule.getTournament(),
            teamsModule.getTeams(),
            gamesModule.getTournamentGames(),
          ]);

        if (cancelled) return;

        const topScorers = statsModule.getTopScorers(finishedGames, players, { year });
        const mainTeam = teams.find((team) => team.isMain) || null;
        const gamesFromActiveTournament = finishedTournamentGames.filter(
          (game) => game.tournamentId === tournament?.id
        );

        const hybridTournament = tournament
          ? {
              ...tournament,
              standings: statsModule.getHybridTournamentTable({
                manualStandings: tournament.standings,
                games: gamesFromActiveTournament,
                mainTeam,
              }),
            }
          : null;

        setSecondaryData({ topScorers, tournament: hybridTournament });
      } catch (error) {
        if (cancelled) return;

        reportError(error, { page: "Home", action: "load_home_secondary_data" });
        setSecondaryError(true);
      } finally {
        if (!cancelled) {
          setLoadingSecondary(false);
        }
      }
    };

    void fetchSecondaryData();

    return () => {
      cancelled = true;
    };
  }, [deferredQueriesEnabled, year]);

  const news = useMemo(() => sortNews(newsQuery.data ?? []), [newsQuery.data]);

  return {
    news,
    topScorers: secondaryData.topScorers,
    tournament: secondaryData.tournament,
    loadingNews: newsQuery.isLoading,
    loadingSecondary,
    error: newsQuery.isError,
    secondaryError,
    refetch: async () => {
      await Promise.all([newsQuery.refetch()]);
      setDeferredQueriesEnabled(false);
      window.setTimeout(() => {
        setDeferredQueriesEnabled(true);
      }, 0);
    },
  };
};
