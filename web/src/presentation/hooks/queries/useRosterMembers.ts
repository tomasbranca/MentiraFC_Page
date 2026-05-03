import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getPlayers } from "../../../data/players";
import { getStaff } from "../../../data/staff";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import { useInitialData } from "../../context/useInitialData";
import type { Player, StaffMember } from "../../../types/models";

const EMPTY_PLAYERS: Player[] = [];
const EMPTY_STAFF: StaffMember[] = [];

const hasLoadedMembers = <TMember,>(
  members: TMember[] | undefined
): members is TMember[] => Array.isArray(members) && members.length > 0;

export const useRosterMembers = (source: string) => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const cacheSnapshot = useMemo(() => {
    const cachedPlayers = queryClient.getQueryData<Player[]>(
      queryKeys.players.all
    );
    const cachedStaffMembers = queryClient.getQueryData<StaffMember[]>(
      queryKeys.staff.all
    );
    const hasPlayerList = hasLoadedMembers(cachedPlayers);
    const hasStaffList = hasLoadedMembers(cachedStaffMembers);

    return {
      cachedPlayers,
      cachedStaffMembers,
      hasPlayerList,
      hasStaffList,
    };
  }, [queryClient]);
  const initialPlayers = cacheSnapshot.hasPlayerList
    ? cacheSnapshot.cachedPlayers ?? EMPTY_PLAYERS
    : initialData.players.length > 0
      ? initialData.players
      : undefined;
  const initialStaffMembers = cacheSnapshot.hasStaffList
    ? cacheSnapshot.cachedStaffMembers ?? EMPTY_STAFF
    : initialData.staff.length > 0
      ? initialData.staff
      : undefined;
  const shouldLoadPlayers =
    !cacheSnapshot.hasPlayerList && initialPlayers === undefined;
  const shouldLoadStaff =
    !cacheSnapshot.hasStaffList && initialStaffMembers === undefined;

  const playersQuery = useQuery({
    queryKey: queryKeys.players.all,
    queryFn: async () => {
      try {
        return await getPlayers();
      } catch (error) {
        reportError(error, {
          source,
          action: "refresh_roster_players",
        });
        throw error;
      }
    },
    enabled: shouldLoadPlayers,
    initialData: shouldLoadPlayers ? undefined : initialPlayers,
    placeholderData: shouldLoadPlayers ? initialData.players : undefined,
    refetchOnMount: shouldLoadPlayers ? "always" : false,
  });

  const staffQuery = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      try {
        return await getStaff();
      } catch (error) {
        reportError(error, {
          source,
          action: "refresh_roster_staff",
        });
        throw error;
      }
    },
    enabled: shouldLoadStaff,
    initialData: shouldLoadStaff ? undefined : initialStaffMembers,
    placeholderData: shouldLoadStaff ? initialData.staff : undefined,
    refetchOnMount: shouldLoadStaff ? "always" : false,
  });

  return {
    players: playersQuery.data ?? EMPTY_PLAYERS,
    staffMembers: staffQuery.data ?? EMPTY_STAFF,
  };
};
