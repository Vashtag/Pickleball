import Button from '../components/common/Button';

interface KitchenCounterScreenProps {
  onBack: () => void;
}

// Phase 0 placeholder for the post-run shop. The real rotating shop with card
// unlocks, Dink Bucks, and rerolls arrives in a later phase.
export default function KitchenCounterScreen({ onBack }: KitchenCounterScreenProps) {
  return (
    <main className="screen kitchen-counter-screen">
      <header className="screen__header">
        <h1>The Kitchen Counter</h1>
        <p className="screen__subtitle">
          Spend your Dink Bucks here. (Shop coming in a later phase.)
        </p>
      </header>

      <section className="kitchen-counter-screen__placeholder">
        <p>Card unlocks, rerolls, and Dink Bucks will live here.</p>
      </section>

      <footer className="screen__footer">
        <Button onClick={onBack}>Back</Button>
      </footer>
    </main>
  );
}
