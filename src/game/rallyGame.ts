// Real-time rally simulation for the 3D first-person mode. Framework-free:
// holds all mutable state, advances on update(dt), and exposes input methods.
// No in-rally cards — shot type is contextual (normal / soft / auto-smash on a
// high ball) and tuned by the run's perk Loadout. Arcade ballistics.

import { BASE_LOADOUT, type Loadout } from './perks';
import { getShot } from './shots';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Side = 'player' | 'opponent';

// Court layout (units). Player near +Z, opponent near -Z, net at Z=0.
export const COURT = {
  halfWidth: 5,
  netZ: 0,
  netHeight: 0.85,
  playerBaseline: 8,
  oppBaseline: -8,
  kitchen: 2,
};

// Tuning — slower than the first pass for reaction time.
const GRAVITY = -15;
const BASE_PLAYER_SPEED = 9;
const BASE_PLAYER_REACH = 2.6;
const BASE_HIT_WINDOW = 2.2; // depth tolerance in front of the player
const BASE_OPP_SPEED = 5.5;
const BASE_OPP_REACH = 2.3;
const BASE_OPP_FAULT = 0.16;
const BASE_SERVE_SPEED = 11;

export interface RallyConfig {
  loadout: Loadout;
  /** 0-based difficulty; rises each match. */
  difficulty: number;
  pointsToWin: number;
  opponentName: string;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class RallyGame {
  ball: { p: Vec3; v: Vec3 } = { p: { x: 0, y: 0.2, z: 0 }, v: { x: 0, y: 0, z: 0 } };
  player = { x: 0, z: COURT.playerBaseline };
  opp = { x: 0, z: COURT.oppBaseline };

  // input
  aimX = 0;
  moveDir = 0; // -1 (left) .. 1 (right)
  moveDirZ = 0; // -1 (toward net) .. 1 (back)
  currentShotId = 'drive'; // selected shot in the palette

  // rally state
  lastHitBy: Side | null = null;
  bounces = 0;
  ballActive = false;
  private prevZ = 0;
  private swingCooldown = 0;
  private resolving = false;

  // config / tuning
  private loadout: Loadout;
  private difficulty: number;
  pointsToWin: number;
  opponentName: string;
  private oppSpeed: number;
  private oppReach: number;
  private oppFault: number;
  private serveSpeed: number;

  // score / flow
  scoreYou = 0;
  scoreOpp = 0;
  message = 'Get ready…';
  rallyCount = 0;
  serving = true;
  private serveTimer = 1.2;
  matchOver = false;

  onHud?: () => void;
  onMatchEnd?: (winner: Side) => void;

  constructor(config?: Partial<RallyConfig>) {
    this.loadout = config?.loadout ?? { ...BASE_LOADOUT };
    this.difficulty = config?.difficulty ?? 0;
    this.pointsToWin = config?.pointsToWin ?? 4;
    this.opponentName = config?.opponentName ?? 'Rival';
    this.oppSpeed = BASE_OPP_SPEED + this.difficulty * 0.5;
    this.oppReach = BASE_OPP_REACH + this.difficulty * 0.06;
    this.oppFault = Math.max(0.04, BASE_OPP_FAULT - this.difficulty * 0.025 - this.loadout.oppFaultBonus);
    this.serveSpeed = BASE_SERVE_SPEED + this.difficulty * 0.5;
  }

  private hud(): void {
    this.onHud?.();
  }

  private get playerReach(): number {
    return BASE_PLAYER_REACH + this.loadout.reachBonus;
  }

  // ---- point flow ----
  private serve(): void {
    this.opp.x = rand(-4, 4);
    this.ball.p = { x: this.opp.x, y: 0.4, z: COURT.oppBaseline + 0.3 };
    const targetX = rand(-4, 4);
    this.ball.v = aimVelocity(this.ball.p, targetX, COURT.playerBaseline - 1, this.serveSpeed, 8.5);
    this.lastHitBy = 'opponent';
    this.bounces = 0;
    this.prevZ = this.ball.p.z;
    this.ballActive = true;
    this.resolving = false;
    this.message = 'Here it comes — return it!';
    this.hud();
  }

  private endPoint(winner: Side, reason: string): void {
    if (this.resolving) return;
    this.resolving = true;
    this.ballActive = false;
    if (winner === 'player') this.scoreYou++;
    else this.scoreOpp++;
    this.message = `${winner === 'player' ? 'Your point!' : 'Point lost'} — ${reason}`;

    if (this.scoreYou >= this.pointsToWin || this.scoreOpp >= this.pointsToWin) {
      this.matchOver = true;
      const matchWinner: Side = this.scoreYou >= this.pointsToWin ? 'player' : 'opponent';
      this.hud();
      this.onMatchEnd?.(matchWinner);
      return;
    }

    this.serving = true;
    this.serveTimer = 1.4;
    this.rallyCount = 0;
    this.hud();
  }

  // Select which shot the next swing will play.
  setShot(id: string): void {
    this.currentShotId = id;
    this.hud();
  }

  // ---- input: swing ----
  // Executes the currently selected shot toward the aim point.
  swing(): void {
    if (!this.ballActive || this.swingCooldown > 0 || this.matchOver) return;
    if (this.lastHitBy === 'player') return; // can't hit your own shot
    const b = this.ball.p;
    const window = BASE_HIT_WINDOW + this.loadout.hitWindowBonus;
    const inZone =
      b.z >= this.player.z - 5 &&
      b.z <= this.player.z + window &&
      b.y <= 3.8 &&
      Math.abs(b.x - this.player.x) <= this.playerReach;
    if (!inZone) {
      this.message = 'Swing and a miss!';
      this.swingCooldown = 0.22;
      this.hud();
      return;
    }

    const shot = getShot(this.currentShotId);
    const high = b.y > 1.7;
    const mishit = shot.needsHigh === true && !high;
    let speed = shot.speed * this.loadout.speedMult;
    let arc = shot.arc;
    if (mishit) {
      speed *= 0.5; // smash off a low ball pops up weakly
      arc += 8;
    }
    const targetZ = shot.depth === 'short' ? -(COURT.kitchen + 1) : COURT.oppBaseline + 1;

    this.ball.v = aimVelocity(b, this.aimX, targetZ, speed, arc);
    this.lastHitBy = 'player';
    this.bounces = 0;
    this.swingCooldown = 0.25;
    this.rallyCount++;
    this.message = mishit ? `Mishit ${shot.name}…` : shot.name;
    this.hud();
  }

  // ---- main update ----
  update(dtRaw: number): void {
    if (this.matchOver) return;
    const dt = Math.min(0.05, dtRaw);
    this.swingCooldown = Math.max(0, this.swingCooldown - dt);

    if (this.serving) {
      this.serveTimer -= dt;
      if (this.serveTimer <= 0) {
        this.serving = false;
        this.serve();
      }
      return;
    }
    if (!this.ballActive) return;

    // Player movement (lateral + up/down court).
    const moveSpeed = BASE_PLAYER_SPEED * this.loadout.moveSpeedMult;
    this.player.x = clamp(this.player.x + this.moveDir * moveSpeed * dt, -COURT.halfWidth, COURT.halfWidth);
    this.player.z = clamp(
      this.player.z + this.moveDirZ * moveSpeed * dt,
      COURT.kitchen + 0.5,
      COURT.playerBaseline,
    );

    // Opponent AI: track the ball when it's heading to them.
    if (this.lastHitBy === 'player') {
      const dir = Math.sign(this.ball.p.x - this.opp.x);
      this.opp.x = clamp(this.opp.x + dir * this.oppSpeed * dt, -COURT.halfWidth, COURT.halfWidth);
    }

    // Integrate ball.
    const b = this.ball;
    b.v.y += GRAVITY * dt;
    b.p.x += b.v.x * dt;
    b.p.y += b.v.y * dt;
    b.p.z += b.v.z * dt;

    // Net crossing.
    if ((this.prevZ - COURT.netZ) * (b.p.z - COURT.netZ) < 0 && b.p.y < COURT.netHeight) {
      this.endPoint(this.lastHitBy === 'player' ? 'opponent' : 'player', 'into the net');
      return;
    }
    this.prevZ = b.p.z;

    // Ground contact.
    if (b.p.y <= 0.12 && b.v.y < 0) {
      b.p.y = 0.12;
      this.bounces++;
      if (this.bounces === 1) {
        const out =
          Math.abs(b.p.x) > COURT.halfWidth + 0.1 ||
          b.p.z > COURT.playerBaseline + 0.3 ||
          b.p.z < COURT.oppBaseline - 0.3;
        if (out) {
          this.endPoint(this.lastHitBy === 'player' ? 'opponent' : 'player', 'out of bounds');
          return;
        }
      }
      if (this.bounces >= 2) {
        const onPlayerSide = b.p.z > COURT.netZ;
        this.endPoint(onPlayerSide ? 'opponent' : 'player', 'double bounce');
        return;
      }
      b.v.y = -b.v.y * 0.55;
      b.v.x *= 0.85;
      b.v.z *= 0.85;
    }

    // Opponent return when the ball reaches their baseline.
    if (this.lastHitBy === 'player' && b.p.z <= this.opp.z + 0.8 && b.v.z < 0) {
      const reach = Math.abs(this.opp.x - b.p.x) <= this.oppReach && b.p.y <= 3.8;
      if (reach && Math.random() > this.oppFault) {
        const targetX = this.player.x > 0 ? rand(-4, -1) : rand(1, 4);
        this.ball.v = aimVelocity(b.p, targetX, COURT.playerBaseline - 1, rand(10, 13) + this.difficulty * 0.5, rand(7, 9));
        this.lastHitBy = 'opponent';
        this.bounces = 0;
        this.rallyCount++;
        this.message = 'Returned!';
        this.hud();
      } else if (b.p.z <= this.opp.z - 0.6) {
        this.endPoint('player', reach ? 'they shanked it' : 'winner past them');
        return;
      }
    }

    // Player missed: the ball got behind the baseline.
    if (this.lastHitBy === 'opponent' && b.p.z > this.player.z + 1.2) {
      this.endPoint('opponent', 'it got past you');
    }
  }
}

// ---- helpers ----

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// Velocity to launch from `from` toward (targetX, targetZ) with the given
// horizontal speed and upward arc.
function aimVelocity(from: Vec3, targetX: number, targetZ: number, speed: number, arc: number): Vec3 {
  const dx = targetX - from.x;
  const dz = targetZ - from.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: (dx / len) * speed, y: arc, z: (dz / len) * speed };
}
