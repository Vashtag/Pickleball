import { useCallback, useState } from 'react';
import type { RunState } from '../types/game';
import type { RunScore } from '../game/scoring';
import {
  startRun,
  getWarmUpChoices,
  applyWarmUpPick,
  playCard,
  endTurn,
  winRally,
  loseRally,
  beginNextRally,
  finishRun,
} from '../game/engine';
import {
  generateReward,
  applyAddCard,
  applySkip,
  applySpecial,
  applyPaddleMod,
  type RewardSet,
} from '../game/rewards';
import type { RewardOption } from '../types/rewards';
import type { useSaveData } from './useSaveData';

type SaveApi = ReturnType<typeof useSaveData>;

// Owns the active run and exposes engine actions to the UI. Terminal handling
// (game over / victory) is detected by the caller via `run.phase`.
export function useGame(saveApi: SaveApi) {
  const [run, setRun] = useState<RunState | null>(null);
  const [warmUpChoices, setWarmUpChoices] = useState<string[]>([]);
  const [lastScore, setLastScore] = useState<RunScore | null>(null);
  const [reward, setReward] = useState<RewardSet | null>(null);

  const start = useCallback(
    (seed?: string) => {
      const fresh = startRun(seed);
      // Note: getWarmUpChoices advances the run's RNG cursor in place.
      setWarmUpChoices(getWarmUpChoices(saveApi.save, fresh));
      setLastScore(null);
      setRun(fresh);
    },
    [saveApi.save],
  );

  const chooseWarmUp = useCallback((cardId: string | null) => {
    setRun((prev) => (prev ? applyWarmUpPick(prev, cardId) : prev));
  }, []);

  const play = useCallback((instanceId: string) => {
    setRun((prev) => (prev ? playCard(prev, instanceId) : prev));
  }, []);

  const endPlayerTurn = useCallback(() => {
    setRun((prev) => (prev ? endTurn(prev) : prev));
  }, []);

  // Resolve a finished rally. A win goes to a reward (or victory); a loss goes
  // to the next rally (or game over).
  const continueAfterRally = useCallback(() => {
    setRun((prev) => {
      if (!prev?.rally) return prev;
      if (prev.rally.outcome === 'won') {
        const next = winRally(prev);
        if (next.phase === 'victory') return next; // boss cleared — no reward
        const { reward: generated, run: withReward } = generateReward(next, saveApi.save);
        setReward(generated);
        return withReward; // stays in 'rewardPending'; App shows the reward screen
      }
      if (prev.rally.outcome === 'lost') {
        return loseRally(prev);
      }
      return prev;
    });
  }, [saveApi.save]);

  // Apply a chosen reward, then begin the next rally.
  const finishReward = useCallback((apply: (r: RunState) => RunState) => {
    setReward(null);
    setRun((prev) => (prev ? beginNextRally(apply(prev)) : prev));
  }, []);

  const chooseRewardCard = useCallback(
    (cardId: string) => finishReward((r) => applyAddCard(r, cardId)),
    [finishReward],
  );
  const skipReward = useCallback(
    () => finishReward((r) => applySkip(r, reward?.skipBucks ?? 0)),
    [finishReward, reward],
  );
  const chooseRewardSpecial = useCallback(
    (option: RewardOption) => finishReward((r) => applySpecial(r, option)),
    [finishReward],
  );
  const chooseRewardMod = useCallback(
    (modId: string) => finishReward((r) => applyPaddleMod(r, modId)),
    [finishReward],
  );

  // Fold the finished run into the save and capture its score. Idempotent per run.
  const finalizeRun = useCallback(() => {
    setRun((prev) => {
      if (!prev) return prev;
      const { save, score } = finishRun(prev, saveApi.save);
      saveApi.setSave(save);
      setLastScore(score);
      return prev;
    });
  }, [saveApi]);

  const clearRun = useCallback(() => {
    setRun(null);
    setWarmUpChoices([]);
    setReward(null);
  }, []);

  return {
    run,
    warmUpChoices,
    lastScore,
    reward,
    start,
    chooseWarmUp,
    play,
    endPlayerTurn,
    continueAfterRally,
    chooseRewardCard,
    skipReward,
    chooseRewardSpecial,
    chooseRewardMod,
    finalizeRun,
    clearRun,
  };
}
