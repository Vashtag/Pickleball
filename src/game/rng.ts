// Seeded RNG (design doc §21). Deterministic mulberry32 generator with a
// string-hashing seed, so a run's opponents/courts/rewards/shop/boss are
// reproducible. Structured so daily challenges can reuse a fixed seed later.

// Hash an arbitrary string into a 32-bit unsigned int (xfnv1a-ish).
export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  // Internal 32-bit state; serializable for deterministic saves.
  state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
  }

  // mulberry32 — returns a float in [0, 1).
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Integer in [min, max] inclusive.
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  // True with probability p (0..1).
  chance(p: number): boolean {
    return this.next() < p;
  }

  // Pick a random element.
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty array');
    return items[this.nextInt(0, items.length - 1)];
  }

  // Weighted pick: each item paired with a positive weight.
  weightedPick<T>(items: readonly { item: T; weight: number }[]): T {
    const total = items.reduce((sum, w) => sum + w.weight, 0);
    let roll = this.next() * total;
    for (const { item, weight } of items) {
      roll -= weight;
      if (roll < 0) return item;
    }
    return items[items.length - 1].item;
  }

  // Fisher–Yates shuffle returning a new array (does not mutate input).
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}

// Generate a fresh random run seed string (no visible UI in MVP).
export function makeRunSeed(): string {
  return Math.floor(Math.random() * 0xffffffff).toString(36) + Date.now().toString(36);
}
