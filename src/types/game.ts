// Core gameplay types: statuses, courts, run/rally/shop state.
// Run and rally state are populated by the engine in Phase 2; the shapes here
// are forward-looking scaffolding and may be extended as the engine lands.

import type { CardInstance } from './cards';

// ---- Status effects (design doc §7) ----

export type StatusId = 'exhausted' | 'vulnerable' | 'protected';

// Maps a status id to remaining triggers/turns (absent = not active).
export type StatusMap = Partial<Record<StatusId, number>>;

// ---- Courts (design doc §10) ----

export interface Court {
  id: string;
  name: string;
  description: string;
  /** Short text describing the court's rule modifier. */
  modifierText: string;
}

// ---- Rally / run state ----

export interface RallyState {
  opponentBalance: number;
  opponentMaxBalance: number;
  pressure: number;
  pressureMax: number;
  stamina: number;
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  hand: CardInstance[];
  /** Card plays still allowed this turn (normally 1). */
  playsRemaining: number;
  /** Id of the last card played this rally, for combo checks. */
  lastCardId: string | null;
  playerStatuses: StatusMap;
  opponentStatuses: StatusMap;
  /** Turn-by-turn action log, newest last. */
  log: string[];
}

export interface RunState {
  seed: string;
  /** Serializable RNG cursor, so a run stays deterministic across saves. */
  rngState: number;
  lives: number;
  ralliesWon: number;
  opponentsDefeated: number;
  dinkBucks: number;
  deck: CardInstance[];
  /** Active Paddle Mod ids for this run. */
  paddleMods: string[];
  currentOpponentId: string;
  currentCourtId: string;
  /** Rally wins so far against the current opponent matchup. */
  matchupRalliesWon: number;
  /** Selected boss variant id once the boss is reached, else null. */
  bossVariantId: string | null;
  rally: RallyState | null;
}

// ---- Post-run shop ----

export interface ShopState {
  offeredCardIds: string[];
  rerollCount: number;
}
