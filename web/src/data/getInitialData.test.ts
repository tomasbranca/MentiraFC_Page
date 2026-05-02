import { describe, expect, it } from "vitest";

import {
  createBootstrapErrorPayload,
  createEmptyInitialData,
} from "./getInitialData";

describe("initial data payload factories", () => {
  it("crea un payload vacio que representa bootstrap pendiente", () => {
    const payload = createEmptyInitialData();

    expect(payload.bootstrapScope).toBe("empty");
    expect(payload.news).toEqual([]);
    expect(payload.staff).toEqual([]);
    expect(payload.latestGame).toBeNull();
    expect(payload.bootstrapError).toBeUndefined();
  });

  it("crea un payload terminal de error para cortar loaders infinitos", () => {
    const payload = createBootstrapErrorPayload();

    expect(payload.bootstrapScope).toBe("bootstrap-error");
    expect(payload.bootstrapError?.message).toBeTruthy();
    expect(payload.news).toEqual([]);
    expect(payload.latestGame).toBeNull();
  });
});
