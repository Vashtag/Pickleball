// Core rally engine (design doc / build plan Phase 2). Functions take a
// RunState, mutate a clone, and return it — pure-ish and testable without UI.
// Rewards (Phase 4), court/difficulty scaling (Phase 5), and boss specifics
// (Phase 6) are stubbed/light here and expanded later.

import type { CardInstance } from '../types/cards';
import type { RallyMods, RallyState, RunState } from '../types/game';
import type { SaveData } from '../types/save';
import { Rng, makeRunSeed } from './rng';
import {
  applyCardEffect,
  spendStamina,
  type EffectContext,
} from './cardEffects';
import {
  cardIsAggressive,
  chooseIntent,
  isIntentHidden,
  resolveIntent,
} from './opponentAI';
import { isCard } from './combos';
import { getCard, getUpgradedCard, STARTER_DECK_RECIPE } from '../data/cards';
import {
  BOSS_COURT_ID,
  STANDARD_COURT_IDS,
} from '../data/courts';
import {
  BOSS_VARIANTS,
  OPPONENTS,
  PICKLE_KING,
  getOpponent,
} from '../data/opponents';
import { DINK_BUCKS } from '../data/unlocks';
import { computeScore, type RunScore } from './scoring';

const HAND_SIZE = 5;
const PRESSURE_MAX = 10;
const START_STAMINA = 5;
const START_LIVES = 5;
const BOSS_RALLY_THRESHOLD = 15; // rallies won before The Pickle King appears
const GOLDEN_SMASH_BONUS = 10;

// ---- helpers ----

function clone<T>(value: T): T {
  return structuredClone(value);
}

// Reconstruct the RNG from the run's serialized cursor; remember to write
// `run.rngState = rng.state` after using it.
function getRng(run: RunState): Rng {
  return new Rng(run.rngState);
}

function nextInstance(run: RunState, cardId: string): CardInstance {
  const instanceId = `${cardId}#${run.instanceCounter++}`;
  return { instanceId, cardId };
}

function defaultMods(): RallyMods {
  return {
    nextPowerBonusBalance: 0,
    nextPowerPressureRelief: 0,
    nextPressureReduction: 0,
    nextStaminaCardBonus: 0,
    illegalPaddleCore: false,
    firstSoftPressureReliefUsed: false,
  };
}

function isBossOpponent(id: string): boolean {
  return id === PICKLE_KING.id;
}

// Light early-difficulty bump so runs ramp; full scaling is Phase 5.
function difficultyBonus(run: RunState): number {
  return Math.floor(run.ralliesWon / 3);
}

// ---- run setup ----

export function startRun(seedInput?: string): RunState {
  const seed = seedInput ?? makeRunSeed();
  const rng = new Rng(seed);

  const run: RunState = {
    seed,
    rngState: rng.state,
    phase: 'warmup',
    lives: START_LIVES,
    ralliesWon: 0,
    opponentsDefeated: 0,
    dinkBucks: 0,
    deck: [],
    paddleMods: [],
    currentOpponentId: '',
    currentCourtId: '',
    matchupRalliesWon: 0,
    matchupRalliesRequired: 1,
    bossVariantId: rng.pick(BOSS_VARIANTS).id, // seed fixes the boss variant
    rally: null,
    instanceCounter: 0,
    edgeGuardUsed: false,
  };

  // Build the 12-card starter deck.
  for (const [cardId, count] of STARTER_DECK_RECIPE) {
    for (let i = 0; i < count; i++) run.deck.push(nextInstance(run, cardId));
  }

  // Assign the first opponent/court.
  const first = rng.pick(OPPONENTS);
  run.currentOpponentId = first.id;
  run.currentCourtId = rng.pick(STANDARD_COURT_IDS);
  run.matchupRalliesRequired = first.baseRalliesRequired;

  run.rngState = rng.state;
  return run;
}

// 3 random unlocked, non-starter cards for the Warm-Up Pick (design doc §13).
export function getWarmUpChoices(save: SaveData, run: RunState): string[] {
  const rng = getRng(run);
  const pool = save.unlockedCardIds.filter((id) => {
    const card = getCard(id);
    return card.unlockState !== 'starter' && !card.isUpgrade;
  });
  const choices = rng.shuffle(pool).slice(0, 3);
  run.rngState = rng.state;
  return choices;
}

// Apply the Warm-Up Pick (or skip with null), then begin the first rally.
export function applyWarmUpPick(run: RunState, cardId: string | null): RunState {
  const next = clone(run);
  if (cardId) next.deck.push(nextInstance(next, cardId));
  startRally(next);
  return next;
}

// ---- rally lifecycle ----

// Begin a rally vs the current opponent. Mutates `run` in place.
export function startRally(run: RunState): void {
  const opponent = getOpponent(run.currentOpponentId);
  const rng = getRng(run);

  const maxBalance = isBossOpponent(opponent.id)
    ? PICKLE_KING.baseBalance
    : opponent.baseBalance + difficultyBonus(run);

  const rally: RallyState = {
    opponentBalance: maxBalance,
    opponentMaxBalance: maxBalance,
    pressure: 0,
    pressureMax: PRESSURE_MAX,
    stamina: START_STAMINA,
    drawPile: rng.shuffle(run.deck),
    discardPile: [],
    hand: [],
    playsRemaining: 1,
    lastCardId: null,
    lastBalanceDealt: 0,
    turn: 1,
    aggressiveThisTurn: false,
    intent: null,
    intentHidden: false,
    playerStatuses: {},
    opponentStatuses: {},
    mods: defaultMods(),
    outcome: 'ongoing',
    log: [`Rally vs ${opponent.name} begins.`],
  };

  // Initial hand + first telegraphed intent.
  drawTo(rally, HAND_SIZE, rng);
  const intent = chooseIntent(opponent, rng);
  rally.intent = intent;
  rally.intentHidden = isIntentHidden(intent);

  run.rally = rally;
  run.phase = 'rally';
  run.rngState = rng.state;
}

// Draw up to a target hand size, reshuffling discard when the draw pile empties.
function drawTo(rally: RallyState, target: number, rng: Rng): void {
  while (rally.hand.length < target) {
    if (rally.drawPile.length === 0) {
      if (rally.discardPile.length === 0) break;
      rally.drawPile = rng.shuffle(rally.discardPile);
      rally.discardPile = [];
      rally.log.push('Reshuffled discard into draw pile.');
    }
    const card = rally.drawPile.pop();
    if (card) rally.hand.push(card);
  }
}

// Effective Stamina cost, including the Counter Step combo discount.
export function effectiveCost(run: RunState, cardId: string): number {
  const card = getCard(cardId);
  let cost = card.staminaCost;
  const prev = run.rally?.lastCardId ?? null;
  if (cardId === 'counter_smash' && isCard(prev, 'step_back')) cost -= 1;
  // Carbon Core: Smash costs 1 less Stamina (minimum 1).
  if (isCard(cardId, 'smash') && run.paddleMods.includes('carbon_core')) {
    return Math.max(1, cost - 1);
  }
  return Math.max(0, cost);
}

export function canPlayCard(run: RunState, instanceId: string): boolean {
  const rally = run.rally;
  if (!rally || rally.outcome !== 'ongoing' || rally.playsRemaining <= 0) return false;
  const inst = rally.hand.find((c) => c.instanceId === instanceId);
  if (!inst) return false;
  return rally.stamina >= effectiveCost(run, inst.cardId);
}

// Play a card from hand. No-op (with a log note) if the play is illegal.
export function playCard(run: RunState, instanceId: string): RunState {
  const next = clone(run);
  const rally = next.rally;
  if (!rally || rally.outcome !== 'ongoing') return next;

  const idx = rally.hand.findIndex((c) => c.instanceId === instanceId);
  if (idx === -1) return next;

  const inst = rally.hand[idx];
  const card = getCard(inst.cardId);
  const cost = effectiveCost(next, inst.cardId);

  if (rally.playsRemaining <= 0) {
    rally.log.push('No plays left this turn.');
    return next;
  }
  if (rally.stamina < cost) {
    rally.log.push(`Not enough Stamina for ${card.name}.`);
    return next;
  }

  // Move card to discard, pay cost.
  rally.hand.splice(idx, 1);
  rally.discardPile.push(inst);
  if (cost > 0) spendStamina(rally, cost);

  const rng = getRng(next);
  const ctx: EffectContext = {
    prevCardId: rally.lastCardId,
    intentAggressive: rally.intent?.aggressive ?? false,
    rng,
    paddleMods: next.paddleMods,
  };

  const balanceBefore = rally.opponentBalance;
  applyCardEffect(rally, card, ctx, rally.log);
  rally.lastBalanceDealt = Math.max(0, balanceBefore - rally.opponentBalance);

  rally.lastCardId = card.id;
  rally.playsRemaining -= 1;
  if (cardIsAggressive(card.id)) rally.aggressiveThisTurn = true;

  if (rally.opponentBalance <= 0) {
    rally.outcome = 'won';
    rally.log.push('Opponent Balance reduced to 0 — rally won!');
  }

  next.rngState = rng.state;
  return next;
}

// End the player's turn: resolve the opponent intent, then draw a fresh hand.
export function endTurn(run: RunState): RunState {
  const next = clone(run);
  const rally = next.rally;
  if (!rally || rally.outcome !== 'ongoing') return next;

  const opponent = getOpponent(next.currentOpponentId);
  const rng = getRng(next);

  if (rally.intent) {
    resolveIntent(
      rally,
      opponent,
      rally.intent,
      { playerWasAggressive: rally.aggressiveThisTurn },
      rng,
      rally.log,
    );
  }

  if (rally.pressure >= rally.pressureMax) {
    rally.pressure = rally.pressureMax;
    rally.outcome = 'lost';
    rally.log.push('Pressure hit maximum — rally lost!');
    next.rngState = rng.state;
    return next;
  }

  // New turn: discard the leftover hand, draw a fresh 5, re-telegraph intent.
  rally.discardPile.push(...rally.hand);
  rally.hand = [];
  drawTo(rally, HAND_SIZE, rng);
  rally.playsRemaining = 1;
  rally.aggressiveThisTurn = false;
  rally.turn += 1;
  const intent = chooseIntent(opponent, rng);
  rally.intent = intent;
  rally.intentHidden = isIntentHidden(intent);
  rally.log.push(`-- Turn ${rally.turn} --`);

  next.rngState = rng.state;
  return next;
}

// ---- rally resolution ----

// Resolve a won rally: payouts, matchup/boss progress. Leaves phase at
// 'rewardPending' (rewards added in Phase 4) or 'victory' on a boss clear.
export function winRally(run: RunState): RunState {
  const next = clone(run);
  const rally = next.rally;
  next.ralliesWon += 1;
  next.matchupRalliesWon += 1;
  next.dinkBucks += DINK_BUCKS.winRally;

  if (rally && isCard(rally.lastCardId, 'golden_smash')) {
    next.dinkBucks += GOLDEN_SMASH_BONUS;
    rally.log.push(`Golden Smash! +${GOLDEN_SMASH_BONUS} Dink Bucks.`);
  }

  const opponent = getOpponent(next.currentOpponentId);
  const matchupComplete = next.matchupRalliesWon >= next.matchupRalliesRequired;

  if (matchupComplete) {
    next.opponentsDefeated += 1;
    if (isBossOpponent(opponent.id)) {
      next.dinkBucks += DINK_BUCKS.defeatBoss;
      next.phase = 'victory';
    } else {
      next.dinkBucks += opponent.tier === 'elite' ? DINK_BUCKS.defeatElite : DINK_BUCKS.defeatNormal;
      advanceOpponent(next);
      next.phase = 'rewardPending';
    }
  } else {
    next.phase = 'rewardPending';
  }

  return next;
}

// Resolve a lost rally: lose a life; same matchup continues (progress kept).
export function loseRally(run: RunState): RunState {
  const next = clone(run);

  // Haunted Edge Guard: ignore the first life loss each run.
  if (next.paddleMods.includes('haunted_edge_guard') && !next.edgeGuardUsed) {
    next.edgeGuardUsed = true;
    if (next.rally) next.rally.log.push('Haunted Edge Guard saves you — no life lost!');
    startRally(next);
    return next;
  }

  next.lives -= 1;
  if (next.lives <= 0) {
    next.lives = 0;
    next.phase = 'runOver';
  } else {
    startRally(next); // retry the same opponent
  }
  return next;
}

// Begin the next rally after a reward (or immediately, in Phase 2).
export function beginNextRally(run: RunState): RunState {
  const next = clone(run);
  if (next.phase === 'victory' || next.phase === 'runOver') return next;
  startRally(next);
  return next;
}

// Choose the next opponent + court. Triggers the boss at the threshold.
export function advanceOpponent(run: RunState): void {
  const rng = getRng(run);
  run.matchupRalliesWon = 0;

  if (run.ralliesWon >= BOSS_RALLY_THRESHOLD) {
    const variant = BOSS_VARIANTS.find((v) => v.id === run.bossVariantId) ?? BOSS_VARIANTS[0];
    run.currentOpponentId = PICKLE_KING.id;
    run.currentCourtId = BOSS_COURT_ID;
    run.matchupRalliesRequired = variant.ralliesRequired;
  } else {
    const opp = rng.pick(OPPONENTS);
    run.currentOpponentId = opp.id;
    run.currentCourtId = rng.pick(STANDARD_COURT_IDS);
    run.matchupRalliesRequired = opp.baseRalliesRequired;
  }

  run.rngState = rng.state;
}

// ---- run completion ----

// Finalize a run: compute score and fold results into the save. Returns the
// updated save and the run score summary.
export function finishRun(run: RunState, save: SaveData): { save: SaveData; score: RunScore } {
  const bossDefeated = run.phase === 'victory';
  const score = computeScore(run, bossDefeated);
  const next = clone(save);

  next.dinkBucks += run.dinkBucks;
  const s = next.lifetimeStats;
  s.totalRuns += 1;
  s.totalRalliesWon += run.ralliesWon;
  s.totalOpponentsDefeated += run.opponentsDefeated;
  s.totalDinkBucksEarned += run.dinkBucks;
  s.bestScore = Math.max(s.bestScore, score.score);
  if (bossDefeated) s.bossWins += 1;

  return { save: next, score };
}

// Convenience: the upgraded version of a card id, if implemented (for rewards).
export { getUpgradedCard };
