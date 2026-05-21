type SkeletonBlockProps = {
  className: string;
};

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const SkeletonBlock = ({ className }: SkeletonBlockProps) => (
  <div
    aria-hidden="true"
    className={joinClasses(
      "animate-pulse rounded-md bg-linear-to-r from-white/6 via-white/10 to-white/6",
      className
    )}
  />
);
