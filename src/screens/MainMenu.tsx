import type { Screen } from '../App';
import Button from '../components/common/Button';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
  onStartRun: () => void;
}

export default function MainMenu({ onNavigate, onStartRun }: MainMenuProps) {
  return (
    <main className="screen screen--center main-menu">
      <h1 className="main-menu__title">Dink or Die</h1>
      <nav className="main-menu__nav">
        <Button onClick={onStartRun}>Start Run</Button>
        <Button variant="secondary" onClick={() => onNavigate('kitchenCounter')}>
          The Kitchen Counter
        </Button>
        <Button variant="secondary" onClick={() => onNavigate('settings')}>
          Settings
        </Button>
      </nav>
    </main>
  );
}
