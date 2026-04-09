import { useCallback, useEffect, useRef, useState } from "react";
import { reportError } from "../lib/errors/errorLogger";

export const useFetchData = (fetcher, options = {}) => {
  const { initialData = null, onError, errorContext } = options;
  const initialDataRef = useRef(initialData);
  const onErrorRef = useRef(onError);
  const errorContextRef = useRef(errorContext);

  const [data, setData] = useState(initialDataRef.current);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    onErrorRef.current = onError;
    errorContextRef.current = errorContext;
  }, [onError, errorContext]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      reportError(err, {
        source: "useFetchData",
        ...errorContextRef.current,
      });

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
