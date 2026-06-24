import type { Card } from '../../types/cards';

interface CardViewProps {
  card: Card;
  disabled?: boolean;
  onClick?: () => void;
  /** Compact display for reward/preview contexts. */
  compact?: boolean;
}

// A single card face: name, icon, rarity, Stamina cost, and effect text.
export default function CardView({ card, disabled = false, onClick, compact = false }: CardViewProps) {
  return (
    <button
      type="button"
      className={`card card--${card.rarity} ${disabled ? 'card--disabled' : ''} ${compact ? 'card--compact' : ''}`.trim()}
      onClick={onClick}
      disabled={disabled || !onClick}
      title={card.tooltip}
    >
      <div className="card__top">
        <span className="card__name">{card.name}</span>
        {card.staminaCost > 0 && (
          <span className="card__cost" title="Stamina cost">
            ⚡{card.staminaCost}
          </span>
        )}
      </div>
      <div className="card__icon" aria-hidden>
        {card.icon}
      </div>
      <div className="card__rarity">{card.rarity}</div>
      <p className="card__effect">{card.effectText}</p>
    </button>
  );
}
