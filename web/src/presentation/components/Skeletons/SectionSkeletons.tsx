import { Link } from "react-router-dom";
import { ROUTES } from "../../../shared/routing";
import PlayerCardSkeleton from "../PlayerCard/PlayerCardSkeleton";
import { SkeletonBlock } from "./SkeletonBlock";

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const TOP_SCORERS_SKELETON_CARD_COUNT = 4;
const TABLE_WIDGET_SKELETON_ROW_COUNT = 5;

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
  <section className="m-4 p-4 sm:m-6 xl:col-span-2" aria-label="Cargando máximos goleadores">
    <div className="mb-6 flex flex-col items-center md:mb-8 xl:flex-row xl:items-center">
      <h2 className="font-extrabold uppercase whitespace-nowrap text-white bg-violet-900 px-6 py-2 text-center text-[clamp(1.2rem,5vw,1.6rem)] xl:text-violet-900 xl:bg-transparent xl:px-0 xl:py-0">
        Máximos goleadores
      </h2>

      <div className="hidden xl:block bg-violet-900 h-8 grow ml-4" />
    </div>

    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 md:hidden">
      {Array.from({ length: TOP_SCORERS_SKELETON_CARD_COUNT }).map((_, index) => (
        <div
          key={index}
          className="snap-start shrink-0 w-[75%] sm:w-[55%]"
        >
          <PlayerCardSkeleton />
        </div>
      ))}
    </div>

    <div className="hidden grid-cols-4 gap-4 md:grid xl:hidden">
      {Array.from({ length: TOP_SCORERS_SKELETON_CARD_COUNT }).map((_, index) => (
        <PlayerCardSkeleton key={index} />
      ))}
    </div>

    <div className="hidden xl:block">
      <div className="flex justify-between">
        {Array.from({ length: TOP_SCORERS_SKELETON_CARD_COUNT }).map((_, index) => (
          <div key={index} className="w-45 xl:w-50">
            <PlayerCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const TableWidgetSkeleton = () => (
  <section
    className="mx-0 bg-linear-to-b from-stone-900 to-stone-950 p-4 shadow-xl h-fit md:m-6 lg:p-6"
    aria-label="Cargando clasificación"
  >
    <div className="mb-6">
      <h2 className="text-2xl lg:text-3xl font-extrabold uppercase text-white tracking-wide">
        Clasificación
      </h2>
      <div className="mt-2 h-1 w-16 bg-violet-600" />
    </div>

    <div className="space-y-2">
      {Array.from({ length: TABLE_WIDGET_SKELETON_ROW_COUNT }).map((_, index) => (
        <div
          key={index}
          className={joinClasses(
            "flex items-center justify-between px-3 py-2 lg:px-4 lg:py-3 bg-stone-800/80",
            index === 2 && "border-l-4 border-violet-500/70 bg-violet-900/50"
          )}
        >
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">
            <SkeletonBlock className="h-5 w-6 rounded-none" />
            <SkeletonBlock className="hidden md:block size-8 rounded-sm" />
            <SkeletonBlock className="h-4 w-28 max-w-40 lg:max-w-none lg:h-5 lg:w-36" />
          </div>

          <SkeletonBlock className="h-6 w-8 lg:h-7 lg:w-10" />
        </div>
      ))}
    </div>

    <div className="mt-6 text-right">
      <Link
        to={ROUTES.TABLE}
        className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition"
      >
        Ver tabla completa →
      </Link>
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
