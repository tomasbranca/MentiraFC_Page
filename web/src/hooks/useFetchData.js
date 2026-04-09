import { useCallback, useEffect, useRef, useState } from "react";

export const useFetchData = (fetcher, options = {}) => {
  const { initialData = null, onError } = options;
  const initialDataRef = useRef(initialData);
  const onErrorRef = useRef(onError);

  const [data, setData] = useState(initialDataRef.current);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
      return initialDataRef.current;
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

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
