// Real-time rally simulation for the 3D first-person mode. Framework-free:
// holds all mutable state, advances on update(dt), and exposes input methods.
//
// Cards drive shots: you draw a hand from a shot deck and PLAY a card to hit the
// ball (live, within a timing window). Playing a card triggers a brief slow-mo
// and a ghost-arc preview so you see the shot. Arcade ballistics.

import { BASE_LOADOUT, type Loadout } from './perks';
import { getShot, SHOT_DECK } from './shots';

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

// Tuning — slow-ish for reaction time.
const GRAVITY = -15;
const BASE_PLAYER_SPEED = 9;
const BASE_PLAYER_REACH = 2.6;
const BASE_HIT_WINDOW = 2.2;
const BASE_OPP_SPEED = 5.5;
const BASE_OPP_REACH = 2.3;
const BASE_OPP_FAULT = 0.16;
const BASE_SERVE_SPEED = 11;

const HAND_SIZE = 4;
const START_STAMINA = 5;
const SLOWMO_DURATION = 0.45;
const SLOWMO_SCALE = 0.3;

export interface RallyConfig {
  loadout: Loadout;
  difficulty: number;
  pointsToWin: number;
  opponentName: string;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class RallyGame {
  ball: { p: Vec3; v: Vec3 } = { p: { x: 0, y: 0.2, z: 0 }, v: { x: 0, y: 0, z: 0 } };
  player = { x: 0, z: COURT.playerBaseline };
  opp = { x: 0, z: COURT.oppBaseline };

  // input
  aimX = 0;
  moveDir = 0;
  moveDirZ = 0;

  // deck / hand
  drawPile: string[] = [];
  discardPile: string[] = [];
  hand: string[] = [];
  stamina = START_STAMINA;

  // rally state
  lastHitBy: Side | null = null;
  bounces = 0;
  ballActive = false;
  private prevZ = 0;
  private swingCooldown = 0;
  private resolving = false;

  // presentation
  timeScale = 1;
  private slowmoTimer = 0;
  predictedArc: Vec3[] = [];
  private arcTimer = 0;

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
    this.drawPile = shuffle(SHOT_DECK.slice());
    this.drawNewHand();
  }

  private hud(): void {
    this.onHud?.();
  }

  private get playerReach(): number {
    return BASE_PLAYER_REACH + this.loadout.reachBonus;
  }

  // ---- deck ----
  private drawOne(): void {
    if (this.drawPile.length === 0) {
      this.drawPile = shuffle(this.discardPile);
      this.discardPile = [];
    }
    const c = this.drawPile.pop();
    if (c) this.hand.push(c);
  }

  private drawNewHand(): void {
    this.discardPile.push(...this.hand);
    this.hand = [];
    while (this.hand.length < HAND_SIZE && this.drawPile.length + this.discardPile.length > 0) {
      this.drawOne();
    }
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
    this.message = 'Here it comes — play a shot!';
    this.hud();
  }

  private endPoint(winner: Side, reason: string): void {
    if (this.resolving) return;
    this.resolving = true;
    this.ballActive = false;
    this.timeScale = 1;
    this.predictedArc = [];
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

    // Fresh hand + stamina for the next point.
    this.drawNewHand();
    this.stamina = START_STAMINA;
    this.serving = true;
    this.serveTimer = 1.4;
    this.rallyCount = 0;
    this.hud();
  }

  // ---- input: play a card from hand to hit the ball ----
  playCard(index: number): void {
    if (!this.ballActive || this.swingCooldown > 0 || this.matchOver) return;
    if (this.lastHitBy === 'player') return; // can't hit your own shot
    if (index < 0 || index >= this.hand.length) return;

    const shot = getShot(this.hand[index]);
    if (this.stamina < shot.cost) {
      this.message = `Not enough Stamina for ${shot.name}.`;
      this.hud();
      return;
    }

    const b = this.ball.p;
    const window = BASE_HIT_WINDOW + this.loadout.hitWindowBonus;
    const inZone =
      b.z >= this.player.z - 5 &&
      b.z <= this.player.z + window &&
      b.y <= 3.8 &&
      Math.abs(b.x - this.player.x) <= this.playerReach;
    if (!inZone) {
      this.message = 'Mistimed — out of reach!';
      this.swingCooldown = 0.2;
      this.hud();
      return; // keep the card
    }

    // Resolve the shot.
    const high = b.y > 1.7;
    const mishit = shot.needsHigh === true && !high;
    let speed = shot.speed * this.loadout.speedMult;
    let arc = shot.arc;
    if (mishit) {
      speed *= 0.5;
      arc += 8;
    }
    const targetZ = shot.depth === 'short' ? -(COURT.kitchen + 1) : COURT.oppBaseline + 1;
    const v = aimVelocity(b, this.aimX, targetZ, speed, arc);

    this.ball.v = v;
    this.lastHitBy = 'player';
    this.bounces = 0;
    this.swingCooldown = 0.25;
    this.rallyCount++;

    // Spend, discard, draw.
    this.stamina -= shot.cost;
    this.discardPile.push(this.hand[index]);
    this.hand.splice(index, 1);
    this.drawOne();

    // Slow-mo + ghost arc so you see the shot leave.
    this.timeScale = SLOWMO_SCALE;
    this.slowmoTimer = SLOWMO_DURATION;
    this.predictedArc = predictArc(b, v);
    this.arcTimer = 0.7;

    this.message = mishit ? `Mishit ${shot.name}…` : shot.name;
    this.hud();
  }

  // ---- main update ----
  update(dtRaw: number): void {
    if (this.matchOver) return;
    const realDt = Math.min(0.05, dtRaw);
    this.swingCooldown = Math.max(0, this.swingCooldown - realDt);

    if (this.slowmoTimer > 0) {
      this.slowmoTimer -= realDt;
      if (this.slowmoTimer <= 0) this.timeScale = 1;
    }
    if (this.arcTimer > 0) {
      this.arcTimer -= realDt;
      if (this.arcTimer <= 0) this.predictedArc = [];
    }

    if (this.serving) {
      this.serveTimer -= realDt; // serve countdown runs at real speed
      if (this.serveTimer <= 0) {
        this.serving = false;
        this.serve();
      }
      return;
    }
    if (!this.ballActive) return;

    const dt = realDt * this.timeScale; // physics respects slow-mo

    // Player movement (always responsive — uses real dt).
    const moveSpeed = BASE_PLAYER_SPEED * this.loadout.moveSpeedMult;
    this.player.x = clamp(this.player.x + this.moveDir * moveSpeed * realDt, -COURT.halfWidth, COURT.halfWidth);
    this.player.z = clamp(this.player.z + this.moveDirZ * moveSpeed * realDt, COURT.kitchen + 0.5, COURT.playerBaseline);

    // Opponent AI.
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

    // Opponent return.
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

function aimVelocity(from: Vec3, targetX: number, targetZ: number, speed: number, arc: number): Vec3 {
  const dx = targetX - from.x;
  const dz = targetZ - from.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: (dx / len) * speed, y: arc, z: (dz / len) * speed };
}

// Sample a ballistic trajectory for the ghost-arc preview.
function predictArc(from: Vec3, v: Vec3): Vec3[] {
  const pts: Vec3[] = [];
  const p = { ...from };
  const vel = { ...v };
  const step = 0.05;
  for (let i = 0; i < 40; i++) {
    vel.y += GRAVITY * step;
    p.x += vel.x * step;
    p.y += vel.y * step;
    p.z += vel.z * step;
    if (p.y <= 0.05) break;
    pts.push({ x: p.x, y: p.y, z: p.z });
  }
  return pts;
}
