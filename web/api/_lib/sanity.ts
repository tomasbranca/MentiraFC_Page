import process from "node:process";

type SanityMutationResponse<T> = {
  results?: Array<{
    document?: T;
  }>;
  error?: {
    description?: string;
    message?: string;
  };
};

type SanityQueryResponse<T> = {
  result?: T;
  error?: {
    description?: string;
    message?: string;
  };
};

const getSanityConfig = ({ requireWriteToken = false } = {}) => {
  const projectId =
    process.env.SANITY_PROJECT_ID ?? process.env.VITE_SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET ?? process.env.VITE_SANITY_DATASET;
  const apiVersion =
    process.env.SANITY_API_VERSION ?? process.env.VITE_SANITY_API_VERSION;
  const token = process.env.SANITY_WRITE_TOKEN;

  if (!projectId || !dataset || !apiVersion) {
    throw new Error("Sanity server environment variables are not configured.");
  }

  if (requireWriteToken && !token) {
    throw new Error("Sanity write token is not configured.");
  }

  return { projectId, dataset, apiVersion, token };
};

export const querySanity = async <T>(
  query: string,
  params?: Record<string, string>
): Promise<T> => {
  const { projectId, dataset, apiVersion } = getSanityConfig();
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`
  );

  url.searchParams.set("query", query);

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  const response = await fetch(url);
  const payload = (await response.json()) as SanityQueryResponse<T>;

  if (!response.ok || payload.error || typeof payload.result === "undefined") {
    throw new Error(
      payload.error?.description ??
        payload.error?.message ??
        "Sanity query failed."
    );
  }

  return payload.result;
};

export const mutateSanity = async <T>(
  mutations: unknown[]
): Promise<T | null> => {
  const { projectId, dataset, apiVersion, token } = getSanityConfig({
    requireWriteToken: true,
  });
  const response = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?returnDocuments=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mutations }),
    }
  );
  const payload = (await response.json()) as SanityMutationResponse<T>;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.description ??
        payload.error?.message ??
        "Sanity mutation failed."
    );
  }

  return payload.results?.[0]?.document ?? null;
};
