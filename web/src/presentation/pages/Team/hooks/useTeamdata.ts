import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getPlayers } from "../../../../data/players";
import { getStaff } from "../../../../data/staff";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import {
  shouldLoadStaffInitially,
  shouldLoadTeamInitially,
} from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/useInitialData";
import { groupTeamMembers } from "../team.utils";
import type { Player, StaffMember } from "../../../../types/models";

const EMPTY_PLAYERS: Player[] = [];
const EMPTY_STAFF: StaffMember[] = [];

export const useTeamData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const hasCachedPlayers = useRef(
    queryClient.getQueryState(queryKeys.players.all)?.data !== undefined
  );
  const cachedPlayers = hasCachedPlayers.current
    ? queryClient.getQueryData<Player[]>(queryKeys.players.all)
    : undefined;
  const hasCachedStaff = useRef(
    queryClient.getQueryState(queryKeys.staff.all)?.data !== undefined
  );
  const cachedStaff = hasCachedStaff.current
    ? queryClient.getQueryData<StaffMember[]>(queryKeys.staff.all)
    : undefined;
  const initialPlayers = cachedPlayers ?? initialData.players;
  const initialStaff = cachedStaff ?? initialData.staff;
  const needsInitialFetch =
    !hasCachedPlayers.current &&
    shouldLoadTeamInitially(initialData.bootstrapScope, initialPlayers.length);
  const needsInitialStaffFetch =
    !hasCachedStaff.current &&
    shouldLoadStaffInitially(initialData.bootstrapScope, initialStaff.length);

  const playersQuery = useQuery({
    queryKey: queryKeys.players.all,
    queryFn: async () => {
      try {
        return await getPlayers();
      } catch (error) {
        reportError(error, {
          page: "Team",
          action: "refresh_team_players",
        });
        throw error;
      }
    },
    enabled: true,
    initialData: needsInitialFetch ? undefined : initialPlayers,
    placeholderData: needsInitialFetch ? initialPlayers : undefined,
    refetchInterval: SANITY_FRESHNESS.semiDynamic.refetchInterval,
    refetchOnMount: true,
    staleTime: SANITY_FRESHNESS.semiDynamic.staleTime,
  });

  const staffQuery = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      try {
        return await getStaff();
      } catch (error) {
        reportError(error, {
          page: "Team",
          action: "refresh_team_staff",
        });
        throw error;
      }
    },
    enabled: true,
    initialData: needsInitialStaffFetch ? undefined : initialStaff,
    placeholderData: needsInitialStaffFetch ? initialStaff : undefined,
    refetchInterval: SANITY_FRESHNESS.semiDynamic.refetchInterval,
    refetchOnMount: true,
    staleTime: SANITY_FRESHNESS.semiDynamic.staleTime,
  });

  const players = playersQuery.data ?? EMPTY_PLAYERS;
  const staff = staffQuery.data ?? EMPTY_STAFF;
  const grouped = useMemo(
    () => groupTeamMembers(players, staff),
    [players, staff]
  );
  const loading =
    (needsInitialFetch && playersQuery.isFetching) ||
    (needsInitialStaffFetch && staffQuery.isFetching);
  const error = Boolean(
    (playersQuery.error && typeof playersQuery.data === "undefined") ||
      (staffQuery.error && typeof staffQuery.data === "undefined")
  );

  return {
    players,
    staff,
    grouped,
    loading,
    error,
    refetch: async () => {
      await Promise.all([playersQuery.refetch(), staffQuery.refetch()]);
    },
  };
};
