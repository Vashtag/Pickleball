// LocalStorage save shape. See design doc §18.

export interface LifetimeStats {
  totalRuns: number;
  totalRalliesWon: number;
  totalOpponentsDefeated: number;
  totalDinkBucksEarned: number;
  bestScore: number;
  longestRally: number;
  bestCombo: string | null;
  bossWins: number;
}

export interface GameSettings {
  soundEnabled: boolean;
}

export interface SaveData {
  version: number;
  dinkBucks: number;
  unlockedCardIds: string[];
  lifetimeStats: LifetimeStats;
  settings: GameSettings;
  debug?: {
    lastRunSeed?: string;
  };
}
