import { ROUTES } from "../../../shared/routing";
import type { StaffMember } from "../../../types/models";

export const getStaffLink = (staffMember: StaffMember): string => {
  return ROUTES.STAFF_DETAIL(staffMember.slug?.trim() || staffMember.id);
};
