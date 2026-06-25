// Shot parameters for the real-time rally prototype. Each playable shot card
// maps to a ball trajectory (launch speed + vertical arc) and a Stamina cost.
// Tuned by feel — expect to adjust these during playtest.

export interface ShotParams {
  id: string;
  name: string;
  icon: string;
  cost: number;
  /** Horizontal launch speed (court units/sec). */
  speed: number;
  /** Upward launch velocity (sets the arc height). */
  arc: number;
  /** Smash-style shots only land well when struck from a high ball. */
  needsHigh?: boolean;
  note: string;
}

export const SHOTS: Record<string, ShotParams> = {
  block: { id: 'block', name: 'Block', icon: '🪨', cost: 0, speed: 15, arc: 7, note: 'Safe neutral return.' },
  dink: { id: 'dink', name: 'Dink', icon: '🏓', cost: 0, speed: 12, arc: 8, note: 'Soft — drops near the net.' },
  drive: { id: 'drive', name: 'Drive', icon: '➡️', cost: 0, speed: 24, arc: 4, note: 'Fast and flat.' },
  lob: { id: 'lob', name: 'Lob', icon: '🌙', cost: 1, speed: 15, arc: 13, note: 'High and deep.' },
  smash: { id: 'smash', name: 'Smash', icon: '💥', cost: 2, speed: 28, arc: 2, needsHigh: true, note: 'Huge — needs a high ball.' },
  slice: { id: 'slice', name: 'Slice', icon: '🔪', cost: 0, speed: 18, arc: 6, note: 'Low and skiddy.' },
  drop_shot: { id: 'drop_shot', name: 'Drop Shot', icon: '🤏', cost: 1, speed: 13, arc: 9, note: 'Soft touch into the kitchen.' },
  reset: { id: 'reset', name: 'Reset', icon: '🔄', cost: 0, speed: 12, arc: 9, note: 'Absorb pace, soft reset.' },
};

export function getShot(id: string): ShotParams {
  return SHOTS[id] ?? SHOTS.block;
}

// The prototype shot deck drawn from during a rally.
export const SHOT_DECK: string[] = [
  'dink', 'dink', 'dink',
  'drive', 'drive',
  'slice', 'slice',
  'drop_shot',
  'lob',
  'smash',
  'reset', 'reset',
];
