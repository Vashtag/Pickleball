import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import TitleScreen from './screens/TitleScreen';
import MainMenu from './screens/MainMenu';
import SettingsScreen from './screens/SettingsScreen';
import KitchenCounterScreen from './screens/KitchenCounterScreen';
import WarmUpPickScreen from './screens/WarmUpPickScreen';
import RunScreen from './screens/RunScreen';
import RewardScreen from './components/rewards/RewardScreen';
import GameOverScreen from './screens/GameOverScreen';
import VictoryScreen from './screens/VictoryScreen';

// Code-split: the 3D rally pulls in Three.js, so load it only on demand.
const PracticeRallyScreen = lazy(() => import('./screens/PracticeRallyScreen'));
import { useSaveData } from './hooks/useSaveData';
import { useGame } from './hooks/useGame';

// Screen-state navigation. Run-flow screens (warmup/run/gameover/victory) are
// driven by the active run's phase; menu screens are navigated explicitly.
export type Screen =
  | 'title'
  | 'mainMenu'
  | 'settings'
  | 'kitchenCounter'
  | 'warmup'
  | 'run'
  | 'reward'
  | 'gameover'
  | 'victory'
  | 'practice';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const saveApi = useSaveData();
  const game = useGame(saveApi);

  const phase = game.run?.phase;
  // Guards finishRun against re-running while a terminal phase persists.
  const finalizedRef = useRef(false);

  // Route run-flow screens off the run phase. Depends only on the stable phase
  // string so it fires once per transition (not on every render).
  useEffect(() => {
    if (!phase) return;
    if (phase === 'rally') {
      setScreen('run');
    } else if (phase === 'rewardPending') {
      setScreen('reward');
    } else if (phase === 'runOver') {
      if (!finalizedRef.current) {
        finalizedRef.current = true;
        game.finalizeRun();
      }
      setScreen('gameover');
    } else if (phase === 'victory') {
      if (!finalizedRef.current) {
        finalizedRef.current = true;
        game.finalizeRun();
      }
      setScreen('victory');
    }
    // game is stable enough here; finalize is ref-guarded above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startRun = () => {
    finalizedRef.current = false;
    game.start();
    setScreen('warmup');
  };

  const quitToMenu = () => {
    game.clearRun();
    setScreen('mainMenu');
  };

  return (
    <div className="app-shell">
      {screen === 'title' && <TitleScreen onContinue={() => setScreen('mainMenu')} />}

      {screen === 'mainMenu' && (
        <MainMenu
          onNavigate={setScreen}
          onStartRun={startRun}
          onPractice={() => setScreen('practice')}
        />
      )}

      {screen === 'practice' && (
        <Suspense fallback={<div className="screen screen--center">Loading court…</div>}>
          <PracticeRallyScreen onBack={() => setScreen('mainMenu')} />
        </Suspense>
      )}

      {screen === 'settings' && (
        <SettingsScreen saveApi={saveApi} onBack={() => setScreen('mainMenu')} />
      )}

      {screen === 'kitchenCounter' && (
        <KitchenCounterScreen
          dinkBucks={saveApi.save.dinkBucks}
          onBack={() => setScreen('mainMenu')}
        />
      )}

      {screen === 'warmup' && (
        <WarmUpPickScreen choices={game.warmUpChoices} onPick={game.chooseWarmUp} />
      )}

      {screen === 'run' && game.run && (
        <RunScreen
          run={game.run}
          onPlay={game.play}
          onEndTurn={game.endPlayerTurn}
          onContinue={game.continueAfterRally}
          onQuit={quitToMenu}
        />
      )}

      {screen === 'reward' && game.reward && (
        <RewardScreen
          reward={game.reward}
          onAddCard={game.chooseRewardCard}
          onSkip={game.skipReward}
          onSpecial={game.chooseRewardSpecial}
          onPickMod={game.chooseRewardMod}
        />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          score={game.lastScore}
          onContinue={() => {
            game.clearRun();
            setScreen('kitchenCounter');
          }}
        />
      )}

      {screen === 'victory' && (
        <VictoryScreen
          score={game.lastScore}
          onContinue={() => {
            game.clearRun();
            setScreen('kitchenCounter');
          }}
        />
      )}
    </div>
  );
}
