// Selectable shot palette for the 3D rally. You pick the current shot (1-5 or
// click), then swinging executes it toward your aim. No stamina/cards — these
// are just shot types. Tuned slow-ish for reaction time; adjust by feel.

export interface ShotParams {
  id: string;
  name: string;
  icon: string;
  /** Stamina cost to play this shot (basic shots are free). */
  cost: number;
  /** Horizontal launch speed (court units/sec). */
  speed: number;
  /** Upward launch velocity (arc height). */
  arc: number;
  /** Where it aims down-court: short = into their kitchen, deep = baseline. */
  depth: 'short' | 'deep';
  /** Smash-style shots only land well off a high ball. */
  needsHigh?: boolean;
  note: string;
}

export const SHOTS: Record<string, ShotParams> = {
  dink: { id: 'dink', name: 'Dink', icon: '🏓', cost: 0, speed: 9, arc: 8, depth: 'short', note: 'Soft drop into the kitchen.' },
  drive: { id: 'drive', name: 'Drive', icon: '➡️', cost: 0, speed: 15, arc: 4, depth: 'deep', note: 'Paced, flat, deep.' },
  slice: { id: 'slice', name: 'Slice', icon: '🔪', cost: 0, speed: 13, arc: 5, depth: 'deep', note: 'Low and skiddy.' },
  lob: { id: 'lob', name: 'Lob', icon: '🌙', cost: 1, speed: 12, arc: 14, depth: 'deep', note: 'High and deep — push them back.' },
  smash: { id: 'smash', name: 'Smash', icon: '💥', cost: 2, speed: 20, arc: 2, depth: 'deep', needsHigh: true, note: 'Fast and down — needs a high ball.' },
};

export function getShot(id: string): ShotParams {
  return SHOTS[id] ?? SHOTS.drive;
}

// The rally deck — the pool your hand is drawn from each point.
export const SHOT_DECK: string[] = [
  'dink', 'dink', 'dink',
  'drive', 'drive', 'drive',
  'slice', 'slice',
  'lob', 'lob',
  'smash',
];

