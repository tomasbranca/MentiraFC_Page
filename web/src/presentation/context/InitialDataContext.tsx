import { createContext, useContext, type ReactNode } from "react";

import type { InitialDataPayload } from "../../data/getInitialData";

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
  return (
    <InitialDataContext.Provider value={{ initialData }}>
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
