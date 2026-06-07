import type { BootstrapScope } from "../../../types/models";

type FullTableState = {
  bootstrapScope: BootstrapScope;
  tournament: unknown;
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

export const shouldLoadGalleryInitially = (
  bootstrapScope: BootstrapScope,
  galleriesLength: number
) => bootstrapScope !== "full" && galleriesLength === 0;

export const shouldLoadRecordInitially = (
  bootstrapScope: BootstrapScope,
  gamesLength: number
) => bootstrapScope !== "full" && gamesLength === 0;

export const shouldLoadTeamInitially = (
  bootstrapScope: BootstrapScope,
  playersLength: number
) => bootstrapScope !== "full" && playersLength === 0;

export const shouldLoadStaffInitially = (
  bootstrapScope: BootstrapScope,
  staffLength: number
) => bootstrapScope !== "full" && staffLength === 0;

export const shouldLoadTableInitially = ({
  bootstrapScope,
  tournament,
}: FullTableState) =>
  bootstrapScope !== "full" &&
  !tournament;

export const shouldLoadPlayerDetailInitially = ({
  hasInitialDetail,
  slug,
}: PlayerDetailState) => Boolean(slug) && !hasInitialDetail;
