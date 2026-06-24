// Opponent, intent, and boss type models. See design doc §8–9.

export type OpponentTier = 'normal' | 'elite' | 'boss';

export interface OpponentIntent {
  id: string;
  name: string;
  /** Shown to the player as the telegraphed intent text. */
  description: string;
  /** Base Pressure inflicted on the player when resolved. */
  pressure?: number;
  /** Relative selection weight within the opponent's intent pool. */
  weight: number;
  /** Counts as an aggressive/power intent (Counter Smash, some passives). */
  aggressive?: boolean;
}

export interface Opponent {
  id: string;
  name: string;
  tier: OpponentTier;
  portraitIcon: string;
  baseBalance: number;
  baseRalliesRequired: number;
  passiveName: string;
  passiveDescription: string;
  intents: OpponentIntent[];
  barks: string[];
}

// ---- Boss ----

export interface BossVariant {
  id: string;
  name: string;
  ralliesRequired: number;
  modifier: string;
  /** Readable warning shown before the fight. */
  warning: string;
}

export interface BossBuff {
  id: string;
  name: string;
  description: string;
}

export interface BossCounter {
  id: string;
  name: string;
  description: string;
}
