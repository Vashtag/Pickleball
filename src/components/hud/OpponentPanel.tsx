import type { Opponent } from '../../types/opponents';
import type { Court } from '../../types/game';
import type { RallyState } from '../../types/game';
import Meter from '../common/Meter';

interface OpponentPanelProps {
  opponent: Opponent;
  court: Court;
  rally: RallyState;
  bark: string;
}

// Top panel: opponent identity, court, Balance, and telegraphed intent.
export default function OpponentPanel({ opponent, court, rally, bark }: OpponentPanelProps) {
  const intentText = rally.intent
    ? rally.intentHidden
      ? 'Intent unclear…'
      : rally.intent.description
    : '—';

  return (
    <section className="opponent-panel">
      <div className="opponent-panel__id">
        <span className="opponent-panel__portrait" aria-hidden>
          {opponent.portraitIcon}
        </span>
        <div>
          <h2 className="opponent-panel__name">
            {opponent.name} <span className={`tier tier--${opponent.tier}`}>{opponent.tier}</span>
          </h2>
          <p className="opponent-panel__bark">“{bark}”</p>
        </div>
        <div className="opponent-panel__court" title={court.modifierText}>
          🏟️ {court.name}
        </div>
      </div>

      <Meter
        label="Balance"
        value={rally.opponentBalance}
        max={rally.opponentMaxBalance}
        color="var(--color-accent)"
      />

      <div className="opponent-panel__intent">
        <span className="opponent-panel__intent-label">Next intent</span>
        <span className="opponent-panel__intent-text">{intentText}</span>
      </div>
    </section>
  );
}
