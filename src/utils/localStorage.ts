// LocalStorage save system (design doc §18). Defensive against missing
// storage (SSR/private mode) and corrupt/old data.

import type { SaveData } from '../types/save';
import { getInitialUnlockedCardIds } from '../data/unlocks';

const SAVE_KEY = 'dink-or-die:save';
const SAVE_VERSION = 1;

export function defaultSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    dinkBucks: 0,
    unlockedCardIds: getInitialUnlockedCardIds(),
    lifetimeStats: {
      totalRuns: 0,
      totalRalliesWon: 0,
      totalOpponentsDefeated: 0,
      totalDinkBucksEarned: 0,
      bestScore: 0,
      longestRally: 0,
      bestCombo: null,
      bossWins: 0,
    },
    settings: {
      soundEnabled: true,
    },
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

// Merge a parsed (possibly partial/old) save onto defaults so new fields are
// always present. Keeps a simple, forgiving migration path.
function migrate(raw: unknown): SaveData {
  const base = defaultSaveData();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<SaveData>;
  return {
    ...base,
    ...data,
    version: SAVE_VERSION,
    lifetimeStats: { ...base.lifetimeStats, ...(data.lifetimeStats ?? {}) },
    settings: { ...base.settings, ...(data.settings ?? {}) },
    unlockedCardIds: data.unlockedCardIds ?? base.unlockedCardIds,
  };
}

export function loadSave(): SaveData {
  const storage = getStorage();
  if (!storage) return defaultSaveData();
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return defaultSaveData();
    return migrate(JSON.parse(raw));
  } catch {
    return defaultSaveData();
  }
}

export function writeSave(data: SaveData): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota/serialization errors — saving is best-effort in MVP.
  }
}

export function resetSave(): SaveData {
  const fresh = defaultSaveData();
  writeSave(fresh);
  return fresh;
}
