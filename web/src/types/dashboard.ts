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
