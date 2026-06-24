// Reward generation and application (design doc §9, §11). A reward is shown
// after each won rally: a Paddle Mod choice every 3rd rally, otherwise a small
// card reward (add a card, skip for Dink Bucks, or an occasional special).

import type { RunState } from '../types/game';
import type { RewardOption } from '../types/rewards';
import type { SaveData } from '../types/save';
import { Rng } from './rng';
import { getCard } from '../data/cards';
import { PADDLE_MODS } from '../data/paddleMods';
import { DINK_BUCKS } from '../data/unlocks';

const MAX_LIVES = 5;
const SKIP_BUCKS = DINK_BUCKS.skipReward; // +5

export interface RewardSet {
  type: 'card' | 'paddleMod';
  /** Card ids offered to add to the deck (for a card reward). */
  cardChoices: string[];
  /** Paddle Mod ids offered (for a Paddle Mod reward). */
  paddleModChoices: string[];
  /** Optional extra option (recovery / bonus bucks). */
  special: RewardOption | null;
  /** Dink Bucks gained by skipping a card reward. */
  skipBucks: number;
}

function getRng(run: RunState): Rng {
  return new Rng(run.rngState);
}

// Build the reward set for the current state and advance the run's RNG.
export function generateReward(run: RunState, save: SaveData): { reward: RewardSet; run: RunState } {
  const next = structuredClone(run);
  const rng = getRng(next);

  let reward: RewardSet;

  if (next.ralliesWon % 3 === 0) {
    // Paddle Mod reward: 3 mods the player doesn't already have.
    const owned = new Set(next.paddleMods);
    const available = PADDLE_MODS.filter((m) => !owned.has(m.id)).map((m) => m.id);
    reward = {
      type: 'paddleMod',
      cardChoices: [],
      paddleModChoices: rng.shuffle(available).slice(0, 3),
      special: null,
      skipBucks: 0,
    };
  } else {
    // Card reward: add 1 of N unlocked, non-upgrade cards (Lucky Paddle Wrap
    // adds a 4th option).
    const pool = save.unlockedCardIds.filter((id) => !getCard(id).isUpgrade);
    const count = next.paddleMods.includes('lucky_paddle_wrap') ? 4 : 3;
    const cardChoices = rng.shuffle(pool).slice(0, count);

    // Occasional special: recover a life (if hurt) or a small Dink Bucks bonus.
    let special: RewardOption | null = null;
    if (rng.chance(0.3)) {
      if (next.lives < MAX_LIVES && rng.chance(0.5)) {
        special = { kind: 'recoverPressure', amount: 1, label: 'Recover: +1 life' };
      } else {
        special = { kind: 'bonusBucks', amount: 8, label: 'Bonus: +8 Dink Bucks' };
      }
    }

    reward = {
      type: 'card',
      cardChoices,
      paddleModChoices: [],
      special,
      skipBucks: SKIP_BUCKS,
    };
  }

  next.rngState = rng.state;
  return { reward, run: next };
}

// ---- application (each returns a new RunState) ----

let rewardInstanceSeq = 0;

export function applyAddCard(run: RunState, cardId: string): RunState {
  const next = structuredClone(run);
  next.deck.push({ instanceId: `${cardId}#reward-${rewardInstanceSeq++}`, cardId });
  return next;
}

export function applySkip(run: RunState, skipBucks: number): RunState {
  const next = structuredClone(run);
  next.dinkBucks += skipBucks;
  return next;
}

export function applySpecial(run: RunState, option: RewardOption): RunState {
  const next = structuredClone(run);
  if (option.kind === 'recoverPressure') {
    next.lives = Math.min(MAX_LIVES, next.lives + (option.amount ?? 1));
  } else if (option.kind === 'bonusBucks') {
    next.dinkBucks += option.amount ?? 0;
  }
  return next;
}

export function applyPaddleMod(run: RunState, modId: string): RunState {
  const next = structuredClone(run);
  if (!next.paddleMods.includes(modId)) next.paddleMods.push(modId);
  return next;
}
