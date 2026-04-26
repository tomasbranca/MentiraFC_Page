// @ts-nocheck
import { useState } from "react";
import { FiBarChart2 } from "react-icons/fi";
import { urlFor } from "../../../data/sanity/sanity.image";
import Loader from "../../components/Loader/Loader";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import { useTableData } from "./hooks/useTableData";
import { formatLongDate } from "../../utils/date.utils";

const Table = () => {
  const { tournament, loading, error, refetch } = useTableData();
  const [mode, setMode] = useState("compact");
  if (loading) return <Loader />;

  if (error) {
    return (
      <ErrorFallback
        title="Error al cargar la tabla"
        message="Intentá nuevamente más tarde."
        onRetry={refetch}
      />
    );
  }

  if (!tournament) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 text-white">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4 flex justify-center" aria-hidden="true">
            <FiBarChart2 />
          </div>
          <h2 className="text-xl font-bold mb-2">Sin tabla activa</h2>
          <p className="text-neutral-400">Aún no hay datos disponibles.</p>
        </div>
      </main>
    );
  }

  const standings = tournament.standings;

  const lastUpdate = formatLongDate(tournament.updatedAt);

  return (
    <>
      <div className="max-w-6xl mx-auto md:px-4 md:py-10">
        <div className="border border-neutral-800 bg-neutral-900">
          {/* HEADER */}
          <div className="px-6 py-8 border-b border-neutral-800 text-center shadow-lg shadow-black/30">
            {tournament.imageUrl && (
              <img
                src={urlFor(tournament.imageUrl).width(80).height(80).url()}
                alt={tournament.name}
                className="w-20 h-20 mx-auto mb-4 object-contain"
              />
            )}

            <span className="text-xs uppercase tracking-widest text-neutral-500">
              Tabla de posiciones
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
              {tournament.name}
            </h1>

            <div
              className="w-16 h-0.75 mx-auto mt-2"
              style={{ backgroundColor: tournament.primaryColor }}
            />

            {lastUpdate && (
              <p className="text-xs text-neutral-400 mt-3">
                Última actualización: {lastUpdate}
              </p>
            )}
          </div>

          {/* TOGGLE MOBILE */}
          <div className="md:hidden p-4">
            <div className="flex bg-neutral-900 border border-neutral-700 rounded-lg p-1">
              <Button
                variant="toggle"
                active={mode === "compact"}
                onClick={() => setMode("compact")}
                className="flex-1 rounded-l-md"
              >
                Resumen
              </Button>

              <Button
                variant="toggle"
                active={mode === "full"}
                onClick={() => setMode("full")}
                className="flex-1 rounded-r-md"
              >
                Completa
              </Button>
            </div>
          </div>

          {/* MOBILE */}
          <div
            className={`${
              mode === "compact" ? "block" : "hidden"
            } md:hidden px-4 pb-4 space-y-3 transition-all duration-300`}
          >
            {standings.map((row) => {
              const isChampion = row.type === "champion";
              const isPlayoff = row.type === "playoff";

              return (
                <div
                  key={row.team.id}
                  className={`border border-neutral-800 p-4
                    ${isChampion ? "bg-yellow-500/10" : ""}
                    ${isPlayoff ? "bg-white/2" : "bg-neutral-900"}
                  `}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-neutral-300">
                        {row.position}
                      </span>

                      <img
                        src={urlFor(row.team.imageUrl)
                          .width(32)
                          .height(32)
                          .url()}
                        alt={row.team.name}
                        className="w-7 h-7 object-contain"
                      />

                      <span
                        className={`font-semibold ${
                          row.team.isMain ? "text-violet-400" : "text-white"
                        }`}
                      >
                        {row.team.name}
                      </span>
                    </div>

                    <span
                      className={`text-lg font-extrabold ${
                        row.team.isMain
                          ? "text-violet-400"
                          : isChampion
                          ? "text-yellow-300"
                          : "text-white"
                      }`}
                    >
                      {row.points}
                    </span>
                  </div>

                  <div className="flex text-xs text-neutral-400 flex-wrap">
                    <span className="px-2 border-r border-neutral-700">
                      PJ: {row.played}
                    </span>
                    <span className="px-2 border-r border-neutral-700">
                      G: {row.wins}
                    </span>
                    <span className="px-2 border-r border-neutral-700">
                      E: {row.draws}
                    </span>
                    <span className="px-2 border-r border-neutral-700">
                      P: {row.losses}
                    </span>
                    <span className="px-2 border-r border-neutral-700">
                      GF: {row.goalsFor}
                    </span>
                    <span className="px-2 border-r border-neutral-700">
                      GC: {row.goalsAgainst}
                    </span>

                    <span className="px-2">
                      DG:{" "}
                      <span
                        className={
                          row.goalDiff > 0
                            ? "text-green-400"
                            : row.goalDiff < 0
                            ? "text-red-400"
                            : ""
                        }
                      >
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP - INTACTO */}
          <div
            className={`${
              mode === "full" ? "block" : "hidden"
            } md:block overflow-x-auto`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-neutral-500 border-b border-neutral-800">
                  <th className="py-3 px-3 text-left">#</th>
                  <th className="py-3 px-3 text-left">Equipo</th>
                  <th className="py-3 px-2 text-center">PJ</th>
                  <th className="py-3 px-2 text-center">G</th>
                  <th className="py-3 px-2 text-center">E</th>
                  <th className="py-3 px-2 text-center">P</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell">
                    GF
                  </th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell">
                    GC
                  </th>
                  <th className="py-3 px-2 text-center">DG</th>
                  <th className="py-3 px-3 text-center">PTS</th>
                </tr>
              </thead>

              <tbody>
                {standings.map((row, i) => {
                  const isChampion = row.type === "champion";
                  const isPlayoff = row.type === "playoff";

                  return (
                    <tr
                      key={row.team.id}
                      className={`border-b border-neutral-800 transition
                        ${i % 2 === 0 ? "bg-neutral-900" : "bg-neutral-900/70"}
                        ${isChampion ? "border-l-4 bg-yellow-500/10" : ""}
                        ${isPlayoff ? "border-l-4 bg-white/2" : ""}
                        hover:bg-neutral-800
                      `}
                      style={
                        isChampion
                          ? { borderLeftColor: "rgba(255, 193, 7, 0.8)" }
                          : isPlayoff
                          ? { borderLeftColor: tournament.primaryColor }
                          : {}
                      }
                    >
                      <td className="py-3 px-3 font-bold text-lg text-neutral-300">
                        {row.position}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={urlFor(row.team.imageUrl)
                              .width(30)
                              .height(30)
                              .url()}
                            alt={row.team.name}
                            className="w-7 h-7"
                          />
                          <span
                            className={`font-semibold ${
                              row.team.isMain ? "text-violet-400" : "text-white"
                            }`}
                          >
                            {row.team.name}
                          </span>
                        </div>
                      </td>

                      <td className="text-center text-neutral-400">
                        {row.played}
                      </td>
                      <td className="text-center text-neutral-400">
                        {row.wins}
                      </td>
                      <td className="text-center text-neutral-400">
                        {row.draws}
                      </td>
                      <td className="text-center text-neutral-400">
                        {row.losses}
                      </td>
                      <td className="text-center text-neutral-400 hidden sm:table-cell">
                        {row.goalsFor}
                      </td>
                      <td className="text-center text-neutral-400 hidden sm:table-cell">
                        {row.goalsAgainst}
                      </td>

                      <td className="text-center text-neutral-400">
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </td>

                      <td
                        className={`text-center font-extrabold text-lg ${
                          row.team.isMain
                            ? "text-violet-400"
                            : isChampion
                            ? "text-yellow-300"
                            : "text-white"
                        }`}
                      >
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Table;
