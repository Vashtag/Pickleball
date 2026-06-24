import Button from '../components/common/Button';
import { formatDinkBucks } from '../utils/format';

interface KitchenCounterScreenProps {
  dinkBucks: number;
  onBack: () => void;
}

// Phase 0/1 placeholder for the post-run shop. The real rotating shop with card
// unlocks and rerolls arrives in a later phase; for now it shows the persisted
// Dink Bucks balance to confirm the save system works.
export default function KitchenCounterScreen({ dinkBucks, onBack }: KitchenCounterScreenProps) {
  return (
    <main className="screen kitchen-counter-screen">
      <header className="screen__header">
        <h1>The Kitchen Counter</h1>
        <p className="screen__subtitle">
          Dink Bucks: <strong>{formatDinkBucks(dinkBucks)}</strong>
        </p>
      </header>

      <section className="kitchen-counter-screen__placeholder">
        <p>Card unlocks and rerolls will live here. (Shop coming in a later phase.)</p>
      </section>

      <footer className="screen__footer">
        <Button onClick={onBack}>Back</Button>
      </footer>
    </main>
  );
}
