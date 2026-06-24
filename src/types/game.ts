// Core gameplay types: statuses, courts, run/rally/shop state.

import type { CardInstance } from './cards';
import type { OpponentIntent } from './opponents';

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

export type RallyOutcome = 'ongoing' | 'won' | 'lost';

// Pending, rally-scoped effect modifiers set up by cards (consumed later).
export interface RallyMods {
  /** Fakeout: bonus Balance for the next Power card played. */
  nextPowerBonusBalance: number;
  /** Fakeout: Pressure relief on the next Power card played. */
  nextPowerPressureRelief: number;
  /** Deep Return: reduces the next Pressure gain. */
  nextPressureReduction: number;
  /** Safe Serve: bonus Balance for the next Stamina-cost card. */
  nextStaminaCardBonus: number;
  /** Illegal Paddle Core: Power cards deal +2 Balance but +1 Pressure this rally. */
  illegalPaddleCore: boolean;
  /** Soft Touch Core paddle mod: first Soft card's Pressure relief used this rally. */
  firstSoftPressureReliefUsed: boolean;
}

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
  /** Balance dealt by the last card (for Spectral Partner). */
  lastBalanceDealt: number;
  /** Current turn number (1-based). */
  turn: number;
  /** Whether the player played an aggressive (Power) card this turn. */
  aggressiveThisTurn: boolean;
  /** Telegraphed opponent intent that resolves at end of turn. */
  intent: OpponentIntent | null;
  /** Whether the intent is shown vaguely/hidden to the player. */
  intentHidden: boolean;
  playerStatuses: StatusMap;
  opponentStatuses: StatusMap;
  mods: RallyMods;
  outcome: RallyOutcome;
  /** Turn-by-turn action log, newest last. */
  log: string[];
}

export type RunPhase =
  | 'warmup'
  | 'rally'
  | 'rewardPending'
  | 'runOver'
  | 'victory';

export interface RunState {
  seed: string;
  /** Serializable RNG cursor, so a run stays deterministic across saves. */
  rngState: number;
  phase: RunPhase;
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
  /** Rally wins required to clear the current matchup. */
  matchupRalliesRequired: number;
  /** Selected boss variant id once the boss is reached, else null. */
  bossVariantId: string | null;
  rally: RallyState | null;
  /** Monotonic counter for generating unique card instance ids. */
  instanceCounter: number;
  /** Haunted Edge Guard paddle mod: whether its one-time life save was used. */
  edgeGuardUsed: boolean;
}

// ---- Post-run shop ----

export interface ShopState {
  offeredCardIds: string[];
  rerollCount: number;
}
