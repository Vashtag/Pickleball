// Card type model. See design doc §1 (Content & Data Lists).

export type CardRarity = 'common' | 'uncommon' | 'rare';

export type CardTag =
  | 'soft'
  | 'power'
  | 'defense'
  | 'trick'
  | 'recovery'
  | 'setup'
  | 'finisher';

// 'starter' cards are available from the first run. 'locked' cards must be
// unlocked at The Kitchen Counter before they appear in reward pools / Warm-Up.
export type CardUnlockState = 'starter' | 'locked';

export interface Card {
  id: string;
  name: string;
  icon: string;
  rarity: CardRarity;
  tags: CardTag[];
  staminaCost: number;
  effectText: string;
  tooltip: string;
  unlockState: CardUnlockState;
  /** id of the upgraded ("+") variant, if one is implemented. */
  upgradedId?: string;
  /** true for "+" variants; excluded from unlock / reward pools. */
  isUpgrade?: boolean;
}

// A concrete copy of a card living in a deck/draw/discard/hand pile.
// The engine (Phase 2) resolves behavior from `cardId`.
export interface CardInstance {
  instanceId: string;
  cardId: string;
}
