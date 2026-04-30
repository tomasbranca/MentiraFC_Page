import { createContext, useContext, type ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { InitialDataPayload } from "../../data/getInitialData";
import { getRouteInitialData } from "../../data/getRouteInitialData";
import { queryKeys } from "../../data/queryKeys";
import { queryClient } from "../../lib/queryClient";
import { reportError } from "../../lib/errors/errorLogger";
import { ROUTES } from "../constants/routes.constants";
import {
  HOME_CRITICAL_BACKGROUND_STALE_TIME,
  mergeHomeCriticalIntoInitialData,
  shouldLoadHomeCriticalData,
} from "./initialDataContext.utils";

type InitialDataContextValue = {
  initialData: InitialDataPayload;
  isHomeCriticalLoading: boolean;
};

const InitialDataContext = createContext<InitialDataContextValue | null>(null);

type InitialDataProviderProps = {
  initialData: InitialDataPayload;
  children: ReactNode;
};

export const InitialDataProvider = ({
  initialData,
  children,
}: InitialDataProviderProps) => {
  const { pathname } = useLocation();
  const [data, setData] = useState<InitialDataPayload>(initialData);
  const [isHomeCriticalLoading, setIsHomeCriticalLoading] = useState(false);

  useEffect(() => {
    setData(initialData);
    setIsHomeCriticalLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (!shouldLoadHomeCriticalData(data.news.length, data.bootstrapScope)) {
      setIsHomeCriticalLoading(false);
      return;
    }

    let isCancelled = false;
    setIsHomeCriticalLoading(true);

    queryClient
      .fetchQuery({
        queryKey: queryKeys.home.critical,
        queryFn: () => getRouteInitialData(ROUTES.HOME),
        staleTime: HOME_CRITICAL_BACKGROUND_STALE_TIME,
      })
      .then((homeData) => {
        if (isCancelled) {
          return;
        }

        setData((previousData) =>
          mergeHomeCriticalIntoInitialData(previousData, homeData)
        );
        setIsHomeCriticalLoading(false);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setIsHomeCriticalLoading(false);

        reportError(error, {
          scope: "InitialDataProvider",
          action: "lazy_load_home_data",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [data.bootstrapScope, data.news.length, pathname]);

  return (
    <InitialDataContext.Provider
      value={{ initialData: data, isHomeCriticalLoading }}
    >
      {children}
    </InitialDataContext.Provider>
  );
};

export const useInitialData = (): InitialDataContextValue => {
  const context = useContext(InitialDataContext);

  if (!context) {
    throw new Error("useInitialData must be used within InitialDataProvider");
  }

  return context;
};
