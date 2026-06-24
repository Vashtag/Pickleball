import type { Screen } from '../App';
import Button from '../components/common/Button';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
}

export default function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <main className="screen screen--center main-menu">
      <h1 className="main-menu__title">Dink or Die</h1>
      <nav className="main-menu__nav">
        {/* Start Run leads to Warm-Up Pick / Run Screen in a later phase. */}
        <Button onClick={() => alert('Start Run — coming in a later phase.')}>
          Start Run
        </Button>
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
