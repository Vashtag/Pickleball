// Roguelite perks for the 3D rally. Picked between matches; each perk adjusts
// the player's "loadout" — the modifiers the real-time rally reads. No in-rally
// cards: perks are the whole upgrade layer.

export interface Loadout {
  /** Multiplies shot launch speed. */
  speedMult: number;
  /** Extra horizontal reach when swinging. */
  reachBonus: number;
  /** Multiplies movement speed. */
  moveSpeedMult: number;
  /** Widens the timing/positioning window for a clean hit. */
  hitWindowBonus: number;
  /** Added to the opponent's fault chance. */
  oppFaultBonus: number;
  /** Extra lives for the run. */
  extraLives: number;
}

export const BASE_LOADOUT: Loadout = {
  speedMult: 1,
  reachBonus: 0,
  moveSpeedMult: 1,
  hitWindowBonus: 0,
  oppFaultBonus: 0,
  extraLives: 0,
};

export interface Perk {
  id: string;
  name: string;
  icon: string;
  desc: string;
  effect: Partial<Loadout>;
}

export const PERKS: Perk[] = [
  { id: 'carbon_paddle', name: 'Carbon Paddle', icon: '🪶', desc: 'Your shots fly 15% faster.', effect: { speedMult: 0.15 } },
  { id: 'big_reach', name: 'Long Arms', icon: '🦾', desc: '+ reach on every swing.', effect: { reachBonus: 0.9 } },
  { id: 'quick_feet', name: 'Quick Feet', icon: '👟', desc: 'Move 30% faster.', effect: { moveSpeedMult: 0.3 } },
  { id: 'wall_defense', name: 'Wall', icon: '🧱', desc: 'Much more forgiving hit timing.', effect: { hitWindowBonus: 1.2 } },
  { id: 'eagle_eye', name: 'Eagle Eye', icon: '🦅', desc: 'Slightly wider hit window.', effect: { hitWindowBonus: 0.7 } },
  { id: 'spin_master', name: 'Spin Master', icon: '🌀', desc: 'Opponents shank more often.', effect: { oppFaultBonus: 0.07 } },
  { id: 'lucky_net', name: 'Lucky Net', icon: '🍀', desc: 'Opponents fault even more.', effect: { oppFaultBonus: 0.1 } },
  { id: 'soft_hands', name: 'Soft Hands', icon: '🪽', desc: '+ reach and steadier touch.', effect: { reachBonus: 0.45, hitWindowBonus: 0.4 } },
  { id: 'second_wind', name: 'Second Wind', icon: '💨', desc: '+1 life this run.', effect: { extraLives: 1 } },
  { id: 'bruiser', name: 'Bruiser', icon: '💪', desc: 'Faster shots and a bit more reach.', effect: { speedMult: 0.1, reachBonus: 0.3 } },
];

const PERKS_BY_ID: Record<string, Perk> = Object.fromEntries(PERKS.map((p) => [p.id, p]));

export function getPerk(id: string): Perk {
  return PERKS_BY_ID[id];
}

export function buildLoadout(perkIds: string[]): Loadout {
  const out: Loadout = { ...BASE_LOADOUT };
  for (const id of perkIds) {
    const e = PERKS_BY_ID[id]?.effect;
    if (!e) continue;
    if (e.speedMult) out.speedMult += e.speedMult;
    if (e.reachBonus) out.reachBonus += e.reachBonus;
    if (e.moveSpeedMult) out.moveSpeedMult += e.moveSpeedMult;
    if (e.hitWindowBonus) out.hitWindowBonus += e.hitWindowBonus;
    if (e.oppFaultBonus) out.oppFaultBonus += e.oppFaultBonus;
    if (e.extraLives) out.extraLives += e.extraLives;
  }
  return out;
}

// Pick n distinct random perks to offer.
export function rollPerkChoices(n: number): string[] {
  const pool = PERKS.map((p) => p.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
