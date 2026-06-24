import Button from '../components/common/Button';
import CardView from '../components/cards/CardView';
import { getCard } from '../data/cards';

interface WarmUpPickScreenProps {
  choices: string[];
  onPick: (cardId: string | null) => void;
}

// Pre-run screen: pick 1 of up to 3 unlocked bonus cards (design doc §13).
export default function WarmUpPickScreen({ choices, onPick }: WarmUpPickScreenProps) {
  return (
    <main className="screen warmup-screen">
      <header className="screen__header">
        <h1>Warm-Up Pick</h1>
        <p className="screen__subtitle">Add one bonus card to your deck for this run.</p>
      </header>

      {choices.length > 0 ? (
        <div className="warmup-screen__choices">
          {choices.map((id) => (
            <CardView key={id} card={getCard(id)} onClick={() => onPick(id)} />
          ))}
        </div>
      ) : (
        <p className="warmup-screen__empty">
          No bonus cards unlocked yet — unlock cards at The Kitchen Counter to see
          choices here. You'll play this run with the standard starter deck.
        </p>
      )}

      <footer className="screen__footer">
        <Button variant="ghost" onClick={() => onPick(null)}>
          {choices.length > 0 ? 'Skip (no bonus card)' : 'Start Run'}
        </Button>
      </footer>
    </main>
  );
}
