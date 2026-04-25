import { useGame } from "../../context/useGame";

export const useLatestGame = () => {
  const { game, loading, error, refetch } = useGame();

  return {
    data: game,
    isLoading: loading,
    isError: Boolean(error),
    refetch,
  };
};
