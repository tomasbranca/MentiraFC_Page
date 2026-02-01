import { useEffect, useState } from "react";
import { getTable, urlFor } from "../../../lib/sanity";

const TableWidget = () => {
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTable().then((data) => {
      setTable(data);
      setLoading(false);
    });
  }, []);

  if (loading || !table) return null;

  // 🔹 misma lógica que la tabla grande
  const standings = [...table.standings].sort(
    (a, b) => a.position - b.position
  );

  // 🔹 detectar equipo principal
  const mainIndex = standings.findIndex((row) => row.team.isMain);

  function getSurroundingTeams(arr, idx, range = 2) {
    if (idx === -1) return arr.slice(0, 5);

    const start = Math.max(0, idx - range);
    const end = Math.min(arr.length, idx + range + 1);

    if (start === 0) return arr.slice(0, 5);
    if (end === arr.length) return arr.slice(-5);

    return arr.slice(start, end);
  }

  const surroundingTeams = getSurroundingTeams(standings, mainIndex);

  return (
    <section className="table-widget bg-stone-900 p-4 m-6 col-span-1 rounded-2xl outline-4 outline-stone-900 outline-offset-2">
      <div className="text-center align-middle h-[15%]">
        <h4 className="text-4xl text-white font-extrabold uppercase leading-tight">
          Clasificación
        </h4>
      </div>

      <table className="w-full h-[85%] table-auto text-white border-separate border-spacing-y-2">
        <tbody>
          {surroundingTeams.map((row) => {
            const points = row.wins * 3 + row.draws;
            const isMain = row.team.isMain;

            return (
              <tr
                key={row.team._id}
                className={isMain ? "bg-violet-900" : "bg-stone-800"}
              >
                {/* POSICIÓN */}
                <td className="p-2 rounded-l-2xl">{row.position}</td>

                {/* EQUIPO */}
                <td className="p-2 align-middle gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={urlFor(row.team.logo)
                        .width(32)
                        .height(32)
                        .fit("max")
                        .url()}
                      alt={row.team.name}
                      className="h-8 object-contain"
                    />
                    {row.team.name}
                  </div>
                </td>

                {/* PUNTOS */}
                <td className="p-2 rounded-r-2xl">{points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default TableWidget;
