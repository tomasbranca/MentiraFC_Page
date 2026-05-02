import type { StaffMember } from "../../../types/models";
import {
  getSanitySlugValue,
  sanityStaffSchema,
  type SanityStaff,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

export const adaptStaffMember = (staffMember: unknown): StaffMember | null => {
  const validated = validateSanityItem(
    sanityStaffSchema,
    staffMember,
    "staff.adapter:adaptStaffMember"
  );
  if (!validated) return null;

  return {
    id: validated._id,
    name: validated.name,
    lastName: validated.lastName,
    fullName: `${validated.name} ${validated.lastName}`,
    role: validated.role,
    birthDate: validated.birthDate,
    slug: getSanitySlugValue(validated.slug),
    imageUrl: validated.imageUrl,
  };
};

export const adaptStaff = (staff: unknown): StaffMember[] => {
  const validatedStaff: SanityStaff[] = validateSanityArray(
    sanityStaffSchema,
    staff,
    "staff.adapter:adaptStaff"
  );

  return validatedStaff
    .map(adaptStaffMember)
    .filter((staffMember): staffMember is StaffMember => Boolean(staffMember));
};
