import { describe, expect, it } from "vitest";

import { STAFF_BY_SLUG_OR_ID_QUERY, STAFF_QUERY } from "./staff.queries";

describe("staff queries", () => {
  it("lista staff sin pedir numero de camiseta ni posicion de jugador", () => {
    expect(STAFF_QUERY).toContain('*[_type == "staff"]');
    expect(STAFF_QUERY).toContain("role");
    expect(STAFF_QUERY).not.toContain("number");
    expect(STAFF_QUERY).not.toContain("position");
  });

  it("busca el detalle por slug canonico o por id de documento", () => {
    expect(STAFF_BY_SLUG_OR_ID_QUERY).toContain("coalesce(");
    expect(STAFF_BY_SLUG_OR_ID_QUERY).toContain("slug.current == $slug");
    expect(STAFF_BY_SLUG_OR_ID_QUERY).toContain("_id == $slug");
  });
});
