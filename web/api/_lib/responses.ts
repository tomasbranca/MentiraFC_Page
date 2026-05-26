const withNoStoreHeader = (init: ResponseInit = {}): ResponseInit => {
  const headers = new Headers(init.headers);

  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }

  return {
    ...init,
    headers,
  };
};

export const json = (data: unknown, init?: ResponseInit): Response =>
  Response.json({ data }, withNoStoreHeader(init));

export const errorJson = (error: string, status: number): Response =>
  Response.json({ error }, withNoStoreHeader({ status }));
