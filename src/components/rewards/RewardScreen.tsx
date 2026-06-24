import type { RewardSet } from '../../game/rewards';
import type { RewardOption } from '../../types/rewards';
import Button from '../common/Button';
import CardView from '../cards/CardView';
import { getCard } from '../../data/cards';
import { getPaddleMod } from '../../data/paddleMods';

interface RewardScreenProps {
  reward: RewardSet;
  onAddCard: (cardId: string) => void;
  onSkip: () => void;
  onSpecial: (option: RewardOption) => void;
  onPickMod: (modId: string) => void;
}

export default function RewardScreen({
  reward,
  onAddCard,
  onSkip,
  onSpecial,
  onPickMod,
}: RewardScreenProps) {
  if (reward.type === 'paddleMod') {
    return (
      <main className="screen reward-screen">
        <header className="screen__header">
          <h1>Paddle Mod</h1>
          <p className="screen__subtitle">Choose 1 — it lasts the rest of this run.</p>
        </header>

        <div className="reward-screen__mods">
          {reward.paddleModChoices.map((id) => {
            const mod = getPaddleMod(id);
            return (
              <button key={id} type="button" className="mod-card" onClick={() => onPickMod(id)}>
                <span className="mod-card__icon" aria-hidden>{mod.icon}</span>
                <span className="mod-card__name">{mod.name}</span>
                <span className="mod-card__desc">{mod.description}</span>
                <span className="mod-card__theme">{mod.theme}</span>
              </button>
            );
          })}
          {reward.paddleModChoices.length === 0 && (
            <p className="warmup-screen__empty">All Paddle Mods already owned!</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="screen reward-screen">
      <header className="screen__header">
        <h1>Reward</h1>
        <p className="screen__subtitle">Add one card to your deck, or skip for Dink Bucks.</p>
      </header>

      <div className="reward-screen__cards">
        {reward.cardChoices.map((id) => (
          <CardView key={id} card={getCard(id)} onClick={() => onAddCard(id)} />
        ))}
      </div>

      <footer className="reward-screen__actions">
        {reward.special && (
          <Button variant="secondary" onClick={() => onSpecial(reward.special!)}>
            {reward.special.label}
          </Button>
        )}
        <Button variant="ghost" onClick={onSkip}>
          Skip for +{reward.skipBucks} Dink Bucks
        </Button>
      </footer>
    </main>
  );
}
