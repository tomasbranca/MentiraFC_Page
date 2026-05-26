export const getProfileInitials = (
  firstName: string,
  lastName: string,
  fallback = "?"
): string => {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);
  const initials = `${firstInitial}${lastInitial}`.trim();

  return initials ? initials.toUpperCase() : fallback;
};
