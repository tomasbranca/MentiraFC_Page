import { getMainTeamIndex, getSurroundingTeams } from "../../../utils/table.utils";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes.constants";
import { getImageUrl } from "../../../../data/imageService";

const TableWidget = ({ table }) => {
  if (!table) return null;

  const standings = table.standings || [];
  const mainIndex = getMainTeamIndex(standings);
  const surroundingTeams = getSurroundingTeams(standings, mainIndex);

  return (
    <section className="bg-gradient-to-b from-stone-900 to-stone-950 p-4 lg:p-6 mx-0 lg:m-6 shadow-xl h-fit">
      {/* HEADER */}
      <div className="mb-6">
        <h4 className="text-2xl lg:text-3xl font-extrabold uppercase text-white tracking-wide">
          Clasificación
        </h4>
        <div className="mt-2 h-1 w-16 bg-violet-600" />
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {surroundingTeams.map((row) => {
          const points = row.points ?? row.wins * 3 + row.draws;
          const isMain = row.team.isMain;

          return (
            <div
              key={row.team.id}
              className={`
                flex items-center justify-between
                px-3 lg:px-4
                py-2 lg:py-3
                transition-colors
                ${
                  isMain
                    ? "bg-violet-900/80 border-l-4 border-violet-500"
                    : "bg-stone-800/80 hover:bg-stone-700/80"
                }
              `}
            >
              {/* IZQUIERDA */}
              <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                <span className="text-base lg:text-lg font-bold text-stone-300 w-6 text-center">
                  {row.position}
                </span>

                <img
                  src={getImageUrl(row.team.imageUrl, {
                    width: 32,
                    height: 32,
                    fit: "max",
                  })}
                  alt={row.team.name}
                  className="hidden md:block size-8 object-contain"
                />

                <span
                  className={`
                    font-semibold uppercase tracking-wide
                    truncate max-w-[160px] lg:max-w-none
                    ${isMain ? "text-white" : "text-stone-200"}
                  `}
                >
                  {row.team.name}
                </span>
              </div>

              {/* DERECHA */}
              <span
                className={`
                  text-lg lg:text-xl font-extrabold tabular-nums
                  ${isMain ? "text-white" : "text-stone-100"}
                `}
              >
                {points}
              </span>
            </div>
          );
        })}
      </div>

      {/* LINK */}
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
};

export default TableWidget;
