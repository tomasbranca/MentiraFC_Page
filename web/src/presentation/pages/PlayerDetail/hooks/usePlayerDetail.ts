import { useCallback, useEffect, useMemo, useState } from "react";

import { getAllGames } from "../../../../data/games";
import { getPlayerBySlug } from "../../../../data/players";
import { getPlayerStats } from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadPlayerDetailInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/useInitialData";
import type { Player } from "../../../../types/models";

type PlayerDetailViewModel = Player & { goalsThisYear: number };

export const usePlayerDetail = (slug: string | undefined) => {
  const { initialData } = useInitialData();
  const [overridePlayer, setOverridePlayer] = useState<
    PlayerDetailViewModel | null | undefined
  >(undefined);
  const [overrideGoals, setOverrideGoals] = useState<number | undefined>(
    undefined
  );
  const [overrideYear, setOverrideYear] = useState<number | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [error, setError] = useState(false);

  const detailFromInitialData =
    initialData.currentPlayerDetail?.slug === slug
      ? initialData.currentPlayerDetail
      : null;
  const needsInitialFetch = shouldLoadPlayerDetailInitially({
    slug,
    hasInitialDetail: Boolean(detailFromInitialData),
  });
  const [loading, setLoading] = useState(needsInitialFetch);

  const player = useMemo(() => {
    if (overridePlayer !== undefined) {
      return overridePlayer;
    }

    if (!detailFromInitialData?.player) {
      return null;
    }

    return {
      ...detailFromInitialData.player,
      goalsThisYear: detailFromInitialData.goalsThisYear,
    };
  }, [detailFromInitialData, overridePlayer]);

  const year = overrideYear ?? detailFromInitialData?.year ?? new Date().getFullYear();

  const refetch = useCallback(async () => {
    if (!slug) {
      return;
    }

    setLoading(true);

    try {
      const [nextPlayer, nextGames] = await Promise.all([
        getPlayerBySlug(slug),
        getAllGames(),
      ]);

      if (!nextPlayer) {
        setOverridePlayer(null);
        setOverrideGoals(0);
        setOverrideYear(new Date().getFullYear());
      } else {
        const nextYear = new Date().getFullYear();
        const stats = getPlayerStats(nextGames, nextPlayer.id, {
          year: nextYear,
        });

        setOverridePlayer({
          ...nextPlayer,
          goalsThisYear: stats.goals,
        });
        setOverrideGoals(stats.goals);
        setOverrideYear(nextYear);
      }

      setError(false);
    } catch (nextError) {
      setError(true);
      reportError(nextError, {
        page: "PlayerDetail",
        action: "refresh_player_detail",
        slug,
      });
    } finally {
      setHasAttemptedFetch(true);
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!needsInitialFetch || hasAttemptedFetch) {
      return;
    }

    void refetch();
  }, [hasAttemptedFetch, needsInitialFetch, refetch]);

  return {
    player:
      player && overrideGoals !== undefined
        ? {
            ...player,
            goalsThisYear: overrideGoals,
          }
        : player,
    loading,
    error,
    year,
    refetch,
  };
};
