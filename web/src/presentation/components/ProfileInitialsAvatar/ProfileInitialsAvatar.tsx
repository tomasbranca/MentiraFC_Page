import { getProfileInitials } from "../../utils/profile.utils";

type ProfileInitialsAvatarSize = "sm" | "md";

type ProfileInitialsAvatarProps = {
  firstName: string;
  lastName: string;
  size?: ProfileInitialsAvatarSize;
  className?: string;
};

const sizeClasses: Record<ProfileInitialsAvatarSize, string> = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-lg",
};

const ProfileInitialsAvatar = ({
  firstName,
  lastName,
  size = "sm",
  className = "",
}: ProfileInitialsAvatarProps) => (
  <div
    className={`flex shrink-0 items-center justify-center bg-neutral-700/80 font-black text-neutral-100 ${sizeClasses[size]} ${className}`}
    aria-hidden="true"
  >
    {getProfileInitials(firstName, lastName)}
  </div>
);

export default ProfileInitialsAvatar;
