import type {
  DominantFoot,
  FieldPlayerRatings,
  GoalkeeperRatings,
  NewsContentBlock,
  NewsImageContentBlock,
} from "./models";

export const DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DASHBOARD_NEWS_IMAGE_ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

export const DASHBOARD_NEWS_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const DASHBOARD_NEWS_IMAGE_MAX_MEGAPIXELS = 256;

export const DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DASHBOARD_PLAYER_IMAGE_ACCEPTED_EXTENSIONS =
  ".jpg,.jpeg,.png,.webp";

export const DASHBOARD_PLAYER_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const DASHBOARD_PLAYER_IMAGE_MAX_MEGAPIXELS = 256;

export const DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DASHBOARD_STAFF_IMAGE_ACCEPTED_EXTENSIONS =
  ".jpg,.jpeg,.png,.webp";

export const DASHBOARD_STAFF_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const DASHBOARD_STAFF_IMAGE_MAX_MEGAPIXELS = 256;

export const DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_EXTENSIONS =
  ".jpg,.jpeg,.png,.webp";

export const DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const DASHBOARD_ORGANIZATION_IMAGE_MAX_MEGAPIXELS = 256;

export type DashboardNewsStatus = "published" | "draft";

export type DashboardNewsItem = {
  id: string;
  publishedId?: string | null;
  draftId?: string | null;
  status: DashboardNewsStatus;
  hasDraft: boolean;
  hasPublishedVersion: boolean;
  title: string;
  description: string;
  date?: string | null;
  updatedAt?: string | null;
  slug: string;
  imageAlt?: string | null;
  imageAssetId?: string | null;
  imageUrl?: string | null;
  content?: NewsContentBlock[];
};

export type DashboardNewsInput = {
  title: string;
  description: string;
  date: string;
  slug: string;
  imageAlt: string;
};

export type DashboardNewsImageContentBlock = NewsImageContentBlock & {
  uploadKey?: string;
};

export type DashboardNewsContentBlock =
  | Exclude<NewsContentBlock, NewsImageContentBlock>
  | DashboardNewsImageContentBlock;

export type DashboardNewsMutationInput = DashboardNewsInput & {
  coverImage?: File | null;
  useDefaultImage?: boolean;
  content: DashboardNewsContentBlock[];
  contentImageFiles?: Record<string, File>;
};

export type DashboardNewsDraftMutationInput = Partial<DashboardNewsInput> & {
  coverImage?: File | null;
  useDefaultImage?: boolean;
  content?: DashboardNewsContentBlock[];
  contentImageFiles?: Record<string, File>;
};

export type DashboardDocumentStatus = "published" | "draft";

export type DashboardPlayerPosition = "arq" | "def" | "med" | "del";

export type DashboardPlayerFieldRatingsInput = {
  speed: string;
  shooting: string;
  passing: string;
  dribbling: string;
  defense: string;
  physical: string;
};

export type DashboardPlayerGoalkeeperRatingsInput = {
  jumping: string;
  saving: string;
  kicking: string;
  reflexes: string;
  speed: string;
  positioning: string;
};

export type DashboardPlayerItem = {
  id: string;
  publishedId?: string | null;
  draftId?: string | null;
  status: DashboardDocumentStatus;
  hasDraft: boolean;
  hasPublishedVersion: boolean;
  name: string;
  lastName: string;
  fullName: string;
  number?: number | null;
  position?: DashboardPlayerPosition | string | null;
  dominantFoot?: DominantFoot | null;
  fieldRatings?: FieldPlayerRatings;
  goalkeeperRatings?: GoalkeeperRatings;
  birthDate?: string | null;
  updatedAt?: string | null;
  slug: string;
  imageAssetId?: string | null;
  imageUrl?: string | null;
};

export type DashboardPlayerInput = {
  name: string;
  lastName: string;
  number: string;
  position: DashboardPlayerPosition | "";
  dominantFoot: DominantFoot | "";
  birthDate: string;
  fieldRatings: DashboardPlayerFieldRatingsInput;
  goalkeeperRatings: DashboardPlayerGoalkeeperRatingsInput;
};

export type DashboardPlayerMutationInput = {
  name: string;
  lastName: string;
  number: number;
  position: DashboardPlayerPosition;
  dominantFoot?: DominantFoot;
  birthDate?: string;
  fieldRatings?: Partial<Record<keyof FieldPlayerRatings, number>>;
  goalkeeperRatings?: Partial<Record<keyof GoalkeeperRatings, number>>;
  photoImage?: File | null;
  removePhoto?: boolean;
};

export type DashboardPlayerDraftMutationInput =
  Partial<DashboardPlayerMutationInput>;

export type DashboardStaffItem = {
  id: string;
  publishedId?: string | null;
  draftId?: string | null;
  status: DashboardDocumentStatus;
  hasDraft: boolean;
  hasPublishedVersion: boolean;
  name: string;
  lastName: string;
  fullName: string;
  role?: string | null;
  birthDate?: string | null;
  updatedAt?: string | null;
  slug: string;
  imageAssetId?: string | null;
  imageUrl?: string | null;
};

export type DashboardStaffInput = {
  name: string;
  lastName: string;
  role: string;
  birthDate: string;
};

export type DashboardStaffMutationInput = {
  name: string;
  lastName: string;
  role: string;
  birthDate?: string;
  photoImage?: File | null;
  removePhoto?: boolean;
};

export type DashboardStaffDraftMutationInput =
  Partial<DashboardStaffMutationInput>;

export type DashboardOrganizationReferenceCounts = {
  tournaments: number;
};

export type DashboardOrganizationItem = {
  id: string;
  publishedId?: string | null;
  draftId?: string | null;
  status: DashboardDocumentStatus;
  hasDraft: boolean;
  hasPublishedVersion: boolean;
  name: string;
  primaryColor?: string | null;
  updatedAt?: string | null;
  logoAssetId?: string | null;
  logoUrl?: string | null;
  referenceCounts: DashboardOrganizationReferenceCounts;
};

export type DashboardOrganizationInput = {
  name: string;
  primaryColor: string;
};

export type DashboardOrganizationMutationInput = {
  name: string;
  primaryColor?: string;
  logoImage?: File | null;
  removeLogo?: boolean;
};

export type DashboardOrganizationDraftMutationInput =
  Partial<DashboardOrganizationMutationInput>;

export type DashboardMatchState = "por_jugar" | "finalizado";

export type DashboardMatchCompetition = "Torneo" | "Copa" | "Amistoso";

export type DashboardMatchTeamOption = {
  id: string;
  name: string;
  isMain?: boolean;
  imageUrl?: string | null;
};

export type DashboardMatchTournamentOption = {
  id: string;
  name: string;
  organizationName?: string | null;
  active?: boolean;
};

export type DashboardMatchPlayerOption = {
  id: string;
  name: string;
  lastName: string;
  fullName: string;
  number?: number | null;
  position?: string | null;
};

export type DashboardMatchOptions = {
  teams: DashboardMatchTeamOption[];
  tournaments: DashboardMatchTournamentOption[];
  players: DashboardMatchPlayerOption[];
};

export type DashboardMatchPlayedPlayer = DashboardMatchPlayerOption;

export type DashboardMatchGoalScorer = DashboardMatchPlayerOption & {
  goals: number;
};

export type DashboardMatchItem = {
  id: string;
  publishedId?: string | null;
  draftId?: string | null;
  status: DashboardDocumentStatus;
  hasDraft: boolean;
  hasPublishedVersion: boolean;
  date?: string | null;
  updatedAt?: string | null;
  state?: DashboardMatchState | string | null;
  location?: string | null;
  competition?: DashboardMatchCompetition | string | null;
  tournamentId?: string | null;
  tournamentName?: string | null;
  tournamentLabel?: string | null;
  rivalId?: string | null;
  rivalName?: string | null;
  rivalImageUrl?: string | null;
  result?: {
    goalsFor?: number | null;
    goalsAgainst?: number | null;
  } | null;
  playedPlayers: DashboardMatchPlayedPlayer[];
  goalScorers: DashboardMatchGoalScorer[];
};

export type DashboardMatchInput = {
  rivalId: string;
  date: string;
  location: string;
  competition: DashboardMatchCompetition;
  tournamentId: string;
  state: DashboardMatchState;
  goalsFor: string;
  goalsAgainst: string;
  playedPlayerIds: string[];
  goalScorers: Array<{
    playerId: string;
    goals: string;
  }>;
};

export type DashboardMatchMutationInput = {
  rivalId: string;
  date: string;
  location: string;
  competition: DashboardMatchCompetition;
  tournamentId?: string;
  state: DashboardMatchState;
  goalsFor?: number;
  goalsAgainst?: number;
  playedPlayerIds: string[];
  goalScorers: Array<{
    playerId: string;
    goals: number;
  }>;
};

export type DashboardMatchDraftMutationInput =
  Partial<Omit<DashboardMatchMutationInput, "playedPlayerIds" | "goalScorers">> & {
    playedPlayerIds?: string[];
    goalScorers?: Array<{
      playerId: string;
      goals: number;
    }>;
  };

export type DashboardTableTeamOption = {
  id: string;
  name: string;
  isMain?: boolean;
  imageUrl?: string | null;
  status?: string | null;
  activeFromMatchday?: number | null;
  activeUntilMatchday?: number | null;
};

export type DashboardTableTournamentOption = {
  id: string;
  name: string;
  organizationName?: string | null;
  active?: boolean;
  imageUrl?: string | null;
  participants: DashboardTableTeamOption[];
};

export type DashboardTableOptions = {
  tournaments: DashboardTableTournamentOption[];
};

export type DashboardTableRowItem = {
  key?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  teamImageUrl?: string | null;
  wins?: number | null;
  draws?: number | null;
  losses?: number | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
};

export type DashboardTableItem = {
  id: string;
  publishedId?: string | null;
  draftId?: string | null;
  status: DashboardDocumentStatus;
  hasDraft: boolean;
  hasPublishedVersion: boolean;
  tournamentId?: string | null;
  tournamentName?: string | null;
  tournamentOrganizationName?: string | null;
  tournamentImageUrl?: string | null;
  matchdayNumber?: number | null;
  label?: string | null;
  snapshotDate?: string | null;
  gamesThroughDate?: string | null;
  updatedAt?: string | null;
  rows: DashboardTableRowItem[];
};

export type DashboardTableRowMutationInput = {
  key?: string;
  teamId: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type DashboardTableRowDraftMutationInput = {
  key?: string;
  teamId?: string;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
};

export type DashboardTableInput = {
  tournamentId: string;
  matchdayNumber: string;
  label: string;
  snapshotDate: string;
  gamesThroughDate: string;
  rows: Array<{
    key: string;
    teamId: string;
    wins: string;
    draws: string;
    losses: string;
    goalsFor: string;
    goalsAgainst: string;
  }>;
};

export type DashboardTableMutationInput = {
  tournamentId: string;
  matchdayNumber: number;
  label?: string;
  snapshotDate: string;
  gamesThroughDate: string;
  rows: DashboardTableRowMutationInput[];
};

export type DashboardTableDraftMutationInput =
  Partial<Omit<DashboardTableMutationInput, "rows">> & {
    rows?: DashboardTableRowDraftMutationInput[];
  };

export type DashboardTournamentParticipantStatus =
  | "active"
  | "replaced"
  | "withdrawn";

export type DashboardTournamentReferenceCounts = {
  matches: number;
  tables: number;
  snapshots: number;
};

export type DashboardTournamentParticipantItem = {
  key?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  teamImageUrl?: string | null;
  status?: DashboardTournamentParticipantStatus | string | null;
  activeFromMatchday?: number | null;
  activeUntilMatchday?: number | null;
  notes?: string | null;
};

export type DashboardTournamentItem = {
  id: string;
  publishedId?: string | null;
  draftId?: string | null;
  status: DashboardDocumentStatus;
  hasDraft: boolean;
  hasPublishedVersion: boolean;
  name: string;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationImageUrl?: string | null;
  active?: boolean | null;
  primaryPrizeSlots?: number | null;
  secondaryPrizeSlots?: number | null;
  updatedAt?: string | null;
  participants: DashboardTournamentParticipantItem[];
  referenceCounts: DashboardTournamentReferenceCounts;
};

export type DashboardTournamentOrganizationOption = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export type DashboardTournamentTeamOption = {
  id: string;
  name: string;
  isMain?: boolean;
  imageUrl?: string | null;
};

export type DashboardTournamentOptions = {
  organizations: DashboardTournamentOrganizationOption[];
  teams: DashboardTournamentTeamOption[];
};

export type DashboardTournamentParticipantInput = {
  key: string;
  teamId: string;
  status: DashboardTournamentParticipantStatus;
  activeFromMatchday: string;
  activeUntilMatchday: string;
  notes: string;
};

export type DashboardTournamentInput = {
  name: string;
  organizationId: string;
  active: boolean;
  primaryPrizeSlots: string;
  secondaryPrizeSlots: string;
  participants: DashboardTournamentParticipantInput[];
};

export type DashboardTournamentParticipantMutationInput = {
  key?: string;
  teamId: string;
  status: DashboardTournamentParticipantStatus;
  activeFromMatchday?: number;
  activeUntilMatchday?: number;
  notes?: string;
};

export type DashboardTournamentParticipantDraftMutationInput = {
  key?: string;
  teamId?: string;
  status?: DashboardTournamentParticipantStatus;
  activeFromMatchday?: number;
  activeUntilMatchday?: number;
  notes?: string;
};

export type DashboardTournamentMutationInput = {
  name: string;
  organizationId: string;
  active: boolean;
  primaryPrizeSlots: number;
  secondaryPrizeSlots: number;
  participants: DashboardTournamentParticipantMutationInput[];
};

export type DashboardTournamentDraftMutationInput = Partial<
  Omit<DashboardTournamentMutationInput, "participants">
> & {
  participants?: DashboardTournamentParticipantDraftMutationInput[];
};
