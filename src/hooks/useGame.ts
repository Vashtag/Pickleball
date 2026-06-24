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
import type { useSaveData } from './useSaveData';

type SaveApi = ReturnType<typeof useSaveData>;

// Owns the active run and exposes engine actions to the UI. Terminal handling
// (game over / victory) is detected by the caller via `run.phase`.
export function useGame(saveApi: SaveApi) {
  const [run, setRun] = useState<RunState | null>(null);
  const [warmUpChoices, setWarmUpChoices] = useState<string[]>([]);
  const [lastScore, setLastScore] = useState<RunScore | null>(null);

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

  // Resolve a finished rally and move to the next one (rewards land in Phase 4).
  const continueAfterRally = useCallback(() => {
    setRun((prev) => {
      if (!prev?.rally) return prev;
      if (prev.rally.outcome === 'won') {
        let next = winRally(prev);
        if (next.phase === 'rewardPending') next = beginNextRally(next);
        return next;
      }
      if (prev.rally.outcome === 'lost') {
        return loseRally(prev);
      }
      return prev;
    });
  }, []);

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
  }, []);

  return {
    run,
    warmUpChoices,
    lastScore,
    start,
    chooseWarmUp,
    play,
    endPlayerTurn,
    continueAfterRally,
    finalizeRun,
    clearRun,
  };
}
