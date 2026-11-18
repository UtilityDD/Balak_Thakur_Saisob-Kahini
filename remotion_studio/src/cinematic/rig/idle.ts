import { clamp, hash, noise1 } from "../core/anim";
import { MOUTH_REST, MouthState, visemeChatter } from "./lipsync";
import { Pose } from "./Puppet";

/**
 * "Idle life" for background characters so nobody stands frozen:
 *  - breathing sway, slow weight shifts and small posture changes
 *  - glances: toward a companion (`partner` = −1 left / +1 right), toward the action, or around
 *  - beats every few seconds, each with its own timing: chatting with a hand gesture,
 *    a laugh (head back, hand to mouth), a nod, or simply watching
 * Everything is seeded so each person moves on their own rhythm.
 */
export interface IdleOpts {
  partner?: 1 | -1; // which side their companion stands
  watch?: number; // headTurn toward the main action
  chatty?: number; // 0..1 how often they talk / gesture
  base?: Partial<Pose>;
}

type Beat = "watch" | "chat" | "laugh" | "nod" | "glance";

const BEAT_LEN = 84;

const beatAt = (f: number, seed: number, chatty: number): { kind: Beat; p: number; k: number } => {
  const off = Math.floor(hash(seed) * BEAT_LEN);
  const k = Math.floor((f + off) / BEAT_LEN);
  const p = ((f + off) % BEAT_LEN) / BEAT_LEN;
  const r = hash(k * 7.13 + seed * 3.1);
  const kind: Beat = r < 0.35 * chatty ? "chat" : r < 0.5 * chatty + 0.08 ? "laugh" : r < 0.62 ? "nod" : r < 0.78 ? "glance" : "watch";
  return { kind, p, k };
};

/** smooth in/out envelope over a beat (holds in the middle) */
const env = (p: number) => clamp(Math.min(p / 0.18, (1 - p) / 0.18));

export function idleLife(seed: number, opts: IdleOpts = {}) {
  const partner = opts.partner ?? 1;
  const watch = opts.watch ?? 0;
  const chatty = opts.chatty ?? 0.6;
  const base = opts.base ?? {};

  const acting = (f: number): Partial<Pose> => {
    const { kind, p, k } = beatAt(f, seed, chatty);
    const e = env(p);
    const sway = noise1(f * 0.012, seed) * 5;
    const pose: Partial<Pose> = {
      smile: 0.45,
      ...base,
      bodyX: (base.bodyX ?? 0) + sway,
      lean: (base.lean ?? 0) + noise1(f * 0.01, seed + 3) * 2.2,
      headTurn: (base.headTurn ?? watch) + noise1(f * 0.015, seed + 5) * 0.12,
      headNod: noise1(f * 0.02, seed + 7) * 1.5,
      headTilt: noise1(f * 0.013, seed + 9) * 3,
    };
    const toPartner = partner * 0.55;
    if (kind === "chat") {
      pose.headTurn = (pose.headTurn ?? 0) * (1 - e) + toPartner * e;
      pose.eyeX = partner * 0.8 * e;
      const g = Math.sin(f * 0.35 + seed) * 12 * e;
      const side = hash(k + seed) > 0.5;
      if (side) Object.assign(pose, { rS: 30 * e + 6, rE: -95 * e - 8 + g, rHand: e > 0.4 ? "open" : "relaxed" });
      else Object.assign(pose, { lS: 30 * e + 6, lE: -95 * e - 8 + g, lHand: e > 0.4 ? "open" : "relaxed" });
      pose.smile = 0.55;
    } else if (kind === "laugh") {
      pose.headTurn = (pose.headTurn ?? 0) * (1 - e) + toPartner * 0.6 * e;
      pose.headTilt = (pose.headTilt ?? 0) - 8 * e;
      pose.headNod = (pose.headNod ?? 0) + Math.abs(Math.sin(f * 0.6)) * 3 * e;
      pose.smile = 0.45 + 0.55 * e;
      pose.lid = 0.45 * e;
      Object.assign(pose, { rS: 10 + 8 * e, rE: -10 - 145 * e, rHand: e > 0.4 ? "relaxed" : "relaxed" });
    } else if (kind === "nod") {
      pose.headNod = (pose.headNod ?? 0) + Math.max(0, Math.sin(p * Math.PI * 6)) * 5 * e;
      pose.smile = 0.6;
    } else if (kind === "glance") {
      const dir = hash(k * 3 + seed) > 0.5 ? 1 : -1;
      pose.headTurn = (pose.headTurn ?? 0) + dir * 0.4 * e;
      pose.eyeX = dir * 0.6 * e;
    }
    return pose;
  };

  const mouth = (f: number): MouthState => {
    const { kind, p } = beatAt(f, seed, chatty);
    if (kind === "chat" && p > 0.15 && p < 0.85) return visemeChatter(f, seed, 0.75);
    if (kind === "laugh" && p > 0.2 && p < 0.8) {
      const o = 0.35 + Math.abs(Math.sin(f * 0.6)) * 0.35;
      return { open: o, width: 1.25, round: 0, teeth: 0.8 };
    }
    return MOUTH_REST;
  };

  return { acting, mouth };
}
