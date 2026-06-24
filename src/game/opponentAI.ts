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

  // The Banger's passive ("Big Swing"): aggressive intents nudge extra Pressure.
  if (opponent.id === 'the_banger' && intent.aggressive) {
    // Light MVP version: +0 at base difficulty; Phase 5 scales this up.
  }
}

// Whether a just-played card counts as aggressive for opponent reactions.
export function cardIsAggressive(cardId: string | null): boolean {
  return isCard(cardId, 'drive') || isCard(cardId, 'smash') || isCard(cardId, 'counter_smash') || isCard(cardId, 'golden_smash');
}
