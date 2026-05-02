import {
  getStaff as fetchStaff,
  getStaffMemberBySlug as fetchStaffMemberBySlug,
} from "./sanity/services/staff.service";

import type { StaffMember } from "../types/models";

export const getStaff = async (): Promise<StaffMember[]> => fetchStaff();

export const getStaffMemberBySlug = async (
  slug: string
): Promise<StaffMember | null> => fetchStaffMemberBySlug(slug);
