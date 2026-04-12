// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";

import { reportError } from "../../lib/errors/errorLogger";

type ErrorContext = Record<string, unknown>;

type UseFetchDataOptions<T> = {
  initialData?: T;
  onError?: (error: unknown) => void;
  errorContext?: ErrorContext;
};

type UseFetchDataResult<T> = {
  data: T;
  loading: boolean;
  error: unknown;
  refetch: () => Promise<T>;
};

export const useFetchData = <T,>(
  fetcher: () => Promise<T>,
  options: UseFetchDataOptions<T> = {}
): UseFetchDataResult<T> => {
  const { initialData, onError, errorContext } = options;
  const initialDataRef = useRef(initialData as T);
  const onErrorRef = useRef(onError);
  const errorContextRef = useRef(errorContext);

  const [data, setData] = useState<T>(initialDataRef.current);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

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
    void execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
};
