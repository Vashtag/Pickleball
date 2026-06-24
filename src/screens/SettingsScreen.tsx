import { useState } from 'react';
import Button from '../components/common/Button';

interface SettingsScreenProps {
  onBack: () => void;
}

// Phase 0 placeholder. Real wiring (LocalStorage-backed sound setting and a true
// save reset) arrives with the save system in Phase 1.
export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <main className="screen settings-screen">
      <header className="screen__header">
        <h1>Settings</h1>
      </header>

      <section className="settings-screen__group">
        <div className="settings-row">
          <span>Sound effects</span>
          <Button
            variant="secondary"
            onClick={() => setSoundEnabled((on) => !on)}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="settings-row">
          <span>Save data</span>
          {/* TODO(phase 1): clear LocalStorage save and reset to defaults. */}
          <Button
            variant="ghost"
            onClick={() => alert('Reset save — wired up in Phase 1.')}
          >
            Reset save
          </Button>
        </div>
      </section>

      <footer className="screen__footer">
        <Button onClick={onBack}>Back</Button>
      </footer>
    </main>
  );
}
