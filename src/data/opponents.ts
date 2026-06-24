// Opponent archetypes, the boss, and boss variants/buffs/counters.
// First-pass values from design doc §8–9. Intent `weight` uses the doc's
// percentages as relative weights.

import type {
  BossBuff,
  BossCounter,
  BossVariant,
  Opponent,
} from '../types/opponents';

export const OPPONENTS: Opponent[] = [
  {
    id: 'the_beginner',
    name: 'The Beginner',
    tier: 'normal',
    portraitIcon: '🐣',
    baseBalance: 8,
    baseRalliesRequired: 1,
    passiveName: 'None',
    passiveDescription: 'No special passive.',
    intents: [
      { id: 'soft_return', name: 'Soft Return', description: 'Soft return (+1 Pressure)', pressure: 1, weight: 40 },
      { id: 'careful_reset', name: 'Careful Reset', description: 'Steadies up (recovers a little Balance)', weight: 30 },
      { id: 'weak_drive', name: 'Weak Drive', description: 'Weak drive (+2 Pressure)', pressure: 2, weight: 30, aggressive: true },
    ],
    barks: [
      'Wait, which side do I serve from?',
      'I meant to do that.',
      'Nice shot! Unfortunately!',
    ],
  },
  {
    id: 'the_banger',
    name: 'The Banger',
    tier: 'normal',
    portraitIcon: '💪',
    baseBalance: 10,
    baseRalliesRequired: 2,
    passiveName: 'Big Swing',
    passiveDescription: 'Power Shot intents add +1 extra Pressure at higher difficulty.',
    intents: [
      { id: 'power_shot', name: 'Power Shot', description: 'Winds up a power shot (+3 Pressure)', pressure: 3, weight: 50, aggressive: true },
      { id: 'overhit', name: 'Overhit', description: 'Overhits (+1 Pressure, becomes Vulnerable)', pressure: 1, weight: 20, aggressive: true },
      { id: 'pressure_push', name: 'Pressure Push', description: 'Pushes hard (+2 Pressure, you lose 1 Stamina)', pressure: 2, weight: 20, aggressive: true },
      { id: 'reset_stance', name: 'Reset Stance', description: 'Resets stance (gains Protected)', weight: 10 },
    ],
    barks: ['I only know one speed.', 'Too soft!', 'That ball had a family.'],
  },
  {
    id: 'the_dink_goblin',
    name: 'The Dink Goblin',
    tier: 'normal',
    portraitIcon: '👺',
    baseBalance: 9,
    baseRalliesRequired: 2,
    passiveName: 'Kitchen Pest',
    passiveDescription: 'Reduces Power card damage by 1 unless your previous card was Soft.',
    intents: [
      { id: 'tiny_dink', name: 'Tiny Dink', description: 'Tiny dink (+1 Pressure, weakens your next Power)', pressure: 1, weight: 35 },
      { id: 'kitchen_trap', name: 'Kitchen Trap', description: 'Sets a trap (+2 Pressure, more if you used Power)', pressure: 2, weight: 30, aggressive: true },
      { id: 'soft_reset', name: 'Soft Reset', description: 'Soft reset (recovers Balance or gains Protected)', weight: 20 },
      { id: 'goblin_fakeout', name: 'Goblin Fakeout', description: 'Intent unclear...', weight: 15 },
    ],
    barks: ['Welcome to my kitchen.', 'Tiny shot. Big problem.', 'No smashing in my house.'],
  },
  {
    id: 'the_lobfather',
    name: 'The Lobfather',
    tier: 'normal',
    portraitIcon: '🎩',
    baseBalance: 11,
    baseRalliesRequired: 3,
    passiveName: 'High Arc',
    passiveDescription: "Every third turn, your next Smash costs +1 Stamina unless you played Drive or Deep Return.",
    intents: [
      { id: 'moon_lob', name: 'Moon Lob', description: 'Moon lob (+2 Pressure, next Smash costs +1)', pressure: 2, weight: 40 },
      { id: 'deep_push', name: 'Deep Push', description: 'Deep push (+2 Pressure)', pressure: 2, weight: 25, aggressive: true },
      { id: 'floaty_setup', name: 'Floaty Setup', description: 'Floaty setup (gains Protected)', weight: 20 },
      { id: 'surprise_drop', name: 'Surprise Drop', description: 'Surprise drop (+3 Pressure if you are Exhausted)', pressure: 3, weight: 15, aggressive: true },
    ],
    barks: ['Look up.', 'The sky is part of the court.', 'I am the arc.'],
  },
  {
    id: 'madame_kitchen',
    name: 'Madame Kitchen',
    tier: 'elite',
    portraitIcon: '👑',
    baseBalance: 12,
    baseRalliesRequired: 3,
    passiveName: 'Kitchen Discipline',
    passiveDescription: 'Repeated aggressive cards gain +1 extra Pressure.',
    intents: [
      { id: 'kitchen_lock', name: 'Kitchen Lock', description: 'Locks the kitchen (+2 Pressure, your next Power costs Pressure)', pressure: 2, weight: 35, aggressive: true },
      { id: 'surgical_dink', name: 'Surgical Dink', description: 'Surgical dink (+2 Pressure, gains Protected)', pressure: 2, weight: 25 },
      { id: 'punish_drive', name: 'Punish Drive', description: 'Punishes aggression (+3 if you attacked last turn, else +1)', pressure: 1, weight: 25, aggressive: true },
      { id: 'calm_reset', name: 'Calm Reset', description: 'Calm reset (recovers +2 Balance)', weight: 15 },
    ],
    barks: ['Stay out of my kitchen.', 'Reckless.', 'Patience wins.'],
  },
];

const OPPONENTS_BY_ID: Record<string, Opponent> = Object.fromEntries(
  OPPONENTS.map((o) => [o.id, o]),
);

// ---- Boss: The Pickle King ----

export const PICKLE_KING: Opponent = {
  id: 'pickle_king',
  name: 'The Pickle King',
  tier: 'boss',
  portraitIcon: '🥒👑',
  baseBalance: 15,
  baseRalliesRequired: 3, // overridden per boss variant
  passiveName: 'Kitchen Tyrant',
  passiveDescription: 'Rules the kitchen with a cucumber fist.',
  intents: [
    { id: 'royal_drive', name: 'Royal Drive', description: 'Royal drive (+3 Pressure)', pressure: 3, weight: 35, aggressive: true },
    { id: 'royal_dink', name: 'Royal Dink', description: 'Royal dink (+1 Pressure, gains Protected)', pressure: 1, weight: 25 },
    { id: 'decree', name: 'Decree', description: 'Issues a decree (+2 Pressure)', pressure: 2, weight: 25, aggressive: true },
    { id: 'royal_reset', name: 'Royal Reset', description: 'Royal reset (recovers +2 Balance)', weight: 15 },
  ],
  barks: ['Kneel before the kitchen.', 'The crown does not dink. It reigns.', 'You are but a pickle.'],
};

export const BOSS_VARIANTS: BossVariant[] = [
  {
    id: 'mirror_king',
    name: 'Mirror King',
    ralliesRequired: 3,
    modifier: 'Copies weaker versions of your recent cards.',
    warning: 'The Pickle King studies your paddle.',
  },
  {
    id: 'kitchen_tyrant',
    name: 'Kitchen Tyrant',
    ralliesRequired: 3,
    modifier: 'Dinks and Drop Shots are riskier unless played after setup.',
    warning: 'The kitchen belongs to the crown.',
  },
  {
    id: 'pressure_king',
    name: 'Pressure King',
    ralliesRequired: 4,
    modifier: 'Opponent intents add +1 Pressure more often.',
    warning: 'Every shot feels heavier.',
  },
  {
    id: 'all_court_king',
    name: 'All-Court King',
    ralliesRequired: 4,
    modifier: 'Uses mixed Power, Soft, Defense, and Trick intents.',
    warning: 'No corner of the court is safe.',
  },
];

export const BOSS_BUFFS: BossBuff[] = [
  { id: 'royal_pressure', name: 'Royal Pressure', description: 'Boss intents add +1 Pressure next rally.' },
  { id: 'golden_balance', name: 'Golden Balance', description: 'Boss starts next rally with +2 Balance.' },
  { id: 'kitchen_decree', name: 'Kitchen Decree', description: "Your first Soft card next rally is weaker." },
  { id: 'mirror_glare', name: 'Mirror Glare', description: 'First combo next rally is reduced by 1 Balance damage.' },
];

export const BOSS_COUNTERS: BossCounter[] = [
  { id: 'catch_breath', name: 'Catch Breath', description: 'Start next rally with +1 Stamina.' },
  { id: 'brace_up', name: 'Brace Up', description: 'Start next rally with Protected.' },
  { id: 'scout_court', name: 'Scout the Court', description: 'Reveal the exact first boss intent.' },
  { id: 'quick_draw', name: 'Quick Draw', description: 'Draw 1 extra card on the first turn next rally.' },
  { id: 'sharpen_grip', name: 'Sharpen Grip', description: 'Upgrade one card for the rest of the boss fight.' },
];

export function getOpponent(id: string): Opponent {
  if (id === PICKLE_KING.id) return PICKLE_KING;
  const opp = OPPONENTS_BY_ID[id];
  if (!opp) throw new Error(`Unknown opponent id: ${id}`);
  return opp;
}
