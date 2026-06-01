import { adaptStaff, adaptStaffMember } from "../adapters/staff.adapter";
import {
  STAFF_BY_SLUG_OR_ID_QUERY,
  STAFF_QUERY,
} from "../queries/staff.queries";
import { normalizeSanitySlugOrPublicIdParam } from "../requestParams";
import { fetchSanityQuery } from "../sanityFetch";

import type { StaffMember } from "../../../types/models";

export const getStaff = async (): Promise<StaffMember[]> => {
  const data = await fetchSanityQuery(STAFF_QUERY);
  return adaptStaff(data);
};

export const getStaffMemberBySlug = async (
  slug: string
): Promise<StaffMember | null> => {
  const normalizedSlug = normalizeSanitySlugOrPublicIdParam(slug);

  if (!normalizedSlug) {
    return null;
  }

  const data = await fetchSanityQuery(STAFF_BY_SLUG_OR_ID_QUERY, {
    params: { slug: normalizedSlug },
  });
  return adaptStaffMember(data);
};
