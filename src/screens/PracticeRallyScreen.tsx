import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { RallyGame, COURT } from '../game/rallyGame';
import { getShot } from '../game/shots';
import Button from '../components/common/Button';
import '../styles/practice.css';

interface PracticeRallyScreenProps {
  onBack: () => void;
}

// Renders the court + ball + opponent and drives the sim each frame.
function Scene({ game }: { game: RallyGame }) {
  const ballRef = useRef<THREE.Mesh>(null);
  const oppRef = useRef<THREE.Mesh>(null);
  const aimRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame((_state, dt) => {
    game.update(dt);

    if (ballRef.current) {
      ballRef.current.position.set(game.ball.p.x, game.ball.p.y, game.ball.p.z);
    }
    if (oppRef.current) {
      oppRef.current.position.set(game.opp.x, 0.8, game.opp.z);
    }
    if (aimRef.current) {
      aimRef.current.position.set(game.aimX, 0.06, COURT.oppBaseline + 1.5);
    }
    // First-person camera at the player, looking down-court.
    camera.position.set(game.player.x, 2.1, game.player.z + 0.4);
    camera.lookAt(game.player.x * 0.25, 0.8, COURT.oppBaseline);
  });

  const onAim = (e: ThreeEvent<PointerEvent>) => {
    game.aimX = Math.max(-COURT.halfWidth, Math.min(COURT.halfWidth, e.point.x));
  };
  const onSwing = () => game.swing();

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 10, 2]} intensity={1.1} />

      {/* Court surface (also captures aim + swing input). */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={onAim}
        onClick={onSwing}
      >
        <planeGeometry args={[COURT.halfWidth * 2 + 2, COURT.playerBaseline - COURT.oppBaseline + 2]} />
        <meshStandardMaterial color="#2c6e49" />
      </mesh>

      {/* Boundary + kitchen lines. */}
      <Line points={[[-COURT.halfWidth, COURT.oppBaseline], [COURT.halfWidth, COURT.oppBaseline]]} />
      <Line points={[[-COURT.halfWidth, COURT.playerBaseline], [COURT.halfWidth, COURT.playerBaseline]]} />
      <Line points={[[-COURT.halfWidth, -COURT.kitchen], [COURT.halfWidth, -COURT.kitchen]]} />
      <Line points={[[-COURT.halfWidth, COURT.kitchen], [COURT.halfWidth, COURT.kitchen]]} />
      <Line points={[[-COURT.halfWidth, COURT.oppBaseline], [-COURT.halfWidth, COURT.playerBaseline]]} />
      <Line points={[[COURT.halfWidth, COURT.oppBaseline], [COURT.halfWidth, COURT.playerBaseline]]} />

      {/* Net. */}
      <mesh position={[0, COURT.netHeight / 2, 0]}>
        <boxGeometry args={[COURT.halfWidth * 2, COURT.netHeight, 0.06]} />
        <meshStandardMaterial color="#e8efe9" transparent opacity={0.6} />
      </mesh>

      {/* Aim marker. */}
      <mesh ref={aimRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.5, 24]} />
        <meshBasicMaterial color="#e8ff5a" />
      </mesh>

      {/* Opponent. */}
      <mesh ref={oppRef}>
        <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
        <meshStandardMaterial color="#c84b4b" />
      </mesh>

      {/* Ball. */}
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#e8ff5a" emissive="#7a8a20" />
      </mesh>
    </>
  );
}

// A flat court line drawn as a thin box between two XZ points.
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

export default function PracticeRallyScreen({ onBack }: PracticeRallyScreenProps) {
  const game = useMemo(() => new RallyGame(), []);
  const [, force] = useState(0);

  useEffect(() => {
    game.onHud = () => force((n) => n + 1);

    const down = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') game.moveDir = -1;
      else if (e.key === 'd' || e.key === 'ArrowRight') game.moveDir = 1;
      else if (e.key === ' ') {
        e.preventDefault();
        game.swing();
      } else if (e.key >= '1' && e.key <= '5') {
        game.loadCard(Number(e.key) - 1);
      }
    };
    const up = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'ArrowLeft') && game.moveDir < 0) game.moveDir = 0;
      if ((e.key === 'd' || e.key === 'ArrowRight') && game.moveDir > 0) game.moveDir = 0;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [game]);

  return (
    <div className="practice">
      <Canvas camera={{ fov: 60, position: [0, 2.1, COURT.playerBaseline + 0.4] }} shadows>
        <color attach="background" args={['#0e1512']} />
        <Scene game={game} />
      </Canvas>

      <div className="practice__hud">
        <div className="practice__scoreboard">
          <span>You {game.scoreYou}</span>
          <span className="practice__vs">·</span>
          <span>{game.scoreOpp} Opp</span>
          <Button variant="ghost" onClick={onBack}>Back</Button>
        </div>

        <div className="practice__message">{game.message}</div>

        <div className="practice__bottom">
          <div className="practice__stamina">Stamina: {'⚡'.repeat(game.stamina) || '0'}</div>
          <div className="practice__hand">
            {game.hand.map((id, i) => {
              const shot = getShot(id);
              const loaded = game.loadedIndex === i;
              const afford = game.stamina >= shot.cost;
              return (
                <button
                  key={i}
                  className={`shot-card ${loaded ? 'shot-card--loaded' : ''} ${afford ? '' : 'shot-card--poor'}`}
                  onClick={() => game.loadCard(i)}
                  title={shot.note}
                >
                  <span className="shot-card__key">{i + 1}</span>
                  <span className="shot-card__icon">{shot.icon}</span>
                  <span className="shot-card__name">{shot.name}</span>
                  {shot.cost > 0 && <span className="shot-card__cost">⚡{shot.cost}</span>}
                </button>
              );
            })}
          </div>
          <p className="practice__hint">
            Move: A/D · Aim: mouse · Swing: click or Space · Load shot: click card or 1–5
          </p>
        </div>
      </div>
    </div>
  );
}
