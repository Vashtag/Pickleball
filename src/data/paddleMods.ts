// 10 MVP Paddle Mods (design doc §6). Behavior is resolved by id in a later
// phase; descriptions are player-facing.

import type { PaddleMod } from '../types/rewards';

export const PADDLE_MODS: PaddleMod[] = [
  { id: 'grandma_grip', name: 'Grandma Grip', icon: '🧶', description: 'Dink cards deal +1 Balance damage.', theme: "Never underestimate grandma's kitchen game." },
  { id: 'carbon_core', name: 'Carbon Core', icon: '🪶', description: 'Smash costs 1 less Stamina (minimum 1).', theme: 'Lightweight, loud, probably expensive.' },
  { id: 'spin_surface', name: 'Spin Surface', icon: '🌀', description: 'Slice deals +1 Balance and applies Vulnerable on Drive → Slice.', theme: 'Maximum paddle texture. Very questionable.' },
  { id: 'kitchen_tape', name: 'Kitchen Tape', icon: '🩹', description: 'Dink → Drop Shot combos deal +2 additional Balance.', theme: 'Precision tape for kitchen pests.' },
  { id: 'haunted_edge_guard', name: 'Haunted Edge Guard', icon: '🪦', description: 'Ignore the first life loss each run.', theme: 'The paddle whispers, "Not yet."' },
  { id: 'squeaky_grip', name: 'Squeaky Grip', icon: '🐭', description: 'Reset reduces +1 extra Pressure.', theme: 'Squeak your way back into the rally.' },
  { id: 'pop_paddle', name: 'Pop Paddle', icon: '🎉', description: 'Drive deals +1 Balance damage.', theme: 'Extra pop. Extra swagger.' },
  { id: 'soft_touch_core', name: 'Soft Touch Core', icon: '🪽', description: 'The first Soft card each rally reduces Pressure by 1.', theme: 'The dink life chose you.' },
  { id: 'illegal_sweet_spot', name: 'Illegal Sweet Spot', icon: '🚫', description: 'Rare cards deal +2 Balance / stronger effects, but add +1 Pressure.', theme: 'The referee is looking away.' },
  { id: 'lucky_paddle_wrap', name: 'Lucky Paddle Wrap', icon: '🍀', description: 'Slightly increases rare card chance in rewards.', theme: 'Wrapped in good vibes and questionable tape.' },
];

const PADDLE_MODS_BY_ID: Record<string, PaddleMod> = Object.fromEntries(
  PADDLE_MODS.map((m) => [m.id, m]),
);

export function getPaddleMod(id: string): PaddleMod {
  const mod = PADDLE_MODS_BY_ID[id];
  if (!mod) throw new Error(`Unknown paddle mod id: ${id}`);
  return mod;
}
