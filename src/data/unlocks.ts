// Unlock / shop / economy constants (design doc §11–14).

import type { CardRarity } from '../types/cards';
import { STARTER_CARD_IDS, UNLOCKABLE_CARDS } from './cards';

// Cards available on a brand-new save: the 7 starter cards. All other cards
// must be unlocked at The Kitchen Counter.
export function getInitialUnlockedCardIds(): string[] {
  return [...STARTER_CARD_IDS];
}

// Cards that can appear as locked options in the shop (not yet unlocked).
export function getLockableCardIds(): string[] {
  return UNLOCKABLE_CARDS.map((c) => c.id);
}

// Shop unlock cost by rarity (Dink Bucks).
export const UNLOCK_COST: Record<CardRarity, number> = {
  common: 25,
  uncommon: 50,
  rare: 100,
};

// Shop reroll cost grows within a single visit: 10, 20, 30, then +10 each time.
export function rerollCost(previousRerolls: number): number {
  return (previousRerolls + 1) * 10;
}

// Dink Bucks payouts (design doc §12).
export const DINK_BUCKS = {
  winRally: 2,
  skipReward: 5,
  defeatNormal: 5,
  defeatElite: 10,
  defeatBoss: 30,
} as const;
