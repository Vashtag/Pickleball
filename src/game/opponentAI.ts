// Opponent intent selection and resolution (design doc §8, §10–11).
// Pattern + randomness for MVP. Difficulty scaling hooks exist but are light;
// fuller scaling lands in Phase 5.

import type { Opponent, OpponentIntent } from '../types/opponents';
import type { RallyState } from '../types/game';
import { Rng } from './rng';
import { gainPressure, spendStamina } from './cardEffects';
import { isCard } from './combos';

// Some later opponents telegraph vaguely. For MVP, intents flagged in data
// (e.g. "Goblin Fakeout") read as hidden.
const HIDDEN_INTENT_IDS = new Set(['goblin_fakeout']);

export function isIntentHidden(intent: OpponentIntent): boolean {
  return HIDDEN_INTENT_IDS.has(intent.id);
}

// Pick the next intent using the opponent's weighted pool.
export function chooseIntent(opponent: Opponent, rng: Rng): OpponentIntent {
  return rng.weightedPick(
    opponent.intents.map((intent) => ({ item: intent, weight: intent.weight })),
  );
}

// Chance an intent is shown vaguely. Rises with difficulty; elites/bosses are
// harder to read (design doc §10: later opponents show vague/hidden intent).
function hiddenChance(difficulty: number, tier: Opponent['tier']): number {
  let c = Math.max(0, (difficulty - 6) * 0.04);
  if (tier === 'elite') c += 0.1;
  if (tier === 'boss') c += 0.2;
  return Math.min(0.4, c);
}

// Pick the next intent and decide whether it reads as hidden.
export function chooseIntentReveal(
  opponent: Opponent,
  rng: Rng,
  difficulty: number,
): { intent: OpponentIntent; hidden: boolean } {
  const intent = chooseIntent(opponent, rng);
  const hidden = isIntentHidden(intent) || rng.chance(hiddenChance(difficulty, opponent.tier));
  return { intent, hidden };
}

export interface IntentResolution {
  /** True if the player's previous card this turn was aggressive (Power). */
  playerWasAggressive: boolean;
}

// Apply the telegraphed intent to the rally. Mutates rally and appends to log.
export function resolveIntent(
  rally: RallyState,
  opponent: Opponent,
  intent: OpponentIntent,
  res: IntentResolution,
  rng: Rng,
  log: string[],
  difficulty = 0,
): void {
  log.push(`${opponent.name}: ${intent.name}.`);

  switch (intent.id) {
    // ---- recovery / defensive intents ----
    case 'careful_reset':
    case 'soft_reset':
    case 'calm_reset':
    case 'royal_reset': {
      const heal = 2;
      rally.opponentBalance = Math.min(rally.opponentMaxBalance, rally.opponentBalance + heal);
      log.push(`${opponent.name} steadies up (+${heal} Balance).`);
      break;
    }
    case 'reset_stance':
    case 'floaty_setup':
    case 'royal_dink': {
      rally.opponentStatuses.protected = (rally.opponentStatuses.protected ?? 0) + 1;
      if (intent.pressure) gainPressure(rally, intent.pressure, log);
      break;
    }
    case 'surgical_dink': {
      rally.opponentStatuses.protected = (rally.opponentStatuses.protected ?? 0) + 1;
      gainPressure(rally, intent.pressure ?? 2, log);
      break;
    }
    case 'overhit': {
      gainPressure(rally, intent.pressure ?? 1, log);
      rally.opponentStatuses.vulnerable = (rally.opponentStatuses.vulnerable ?? 0) + 1;
      log.push(`${opponent.name} overhits and is Vulnerable!`);
      break;
    }
    case 'pressure_push': {
      gainPressure(rally, intent.pressure ?? 2, log);
      spendStamina(rally, 1);
      log.push('They push you off balance (-1 Stamina).');
      break;
    }
    case 'punish_drive': {
      // Madame Kitchen: punishes recent aggression.
      const big = res.playerWasAggressive;
      gainPressure(rally, big ? 3 : 1, log);
      if (big) log.push('Punishes your aggression!');
      break;
    }
    case 'kitchen_trap': {
      let p = intent.pressure ?? 2;
      if (res.playerWasAggressive) p += 1;
      gainPressure(rally, p, log);
      break;
    }
    case 'surprise_drop': {
      const exhausted = (rally.playerStatuses.exhausted ?? 0) > 0;
      gainPressure(rally, exhausted ? (intent.pressure ?? 3) : 1, log);
      break;
    }
    case 'goblin_fakeout': {
      // Vague intent: small random pressure.
      gainPressure(rally, rng.nextInt(1, 2), log);
      break;
    }

    default: {
      // Generic intent: apply its telegraphed Pressure.
      if (intent.pressure) gainPressure(rally, intent.pressure, log);
      break;
    }
  }

  // Difficulty scaling and The Banger's "Big Swing" passive: aggressive intents
  // inflict extra Pressure as the run gets harder.
  if (intent.aggressive) {
    let aggroBonus = Math.floor(difficulty / 6); // +1 from rally 6, +2 from 12
    if (opponent.id === 'the_banger' && difficulty >= 3) aggroBonus += 1; // Big Swing
    if (aggroBonus > 0) {
      log.push(`${opponent.name} bears down (+${aggroBonus} Pressure).`);
      gainPressure(rally, aggroBonus, log);
    }
  }

  // Boss buff / variant (Royal Pressure, Pressure King): every intent stings more.
  if (rally.bonusIntentPressure > 0) {
    gainPressure(rally, rally.bonusIntentPressure, log);
  }
}

// Whether a just-played card counts as aggressive for opponent reactions.
export function cardIsAggressive(cardId: string | null): boolean {
  return isCard(cardId, 'drive') || isCard(cardId, 'smash') || isCard(cardId, 'counter_smash') || isCard(cardId, 'golden_smash');
}
