import Button from '../components/common/Button';
import type { useSaveData } from '../hooks/useSaveData';

interface SettingsScreenProps {
  saveApi: ReturnType<typeof useSaveData>;
  onBack: () => void;
}

// Settings now read/write the LocalStorage save: the sound toggle persists and
// "Reset save" restores defaults.
export default function SettingsScreen({ saveApi, onBack }: SettingsScreenProps) {
  const { save, updateSave, reset } = saveApi;
  const soundEnabled = save.settings.soundEnabled;

  const toggleSound = () => {
    updateSave({ settings: { ...save.settings, soundEnabled: !soundEnabled } });
  };

  const handleReset = () => {
    if (window.confirm('Reset all save data? This clears unlocks and Dink Bucks.')) {
      reset();
    }
  };

  return (
    <main className="screen settings-screen">
      <header className="screen__header">
        <h1>Settings</h1>
      </header>

      <section className="settings-screen__group">
        <div className="settings-row">
          <span>Sound effects</span>
          <Button variant="secondary" onClick={toggleSound} aria-pressed={soundEnabled}>
            {soundEnabled ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="settings-row">
          <span>Save data</span>
          <Button variant="ghost" onClick={handleReset}>
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
