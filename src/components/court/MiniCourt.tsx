interface MiniCourtProps {
  opponentIcon: string;
  /** Last card id played, used only for a tiny flavor caption for now. */
  lastCardId: string | null;
}

// Static mini pickleball court. Ball animation and character reactions by card
// type arrive in Phase 9 (juice); this is the placeholder diorama.
export default function MiniCourt({ opponentIcon, lastCardId }: MiniCourtProps) {
  return (
    <div className="mini-court" aria-hidden>
      <div className="mini-court__half mini-court__half--far">
        <span className="mini-court__actor">{opponentIcon}</span>
      </div>
      <div className="mini-court__net" />
      <div className="mini-court__kitchen" />
      <div className="mini-court__half mini-court__half--near">
        <span className="mini-court__actor">🥷</span>
      </div>
      <div className="mini-court__ball" data-shot={lastCardId ?? 'none'} />
    </div>
  );
}
