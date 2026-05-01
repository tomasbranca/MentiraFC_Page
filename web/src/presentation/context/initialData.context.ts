import { createContext } from "react";
import type { InitialDataPayload } from "../../data/getInitialData";

export type InitialDataContextValue = {
  initialData: InitialDataPayload;
  isHomeCriticalLoading: boolean;
};

export const InitialDataContext =
  createContext<InitialDataContextValue | null>(null);
