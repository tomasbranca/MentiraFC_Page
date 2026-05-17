export const json = (data: unknown, init?: ResponseInit): Response =>
  Response.json({ data }, init);

export const errorJson = (error: string, status: number): Response =>
  Response.json({ error }, { status });
