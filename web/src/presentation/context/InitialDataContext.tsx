import { createContext, useContext, type ReactNode, useState, useEffect } from "react";
import type { InitialDataPayload } from "../../data/getInitialData";
import { getRouteInitialData } from "../../data/getRouteInitialData";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../data/queryKeys";
import { reportError } from "../../lib/errors/errorLogger";

type InitialDataContextValue = {
  initialData: InitialDataPayload;
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
  const [data, setData] = useState<InitialDataPayload>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Lazy load home data si estamos en otra ruta y Home está vacío
  useEffect(() => {
    const pathname = window.location.pathname;
    const isHomePage = pathname === "/";
    const isHomeDataEmpty = !data.news.length;

    if (!isHomePage && isHomeDataEmpty) {
      getRouteInitialData("/")
        .then((homeData) => {
          // Guardar en React Query
          queryClient.setQueryData(queryKeys.home.deferred, homeData);
          // Actualizar contexto
          setData((prev) => ({
            ...prev,
            ...homeData,
          }));
        })
        .catch((error) => {
          reportError(error, {
            scope: "InitialDataProvider",
            action: "lazy_load_home_data",
          });
        });
    }
  }, [data.news.length]);

  return (
    <InitialDataContext.Provider value={{ initialData: data }}>
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