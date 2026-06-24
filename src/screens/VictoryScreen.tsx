import type { RunScore } from '../game/scoring';
import Button from '../components/common/Button';

interface VictoryScreenProps {
  score: RunScore | null;
  onContinue: () => void;
}

export default function VictoryScreen({ score, onContinue }: VictoryScreenProps) {
  return (
    <main className="screen screen--center result-screen result-screen--win">
      <h1 className="result-screen__title">Victory!</h1>
      <p className="result-screen__subtitle">You dethroned The Pickle King. The kitchen is free.</p>

      {score && (
        <ul className="result-screen__stats">
          <li><span>Rank</span><strong>{score.rank}</strong></li>
          <li><span>Score</span><strong>{score.score}</strong></li>
          <li><span>Rallies won</span><strong>{score.ralliesWon}</strong></li>
          <li><span>Opponents defeated</span><strong>{score.opponentsDefeated}</strong></li>
          <li><span>Dink Bucks earned</span><strong>{score.dinkBucksEarned}</strong></li>
        </ul>
      )}

      <Button onClick={onContinue}>To The Kitchen Counter</Button>
    </main>
  );
}
