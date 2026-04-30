import type { BootstrapScope } from "../../../types/models";

type FullTableState = {
  bootstrapScope: BootstrapScope;
  tournament: unknown;
  teamsLength: number;
  gamesLength: number;
};

type PlayerDetailState = {
  hasInitialDetail: boolean;
  slug?: string;
};

export const shouldLoadNewsInitially = (
  bootstrapScope: BootstrapScope,
  newsLength: number
) =>
  bootstrapScope === "home-critical" ||
  (bootstrapScope !== "full" && newsLength === 0);

export const shouldLoadRecordInitially = (
  bootstrapScope: BootstrapScope,
  gamesLength: number
) => bootstrapScope !== "full" && gamesLength === 0;

export const shouldLoadTeamInitially = (
  bootstrapScope: BootstrapScope,
  playersLength: number
) => bootstrapScope !== "full" && playersLength === 0;

export const shouldLoadTableInitially = ({
  bootstrapScope,
  tournament,
  teamsLength,
  gamesLength,
}: FullTableState) =>
  bootstrapScope !== "full" &&
  (!tournament || teamsLength === 0 || gamesLength === 0);

export const shouldLoadPlayerDetailInitially = ({
  hasInitialDetail,
  slug,
}: PlayerDetailState) => Boolean(slug) && !hasInitialDetail;
