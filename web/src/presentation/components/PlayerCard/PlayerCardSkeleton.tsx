import { SkeletonBlock } from "../Skeletons/SkeletonBlock";

type PlayerCardSkeletonProps = {
  className?: string;
};

const PlayerCardSkeleton = ({ className }: PlayerCardSkeletonProps) => (
  <div className={className} aria-hidden="true">
    <div className="relative w-full aspect-3/4 overflow-hidden bg-neutral-950 shadow-xl">
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        <SkeletonBlock className="h-8 w-10 sm:h-10 sm:w-12" />
        <SkeletonBlock className="size-5 rounded-full sm:size-8" />
      </div>

      <SkeletonBlock className="absolute inset-0 z-10 rounded-none" />

      <div className="absolute inset-0 z-20 bg-linear-to-t from-neutral-950 via-neutral-950/40 to-violet-900/20" />

      <div className="absolute bottom-0 left-0 z-30 w-full space-y-2 px-3 pb-4">
        <SkeletonBlock className="h-2 w-16" />
        <SkeletonBlock className="h-6 w-28 sm:h-8 sm:w-36" />
        <SkeletonBlock className="h-0.5 w-10 rounded-full" />
      </div>
    </div>
  </div>
);

export default PlayerCardSkeleton;
