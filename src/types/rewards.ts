// Paddle Mod and reward type models. See design doc §6 and §11.

export type PaddleModRarity = 'common' | 'uncommon' | 'rare';

export interface PaddleMod {
  id: string;
  name: string;
  rarity?: PaddleModRarity;
  icon: string;
  description: string;
  theme: string;
}

// Kinds of small reward offered after a won rally. Resolved in a later phase.
export type RewardKind =
  | 'addCard'
  | 'skipForBucks'
  | 'recoverPressure'
  | 'upgradeCard'
  | 'removeCard'
  | 'bonusBucks';

export interface RewardOption {
  kind: RewardKind;
  /** For card-related rewards, the card id involved. */
  cardId?: string;
  /** For currency rewards, the Dink Bucks amount. */
  amount?: number;
  label: string;
}
