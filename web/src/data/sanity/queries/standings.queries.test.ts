import { describe, expect, it } from "vitest";

import { FINISHED_TOURNAMENT_GAMES_QUERY } from "./games.queries";
import { TOURNAMENT_QUERY } from "./tournaments.queries";

describe("standings Sanity queries", () => {
  it("lee una sola tabla publicada por torneo sin rol de snapshot", () => {
    expect(TOURNAMENT_QUERY).toContain('_type == "standingsSnapshots"');
    expect(TOURNAMENT_QUERY).toContain("tournament._ref == ^._id");
    expect(TOURNAMENT_QUERY).toContain("[0...1]");
    expect(TOURNAMENT_QUERY).not.toContain("points,");
    expect(TOURNAMENT_QUERY).not.toContain("goalDiff,");
    expect(TOURNAMENT_QUERY).not.toContain('"points": coalesce');
    expect(TOURNAMENT_QUERY).not.toContain('"goalDiff": coalesce');
    expect(TOURNAMENT_QUERY).not.toContain("snapshotRole");
    expect(TOURNAMENT_QUERY).not.toContain("gamesThroughDate");
    expect(TOURNAMENT_QUERY).not.toContain("positionChange");
    expect(TOURNAMENT_QUERY).not.toContain('snapshotRole in ["current", "previous"]');
    expect(TOURNAMENT_QUERY).not.toContain(
      "order(matchdayNumber desc, snapshotDate desc, _updatedAt desc)[0...2]"
    );
  });

  it("consulta partidos de torneo por competencia y referencia", () => {
    expect(FINISHED_TOURNAMENT_GAMES_QUERY).toContain(
      "defined(tournament._ref)"
    );
    expect(FINISHED_TOURNAMENT_GAMES_QUERY).toContain(
      'competition == "Torneo"'
    );
  });
});
