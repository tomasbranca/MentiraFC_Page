const TableWidget = ({ table }) => {
  const tableSorted = [...table].sort((a, b) => a.position - b.position);
  const index = tableSorted.findIndex((team) => team.id === 1);

  function getSurroundingTeams(arr, idx, range) {
    const start = Math.max(0, idx - range);
    const end = Math.min(arr.length, idx + range + 1);
    if (start === 0) {
      return arr.slice(0, 7);
    } else if (end === arr.length) {
      return arr.slice(-7);
    }
    return arr.slice(start, end);
  }

  const surroundingTeams = getSurroundingTeams(tableSorted, index, 2);

  return (
    <section className="table-widget bg-stone-900 p-4 m-6 col-span-1 rounded-4xl">
      <div className="text-center align-middle h-[15%]">
        <h4 className="text-4xl text-white font-extrabold uppercase leading-tight">
          Clasificación
        </h4>
      </div>
      <table className="w-full h-[85%] table-auto text-white border-separate border-spacing-y-2">
        <tbody>
          {surroundingTeams.map((team) => (
            <tr
              key={team.id}
              className={team.id === 1 ? "bg-violet-900" : "bg-stone-800"}
            >
              <td className="p-2 rounded-l-2xl">{team.position}</td>
              <td className="p-2 align-middle gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src={team.id === 1 ? `logo.webp` : `/Teams/${team.id}.png`}
                    alt=""
                    className="y-8 h-8 object-contain"
                  />
                  {team.team}
                </div>
              </td>
              <td className="p-2 rounded-r-2xl">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default TableWidget;
