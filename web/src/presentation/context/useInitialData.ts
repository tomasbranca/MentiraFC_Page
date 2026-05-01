import { useContext } from "react";
import {
  InitialDataContext,
  type InitialDataContextValue,
} from "./initialData.context";

export const useInitialData = (): InitialDataContextValue => {
  const context = useContext(InitialDataContext);

  if (!context) {
    throw new Error("useInitialData must be used within InitialDataProvider");
  }

  return context;
};
