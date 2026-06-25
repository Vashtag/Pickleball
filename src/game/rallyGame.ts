// Real-time rally simulation for the 3D first-person prototype. Framework-free:
// holds all mutable state, advances on update(dt), and exposes input methods.
// The R3F scene reads positions each frame; the HUD reads summary fields.
// Arcade ballistics (no physics engine). Constants are tuned by feel.

import { getShot, SHOT_DECK, type ShotParams } from './shots';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Side = 'player' | 'opponent';

// Court layout (units). Player stands near +Z, opponent near -Z, net at Z=0.
export const COURT = {
  halfWidth: 5,
  netZ: 0,
  netHeight: 0.85,
  playerBaseline: 8,
  oppBaseline: -8,
  kitchen: 2,
};

const GRAVITY = -18;
const PLAYER_SPEED = 9; // lateral move speed
const PLAYER_REACH = 2.4;
const OPP_SPEED = 7;
const OPP_REACH = 2.3;
const OPP_FAULT_CHANCE = 0.15;
const HAND_SIZE = 5;
const START_STAMINA = 5;

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

  // rally state
  lastHitBy: Side | null = null;
  bounces = 0;
  ballActive = false;
  private prevZ = 0;
  private swingCooldown = 0;
  private resolving = false;

  // deck
  drawPile: string[] = [];
  discardPile: string[] = [];
  hand: string[] = [];
  loadedIndex: number | null = null;
  stamina = START_STAMINA;

  // score / flow
  scoreYou = 0;
  scoreOpp = 0;
  message = 'Get ready…';
  rallyCount = 0; // shots exchanged this point
  serving = true;
  private serveTimer = 1.2;

  onHud?: () => void;

  constructor() {
    this.resetDeck();
    this.drawNewHand();
  }

  private hud(): void {
    this.onHud?.();
  }

  // ---- deck ----
  private resetDeck(): void {
    this.drawPile = shuffle(SHOT_DECK.slice());
    this.discardPile = [];
    this.hand = [];
  }

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
    this.loadedIndex = null;
  }

  loadCard(index: number): void {
    if (index < 0 || index >= this.hand.length) return;
    const shot = getShot(this.hand[index]);
    if (this.stamina < shot.cost) {
      this.message = `Not enough Stamina for ${shot.name}.`;
      this.hud();
      return;
    }
    this.loadedIndex = this.loadedIndex === index ? null : index;
    this.hud();
  }

  private currentShot(): { shot: ShotParams; index: number | null } {
    if (this.loadedIndex != null && this.loadedIndex < this.hand.length) {
      const shot = getShot(this.hand[this.loadedIndex]);
      if (this.stamina >= shot.cost) return { shot, index: this.loadedIndex };
    }
    return { shot: getShot('block'), index: null };
  }

  // ---- point flow ----
  private serve(): void {
    this.opp.x = rand(-4, 4);
    this.ball.p = { x: this.opp.x, y: 0.4, z: COURT.oppBaseline + 0.3 };
    const targetX = rand(-4, 4);
    this.ball.v = aimVelocity(this.ball.p, targetX, COURT.playerBaseline - 1, 16, 8.5);
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
    this.drawNewHand();
    this.stamina = START_STAMINA;
    this.serving = true;
    this.serveTimer = 1.4;
    this.rallyCount = 0;
    this.hud();
  }

  // ---- input: swing ----
  swing(): void {
    if (!this.ballActive || this.swingCooldown > 0) return;
    if (this.lastHitBy === 'player') return; // can't hit your own shot
    const b = this.ball.p;
    const inZone =
      b.z >= this.player.z - 4 &&
      b.z <= this.player.z + 1.5 &&
      b.y <= 3.8 &&
      Math.abs(b.x - this.player.x) <= PLAYER_REACH;
    if (!inZone) {
      this.message = 'Swing and a miss!';
      this.swingCooldown = 0.25;
      this.hud();
      return;
    }

    const { shot, index } = this.currentShot();
    // Smash off a low ball pops up weakly and risks a fault.
    const mishit = shot.needsHigh && b.y < 1.7;
    const speed = mishit ? shot.speed * 0.45 : shot.speed;
    const arc = mishit ? shot.arc + 9 : shot.arc;

    this.ball.v = aimVelocity(b, this.aimX, COURT.oppBaseline + 1, speed, arc);
    this.lastHitBy = 'player';
    this.bounces = 0;
    this.swingCooldown = 0.3;

    if (index != null) {
      this.stamina -= shot.cost;
      this.discardPile.push(this.hand[index]);
      this.hand.splice(index, 1);
      this.drawOne();
      this.loadedIndex = null;
    }
    this.rallyCount++;
    this.message = mishit ? `Mishit ${shot.name}…` : `${shot.name}!`;
    this.hud();
  }

  // ---- main update ----
  update(dtRaw: number): void {
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

    // Player movement.
    this.player.x = clamp(this.player.x + this.moveDir * PLAYER_SPEED * dt, -COURT.halfWidth, COURT.halfWidth);

    // Opponent AI: track the ball when it's on their side and heading to them.
    if (this.lastHitBy === 'player') {
      const dir = Math.sign(this.ball.p.x - this.opp.x);
      this.opp.x = clamp(this.opp.x + dir * OPP_SPEED * dt, -COURT.halfWidth, COURT.halfWidth);
    }

    // Integrate ball.
    const b = this.ball;
    b.v.y += GRAVITY * dt;
    b.p.x += b.v.x * dt;
    b.p.y += b.v.y * dt;
    b.p.z += b.v.z * dt;

    // Net crossing.
    if ((this.prevZ - COURT.netZ) * (b.p.z - COURT.netZ) < 0) {
      if (b.p.y < COURT.netHeight) {
        this.endPoint(this.lastHitBy === 'player' ? 'opponent' : 'player', 'into the net');
        return;
      }
    }
    this.prevZ = b.p.z;

    // Ground contact.
    if (b.p.y <= 0.12 && b.v.y < 0) {
      b.p.y = 0.12;
      this.bounces++;
      // Out of bounds on first landing.
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
      // Second bounce: the side it's on failed to return it.
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
      const reach = Math.abs(this.opp.x - b.p.x) <= OPP_REACH && b.p.y <= 3.8;
      if (reach && Math.random() > OPP_FAULT_CHANCE) {
        // Opponent returns toward the open part of the player's court.
        const targetX = this.player.x > 0 ? rand(-4, -1) : rand(1, 4);
        this.ball.v = aimVelocity(b.p, targetX, COURT.playerBaseline - 1, rand(15, 19), rand(7, 9.5));
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

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Velocity to launch from `from` toward (targetX, targetZ) on the ground, with
// the given horizontal speed and upward arc.
function aimVelocity(from: Vec3, targetX: number, targetZ: number, speed: number, arc: number): Vec3 {
  const dx = targetX - from.x;
  const dz = targetZ - from.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: (dx / len) * speed, y: arc, z: (dz / len) * speed };
}
