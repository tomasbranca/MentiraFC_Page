export type SanityReadClient = {
  name: "publicCachedClient" | "sanityFreshClient";
  useCdn: boolean;
  requestCache: RequestCache;
};

export const publicCachedClient: SanityReadClient = {
  name: "publicCachedClient",
  useCdn: true,
  requestCache: "default",
};

export const sanityClient = publicCachedClient;

export const sanityFreshClient: SanityReadClient = {
  name: "sanityFreshClient",
  useCdn: false,
  requestCache: "no-store",
};

export const resolveSanityReadClient = (options?: {
  client?: SanityReadClient;
  useCdn?: boolean;
}): SanityReadClient => {
  if (options?.client) {
    return options.client;
  }

  return options?.useCdn === false ? sanityFreshClient : publicCachedClient;
};
