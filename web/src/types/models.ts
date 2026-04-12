export type GameState = "programado" | "en_juego" | "finalizado" | "suspendido" | string;

export interface TeamRef {
  id: string;
  name: string;
  isMain?: boolean;
  imageUrl?: string | null;
}

export interface Player {
  id: string;
  name: string;
  lastName: string;
  fullName: string;
  slug?: string;
  number?: number | null;
  position?: string | null;
  birthDate?: string | null;
  imageUrl?: string | null;
}

export interface MatchEvent {
  id: string;
  type: string;
  order?: number;
  player: Pick<Player, "id" | "name" | "lastName" | "slug"> | null;
}

export interface GameResult {
  goalsFor: number;
  goalsAgainst: number;
}

export interface Game {
  id: string;
  date: string;
  state: GameState;
  location?: string | null;
  competition?: string | null;
  tournamentId?: string | null;
  tournament?: string | null;
  rival: TeamRef;
  result: GameResult;
  events: MatchEvent[];
}

export interface StandingsRow {
  team: TeamRef;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points?: number;
  goalDiff?: number;
  position?: number;
  type?: "champion" | "playoff" | "normal";
}

export interface Tournament {
  id: string;
  name: string;
  imageUrl?: string | null;
  primaryColor?: string | null;
  updatedAt?: string;
  standings: StandingsRow[];
}

export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  content?: unknown;
  date: string;
  slug: string;
  imageUrl?: string | null;
}

export interface GoalEvent {
  id: string;
  type: string;
  order?: number;
  game: { id: string; date: string } | null;
  player: Pick<Player, "id" | "name" | "lastName" | "slug"> | null;
}

/**
 * Shape mínimo de documento de Sanity para mapear a dominio.
 * Se mantiene parcial para evitar acoplar el dominio al CMS.
 */
export interface SanityGameSource {
  _id: string;
  date?: string;
  state?: string;
  events?: unknown[];
  [key: string]: unknown;
}
