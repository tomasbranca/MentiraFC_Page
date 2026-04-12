// @ts-nocheck
import { useCallback } from "react";
import { getPlayers } from "../../../../data/players";
import { groupPlayersByPosition } from "../team.utils";
import { useFetchData } from "../../../hooks/useFetchData";

export const useTeamData = () => {
  const fetcher = useCallback(async () => {
    const players = await getPlayers();
    return {
      players,
      grouped: groupPlayersByPosition(players),
    };
  }, []);

  const { data, loading, error, refetch } = useFetchData(fetcher, {
    initialData: {
      players: [],
      grouped: {},
    },
    errorContext: {
      page: "Team",
      action: "load_team",
    },
  });

  return { ...data, loading, error: Boolean(error), refetch };
};
