// Run scoring (first pass; expanded in Phase 7).

import type { RunState } from '../types/game';
import { getRank } from '../data/ranks';

export interface RunScore {
  ralliesWon: number;
  opponentsDefeated: number;
  bossDefeated: boolean;
  dinkBucksEarned: number;
  score: number;
  rank: string;
}

export function computeScore(run: RunState, bossDefeated: boolean): RunScore {
  const score =
    run.ralliesWon * 100 +
    run.opponentsDefeated * 50 +
    (bossDefeated ? 500 : 0);
  return {
    ralliesWon: run.ralliesWon,
    opponentsDefeated: run.opponentsDefeated,
    bossDefeated,
    dinkBucksEarned: run.dinkBucks,
    score,
    rank: getRank(score).name,
  };
}
