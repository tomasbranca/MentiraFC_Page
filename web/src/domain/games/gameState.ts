export const KNOWN_GAME_STATES = ["por_jugar", "finalizado"] as const;

export type KnownGameState = (typeof KNOWN_GAME_STATES)[number];

export const UNKNOWN_GAME_STATE = "desconocido" as const;

export type UnknownGameState = typeof UNKNOWN_GAME_STATE;

export const GAME_STATES = [
  ...KNOWN_GAME_STATES,
  UNKNOWN_GAME_STATE,
] as const;

export type GameState = KnownGameState | UnknownGameState;

export const isKnownGameState = (value: unknown): value is KnownGameState =>
  typeof value === "string" &&
  (KNOWN_GAME_STATES as readonly string[]).includes(value);

export const normalizeGameState = (value: unknown): GameState =>
  isKnownGameState(value) ? value : UNKNOWN_GAME_STATE;

export const isFinishedGameState = (state: GameState): boolean =>
  state === "finalizado";

export const isScheduledGameState = (state: GameState): boolean =>
  state === "por_jugar";

export const isUnknownGameState = (state: GameState): boolean =>
  state === UNKNOWN_GAME_STATE;
