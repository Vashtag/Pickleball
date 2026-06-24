import { useState } from 'react';
import TitleScreen from './screens/TitleScreen';
import MainMenu from './screens/MainMenu';
import SettingsScreen from './screens/SettingsScreen';
import KitchenCounterScreen from './screens/KitchenCounterScreen';

// Screen-state navigation for Phase 0. Later phases add Warm-Up Pick, Run,
// Reward, Game Over, and Victory screens to this union.
export type Screen =
  | 'title'
  | 'mainMenu'
  | 'settings'
  | 'kitchenCounter';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');

  return (
    <div className="app-shell">
      {screen === 'title' && <TitleScreen onContinue={() => setScreen('mainMenu')} />}
      {screen === 'mainMenu' && <MainMenu onNavigate={setScreen} />}
      {screen === 'settings' && <SettingsScreen onBack={() => setScreen('mainMenu')} />}
      {screen === 'kitchenCounter' && (
        <KitchenCounterScreen onBack={() => setScreen('mainMenu')} />
      )}
    </div>
  );
}
