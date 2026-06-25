import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { RallyGame, COURT } from '../game/rallyGame';
import { buildLoadout, getPerk, rollPerkChoices, type Loadout } from '../game/perks';
import Button from '../components/common/Button';
import '../styles/practice.css';

interface PracticeRallyScreenProps {
  onBack: () => void;
}

// Opponent ladder for a 3D run; difficulty = index.
const LADDER = [
  { name: 'The Beginner', boss: false },
  { name: 'The Banger', boss: false },
  { name: 'The Dink Goblin', boss: false },
  { name: 'The Lobfather', boss: false },
  { name: 'The Pickle King', boss: true },
];
const BASE_LIVES = 3;

type RunPhase = 'perk' | 'match' | 'won' | 'lost';

// ---- 3D scene ----
function Scene({ game }: { game: RallyGame }) {
  const ballRef = useRef<THREE.Mesh>(null);
  const oppRef = useRef<THREE.Mesh>(null);
  const aimRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame((_s, dt) => {
    game.update(dt);
    ballRef.current?.position.set(game.ball.p.x, game.ball.p.y, game.ball.p.z);
    oppRef.current?.position.set(game.opp.x, 0.8, game.opp.z);
    aimRef.current?.position.set(game.aimX, 0.06, COURT.oppBaseline + 1.5);
    camera.position.set(game.player.x, 2.1, game.player.z + 0.4);
    camera.lookAt(game.player.x * 0.25, 0.8, COURT.oppBaseline);
  });

  const onAim = (e: ThreeEvent<PointerEvent>) => {
    game.aimX = Math.max(-COURT.halfWidth, Math.min(COURT.halfWidth, e.point.x));
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 10, 2]} intensity={1.1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerMove={onAim}>
        <planeGeometry args={[COURT.halfWidth * 2 + 2, COURT.playerBaseline - COURT.oppBaseline + 2]} />
        <meshStandardMaterial color="#2c6e49" />
      </mesh>
      <Line points={[[-COURT.halfWidth, COURT.oppBaseline], [COURT.halfWidth, COURT.oppBaseline]]} />
      <Line points={[[-COURT.halfWidth, COURT.playerBaseline], [COURT.halfWidth, COURT.playerBaseline]]} />
      <Line points={[[-COURT.halfWidth, -COURT.kitchen], [COURT.halfWidth, -COURT.kitchen]]} />
      <Line points={[[-COURT.halfWidth, COURT.kitchen], [COURT.halfWidth, COURT.kitchen]]} />
      <Line points={[[-COURT.halfWidth, COURT.oppBaseline], [-COURT.halfWidth, COURT.playerBaseline]]} />
      <Line points={[[COURT.halfWidth, COURT.oppBaseline], [COURT.halfWidth, COURT.playerBaseline]]} />
      <mesh position={[0, COURT.netHeight / 2, 0]}>
        <boxGeometry args={[COURT.halfWidth * 2, COURT.netHeight, 0.06]} />
        <meshStandardMaterial color="#e8efe9" transparent opacity={0.6} />
      </mesh>
      <mesh ref={aimRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.5, 24]} />
        <meshBasicMaterial color="#e8ff5a" />
      </mesh>
      <mesh ref={oppRef}>
        <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
        <meshStandardMaterial color="#c84b4b" />
      </mesh>
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#e8ff5a" emissive="#7a8a20" />
      </mesh>
    </>
  );
}

function Line({ points }: { points: [[number, number], [number, number]] }) {
  const [[x1, z1], [x2, z2]] = points;
  const mx = (x1 + x2) / 2;
  const mz = (z1 + z2) / 2;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(z2 - z1, x2 - x1);
  return (
    <mesh position={[mx, 0.02, mz]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[len, 0.02, 0.08]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}

// ---- run controller ----
export default function PracticeRallyScreen({ onBack }: PracticeRallyScreenProps) {
  // Mutable run state in refs to avoid stale closures in the game callbacks.
  const phaseRef = useRef<RunPhase>('perk');
  const matchIndexRef = useRef(0);
  const livesRef = useRef(BASE_LIVES);
  const perkIdsRef = useRef<string[]>([]);
  const perkChoicesRef = useRef<string[]>(rollPerkChoices(3));
  const attemptRef = useRef(0);
  const gameRef = useRef<RallyGame | null>(null);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const startMatch = () => {
    const idx = matchIndexRef.current;
    const opp = LADDER[idx];
    const loadout: Loadout = buildLoadout(perkIdsRef.current);
    const game = new RallyGame({
      loadout,
      difficulty: idx,
      pointsToWin: opp.boss ? 5 : 4,
      opponentName: opp.name,
    });
    game.onHud = rerender;
    game.onMatchEnd = handleMatchEnd;
    gameRef.current = game;
    attemptRef.current += 1;
    phaseRef.current = 'match';
    rerender();
  };

  const handleMatchEnd = (winner: 'player' | 'opponent') => {
    if (winner === 'player') {
      matchIndexRef.current += 1;
      if (matchIndexRef.current >= LADDER.length) {
        phaseRef.current = 'won';
      } else {
        perkChoicesRef.current = rollPerkChoices(3);
        phaseRef.current = 'perk';
      }
    } else {
      livesRef.current -= 1;
      if (livesRef.current <= 0) {
        phaseRef.current = 'lost';
      } else {
        startMatch(); // retry same opponent
        return;
      }
    }
    rerender();
  };

  const choosePerk = (id: string) => {
    perkIdsRef.current = [...perkIdsRef.current, id];
    livesRef.current += getPerk(id).effect.extraLives ?? 0;
    startMatch();
  };

  const restartRun = () => {
    phaseRef.current = 'perk';
    matchIndexRef.current = 0;
    livesRef.current = BASE_LIVES;
    perkIdsRef.current = [];
    perkChoicesRef.current = rollPerkChoices(3);
    gameRef.current = null;
    rerender();
  };

  // Keyboard controls (active during a match).
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g || phaseRef.current !== 'match') return;
      if (e.key === 'a' || e.key === 'ArrowLeft') g.moveDir = -1;
      else if (e.key === 'd' || e.key === 'ArrowRight') g.moveDir = 1;
      else if (e.key === 'w' || e.key === 'ArrowUp') g.moveDirZ = -1;
      else if (e.key === 's' || e.key === 'ArrowDown') g.moveDirZ = 1;
      else if (e.key === ' ') { e.preventDefault(); g.swing(false); }
      else if (e.key === 'Shift') g.swing(true);
    };
    const up = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g) return;
      if ((e.key === 'a' || e.key === 'ArrowLeft') && g.moveDir < 0) g.moveDir = 0;
      if ((e.key === 'd' || e.key === 'ArrowRight') && g.moveDir > 0) g.moveDir = 0;
      if ((e.key === 'w' || e.key === 'ArrowUp') && g.moveDirZ < 0) g.moveDirZ = 0;
      if ((e.key === 's' || e.key === 'ArrowDown') && g.moveDirZ > 0) g.moveDirZ = 0;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const phase = phaseRef.current;
  const game = gameRef.current;
  const nextOpp = LADDER[Math.min(matchIndexRef.current, LADDER.length - 1)];

  // ---- perk draft ----
  if (phase === 'perk') {
    return (
      <main className="screen screen--center perk-screen">
        <header className="screen__header">
          <h1>Match {matchIndexRef.current + 1} — {nextOpp.name}{nextOpp.boss ? ' 👑' : ''}</h1>
          <p className="screen__subtitle">
            Pick a perk for the rest of your run · {'❤️'.repeat(livesRef.current)}
          </p>
        </header>
        <div className="perk-screen__choices">
          {perkChoicesRef.current.map((id) => {
            const perk = getPerk(id);
            return (
              <button key={id} className="perk-card" onClick={() => choosePerk(id)}>
                <span className="perk-card__icon">{perk.icon}</span>
                <span className="perk-card__name">{perk.name}</span>
                <span className="perk-card__desc">{perk.desc}</span>
              </button>
            );
          })}
        </div>
        {perkIdsRef.current.length > 0 && (
          <div className="perk-screen__owned">
            Perks: {perkIdsRef.current.map((id) => getPerk(id).icon).join(' ')}
          </div>
        )}
        <Button variant="ghost" onClick={onBack}>Quit to Menu</Button>
      </main>
    );
  }

  // ---- result ----
  if (phase === 'won' || phase === 'lost') {
    return (
      <main className={`screen screen--center result-screen ${phase === 'won' ? 'result-screen--win' : 'result-screen--loss'}`}>
        <h1 className="result-screen__title">{phase === 'won' ? 'Champion!' : 'Run Over'}</h1>
        <p className="result-screen__subtitle">
          {phase === 'won'
            ? 'You beat The Pickle King on the real court.'
            : `You reached ${LADDER[matchIndexRef.current].name}.`}
        </p>
        <div className="result-screen__buttons">
          <Button onClick={restartRun}>New Run</Button>
          <Button variant="secondary" onClick={onBack}>Menu</Button>
        </div>
      </main>
    );
  }

  // ---- live match ----
  return (
    <div
      className="practice"
      onPointerDown={(e) => {
        if (phaseRef.current !== 'match') return;
        if (e.button === 2) game?.swing(true);
        else if (e.button === 0) game?.swing(false);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas key={`${matchIndexRef.current}-${attemptRef.current}`} camera={{ fov: 60, position: [0, 2.1, COURT.playerBaseline + 0.4] }}>
        <color attach="background" args={['#0e1512']} />
        {game && <Scene game={game} />}
      </Canvas>

      <div className="practice__hud">
        <div className="practice__scoreboard">
          <span>You {game?.scoreYou ?? 0}</span>
          <span className="practice__vs">·</span>
          <span>{game?.scoreOpp ?? 0} {nextOpp.name}</span>
          <span className="practice__lives">{'❤️'.repeat(livesRef.current)}</span>
          <Button variant="ghost" onClick={onBack}>Quit</Button>
        </div>

        <div className="practice__message">{game?.message}</div>

        <div className="practice__bottom">
          <div className="practice__perks">
            {perkIdsRef.current.map((id) => (
              <span key={id} title={getPerk(id).name}>{getPerk(id).icon}</span>
            ))}
          </div>
          <p className="practice__hint">
            Move: W/A/S/D · Aim: mouse · Drive/Smash: left-click or Space · Dink: right-click or Shift · First to {game?.pointsToWin ?? 4}
          </p>
        </div>
      </div>
    </div>
  );
}
