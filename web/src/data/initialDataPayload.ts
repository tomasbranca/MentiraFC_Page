import type {
  BootstrapScope,
  GalleryItem,
  Game,
  GoalEvent,
  NewsItem,
  Player,
  StaffMember,
  TeamRef,
  Tournament,
} from "../types/models";

export interface InitialDataPayload {
  bootstrapScope: BootstrapScope;
  news: NewsItem[];
  galleries: GalleryItem[];
  players: Player[];
  staff: StaffMember[];
  games: Game[];
  goalEvents: GoalEvent[];
  tournament: Tournament | null;
  teams: TeamRef[];
  tournamentGames: Game[];
  latestGame: Game | null;
  currentNewsDetail?: {
    slug: string;
    newsItem: NewsItem | null;
    suggestedNews: NewsItem[];
  };
  currentGalleryDetail?: {
    slug: string;
    gallery: GalleryItem | null;
  };
  currentPlayerDetail?: {
    slug: string;
    player: Player | null;
    goalsThisYear: number;
    matchesPlayedThisYear: number;
    year: number;
  };
  currentStaffDetail?: {
    slug: string;
    staffMember: StaffMember | null;
  };
  bootstrapError?: {
    message: string;
  };
}

export const createEmptyInitialData = (): InitialDataPayload => ({
  bootstrapScope: "empty",
  news: [],
  galleries: [],
  players: [],
  staff: [],
  games: [],
  goalEvents: [],
  tournament: null,
  teams: [],
  tournamentGames: [],
  latestGame: null,
});

export const createBootstrapErrorPayload = (): InitialDataPayload => ({
  ...createEmptyInitialData(),
  bootstrapScope: "bootstrap-error",
  bootstrapError: {
    message:
      "No pudimos cargar los datos iniciales. Reintenta en unos segundos.",
  },
});
