import Button from '../components/common/Button';

interface TitleScreenProps {
  onContinue: () => void;
}

export default function TitleScreen({ onContinue }: TitleScreenProps) {
  return (
    <main className="screen screen--center title-screen">
      <div className="title-screen__logo">
        <h1 className="title-screen__name">Dink or Die</h1>
        <p className="title-screen__subtitle">A roguelite pickleball card battler</p>
      </div>
      <Button onClick={onContinue}>Press to Start</Button>
      <p className="title-screen__hint">MVP prototype · placeholder art</p>
    </main>
  );
}
