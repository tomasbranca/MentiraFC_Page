import { useEffect, useState } from "react";
import { getTable, urlFor } from "../../lib/sanity";
import { FaCrown } from "react-icons/fa";
import Loader from "../../components/Loader/Loader";

const Table = () => {
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getTable()
      .then((data) => {
        setTable(data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error al cargar la tabla</h2>
          <p className="text-neutral-500">
            No pudimos obtener la tabla de posiciones. Intentá recargar la
            página más tarde.
          </p>
        </div>
      </main>
    );
  }

  if (!table) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold mb-4">No hay tabla activa</h2>
          <p className="text-neutral-500">
            Todavía no se publicó una tabla de posiciones para este torneo.
          </p>
        </div>
      </main>
    );
  }

  const standings = [...table.standings].sort(
    (a, b) => a.position - b.position
  );

  const lastUpdate = table._updatedAt
    ? new Date(table._updatedAt).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden">
        {/* TÍTULO */}
        <div className="py-10 mb-6 relative">
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${table.primaryColor}, transparent)`,
            }}
          />

          <div className="flex flex-col items-center gap-3">
            {table.logo && (
              <img
                src={urlFor(table.logo).width(56).height(56).fit("max").url()}
                alt={table.title}
                className="w-14 h-14 object-contain"
              />
            )}

            <span className="text-xs uppercase tracking-widest text-neutral-500">
              Tabla de posiciones
            </span>

            <h1 className="text-4xl font-black text-neutral-900 tracking-tight relative text-center">
              {table.title}
              <span
                className="absolute left-1/2 -bottom-3 w-20 h-[3px] -translate-x-1/2 rounded-full"
                style={{ backgroundColor: table.primaryColor }}
              />
            </h1>

            {lastUpdate && (
              <span className="text-xs text-neutral-500 mt-4">
                Última actualización:{" "}
                <span className="font-medium text-neutral-700">
                  {lastUpdate}
                </span>
              </span>
            )}
          </div>

          <div
            className="absolute inset-x-0 bottom-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${table.primaryColor}, transparent)`,
            }}
          />
        </div>

        {/* TABLA */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-900 text-neutral-100 text-[11px] uppercase tracking-widest">
                <th className="py-4 px-4 text-left">#</th>
                <th className="py-4 px-4 text-left">Equipo</th>
                <th className="py-4 px-3 text-center">PJ</th>
                <th className="py-4 px-3 text-center">G</th>
                <th className="py-4 px-3 text-center">E</th>
                <th className="py-4 px-3 text-center">P</th>
                <th className="py-4 px-3 text-center">GF</th>
                <th className="py-4 px-3 text-center">GC</th>
                <th className="py-4 px-3 text-center">DG</th>
                <th className="py-4 px-4 text-center font-bold">Pts</th>
              </tr>
            </thead>

            <tbody>
              {standings.map((row) => {
                const dg = row.goalsFor - row.goalsAgainst;
                const points = row.wins * 3 + row.draws;

                return (
                  <tr
                    key={row.team._id}
                    className={`
                      border-b border-neutral-200 transition
                      ${row.position === 1 ? "bg-yellow-50" : ""}
                      ${
                        row.team.isMain
                          ? "bg-violet-50 ring-1 ring-violet-200"
                          : "hover:bg-neutral-100"
                      }
                    `}
                  >
                    <td className="py-3 px-4 font-bold flex items-center gap-2">
                      {row.position}
                      {row.position === 1 && (
                        <FaCrown className="text-yellow-500 text-sm" />
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={urlFor(row.team.logo)
                            .width(30)
                            .height(30)
                            .fit("max")
                            .url()}
                          alt={row.team.name}
                          className="w-7 h-7 object-contain"
                        />
                        <span
                          className={`font-semibold ${
                            row.team.isMain
                              ? "text-violet-700"
                              : "text-neutral-900"
                          }`}
                        >
                          {row.team.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">{row.played}</td>
                    <td className="py-3 px-3 text-center">{row.wins}</td>
                    <td className="py-3 px-3 text-center">{row.draws}</td>
                    <td className="py-3 px-3 text-center">{row.losses}</td>
                    <td className="py-3 px-3 text-center">{row.goalsFor}</td>
                    <td className="py-3 px-3 text-center">
                      {row.goalsAgainst}
                    </td>

                    <td
                      className={`py-3 px-3 text-center font-bold ${
                        dg > 0
                          ? "text-green-600"
                          : dg < 0
                          ? "text-red-500"
                          : "text-neutral-500"
                      }`}
                    >
                      {dg > 0 ? `+${dg}` : dg}
                    </td>

                    <td className="py-3 px-4 text-center text-lg font-extrabold text-neutral-900">
                      {points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Table;
