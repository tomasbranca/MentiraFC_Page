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

type SanityAssetUploadResponse = {
  document?: SanityImageAssetDocument;
  error?: {
    description?: string;
    message?: string;
  };
};

export type SanityImageAssetDocument = {
  _id: string;
  _type: "sanity.imageAsset";
  url?: string;
  size?: number;
  mimeType?: string;
  originalFilename?: string;
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

export const uploadSanityImageAsset = async (
  imageFile: File
): Promise<SanityImageAssetDocument> => {
  const { projectId, dataset, apiVersion, token } = getSanityConfig({
    requireWriteToken: true,
  });
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/assets/images/${dataset}`
  );

  url.searchParams.set("filename", imageFile.name);
  url.searchParams.set("tag", "dashboard.news.cover");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": imageFile.type,
    },
    body: await imageFile.arrayBuffer(),
  });
  const payload = (await response.json()) as
    | SanityAssetUploadResponse
    | SanityImageAssetDocument;
  const error =
    "error" in payload && payload.error ? payload.error : undefined;

  if (!response.ok || error) {
    throw new Error(
      error?.description ?? error?.message ?? "Sanity asset upload failed."
    );
  }

  const document =
    "document" in payload
      ? payload.document
      : "_id" in payload
        ? payload
        : undefined;

  if (!document?._id) {
    throw new Error("Sanity asset upload did not return a document.");
  }

  return document;
};

export const deleteSanityDocument = async (id: string): Promise<void> => {
  await mutateSanity<unknown>([
    {
      delete: {
        id,
      },
    },
  ]);
};
