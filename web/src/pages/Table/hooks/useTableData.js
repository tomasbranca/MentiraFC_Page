import { useEffect, useState } from "react";
import { getTable } from "../../../lib/sanity";
import { formatStandings } from "../table.utils";

export const useTableData = () => {
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getTable()
      .then((data) => {
        const formatted = {
          ...data,
          standings: formatStandings(data.standings),
        };

        setTable(formatted);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { table, loading, error };
};