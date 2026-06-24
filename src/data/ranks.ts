// Funny pickleball ranks shown on victory/defeat (design doc §15).
// Thresholds are score floors; the highest threshold <= score wins.

export interface Rank {
  threshold: number;
  name: string;
}

export const RANKS: Rank[] = [
  { threshold: 0, name: 'Pickle Rookie' },
  { threshold: 100, name: 'Casual Dinker' },
  { threshold: 250, name: 'Kitchen Pest' },
  { threshold: 500, name: 'Rally Rascal' },
  { threshold: 800, name: 'Dink Menace' },
  { threshold: 1200, name: 'Net Goblin' },
  { threshold: 1700, name: 'Paddle Gremlin' },
  { threshold: 2300, name: 'Kitchen Demon' },
  { threshold: 3000, name: 'Eternal Dinker' },
];

export function getRank(score: number): Rank {
  let result = RANKS[0];
  for (const rank of RANKS) {
    if (score >= rank.threshold) result = rank;
    else break;
  }
  return result;
}
