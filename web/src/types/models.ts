import type { PortableTextBlock, TypedObject } from "@portabletext/types";

import type { GameState, GoalScorerKind, KnownGameState } from "../domain/games";

export type { GameState, GoalScorerKind, KnownGameState };
export type BootstrapScope =
  | "empty"
  | "bootstrap-error"
  | "full"
  | "home-critical"
  | "gallery-detail"
  | "news-detail"
  | "player-detail"
  | "staff-detail";

export interface TeamRef {
  id: string;
  name: string;
  isMain?: boolean;
  imageUrl?: unknown;
}

export type DominantFoot = "left" | "right";

export interface FieldPlayerRatings {
  speed?: number | null;
  shooting?: number | null;
  passing?: number | null;
  dribbling?: number | null;
  defense?: number | null;
  physical?: number | null;
}

export interface GoalkeeperRatings {
  jumping?: number | null;
  saving?: number | null;
  kicking?: number | null;
  reflexes?: number | null;
  speed?: number | null;
  positioning?: number | null;
}

export interface Player {
  id: string;
  name: string;
  lastName: string;
  fullName: string;
  slug?: string;
  number?: number | null;
  position?: string | null;
  dominantFoot?: DominantFoot | null;
  fieldRatings?: FieldPlayerRatings;
  goalkeeperRatings?: GoalkeeperRatings;
  birthDate?: string | null;
  imageUrl?: string | null;
}

export type PlayerWithGoals = Player & { goals: number };

export interface StaffMember {
  id: string;
  name: string;
  lastName: string;
  fullName: string;
  slug?: string;
  role: string;
  birthDate?: string | null;
  imageUrl?: string | null;
}

export interface MatchEvent {
  id: string;
  type: string;
  order?: number;
  scorerKind?: GoalScorerKind;
  guestName?: string | null;
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
  playedPlayers: Pick<Player, "id" | "name" | "lastName" | "slug">[];
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
  previousPosition?: number | null;
  positionChange?: number | null;
  type?: "primaryPrize" | "secondaryPrize" | "normal";
}

export interface StandingsSnapshot {
  id: string;
  matchdayNumber: number;
  label?: string | null;
  snapshotDate?: string | null;
  gamesThroughDate?: string | null;
  standings: StandingsRow[];
}

export interface Tournament {
  id: string;
  name: string;
  imageUrl?: string | null;
  primaryColor?: string | null;
  mainTeam?: TeamRef | null;
  primaryPrizeSlots?: number;
  secondaryPrizeSlots?: number;
  updatedAt?: string;
  currentSnapshot?: StandingsSnapshot | null;
  previousSnapshot?: StandingsSnapshot | null;
  standingsSnapshots?: StandingsSnapshot[];
  standings: StandingsRow[];
}

export interface NewsImageContentBlock extends TypedObject {
  _type: "image";
  alt?: string;
  caption?: string;
  imageAssetId?: string | null;
  imageUrl?: string | null;
  asset?: unknown;
}

export interface NewsVideoContentBlock extends TypedObject {
  _type: "video";
  url?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  originalFilename?: string | null;
  title?: string | null;
  caption?: string | null;
}

export type NewsContentBlock =
  | PortableTextBlock
  | NewsImageContentBlock
  | NewsVideoContentBlock;

export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  content?: NewsContentBlock[];
  date: string;
  slug: string;
  imageAlt?: string | null;
  imageUrl?: string | null;
}

export interface GalleryImageDimensions {
  width?: number | null;
  height?: number | null;
  aspectRatio?: number | null;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  alt: string;
  caption?: string | null;
  isHero?: boolean;
  originalFilename?: string | null;
  dimensions?: GalleryImageDimensions | null;
}

export interface GalleryItem {
  id: string;
  slug: string;
  date: string;
  game: Game;
  heroImage: GalleryImage;
  images: GalleryImage[];
  photoCount: number;
}

export interface GoalEvent {
  id: string;
  type: string;
  order?: number;
  scorerKind?: GoalScorerKind;
  guestName?: string | null;
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
  playedPlayers?: unknown[];
  [key: string]: unknown;
}
