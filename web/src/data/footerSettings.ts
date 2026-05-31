import { getFooterSettings as fetchFooterSettings } from "./sanity/services/footerSettings.service";
import type { FooterSettings } from "../types/models";

export const getFooterSettings = async (): Promise<FooterSettings> =>
  fetchFooterSettings();
