import type {
  BootstrapScope,
  Game,
  NewsItem,
  Player,
  StaffMember,
  TeamRef,
  Tournament,
} from "../types/models";

export interface InitialDataPayload {
  bootstrapScope: BootstrapScope;
  news: NewsItem[];
  players: Player[];
  staff: StaffMember[];
  games: Game[];
  tournament: Tournament | null;
  teams: TeamRef[];
  tournamentGames: Game[];
  latestGame: Game | null;
  currentNewsDetail?: {
    slug: string;
    newsItem: NewsItem | null;
    suggestedNews: NewsItem[];
  };
  currentPlayerDetail?: {
    slug: string;
    player: Player | null;
    goalsThisYear: number;
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
  players: [],
  staff: [],
  games: [],
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
