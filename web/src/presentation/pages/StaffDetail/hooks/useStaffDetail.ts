import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getStaffMemberBySlug } from "../../../../data/staff";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/useInitialData";
import type { StaffMember } from "../../../../types/models";

export const useStaffDetail = (slug: string | undefined) => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const detailFromInitialData =
    initialData.currentStaffDetail?.slug === slug
      ? initialData.currentStaffDetail
      : null;
  const staffQueryKey = useMemo(
    () => queryKeys.staff.bySlug(slug ?? ""),
    [slug]
  );
  const cacheSnapshot = useMemo(() => {
    const hasStaffMember =
      queryClient.getQueryState(staffQueryKey)?.data !== undefined;

    return {
      cachedStaffMember: hasStaffMember
        ? queryClient.getQueryData<StaffMember | null>(staffQueryKey)
        : undefined,
      hasStaffMember,
    };
  }, [queryClient, staffQueryKey]);
  const initialStaffMember = cacheSnapshot.hasStaffMember
    ? cacheSnapshot.cachedStaffMember ?? null
    : detailFromInitialData?.staffMember ?? undefined;
  const shouldLoadStaffMember =
    Boolean(slug) && !detailFromInitialData && !cacheSnapshot.hasStaffMember;

  const staffQuery = useQuery({
    queryKey: staffQueryKey,
    queryFn: async () => {
      try {
        return await getStaffMemberBySlug(slug ?? "");
      } catch (error) {
        reportError(error, {
          page: "StaffDetail",
          action: "refresh_staff_detail",
          slug,
        });
        throw error;
      }
    },
    enabled: Boolean(slug),
    initialData: shouldLoadStaffMember ? undefined : initialStaffMember,
    placeholderData: shouldLoadStaffMember ? initialStaffMember : undefined,
    refetchInterval: SANITY_FRESHNESS.semiDynamic.refetchInterval,
    refetchOnMount: true,
    staleTime: SANITY_FRESHNESS.semiDynamic.staleTime,
  });

  return {
    staffMember: staffQuery.data ?? null,
    loading: shouldLoadStaffMember && staffQuery.isFetching,
    error: Boolean(staffQuery.error && typeof staffQuery.data === "undefined"),
    refetch: async () => {
      await staffQuery.refetch();
    },
  };
};
