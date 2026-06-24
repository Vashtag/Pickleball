// Card effect resolution. Mutates a RallyState in place and appends to its log.
// Effects are first-pass per design doc §3–4; some interactions are simplified
// for MVP and marked with TODO. Court and Paddle Mod hooks land in later phases.

import type { Card } from '../types/cards';
import type { RallyState, StatusId } from '../types/game';
import { Rng } from './rng';
import { getComboName, isCard } from './combos';

// ---- low-level mutators ----

function setExhausted(rally: RallyState): void {
  if (rally.stamina <= 0) rally.playerStatuses.exhausted = 1;
  else delete rally.playerStatuses.exhausted;
}

export function gainStamina(rally: RallyState, amount: number): void {
  rally.stamina += amount;
  setExhausted(rally);
}

export function spendStamina(rally: RallyState, amount: number): void {
  rally.stamina = Math.max(0, rally.stamina - amount);
  setExhausted(rally);
}

// Deal Balance damage to the opponent, applying their Vulnerable/Protected.
function dealBalance(rally: RallyState, amount: number, log: string[], label: string): number {
  let dmg = Math.max(0, amount);
  if (dmg > 0 && (rally.opponentStatuses.vulnerable ?? 0) > 0) {
    dmg += 2;
    delete rally.opponentStatuses.vulnerable;
    log.push('Opponent is Vulnerable (+2)!');
  }
  if (dmg > 0 && (rally.opponentStatuses.protected ?? 0) > 0) {
    dmg = Math.max(0, dmg - 2);
    delete rally.opponentStatuses.protected;
  }
  rally.opponentBalance = Math.max(0, rally.opponentBalance - dmg);
  if (dmg > 0) log.push(`${label} deals ${dmg} Balance.`);
  return dmg;
}

// Increase the player's Pressure, applying Exhausted/Protected/Deep Return.
export function gainPressure(rally: RallyState, amount: number, log: string[]): void {
  let p = Math.max(0, amount);
  if (p > 0 && (rally.playerStatuses.exhausted ?? 0) > 0) {
    p += 1; // Exhausted: incoming Pressure +1
  }
  if (p > 0 && rally.mods.nextPressureReduction > 0) {
    const cut = Math.min(p, rally.mods.nextPressureReduction);
    p -= cut;
    rally.mods.nextPressureReduction = 0;
    log.push(`Deep Return absorbs ${cut} Pressure.`);
  }
  if (p > 0 && (rally.playerStatuses.protected ?? 0) > 0) {
    p = Math.max(0, p - 2);
    delete rally.playerStatuses.protected;
    log.push('Protected reduces incoming Pressure.');
  }
  if (p > 0) {
    rally.pressure += p;
    log.push(`+${p} Pressure.`);
  }
}

export function reducePressure(rally: RallyState, amount: number, log: string[]): void {
  if (amount <= 0 || rally.pressure <= 0) return;
  const cut = Math.min(rally.pressure, amount);
  rally.pressure -= cut;
  log.push(`-${cut} Pressure.`);
}

function applyStatus(
  target: 'player' | 'opponent',
  rally: RallyState,
  status: StatusId,
  log: string[],
): void {
  const map = target === 'player' ? rally.playerStatuses : rally.opponentStatuses;
  map[status] = (map[status] ?? 0) + 1;
  log.push(`${target === 'player' ? 'You gain' : 'Opponent gains'} ${status}.`);
}

export function drawCards(rally: RallyState, n: number, rng: Rng, log: string[]): void {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (rally.drawPile.length === 0) {
      if (rally.discardPile.length === 0) break; // nothing left to draw
      rally.drawPile = rng.shuffle(rally.discardPile);
      rally.discardPile = [];
      log.push('Reshuffled discard into draw pile.');
    }
    const card = rally.drawPile.pop();
    if (card) {
      rally.hand.push(card);
      drawn++;
    }
  }
  if (drawn > 0) log.push(`Drew ${drawn} card${drawn === 1 ? '' : 's'}.`);
}

// Consume Fakeout / Illegal Paddle Core bonuses for a Power card.
function powerMods(rally: RallyState, log: string[]): { bonus: number; relief: number; extra: number } {
  let bonus = 0;
  let relief = 0;
  let extra = 0;
  if (rally.mods.nextPowerBonusBalance > 0 || rally.mods.nextPowerPressureRelief > 0) {
    bonus += rally.mods.nextPowerBonusBalance;
    relief += rally.mods.nextPowerPressureRelief;
    rally.mods.nextPowerBonusBalance = 0;
    rally.mods.nextPowerPressureRelief = 0;
    log.push('Fakeout sets up the shot!');
  }
  if (rally.mods.illegalPaddleCore) {
    bonus += 2;
    extra += 1;
  }
  return { bonus, relief, extra };
}

export interface EffectContext {
  prevCardId: string | null;
  intentAggressive: boolean;
  rng: Rng;
}

// Resolve a single card's effect. Returns the combo name if one fired (for the
// caller to surface), having already applied any mechanical bonus.
export function applyCardEffect(
  rally: RallyState,
  card: Card,
  ctx: EffectContext,
  log: string[],
): string | null {
  const prev = ctx.prevCardId;
  const combo = getComboName(prev, card.id);

  // Generic bonuses to any damaging card.
  const quickHands = isCard(prev, 'paddle_tap') ? 1 : 0; // Quick Hands combo
  let staminaBonus = 0;
  if (card.staminaCost > 0 && rally.mods.nextStaminaCardBonus > 0) {
    staminaBonus = rally.mods.nextStaminaCardBonus;
    rally.mods.nextStaminaCardBonus = 0;
    log.push('Safe Serve setup pays off!');
  }
  const dmgBonus = quickHands + staminaBonus;

  switch (card.id) {
    // ---- starters ----
    case 'dink':
    case 'dink_plus': {
      const base = card.id === 'dink_plus' ? 2 : 1;
      dealBalance(rally, base + dmgBonus, log, card.name);
      let relief = 1;
      if (isCard(prev, 'reset')) relief += 1; // Calm Dink combo
      reducePressure(rally, relief, log);
      break;
    }
    case 'drive':
    case 'drive_plus': {
      const pm = powerMods(rally, log);
      const base = card.id === 'drive_plus' ? 3 : 2;
      dealBalance(rally, base + dmgBonus + pm.bonus, log, card.name);
      gainPressure(rally, Math.max(0, 1 + pm.extra - pm.relief), log);
      break;
    }
    case 'reset':
    case 'reset_plus': {
      reducePressure(rally, card.id === 'reset_plus' ? 4 : 3, log);
      if (card.id === 'reset_plus') drawCards(rally, 1, ctx.rng, log);
      break;
    }
    case 'lob':
    case 'lob_plus': {
      dealBalance(rally, (card.id === 'lob_plus' ? 2 : 1) + dmgBonus, log, card.name);
      // Smash bonus is read from the previous-card combo when Smash follows.
      break;
    }
    case 'smash':
    case 'smash_plus': {
      const pm = powerMods(rally, log);
      let dmg = (card.id === 'smash_plus' ? 5 : 4) + dmgBonus + pm.bonus;
      let lobSetup = 0;
      if (isCard(prev, 'lob')) lobSetup = prev === 'lob_plus' ? 3 : 2; // Lob → Smash
      dmg += lobSetup;
      const safe = lobSetup > 0 || (rally.opponentStatuses.vulnerable ?? 0) > 0;
      dealBalance(rally, dmg, log, card.name);
      // Risk Pressure unless set up; Smash+ reduces the risk by 1.
      let risk = safe ? 0 : 2;
      if (card.id === 'smash_plus' && risk > 0) risk -= 1;
      gainPressure(rally, Math.max(0, risk + pm.extra - pm.relief), log);
      break;
    }
    case 'slice':
    case 'slice_plus': {
      dealBalance(rally, (card.id === 'slice_plus' ? 2 : 1) + dmgBonus, log, card.name);
      if (isCard(prev, 'drive')) applyStatus('opponent', rally, 'vulnerable', log); // Cut Drive
      break;
    }
    case 'drop_shot':
    case 'drop_shot_plus': {
      let dmg = (card.id === 'drop_shot_plus' ? 3 : 2) + dmgBonus;
      if (isCard(prev, 'dink')) dmg += 2; // Kitchen Touch
      dealBalance(rally, dmg, log, card.name);
      break;
    }

    // ---- common (locked) ----
    case 'rally_breath':
    case 'rally_breath_plus': {
      gainStamina(rally, card.id === 'rally_breath_plus' ? 3 : 2);
      reducePressure(rally, 1, log);
      log.push('Catches their breath.');
      break;
    }
    case 'step_back': {
      applyStatus('player', rally, 'protected', log);
      drawCards(rally, 1, ctx.rng, log);
      break;
    }
    case 'safe_serve': {
      dealBalance(rally, 1 + dmgBonus, log, card.name);
      rally.mods.nextStaminaCardBonus += 1;
      log.push('Next Stamina-cost card gains +1 Balance.');
      break;
    }
    case 'court_shoes': {
      reducePressure(rally, 2, log);
      if ((rally.playerStatuses.exhausted ?? 0) > 0) gainStamina(rally, 1);
      break;
    }
    case 'paddle_tap': {
      dealBalance(rally, 1 + dmgBonus, log, card.name);
      rally.playsRemaining += 1; // extra play
      log.push('Quick hands — play another card!');
      break;
    }

    // ---- uncommon (locked) ----
    case 'fakeout': {
      reducePressure(rally, 1, log);
      rally.mods.nextPowerBonusBalance += 2;
      rally.mods.nextPowerPressureRelief += 1;
      log.push('Sets up the next Power card.');
      break;
    }
    case 'kitchen_trap': {
      dealBalance(rally, 3 + dmgBonus, log, card.name);
      if (isCard(prev, 'dink') || isCard(prev, 'drop_shot')) {
        applyStatus('opponent', rally, 'vulnerable', log);
      }
      break;
    }
    case 'counter_smash': {
      const pm = powerMods(rally, log);
      let dmg = 3 + dmgBonus + pm.bonus;
      if (ctx.intentAggressive) {
        dmg += 2;
        applyStatus('player', rally, 'protected', log);
        log.push('Counters their aggression!');
      }
      dealBalance(rally, dmg, log, card.name);
      gainPressure(rally, Math.max(0, pm.extra - pm.relief), log);
      break;
    }
    case 'net_kiss': {
      let dmg = 2 + dmgBonus;
      if (ctx.rng.chance(0.25)) {
        dmg += 3;
        log.push('Net cord — lucky bounce!');
      }
      dealBalance(rally, dmg, log, card.name);
      if (ctx.rng.chance(0.25)) gainPressure(rally, 1, log);
      break;
    }
    case 'deep_return': {
      dealBalance(rally, 2 + dmgBonus, log, card.name);
      rally.mods.nextPressureReduction += 2;
      log.push('Next Pressure gain reduced by 2.');
      break;
    }
    case 'forbidden_dink': {
      dealBalance(rally, 3 + dmgBonus, log, card.name);
      if (rally.pressure >= 6) reducePressure(rally, 2, log);
      break;
    }
    case 'brine_block': {
      if ((rally.playerStatuses.protected ?? 0) > 0) {
        reducePressure(rally, 3, log);
      } else {
        applyStatus('player', rally, 'protected', log);
      }
      break;
    }
    case 'momentum_swing': {
      const pm = powerMods(rally, log);
      dealBalance(rally, 2 + dmgBonus + pm.bonus, log, card.name);
      gainPressure(rally, Math.max(0, pm.extra - pm.relief), log);
      rally.playsRemaining += 1;
      log.push('Momentum — play another card!');
      break;
    }

    // ---- rare (locked) ----
    case 'pickle_curse': {
      dealBalance(rally, 2 + dmgBonus, log, card.name);
      applyStatus('opponent', rally, 'vulnerable', log);
      // TODO(phase 5+): weaken opponent's next intent.
      log.push("Opponent's next intent is weakened.");
      break;
    }
    case 'haunted_net': {
      reducePressure(rally, 2, log);
      // TODO(phase 5+): chance to fail/weaken next opponent intent.
      log.push('The net haunts their next shot.');
      break;
    }
    case 'golden_smash': {
      const pm = powerMods(rally, log);
      dealBalance(rally, 7 + dmgBonus + pm.bonus, log, card.name);
      gainPressure(rally, Math.max(0, pm.extra - pm.relief), log);
      // Bonus Dink Bucks on a winning Smash is granted in the engine on win.
      break;
    }
    case 'spectral_partner': {
      // Simplified: repeat ~50% of the previous card's Balance damage.
      const repeat = Math.floor(rally.lastBalanceDealt * 0.5);
      if (repeat > 0) {
        dealBalance(rally, repeat, log, 'Spectral Partner');
      } else {
        log.push('Spectral Partner finds nothing to echo.');
      }
      break;
    }
    case 'illegal_paddle_core': {
      rally.mods.illegalPaddleCore = true;
      log.push('Power cards are supercharged this rally (and riskier).');
      break;
    }

    default:
      // Unknown card: no-op but keep the game stable.
      log.push(`${card.name} has no effect yet.`);
      break;
  }

  if (combo) log.push(`Combo: ${combo}!`);
  return combo;
}
