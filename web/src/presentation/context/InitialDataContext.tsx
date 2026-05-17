import { type ReactNode, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  createBootstrapErrorPayload,
  type InitialDataPayload,
} from "../../data/initialDataPayload";
import { queryKeys } from "../../data/queryKeys";
import { queryClient } from "../../lib/queryClient";
import { reportError } from "../../lib/errors/errorLogger";
import { ROUTES } from "../../shared/routing";
import {
  HOME_CRITICAL_BACKGROUND_STALE_TIME,
  mergeHomeCriticalIntoInitialData,
  shouldLoadHomeCriticalData,
} from "./initialDataContext.utils";
import { InitialDataContext } from "./initialData.context";

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
  const previousPathnameRef = useRef<string | null>(pathname);

  useEffect(() => {
    setData(initialData);
    setIsHomeCriticalLoading(false);
  }, [initialData]);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    if (
      !shouldLoadHomeCriticalData({
        newsCount: data.news.length,
        bootstrapScope: data.bootstrapScope,
        pathname,
        previousPathname,
      })
    ) {
      setIsHomeCriticalLoading(false);
      return;
    }

    let isCancelled = false;
    setIsHomeCriticalLoading(true);

    queryClient
      .fetchQuery({
        queryKey: queryKeys.home.critical,
        queryFn: async () => {
          const { getRouteInitialData } = await import(
            "../../data/getRouteInitialData"
          );

          return getRouteInitialData(ROUTES.HOME);
        },
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

        setData(createBootstrapErrorPayload());
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
