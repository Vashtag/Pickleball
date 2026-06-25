import type { Screen } from '../App';
import Button from '../components/common/Button';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
  onStartRun: () => void;
  onPractice: () => void;
}

export default function MainMenu({ onNavigate, onStartRun, onPractice }: MainMenuProps) {
  return (
    <main className="screen screen--center main-menu">
      <h1 className="main-menu__title">Dink or Die</h1>
      <nav className="main-menu__nav">
        <Button onClick={onPractice}>Play 3D Run ★ new</Button>
        <Button onClick={onStartRun}>Start Run (cards)</Button>
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
