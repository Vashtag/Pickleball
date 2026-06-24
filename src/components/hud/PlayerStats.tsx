import type { RallyState, RunState } from '../../types/game';
import Meter from '../common/Meter';
import { getPaddleMod } from '../../data/paddleMods';

interface PlayerStatsProps {
  run: RunState;
  rally: RallyState;
}

// Side panel: lives, Pressure, Stamina, run progress, and active statuses.
export default function PlayerStats({ run, rally }: PlayerStatsProps) {
  const exhausted = (rally.playerStatuses.exhausted ?? 0) > 0;
  const protectedTurns = rally.playerStatuses.protected ?? 0;

  return (
    <section className="player-stats">
      <div className="player-stats__lives" title="Lives">
        {'❤️'.repeat(Math.max(0, run.lives)) || '—'}
      </div>

      <Meter
        label="Pressure"
        value={rally.pressure}
        max={rally.pressureMax}
        color={rally.pressure >= rally.pressureMax - 2 ? 'var(--color-danger)' : 'var(--color-gold)'}
      />

      <div className="player-stats__row">
        <span>Stamina</span>
        <strong>
          {'⚡'.repeat(rally.stamina) || '0'}
        </strong>
      </div>

      <div className="player-stats__row">
        <span>Rallies won</span>
        <strong>{run.ralliesWon}</strong>
      </div>
      <div className="player-stats__row">
        <span>Matchup</span>
        <strong>
          {run.matchupRalliesWon} / {run.matchupRalliesRequired}
        </strong>
      </div>

      {(exhausted || protectedTurns > 0) && (
        <div className="player-stats__statuses">
          {exhausted && <span className="status status--exhausted">Exhausted</span>}
          {protectedTurns > 0 && <span className="status status--protected">Protected</span>}
        </div>
      )}

      {run.paddleMods.length > 0 && (
        <div className="player-stats__mods" title="Active Paddle Mods">
          {run.paddleMods.map((id) => {
            const mod = getPaddleMod(id);
            return (
              <span key={id} className="player-stats__mod" title={`${mod.name}: ${mod.description}`}>
                {mod.icon}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
