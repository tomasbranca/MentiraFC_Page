type SanityQueryResponse<T> = {
  result?: T;
  error?: {
    description?: string;
    message?: string;
  };
};

type SanityQueryOptions = {
  params?: Record<string, string | number | boolean>;
  useCdn?: boolean;
};

const getSanityQueryUrl = (
  query: string,
  { params, useCdn = true }: SanityQueryOptions = {}
): string => {
  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
  const dataset = import.meta.env.VITE_SANITY_DATASET;
  const apiVersion = import.meta.env.VITE_SANITY_API_VERSION;

  if (!projectId || !dataset || !apiVersion) {
    throw new Error("Sanity environment variables are not configured");
  }

  const url = new URL(
    `https://${projectId}.${
      useCdn ? "apicdn" : "api"
    }.sanity.io/v${apiVersion}/data/query/${dataset}`
  );

  url.searchParams.set("query", query);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(`$${key}`, JSON.stringify(value));
    }
  }

  return url.toString();
};

export const fetchSanityQuery = async <T>(
  query: string,
  options?: SanityQueryOptions
): Promise<T> => {
  const response = await fetch(getSanityQueryUrl(query, options));
  const payload = (await response.json()) as SanityQueryResponse<T>;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.description ??
        payload.error?.message ??
        `Sanity query failed with status ${response.status}`
    );
  }

  if (typeof payload.result === "undefined") {
    throw new Error("Sanity query returned no result");
  }

  return payload.result;
};
