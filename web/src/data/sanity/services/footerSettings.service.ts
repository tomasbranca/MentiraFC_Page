import { DEFAULT_FOOTER_SETTINGS } from "../../../../shared/site/footerSettings";
import type { FooterSettings } from "../../../types/models";
import { reportError } from "../../../lib/errors/errorLogger";
import { adaptFooterSettings } from "../adapters/footerSettings.adapter";
import { sanityFreshClient } from "../client";
import { FOOTER_SETTINGS_QUERY } from "../queries/footerSettings.queries";
import { fetchSanityQuery } from "../sanityFetch";

export const getFooterSettings = async (): Promise<FooterSettings> => {
  try {
    const data = await fetchSanityQuery(FOOTER_SETTINGS_QUERY, {
      client: sanityFreshClient,
    });

    return adaptFooterSettings(data);
  } catch (error) {
    reportError(error, {
      scope: "data:footerSettings",
      action: "load_footer_settings",
    });

    return DEFAULT_FOOTER_SETTINGS;
  }
};
