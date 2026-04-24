// @ts-nocheck
import { useMemo } from "react";

import { groupPlayersByPosition } from "../team.utils";
import { usePlayers } from "../../../hooks/queries/usePlayers";

export const useTeamData = () => {
  const { data: players = [], isLoading, isError, refetch } = usePlayers();

  const grouped = useMemo(() => groupPlayersByPosition(players), [players]);

  return {
    players,
    grouped,
    loading: isLoading,
    error: isError,
    refetch,
  };
};
