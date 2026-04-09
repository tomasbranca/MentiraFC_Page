import { useCallback, useEffect, useState } from "react";

export const useFetchData = (fetcher, options = {}) => {
  const { initialData = null, onError } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      return initialData;
    } finally {
      setLoading(false);
    }
  }, [fetcher, initialData, onError]);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
};
