import { useState } from 'react';
import TitleScreen from './screens/TitleScreen';
import MainMenu from './screens/MainMenu';
import SettingsScreen from './screens/SettingsScreen';
import KitchenCounterScreen from './screens/KitchenCounterScreen';
import { useSaveData } from './hooks/useSaveData';

// Screen-state navigation for Phase 0/1. Later phases add Warm-Up Pick, Run,
// Reward, Game Over, and Victory screens to this union.
export type Screen =
  | 'title'
  | 'mainMenu'
  | 'settings'
  | 'kitchenCounter';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const saveApi = useSaveData();

  return (
    <div className="app-shell">
      {screen === 'title' && <TitleScreen onContinue={() => setScreen('mainMenu')} />}
      {screen === 'mainMenu' && <MainMenu onNavigate={setScreen} />}
      {screen === 'settings' && (
        <SettingsScreen saveApi={saveApi} onBack={() => setScreen('mainMenu')} />
      )}
      {screen === 'kitchenCounter' && (
        <KitchenCounterScreen
          dinkBucks={saveApi.save.dinkBucks}
          onBack={() => setScreen('mainMenu')}
        />
      )}
    </div>
  );
}
