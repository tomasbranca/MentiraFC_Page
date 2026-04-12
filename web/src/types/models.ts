export type EventType = "goal" | "yellow_card" | "red_card" | "substitution" | "other";

export interface TeamRef {
  id: string;
  name: string;
  isMain?: boolean;
}

export interface Player {
  id: string;
  fullName: string;
  number?: number | null;
  position?: string | null;
  photoUrl?: string | null;
}

export interface MatchEvent {
  id: string;
  type: EventType;
  minute?: number | null;
  teamId?: string | null;
  player?: Pick<Player, "id" | "fullName"> | null;
  assistByPlayerId?: string | null;
}

export interface Game {
  id: string;
  date: string;
  state: "programado" | "en_juego" | "finalizado" | "suspendido";
  tournamentId?: string | null;
  opponent: TeamRef;
  result?: {
    goalsFor: number;
    goalsAgainst: number;
  } | null;
  events: MatchEvent[];
}

/**
 * Shape mínimo del documento de Sanity usado para mapear a `Game`.
 * Nota: deliberadamente incompleto para no acoplar dominio al CMS.
 */
export interface SanityGameSource {
  _id: string;
  date?: string;
  state?: string;
  events?: unknown[];
  [key: string]: unknown;
}
