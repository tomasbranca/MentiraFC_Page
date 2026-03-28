import { useEffect, useState } from "react";
import { getPlayers } from "../../../lib/sanity";
import { groupPlayersByPosition } from "../team.utils";

export const useTeamData = () => {
  const [players, setPlayers] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPlayers()
      .then((data) => {
        setPlayers(data);
        setGrouped(groupPlayersByPosition(data));
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { players, grouped, loading, error };
};