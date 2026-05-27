import { useState } from "react";
import PlayerCard from "../../../components/PlayerCard/PlayerCard";
import { filterPlayersWithGoals, paginate } from "./topScorers.utils";
import { PLAYER_CARD_MODE } from "../../../components/PlayerCard/playerCard.utils";
import type { PlayerWithGoals } from "../../../../types/models";

type TopScorersProps = {
  players?: PlayerWithGoals[];
};

const TopScorers = ({ players = [] }: TopScorersProps) => {
  const [page, setPage] = useState(0);

  const playersPerPage = 4;

  const playersWithGoals = filterPlayersWithGoals(players);

  if (!playersWithGoals.length) return null;

  const {
    slice: visiblePlayers,
    hasNext,
    hasPrev,
  } = paginate(playersWithGoals, page, playersPerPage);

  return (
    <section className="m-4 p-4 sm:m-6 xl:col-span-2">
      {/* HEADER */}
      <div className="mb-6 flex flex-col items-center md:mb-8 xl:flex-row xl:items-center">
        <h2 className="font-extrabold uppercase whitespace-nowrap text-white bg-violet-900 px-6 py-2 text-center text-[clamp(1.2rem,5vw,1.6rem)] xl:text-violet-900 xl:bg-transparent xl:px-0 xl:py-0">
          Máximos goleadores
        </h2>

        <div className="hidden xl:block bg-violet-900 h-8 grow ml-4"></div>
      </div>

      {/* MOBILE */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 md:hidden">
        {playersWithGoals.map((player) => (
          <div
            key={player.id}
            className="snap-start shrink-0 w-[75%] sm:w-[55%]"
          >
            <PlayerCard player={player} mode={PLAYER_CARD_MODE.GOALS} />
          </div>
        ))}
      </div>

      {/* TABLET */}
      <div className="hidden grid-cols-4 gap-4 md:grid xl:hidden">
        {playersWithGoals.slice(0, playersPerPage).map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            mode={PLAYER_CARD_MODE.GOALS}
          />
        ))}
      </div>

      {/* DESKTOP */}
      <div className="hidden xl:block">
        <div
          className={`flex ${
            visiblePlayers.length < 4
              ? "justify-start gap-12"
              : "justify-between"
          }`}
        >
          {visiblePlayers.map((player) => (
            <div key={player.id} className="w-45 xl:w-50">
              <PlayerCard player={player} mode={PLAYER_CARD_MODE.GOALS} />
            </div>
          ))}
        </div>

        {/* CONTROLES */}
        {playersWithGoals.length > playersPerPage && (
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!hasPrev}
              className="px-4 py-2 bg-neutral-900 text-white disabled:opacity-30 hover:bg-neutral-800 transition"
            >
              ←
            </button>

            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasNext}
              className="px-4 py-2 bg-neutral-900 text-white disabled:opacity-30 hover:bg-neutral-800 transition"
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopScorers;
