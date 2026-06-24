import type { RunState } from '../types/game';
import Button from '../components/common/Button';
import CardView from '../components/cards/CardView';
import OpponentPanel from '../components/hud/OpponentPanel';
import PlayerStats from '../components/hud/PlayerStats';
import StatusLog from '../components/hud/StatusLog';
import MiniCourt from '../components/court/MiniCourt';
import { getCard } from '../data/cards';
import { getCourt } from '../data/courts';
import { getOpponent } from '../data/opponents';
import { canPlayCard } from '../game/engine';
import '../styles/run.css';

interface RunScreenProps {
  run: RunState;
  onPlay: (instanceId: string) => void;
  onEndTurn: () => void;
  onContinue: () => void;
  onQuit: () => void;
}

export default function RunScreen({ run, onPlay, onEndTurn, onContinue, onQuit }: RunScreenProps) {
  const rally = run.rally;
  if (!rally) return null;

  const opponent = getOpponent(run.currentOpponentId);
  const court = getCourt(run.currentCourtId);
  const bark = opponent.barks[(rally.turn - 1) % opponent.barks.length];
  const ongoing = rally.outcome === 'ongoing';

  return (
    <div className="run-screen">
      <div className="run-screen__topbar">
        <span className="run-screen__title">Dink or Die</span>
        <Button variant="ghost" onClick={onQuit}>
          Quit run
        </Button>
      </div>

      <div className="run-screen__table">
        <div className="run-screen__opponent">
          <OpponentPanel opponent={opponent} court={court} rally={rally} bark={bark} />
        </div>

        <aside className="run-screen__stats">
          <PlayerStats run={run} rally={rally} />
        </aside>

        <div className="run-screen__court">
          <MiniCourt opponentIcon={opponent.portraitIcon} lastCardId={rally.lastCardId} />
        </div>

        <aside className="run-screen__log">
          <StatusLog entries={rally.log} />
        </aside>
      </div>

      <div className="run-screen__handbar">
        <div className="run-screen__piles">
          <span title="Draw pile">🂠 {rally.drawPile.length}</span>
          <span title="Discard pile">🗑️ {rally.discardPile.length}</span>
          <span title="Plays remaining this turn">▶ {rally.playsRemaining}</span>
        </div>

        <div className="hand">
          {rally.hand.map((inst) => (
            <CardView
              key={inst.instanceId}
              card={getCard(inst.cardId)}
              disabled={!ongoing || !canPlayCard(run, inst.instanceId)}
              onClick={() => onPlay(inst.instanceId)}
            />
          ))}
          {rally.hand.length === 0 && <p className="hand__empty">No cards in hand.</p>}
        </div>

        <div className="run-screen__actions">
          <Button onClick={onEndTurn} disabled={!ongoing}>
            End Turn
          </Button>
        </div>
      </div>

      {!ongoing && (
        <div className="run-overlay">
          <div className="run-overlay__panel">
            <h2 className={rally.outcome === 'won' ? 'run-overlay__win' : 'run-overlay__loss'}>
              {rally.outcome === 'won' ? 'Rally Won!' : 'Rally Lost'}
            </h2>
            <p>
              {rally.outcome === 'won'
                ? 'You reduced their Balance to 0.'
                : 'Pressure hit maximum — you lose 1 life.'}
            </p>
            <Button onClick={onContinue}>Continue</Button>
          </div>
        </div>
      )}
    </div>
  );
}
