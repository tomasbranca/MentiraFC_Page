import { adaptStaff, adaptStaffMember } from "../adapters/staff.adapter";
import { client } from "../sanity.client";
import {
  STAFF_BY_SLUG_OR_ID_QUERY,
  STAFF_QUERY,
} from "../queries/staff.queries";

import type { StaffMember } from "../../../types/models";

export const getStaff = async (): Promise<StaffMember[]> => {
  const data = await client.fetch(STAFF_QUERY);
  return adaptStaff(data);
};

export const getStaffMemberBySlug = async (
  slug: string
): Promise<StaffMember | null> => {
  const data = await client.fetch(STAFF_BY_SLUG_OR_ID_QUERY, { slug });
  return adaptStaffMember(data);
};
