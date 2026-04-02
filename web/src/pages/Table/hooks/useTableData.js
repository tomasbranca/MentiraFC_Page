import { useEffect, useState } from "react";
import { formatStandings } from "../table.utils";
import { getTournament } from "../../../lib/sanity/services/tournaments.service";

export const useTableData = () => {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getTournament()
      .then((data) => {
        const formatted = {
          ...data,
          standings: formatStandings(data.standings),
        };

        setTournament(formatted);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { tournament, loading, error };
};