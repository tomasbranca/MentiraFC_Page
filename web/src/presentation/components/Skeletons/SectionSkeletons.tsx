type SkeletonBlockProps = {
  className: string;
};

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const SkeletonBlock = ({ className }: SkeletonBlockProps) => (
  <div
    aria-hidden="true"
    className={joinClasses(
      "animate-pulse rounded-md bg-linear-to-r from-white/6 via-white/10 to-white/6",
      className
    )}
  />
);

export const GameWidgetSkeleton = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={joinClasses(
      "relative overflow-hidden flex items-center justify-center bg-black border-2 border-gray-400 rounded-xl",
      compact ? "w-40 h-12" : "w-64 h-16"
    )}
    aria-label="Cargando resumen del partido"
  >
    <SkeletonBlock
      className={joinClasses(
        "absolute top-1/2 -translate-y-1/2 rounded-full",
        compact ? "-left-8 w-20 h-20 opacity-40" : "-left-10 w-28 h-28 opacity-50"
      )}
    />
    <SkeletonBlock
      className={joinClasses(
        "absolute top-1/2 -translate-y-1/2 rounded-full",
        compact ? "-right-8 w-20 h-20 opacity-40" : "-right-10 w-28 h-28 opacity-50"
      )}
    />

    <div className="relative z-10 flex flex-col items-center gap-1 px-6">
      <SkeletonBlock className={compact ? "h-2.5 w-20" : "h-3 w-28"} />
      <SkeletonBlock className={compact ? "h-2.5 w-16" : "h-3 w-20"} />
    </div>
  </div>
);

export const TopScorersSkeleton = () => (
  <section className="p-4 m-6 lg:col-span-2" aria-label="Cargando máximos goleadores">
    <div className="flex flex-col items-center lg:flex-row lg:items-center mb-8">
      <SkeletonBlock className="h-10 w-56" />
      <SkeletonBlock className="hidden lg:block h-8 grow ml-4" />
    </div>

    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <SkeletonBlock className="aspect-3/4 w-full" />
          <SkeletonBlock className="h-3 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  </section>
);

export const TableWidgetSkeleton = () => (
  <section
    className="bg-linear-to-b from-stone-900 to-stone-950 p-4 lg:p-6 mx-0 lg:m-6 shadow-xl h-fit"
    aria-label="Cargando clasificación"
  >
    <div className="mb-6">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="mt-2 h-1 w-16" />
    </div>

    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between px-3 py-3 lg:px-4 bg-stone-800/80"
        >
          <div className="flex items-center gap-3 lg:gap-4 min-w-0">
            <SkeletonBlock className="h-5 w-5" />
            <SkeletonBlock className="hidden md:block size-8" />
            <SkeletonBlock className="h-4 w-28" />
          </div>

          <SkeletonBlock className="h-6 w-8" />
        </div>
      ))}
    </div>

    <div className="mt-6 flex justify-end">
      <SkeletonBlock className="h-4 w-28" />
    </div>
  </section>
);

export const MoreNewsSkeleton = () => (
  <section aria-label="Cargando más noticias">
    <div className="mt-10 mb-6 px-6 pt-6 border-t border-violet-700/60">
      <div className="flex justify-center sm:justify-between items-center gap-4">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="hidden sm:block h-4 w-24" />
      </div>
    </div>

    <div className="grid gap-6 px-6 pb-14 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <SkeletonBlock className="aspect-4/3 sm:aspect-video w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  </section>
);
