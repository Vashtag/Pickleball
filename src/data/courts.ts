// 5 MVP courts + the boss court (design doc §10). Court rule effects are
// resolved by id in a later phase.

import type { Court } from '../types/game';

export const COURTS: Court[] = [
  {
    id: 'training_court',
    name: 'Training Court',
    description: 'A clean local court. No nonsense yet.',
    modifierText: 'No modifier.',
  },
  {
    id: 'windy_court',
    name: 'Windy Court',
    description: 'The wind has opinions.',
    modifierText: 'Lob deals +1 Balance but has a small chance to add +1 Pressure.',
  },
  {
    id: 'kitchen_court',
    name: 'Kitchen Court',
    description: 'Soft shots rule here.',
    modifierText: 'Dink and Drop Shot deal +1 Balance damage.',
  },
  {
    id: 'tiny_court',
    name: 'Tiny Court',
    description: 'No room to breathe.',
    modifierText: 'Pressure gain +1, but Soft cards deal +1 Balance.',
  },
  {
    id: 'cracked_court',
    name: 'Cracked Court',
    description: 'The bounce is cursed.',
    modifierText: 'Every few turns a random card in hand gets +1 Balance or +1 Pressure risk.',
  },
  {
    id: 'royal_kitchen',
    name: 'The Royal Kitchen',
    description: 'The crown jewel of questionable pickleball governance.',
    modifierText: 'Boss court — cosmetic only in MVP.',
  },
];

// Courts that can be randomly assigned to normal matchups (excludes boss court).
export const STANDARD_COURT_IDS: string[] = COURTS.filter(
  (c) => c.id !== 'royal_kitchen',
).map((c) => c.id);

export const BOSS_COURT_ID = 'royal_kitchen';

const COURTS_BY_ID: Record<string, Court> = Object.fromEntries(
  COURTS.map((c) => [c.id, c]),
);

export function getCourt(id: string): Court {
  const court = COURTS_BY_ID[id];
  if (!court) throw new Error(`Unknown court id: ${id}`);
  return court;
}
