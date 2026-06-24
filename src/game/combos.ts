// Combo recognition (design doc §5). The mechanical bonuses live in
// cardEffects.ts (each card reads the previous card id); this module is the
// single source of truth for *naming* a combo so the engine can log it and the
// UI can flash it. Base ids and their "+" variants both match.

interface ComboDef {
  prev: string;
  curr: string;
  name: string;
}

const COMBOS: ComboDef[] = [
  { prev: 'lob', curr: 'smash', name: 'Lob → Smash' },
  { prev: 'dink', curr: 'drop_shot', name: 'Kitchen Touch' },
  { prev: 'reset', curr: 'dink', name: 'Calm Dink' },
  { prev: 'drive', curr: 'slice', name: 'Cut Drive' },
  { prev: 'fakeout', curr: 'smash', name: 'Fakeout Smash' },
  { prev: 'step_back', curr: 'counter_smash', name: 'Counter Step' },
  { prev: 'paddle_tap', curr: '*', name: 'Quick Hands' },
];

// Strip a trailing "_plus" so upgraded cards still trigger combos.
function baseId(id: string): string {
  return id.endsWith('_plus') ? id.slice(0, -'_plus'.length) : id;
}

export function getComboName(prevCardId: string | null, currCardId: string): string | null {
  if (!prevCardId) return null;
  const prev = baseId(prevCardId);
  const curr = baseId(currCardId);
  for (const c of COMBOS) {
    if (c.prev !== prev) continue;
    if (c.curr === '*' && curr !== 'paddle_tap') return c.name;
    if (c.curr === curr) return c.name;
  }
  return null;
}

// Does `prevCardId` count as the given base card (incl. its "+" variant)?
export function isCard(cardId: string | null, base: string): boolean {
  return cardId != null && baseId(cardId) === base;
}
