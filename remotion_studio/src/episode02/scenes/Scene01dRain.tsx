import React from "react";
import { clamp, EASE, flicker, hash, lerp, makeActing, noise1, track, windowed } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { Flame, Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { BASE_POSE, CastMember, Pose, Puppet, SceneLight } from "../../cinematic/rig/Puppet";
import { CAST } from "../../cinematic/rig/cast";
import { BaidikBariDay } from "../../cinematic/sets/S01_DaySets";
import { Bolt, Rain, Splashes } from "../../cinematic/sets/S05_Sets";
import { cueLocalStory, pausesFor, storyToReal, useStory } from "../../episode/storyClock";

/**
 * Episode 2 · scene 01d_shashthi_rain: the Shashthi day downpour at the Baidik Bari.
 * Narration: "ষষ্ঠীপূজোর দিন সকাল থেকে এমন / মুষলধারে বৃষ্টি নামল যে গাঁয়ের কেউ / আসতে পারল না।"
 *
 * Set: the Episode 1 Baidik Bari exterior (BaidikBariDay, read-only), regraded to a cool slate
 * storm by a colour-matrix filter. On top of it, in this file: the Shashthi decorations (banana
 * stems and mango-leaf garlands at the central gate, garlands along the arcade, white alpana in
 * the courtyard that runs in the rain), the puja set out under the arcade veranda (brass lamps,
 * brass plate of fruit, the small Shashthi altar with its ghat, sweets under a cloth), the rain,
 * the drips off the cornice and the outhouse thatch, the spreading flood, and the people.
 *
 * Two clocks (CAM-14, src/episode/storyClock.ts): `f` = the STORY clock (holds during a pause) drives
 * every story action (the woman, the villagers, the boat, the strike, the camera keys); `lifeF` = the
 * real local frame drives the weather (rain, splashes, drips, puddle ripples, clouds, river, palms,
 * garlands, banana leaves, lamp flames and flicker) and the rigs' breathing and blinks, so the storm
 * keeps moving through the pauses.
 *
 * Shot list (approved plan, Ep02_Shots_and_Pauses_DRAFT.md "Scene 01d"; keys tied to the cues, CAM-13):
 *   P1 (open pause, 24 f, story held at 0): held wide on the decorated house in the storm: rain sheets
 *           across the gate, garlands and banana leaves swing in the gusts, the alpana starts to run.
 *   L1 "ষষ্ঠীপূজোর দিন সকাল থেকে এমন": the same held wide (no crane). The household woman stands in
 *           the arcade doorway, looking down the path. The puja is laid out, waiting.
 *   76      the single lightning strike (story frame 76, 6 f before "মুষলধারে"; the thunder in
 *           Episode02.tsx is anchored to it). Camera holds.
 *   L2 "মুষলধারে বৃষ্টি নামল যে গাঁয়ের কেউ": hold the wide. Off frame right, three villagers reach the
 *           water over the path (116-124) and stand hesitating; the woman leans out to look.
 *   L3 "আসতে পারল না।": ONE slow pan right from "আসতে" to the flooded village path, landing as the
 *           villagers turn back (they turn in the last frames of the pan); hold. The boat on the river
 *           turns back too. The woman shakes her head and goes back inside.
 *   P2 (end pause, 24 f, story held at its last frame): CUT to a medium of the empty decorated veranda,
 *           the two puja lamps flickering alone in the gusts; hold to the end of the scene.
 *
 * The set is an exterior only (no interior set and no mat in this scene).
 */

const SCENE_ID = "01d_shashthi_rain";
/** Narration cues in story frames (fallbacks are today's values). */
const L2 = cueLocalStory("মুষলধারে", SCENE_ID)?.from ?? 82;
const L3 = cueLocalStory("আসতে পারল না", SCENE_ID)?.from ?? 186;
const L3_END = cueLocalStory("আসতে পারল না", SCENE_ID)?.to ?? 224;
/** The pan right on L3: starts on "আসতে", lands as the villagers turn back. */
const PAN_A = L3;
const PAN_B = Math.max(L3 + 32, L3_END);
/** Pauses of this scene (open at story 0, end at the last story frame). */
const PAUSES = pausesFor(SCENE_ID);
const END_PAUSE = PAUSES.length ? PAUSES[PAUSES.length - 1] : undefined;
/** Real local frame where the end pause begins: the cut to the empty veranda. */
const END_CUT_REAL = END_PAUSE && END_PAUSE.atStory > 0 ? storyToReal(END_PAUSE.atStory, PAUSES) : Infinity;

/** Weather clock (real frames): the storm is already heavy at the open and builds to full by about this frame. */
const WEATHER_FULL = 226;
/** Storm intensity 0..1 on the weather clock (lifeF): heavy from the first frame, full downpour by the end. */
const stormAt = (lf: number) => 0.4 + 0.6 * Math.pow(clamp(lf / WEATHER_FULL), 1.2);
/** Flood level 0..1 on the weather clock: puddles spread and join, then stay at full flood. */
const floodAt = (lf: number) => 0.2 + 0.8 * Math.pow(clamp(lf / WEATHER_FULL), 0.85);
/** The alpana runs: it starts to blur in the open pause and keeps bleeding (weather clock). */
const alpanaRunAt = (lf: number) => clamp(0.12 + 0.88 * Math.pow(clamp(lf / 200), 0.7));

/**
 * The one lightning strike, STORY frame 76: on the narration's "মুষলধারে বৃষ্টি নামল". Protected: the
 * thunder in Episode02.tsx is anchored to it, so it stays on the story clock.
 */
const STRIKE = 76;

/** Flash envelope: up over 2 frames to a peak, then decays to nothing over about 10 frames. */
const flashAt = (f: number) => {
  const d = f - STRIKE;
  if (d < 0) return 0;
  if (d === 0) return 0.55;
  if (d === 1) return 1;
  if (d === 2) return 0.9;
  return 0.9 * Math.pow(clamp(1 - (d - 2) / 10), 2);
};

/** Rain sheets cover a taller area so the high opening frame is full of streaks (density kept). */
const RAIN_AREA: [number, number, number, number] = [-1000, -1100, 4000, 2500];
const RAIN_DENSITY = 2500 / 1800;

/* Baidik Bari geometry (house-layer coordinates, from BaidikBariDay). */
const FLOOR_Y = 740; // arcade floor (bottom of the arches)
const ARCH_X = (i: number) => 290 + i * 168; // arcade arch centres, i = 0..8, half-width 56
const DOOR_ARCH = 7; // the woman stands in this arch, looking down the path
const DOOR_X = ARCH_X(DOOR_ARCH); // 1466
const LAMPS = [
  { x: 1098, seed: 3 },
  { x: 1292, seed: 8 },
];
const LAMP_FLAME_Y = FLOOR_Y - 40;

/* ------------------------------------------------------------------ */
/* Sky: slate storm clouds                                             */
/* ------------------------------------------------------------------ */

const StormSky: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="ep2s1d-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a222c" />
        <stop offset="45%" stopColor="#2f3b4a" />
        <stop offset="78%" stopColor="#546374" />
        <stop offset="100%" stopColor="#66788a" />
      </linearGradient>
    </defs>
    <rect x={-1000} y={-800} width={3900} height={1900} fill="url(#ep2s1d-sky)" />
    {Array.from({ length: 22 }, (_, i) => {
      const dx = f * (0.25 + hash(i) * 0.25);
      const cx = -900 + hash(i * 1.9) * 3800 + dx;
      const cy = -120 + hash(i * 3.1) * 420;
      const rx = 260 + hash(i * 5.7) * 380;
      const ry = 60 + hash(i * 7.3) * 60;
      const shade = i % 3 === 0 ? "#243041" : i % 3 === 1 ? "#37455a" : "#4a5a6c";
      return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={shade} opacity={0.75} />;
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Wind-bent palm (generic)                                            */
/* ------------------------------------------------------------------ */

const BentPalm: React.FC<{ f: number; storm: number; x: number; y: number; s?: number; seed?: number; col?: string }> = ({
  f,
  storm,
  x,
  y,
  s = 1,
  seed = 0,
  col = "#1a1d25",
}) => {
  // gusts push the crown right (the rain drifts that way too), harder as the storm builds
  const gust = noise1(f * 0.06, 21 + seed) * 0.6 + noise1(f * 0.19, 5 + seed) * 0.4;
  const tipX = 70 + (50 + 70 * storm) * (0.55 + 0.45 * gust);
  const tipY = -350;
  const fronds = [-160, -120, -75, -30, 10, 50, 95, 140];
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <path d={`M -12 0 Q ${tipX * 0.3 - 6} -190 ${tipX - 7} ${tipY} L ${tipX + 7} ${tipY} Q ${tipX * 0.3 + 8} -190 12 0 Z`} fill="#14161c" />
      {fronds.map((a, j) => {
        // fronds stream downwind: the ones on the windward side fold over the crown
        const sway = Math.sin(f * 0.13 + j * 1.7 + seed) * (2 + 5 * storm) + noise1(f * 0.11, j + 9 + seed) * (2 + 6 * storm) + gust * 6 * storm;
        const bend = a < 0 ? 18 * storm * (0.5 + 0.5 * gust) : 0;
        return <path key={j} d="M 0 0 Q 70 -70 170 -30 Q 90 -50 0 12 Z" fill={col} transform={`translate(${tipX}, ${tipY}) rotate(${a + sway + bend})`} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Far bank and the swollen Padma, with a boat that cannot cross        */
/* ------------------------------------------------------------------ */

/** Boat (story clock): pushed downstream by the current through L2, it gives up and turns back on L3. */
const BOAT_TURN = L3 + 4;
const boatX = (f: number) => track(f, [[0, 1890], [BOAT_TURN - 40, 1805], [BOAT_TURN, 1720, "out"], [BOAT_TURN + 51, 1700]]);
const boatY = (f: number) => track(f, [[0, 498], [BOAT_TURN - 40, 512], [BOAT_TURN, 515], [BOAT_TURN + 51, 497]]);
/** Boat heading: -1 = bow toward our bank (left, downstream); turns back to +1 from BOAT_TURN. */
const boatFacing = (f: number) => lerp(-1, 1, EASE.inOut(clamp((f - BOAT_TURN) / 10)));

/** `f` story clock (where the boat is), `lf` weather clock (rocking, heaving, poling keep going in a pause). */
const Boat: React.FC<{ f: number; lf: number; storm: number }> = ({ f, lf, storm }) => {
  const swell = windowed(f, BOAT_TURN - 38, BOAT_TURN, 10);
  const rock = Math.sin(lf * 0.21) * 5 * (0.6 + storm) + Math.sin(lf * 0.37 + 1) * 7 * swell;
  const heave = Math.sin(lf * 0.18) * 2.5 + Math.sin(lf * 0.31) * 3 * swell;
  const face = boatFacing(f);
  const sx = Math.sign(face || 1) * Math.max(0.2, Math.abs(face));
  const pole = 22 + Math.sin(lf * 0.16) * 9;
  return (
    <g transform={`translate(${boatX(f)}, ${boatY(f) + heave}) rotate(${rock}) scale(${sx}, 1)`}>
      {/* boatman poling at the stern */}
      <g transform="translate(22, -8)">
        <line x1={0} y1={-26} x2={0} y2={-6} stroke="#2a2d33" strokeWidth={4} />
        <line x1={0} y1={-6} x2={-3} y2={6} stroke="#23252a" strokeWidth={3} />
        <line x1={0} y1={-6} x2={4} y2={6} stroke="#23252a" strokeWidth={3} />
        <path d="M -5 -12 L 5 -12 L 4 -2 L -4 -2 Z" fill="#7e8790" />
        <circle cx={0} cy={-31} r={4.5} fill="#2a2d33" />
        <line x1={-12} y1={-46} x2={12} y2={10} stroke="#4a3a2a" strokeWidth={2} transform={`rotate(${pole} 0 -20)`} />
      </g>
      {/* small hood (chhoi) and the hull */}
      <path d="M -16 -6 Q -4 -26 10 -6 Z" fill="#30302e" />
      <path d="M -40 -6 Q -2 -1 38 -7 L 32 4 Q 0 9 -34 4 Z" fill="#2a221c" />
      <path d="M -40 -6 Q -2 -1 38 -7" stroke="#5a4a3a" strokeWidth={1.5} fill="none" />
      {/* spray where the hull slaps the swell */}
      <path d="M -44 2 q 6 -8 12 0 M 34 2 q 6 -8 12 0" stroke="#c9d6e2" strokeWidth={2} fill="none" opacity={0.4 + 0.4 * swell} />
    </g>
  );
};

/** `f` = weather clock (the current races on in a pause), `sf` = story clock (the boat's course). */
const RiverPlate: React.FC<{ f: number; sf: number; storm: number }> = ({ f, sf, storm }) => {
  let d = "M -800 470";
  for (let x = -800; x < 2800; x += 36) {
    const k = hash(Math.floor(x / 36) + 17);
    const bump = k > 0.8 ? 40 : k > 0.5 ? 22 : 10;
    d += ` Q ${x + 18} ${452 - bump} ${x + 36} ${464 - bump * 0.3}`;
  }
  d += " L 2800 500 L -800 500 Z";
  return (
    <g>
      <path d={d} fill="#1c2430" />
      {/* the swollen river runs on down under the nearer planes, so no sky shows below it during the crane */}
      <rect x={-800} y={482} width={3600} height={820} fill="#3b4652" />
      <rect x={-800} y={482} width={3600} height={6} fill="#56636f" opacity={0.6} />
      {/* fast current: streaks and whitecaps racing left (downstream) */}
      {Array.from({ length: 30 }, (_, i) => {
        const sp = 3 + hash(i * 1.3) * 3;
        const x = ((((hash(i * 4.1) * 3600 - f * sp) % 3600) + 3600) % 3600) - 800;
        return (
          <rect key={i} x={x} y={490 + hash(i * 6.3) * 80} width={50 + hash(i * 2.7) * 120} height={2} rx={1} fill="#9fb0c0" opacity={0.18 + 0.12 * hash(i)} />
        );
      })}
      {Array.from({ length: 18 }, (_, i) => {
        const x = ((((hash(i * 8.1) * 3600 - f * 4.5) % 3600) + 3600) % 3600) - 800;
        const y = 495 + hash(i * 3.9) * 70;
        const p = ((f + hash(i) * 20) % 20) / 20;
        return <path key={i} d={`M ${x} ${y} q 8 ${-5 - 3 * storm} 16 0`} stroke="#d6e1ea" strokeWidth={1.6} fill="none" opacity={(1 - p) * (0.3 + 0.4 * storm)} />;
      })}
      <Boat f={sf} lf={f} storm={storm} />
    </g>
  );
};

/** Low river mist, thickening with the storm. */
const MistBand: React.FC<{ f: number; storm: number }> = ({ f, storm }) => (
  <g>
    <defs>
      <linearGradient id="ep2s1d-mist" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9aabbd" stopOpacity={0} />
        <stop offset="50%" stopColor="#9aabbd" stopOpacity={1} />
        <stop offset="100%" stopColor="#9aabbd" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={-800} y={430} width={3600} height={150} fill="url(#ep2s1d-mist)" opacity={lerp(0.12, 0.28, storm) * (0.85 + 0.15 * noise1(f * 0.04, 2))} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Flooded fields and the village path, with villagers turning back     */
/* ------------------------------------------------------------------ */

/** The raised village path (aal) beyond the compound wall, running from the far village toward the gate. */
const pathY = (x: number) => 612 + (2500 - x) * 0.09;
/** Right-hand edge of the water that has drowned the dip in the path (spreads, but stops short of the villagers). */
const pathFloodEdge = (f: number) => lerp(1760, 1905, floodAt(f));

type VillagerDef = { stopX: number; tStop: number; tTurn: number; v: number; h: number; cover: "umbrella" | "leaf"; top: string; lower: string; saree: boolean; seed: number };
/**
 * They reach the water at 116-124 (off frame right in the held wide; the splash sound in Episode02.tsx is
 * at 116), stand hesitating through L2, and turn back in the last frames of the L3 pan (STO-01: the pan
 * finds the people who cannot come). Staggered turns: the third gives up first, the first last.
 */
const VILLAGERS: VillagerDef[] = [
  { stopX: 1930, tStop: 116, tTurn: PAN_B - 14, v: 0.95, h: 1, cover: "umbrella", top: "#3a4048", lower: "#8b95a1", saree: false, seed: 1 },
  { stopX: 1968, tStop: 120, tTurn: PAN_B - 8, v: 0.9, h: 0.92, cover: "leaf", top: "#5a3036", lower: "#7a5058", saree: true, seed: 2 },
  { stopX: 2006, tStop: 124, tTurn: PAN_B - 20, v: 0.85, h: 0.97, cover: "umbrella", top: "#30353c", lower: "#7f8994", saree: false, seed: 3 },
];
const TURN_DUR = 6;
/** Eased distance: walks at full speed, decelerating over the last 8 frames before a stop (and accelerating after a start). */
const easedDist = (d: number) => (d > 8 ? d - 4 : (d * d) / 16);

const villagerState = (V: VillagerDef, f: number) => {
  const back = V.tTurn + TURN_DUR;
  let x = V.stopX;
  let stride = 0;
  if (f < V.tStop) {
    x = V.stopX + V.v * easedDist(V.tStop - f);
    stride = clamp((V.tStop - f) / 8);
  } else if (f > back) {
    x = V.stopX + V.v * 0.9 * easedDist(f - back);
    stride = clamp((f - back) / 8);
  }
  const turn = EASE.inOut(clamp((f - V.tTurn) / TURN_DUR));
  const facing = lerp(-1, 1, turn); // -1 walks toward the house (left), +1 goes home (right)
  const hesitate = windowed(f, V.tStop + 2, V.tTurn - 1, 6);
  const fade = 1 - 0.45 * clamp((f - back) / 50);
  return { x, stride, facing, hesitate, fade };
};

/** `f` story clock (walk, stop, turn), `lf` real clock (idle rocking and the wind on the covers). */
const Villager: React.FC<{ V: VillagerDef; f: number; lf: number; storm: number }> = ({ V, f, lf, storm }) => {
  const { x, stride, facing, hesitate, fade } = villagerState(V, f);
  const y = pathY(x);
  const ph = f * 0.33 + V.seed * 2;
  const swing = Math.sin(ph) * stride;
  const bob = -Math.abs(Math.sin(ph)) * 1.4 * stride;
  const h = V.h;
  const sx = Math.sign(facing || 1) * Math.max(0.18, Math.abs(facing));
  // at the water they lean forward to look across, rocking back and forth while they hesitate (the first
  // villager leans furthest); the rocking runs on the real clock so they never freeze while they wait
  const lean =
    hesitate * (V.seed === 1 ? 9 : 5) * (0.75 + 0.25 * Math.sin(lf * 0.11 + V.seed * 1.7)) + hesitate * 1.5 * noise1(lf * 0.05, 70 + V.seed);
  const gust = noise1(lf * 0.07, 40 + V.seed);
  // the cover tilts into the wind (wind from the left) whichever way the villager faces
  const tilt = -(8 + 10 * storm + 6 * gust) * Math.sign(sx);
  const hipY = -26 * h;
  return (
    <g transform={`translate(${x}, ${y + bob})`} opacity={fade}>
      <g transform={`scale(${sx}, 1)`}>
        <g transform={`rotate(${lean} 0 ${hipY})`}>
          {/* legs */}
          <line x1={0} y1={hipY} x2={7 * swing} y2={0} stroke="#25221f" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={0} y1={hipY} x2={-7 * swing} y2={0} stroke="#25221f" strokeWidth={3.4} strokeLinecap="round" />
          {/* dhoti to the knee, or a saree to the ankle */}
          <path d={V.saree ? `M -7 ${-40 * h} L 7 ${-40 * h} L 10 -3 L -9 -3 Z` : `M -7 ${-40 * h} L 7 ${-40 * h} L 8 ${-14 * h} L -8 ${-14 * h} Z`} fill={V.lower} />
          {/* torso and head */}
          <path d={`M -6 ${-52 * h} L 6 ${-52 * h} L 7 ${-38 * h} L -7 ${-38 * h} Z`} fill={V.top} />
          <circle cx={1} cy={-57.5 * h} r={5.2} fill="#2a2420" />
          {V.cover === "umbrella" ? (
            <g>
              <line x1={3} y1={-50 * h} x2={6} y2={-60 * h} stroke="#2a2420" strokeWidth={2.6} strokeLinecap="round" />
              <g transform={`translate(6, ${-60 * h}) rotate(${tilt})`}>
                <line x1={0} y1={0} x2={0} y2={-24} stroke="#1b1c1f" strokeWidth={1.6} />
                <path d="M -24 -22 Q 0 -40 24 -22 Q 18 -24 12 -21 Q 6 -24 0 -21 Q -6 -24 -12 -21 Q -18 -24 -24 -22 Z" fill="#15171b" />
                <path d="M -24 -22 Q 0 -40 24 -22" stroke="#4a5260" strokeWidth={1} fill="none" opacity={0.6} />
              </g>
            </g>
          ) : (
            <g>
              {/* a banana leaf held over the head with both hands */}
              <line x1={-4} y1={-50 * h} x2={-9} y2={-62 * h} stroke="#2a2420" strokeWidth={2.4} strokeLinecap="round" />
              <line x1={4} y1={-50 * h} x2={10} y2={-63 * h} stroke="#2a2420" strokeWidth={2.4} strokeLinecap="round" />
              <g transform={`translate(0, ${-64 * h}) rotate(${tilt * 0.6})`}>
                <path d="M -24 4 Q 0 -16 30 2 Q 4 -4 -24 4 Z" fill="#2f4a2e" />
                <path d="M -24 4 Q 2 -8 30 2" stroke="#5a7a50" strokeWidth={1} fill="none" />
                {[-14, -4, 6, 16].map((lx) => (
                  <line key={lx} x1={lx} y1={-3} x2={lx + 3} y2={6} stroke="#223a22" strokeWidth={0.8} />
                ))}
              </g>
            </g>
          )}
        </g>
      </g>
    </g>
  );
};

const SmallHut: React.FC<{ x: number; y: number; s: number; f: number; seed: number }> = ({ x, y, s, f, seed }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <rect x={-50} y={-50} width={100} height={50} fill="#2c2c2e" />
    <rect x={-14} y={-34} width={16} height={14} fill="#ffb464" opacity={0.35 + 0.3 * (flicker(f, seed) - 0.86)} />
    <path d="M -72 -44 Q 0 -110 72 -44 Q 0 -56 -72 -44 Z" fill="#202126" />
  </g>
);

/** `f` = weather clock, `sf` = story clock (the villagers). */
const FieldsPath: React.FC<{ f: number; sf: number; storm: number }> = ({ f, sf, storm }) => {
  const fl = floodAt(f);
  const edge = pathFloodEdge(f);
  // the path as a raised band
  const xs = Array.from({ length: 21 }, (_, i) => 1400 + i * 60);
  const top = xs.map((x) => `${x} ${pathY(x) - 4}`).join(" L ");
  const bot = [...xs].reverse().map((x) => `${x} ${pathY(x) + 6}`).join(" L ");
  return (
    <g>
      <defs>
        <linearGradient id="ep2s1d-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c353b" />
          <stop offset="100%" stopColor="#1d2226" />
        </linearGradient>
        <linearGradient id="ep2s1d-fwater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b7d8e" />
          <stop offset="100%" stopColor="#465666" />
        </linearGradient>
      </defs>
      <path d="M -800 580 Q 400 570 1200 582 T 2800 576 L 2800 1300 L -800 1300 Z" fill="url(#ep2s1d-field)" />
      {/* the paddy is under water: sheets reflecting the sky, spreading with the flood */}
      {[
        [-300, 610, 360],
        [400, 640, 300],
        [1500, 600, 260],
        [2150, 640, 340],
        [2500, 700, 300],
        [900, 690, 260],
      ].map(([cx, cy, rx], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx * (0.55 + 0.6 * fl)} ry={10 + 12 * fl} fill="url(#ep2s1d-fwater)" opacity={0.75} />
      ))}
      {/* the distant village the guests set out from */}
      <SmallHut x={2080} y={604} s={0.6} f={f} seed={5} />
      <SmallHut x={2260} y={598} s={0.5} f={f} seed={6} />
      <BentPalm f={f} storm={storm} x={1990} y={606} s={0.32} seed={4} col="#1c2029" />
      <BentPalm f={f} storm={storm} x={2360} y={600} s={0.28} seed={7} col="#1c2029" />
      {/* the raised path */}
      <path d={`M ${top} L ${bot} Z`} fill="#3d3732" />
      <path d={`M ${top}`} stroke="#5a5048" strokeWidth={1.5} fill="none" />
      {/* the dip in the path is drowned: muddy water flows over it */}
      <path
        d={`M 1380 ${pathY(1380) - 10} L ${edge} ${pathY(edge) - 7} Q ${edge + 10} ${pathY(edge)} ${edge} ${pathY(edge) + 9} L 1380 ${pathY(1380) + 14} Z`}
        fill="#5d6a74"
        opacity={0.95}
      />
      {Array.from({ length: 10 }, (_, i) => {
        const span = edge - 1400;
        const x = 1400 + ((((hash(i * 3.3) * span - f * 1.6) % span) + span) % span);
        return <rect key={i} x={x} y={pathY(x) - 4 + hash(i * 7.7) * 10} width={18 + hash(i) * 22} height={1.6} fill="#c3d2e2" opacity={0.4} />;
      })}
      <Splashes f={f} n={14} seed={23} y0={600} y1={700} x0={1400} x1={2400} o={0.6} />
      {VILLAGERS.map((V) => (
        <Villager key={V.seed} V={V} f={sf} lf={f} storm={storm} />
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Baidik Bari in the storm, with the Shashthi decorations              */
/* ------------------------------------------------------------------ */

/** Colour matrix that turns the golden day set into cool slate storm light; `k` lifts it during the flash. */
const stormMatrix = (k: number) =>
  [
    [0.3 * k, 0.25 * k, 0.05 * k, 0, 0],
    [0.22 * k, 0.33 * k, 0.1 * k, 0, 0],
    [0.2 * k, 0.3 * k, 0.25 * k, 0, 0.03],
    [0, 0, 0, 1, 0],
  ]
    .map((r) => r.join(" "))
    .join(" ");

/** Mango-leaf garland (aamer pallab): leaves hanging from a string, fluttering in the wind. */
const MangoGarland: React.FC<{ x1: number; y1: number; x2: number; y2: number; sag?: number; f: number; storm: number; seed?: number; s?: number }> = ({
  x1,
  y1,
  x2,
  y2,
  sag = 20,
  f,
  storm,
  seed = 0,
  s = 1,
}) => {
  const n = Math.max(5, Math.floor(Math.hypot(x2 - x1, y2 - y1) / (11 * s)));
  const at = (t: number) => ({ x: lerp(x1, x2, t), y: lerp(y1, y2, t) + sag * 4 * t * (1 - t) });
  const d = Array.from({ length: n + 1 }, (_, i) => at(i / n))
    .map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`)
    .join(" ");
  return (
    <g>
      <path d={d} stroke="#4a3a2a" strokeWidth={1.2 * s} fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const p = at((i + 0.5) / n);
        const flutter = 14 * storm * noise1(f * 0.17 + i * 0.7, seed + i) + 8 * storm + Math.sin(f * 0.3 + i) * 3;
        return (
          <path
            key={i}
            d={`M 0 0 Q ${4 * s} ${9 * s} 0 ${20 * s} Q ${-4 * s} ${9 * s} 0 0 Z`}
            fill={i % 2 ? "#3c5a34" : "#4b6c3c"}
            transform={`translate(${p.x}, ${p.y}) rotate(${-flutter})`}
          />
        );
      })}
    </g>
  );
};

/** Banana stem (kola gachh) planted at the gate, its torn leaves streaming in the wind, a mangal ghat at its foot. */
const BananaStem: React.FC<{ x: number; y: number; f: number; storm: number; seed: number; s?: number }> = ({ x, y, f, storm, seed, s = 1 }) => {
  const gust = noise1(f * 0.08, 60 + seed) * 0.6 + noise1(f * 0.21, 61 + seed) * 0.4;
  const bend = (3 + 5 * storm) * (0.6 + 0.4 * gust);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <g transform={`rotate(${bend * 0.4})`}>
        <path d="M -9 0 L -7 -230 L 7 -230 L 9 0 Z" fill="#4a5a3a" />
        <path d="M -9 0 L -7 -230 L -2 -230 L -3 0 Z" fill="#5d7048" />
        {[-70, -35, 0, 30, 65].map((a, j) => (
          <path
            key={j}
            d="M 0 -228 Q 60 -300 130 -250 Q 64 -270 0 -220 Z"
            fill={j % 2 ? "#36502f" : "#41613a"}
            transform={`rotate(${a + bend * (j < 2 ? 2.2 : 1.2) + Math.sin(f * 0.2 + j + seed) * 3 * (0.5 + storm)} 0 -228)`}
          />
        ))}
      </g>
      {/* mangal ghat with mango leaves */}
      <ellipse cx={0} cy={-14} rx={17} ry={15} fill="#6a4632" />
      <rect x={-8} y={-32} width={16} height={6} fill="#5a3a28" />
      {[-40, -15, 15, 40].map((a, j) => (
        <path key={j} d="M 0 -32 Q 6 -44 0 -56 Q -6 -44 0 -32 Z" fill="#3c5a34" transform={`rotate(${a} 0 -32)`} />
      ))}
      <path d="M -5 -16 h 10 M 0 -21 v 10" stroke="#c8402a" strokeWidth={2} />
    </g>
  );
};

/** Brass lamp (pradip) on a stand; the flame bends in the gusts. */
const BrassLamp: React.FC<{ x: number; f: number; seed: number; gust: number }> = ({ x, f, seed, gust }) => (
  <g>
    <ellipse cx={x} cy={FLOOR_Y - 1} rx={11} ry={3} fill="#8a6a2c" />
    <rect x={x - 2} y={FLOOR_Y - 36} width={4} height={35} fill="#a8823a" />
    <ellipse cx={x} cy={FLOOR_Y - 20} rx={5} ry={2} fill="#c8a050" />
    <ellipse cx={x} cy={FLOOR_Y - 37} rx={10} ry={3} fill="#c8a050" />
    <g transform={`rotate(${gust * 22} ${x} ${LAMP_FLAME_Y})`}>
      <Flame x={x} y={LAMP_FLAME_Y} s={1.15} f={f} seed={seed} life={clamp(1 - Math.abs(gust) * 0.35, 0.6, 1)} />
    </g>
  </g>
);

/** The puja laid out under arches 5 and 6: lamps, a brass plate of fruit, the Shashthi altar, sweets under a cloth. */
/** `f` = weather clock (flames, flicker, gusts), `sf` = story clock (when the woman has gone in). */
const PujaSet: React.FC<{ f: number; sf: number; storm: number }> = ({ f, sf, storm }) => {
  // after the woman has gone in, the gusts reach the lamps and they flicker harder, alone
  const alone = clamp((sf - WOMAN_IN_A) / 12);
  const gustAt = (seed: number) => (noise1(f * 0.12, 80 + seed) * 0.6 + noise1(f * 0.33, 81 + seed) * 0.4) * (0.25 + 0.25 * storm + 0.5 * alone);
  return (
    <g>
      {/* warm pools of lamplight on the veranda floor and the arch backs */}
      {LAMPS.map((l) => (
        <g key={l.x}>
          <Glow x={l.x} y={LAMP_FLAME_Y - 6} r={95} o={0.55 * flicker(f, l.seed)} kind="warm" />
          <ellipse cx={l.x} cy={FLOOR_Y} rx={70} ry={10} fill="url(#fx-glow-soft)" opacity={flicker(f, l.seed + 1)} />
        </g>
      ))}
      {/* brass plate of fruit */}
      <ellipse cx={1136} cy={FLOOR_Y - 2} rx={21} ry={5} fill="#b8903e" />
      <ellipse cx={1136} cy={FLOOR_Y - 3} rx={16} ry={3} fill="#d6b060" />
      <path d="M 1124 735 Q 1130 726 1140 731" stroke="#d8c050" strokeWidth={4} fill="none" strokeLinecap="round" />
      <circle cx={1142} cy={733} r={4} fill="#b8402a" />
      <circle cx={1148} cy={735} r={3.4} fill="#d8862a" />
      {/* the Shashthi altar: a low wooden chouki with a red cloth, the ghat, a banyan sprig and her clay cat */}
      <rect x={1166} y={714} width={96} height={6} fill="#5a3a24" />
      <rect x={1170} y={720} width={5} height={20} fill="#4a2e1c" />
      <rect x={1253} y={720} width={5} height={20} fill="#4a2e1c" />
      <path d="M 1166 714 L 1262 714 L 1258 730 L 1170 730 Z" fill="#8a2420" />
      <path d="M 1170 728 L 1258 728" stroke="#d8a840" strokeWidth={1.6} />
      <ellipse cx={1212} cy={702} rx={13} ry={12} fill="#9a5a34" />
      <rect x={1205} y={686} width={14} height={5} fill="#8a4a2a" />
      <path d="M 1207 703 h 10 M 1212 698 v 10 M 1207 698 v 5 M 1217 708 v -5" stroke="#d8302a" strokeWidth={1.3} />
      {[-45, -20, 0, 20, 45].map((a, j) => (
        <path key={j} d="M 1212 686 Q 1217 676 1212 664 Q 1207 676 1212 686 Z" fill="#3c6034" transform={`rotate(${a} 1212 686)`} />
      ))}
      <path d="M 1236 714 q -2 -14 6 -24 M 1240 698 q 6 -4 10 -2 M 1238 704 q -6 -4 -9 -1" stroke="#3a5a2e" strokeWidth={2} fill="none" />
      <g transform="translate(1186, 714)">
        <ellipse cx={0} cy={-5} rx={6} ry={5} fill="#8a8580" />
        <circle cx={-5} cy={-11} r={3.6} fill="#8a8580" />
        <path d="M -8 -14 l 1 -3 l 2 2 M -3 -14 l 1 -3 l 1 3" fill="#8a8580" stroke="#8a8580" strokeWidth={1} />
        <path d="M 6 -4 q 5 -2 4 -8" stroke="#8a8580" strokeWidth={1.6} fill="none" />
      </g>
      {/* sweets on a brass plate, covered with a white cloth */}
      <ellipse cx={1330} cy={FLOOR_Y - 2} rx={18} ry={4.5} fill="#b8903e" />
      <path d="M 1313 737 Q 1316 716 1330 715 Q 1344 716 1347 737 Q 1330 741 1313 737 Z" fill="#d6d2c8" />
      <path d="M 1322 736 Q 1324 724 1330 717 M 1338 736 Q 1336 726 1332 718" stroke="#aaa69c" strokeWidth={1} fill="none" />
      {LAMPS.map((l) => (
        <BrassLamp key={l.x} x={l.x} f={f} seed={l.seed} gust={gustAt(l.seed)} />
      ))}
    </g>
  );
};

/** Water falling off a ledge: drops at irregular rhythms plus a few continuous runoff streams. */
const Drips: React.FC<{ f: number; x0: number; x1: number; n: number; top: (x: number) => number; bottom: number; seed: number; streams?: number; o?: number }> = ({
  f,
  x0,
  x1,
  n,
  top,
  bottom,
  seed,
  streams = 0,
  o = 1,
}) => (
  <g opacity={o}>
    {Array.from({ length: n }, (_, i) => {
      const x = x0 + ((i + 0.5) / n) * (x1 - x0) + (hash(i * 2.1 + seed) - 0.5) * 10;
      const t0 = top(x);
      const period = 9 + Math.floor(hash(i * 5.3 + seed) * 9);
      const p = ((f + hash(i * 7.7 + seed) * period) % period) / period;
      const y = t0 + (bottom - t0) * p * p;
      const len = 6 + 22 * p;
      return (
        <g key={i}>
          <line x1={x} y1={y - len} x2={x} y2={y} stroke="#cddbe8" strokeWidth={1.8} strokeLinecap="round" opacity={0.75} />
          {p > 0.8 && <ellipse cx={x} cy={bottom} rx={3 + 18 * (p - 0.8)} ry={1.5 + 3 * (p - 0.8)} fill="none" stroke="#cddbe8" strokeWidth={1} opacity={0.6} />}
        </g>
      );
    })}
    {Array.from({ length: streams }, (_, i) => {
      const x = x0 + hash(i * 9.1 + seed) * (x1 - x0);
      return (
        <line
          key={`s${i}`}
          x1={x}
          y1={top(x)}
          x2={x + 3}
          y2={bottom}
          stroke="#c3d2e2"
          strokeWidth={2.2}
          strokeDasharray="14 9"
          strokeDashoffset={-f * 9 - i * 7}
          opacity={0.4}
        />
      );
    })}
  </g>
);

/** The outhouse (kitchen) inside the compound: mud walls, thatch, lamplight behind the shutter. */
const OutHouse: React.FC<{ f: number; x: number; y: number; s: number }> = ({ f, x, y, s }) => {
  const L = 0.85 * clamp(0.98 + 1.2 * (flicker(f, 2) - 0.86), 0.55, 1);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <rect x={-120} y={-130} width={240} height={130} fill="#4a4641" />
      <rect x={-120} y={-130} width={240} height={130} fill="#2a3340" opacity={0.35} />
      <rect x={-96} y={-98} width={58} height={50} fill="#1d1c1f" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-96} y={-96 + i * 12} width={58} height={9} fill="#4f4236" />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-96} y={-87 + i * 12} width={58} height={3} fill="#ffb464" opacity={0.2 + 0.75 * L} />
      ))}
      <Glow x={-67} y={-73} r={70} o={L * 0.45} kind="soft" />
      <path d="M -172 -118 Q -90 -236 0 -246 Q 90 -236 172 -118 Q 0 -140 -172 -118 Z" fill="#34363c" />
      <path d="M -172 -118 Q 0 -140 172 -118" stroke="#50545c" strokeWidth={4} fill="none" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M ${-150 + i * 37} -120 L ${-110 + i * 28} -226`} stroke="#1b1c20" strokeWidth={2} opacity={0.6} />
      ))}
    </g>
  );
};

/* The household woman (Charu's mother-in-law): the household woman with greying hair. */
const SHASHURI: CastMember = { ...CAST.womanA, id: "shashuri", hair: "#8d8780", hairLight: "#b9b3ab", seed: 131 };
const WOMAN_SCALE = 0.44;
/** Story beats of the woman on L3 (story frames): the head shake, then she steps back inside. */
const SHAKE_A = L3 + 4;
const SHAKE_LEN = 18;
const WOMAN_IN_A = L3 + 24;
const WOMAN_IN_B = L3 + 38;
const womanKeys = makeActing<Pose>(BASE_POSE, [
  // in the doorway, looking out down the path toward the gate
  { f: 0, bodyTurn: 0.35, headTurn: 0.32, eyeX: 0.45, eyeY: -0.05, smile: 0.25, brow: 0.05, lean: 0 },
  { f: 44, ease: "inOut", in: 24, lean: 3, headTurn: 0.42, brow: 0.15, smile: 0.15 },
  // waiting: she leans out to look further down the path (L2)
  { f: L2 + 18, ease: "inOut", in: 30, lean: 5, headTilt: -3, headTurn: 0.48, eyeX: 0.6, brow: 0.25, smile: 0.08 },
  { f: L2 + 52, ease: "inOut", in: 22, lean: 2, headTurn: 0.38, headNod: 2, brow: 0.3, smile: 0.04 },
  // a last hopeful look further down the path
  { f: L2 + 78, ease: "inOut", in: 20, lean: 4, headTilt: -2, headTurn: 0.46, eyeX: 0.55, brow: 0.28, smile: 0.02 },
  // nobody is coming (on "আসতে")
  { f: L3 + 2, ease: "inOut", in: 20, lean: 0, headTurn: 0.2, headNod: 4, headTilt: 3, brow: 0.38, lid: 0.25, smile: 0 },
  // she turns back inside
  { f: WOMAN_IN_A + 2, ease: "inOut", in: 10, bodyTurn: -0.45, headTurn: -0.3, headNod: 6, lid: 0.35, eyeX: -0.4 },
  { f: WOMAN_IN_B, ease: "inOut", in: 10, bodyTurn: -0.6 },
]);
/** Head shake on "পারল না": two slow side-to-side turns that fade in and out. */
const womanActing = (fr: number): Pose => {
  const p = womanKeys(fr);
  const env = Math.sin(Math.PI * clamp((fr - SHAKE_A) / SHAKE_LEN));
  return { ...p, headTurn: p.headTurn + 0.34 * env * Math.sin(((fr - SHAKE_A) / (SHAKE_LEN / 2)) * Math.PI * 2) };
};
/** She steps left out of the arch, behind the pier, into the house (story clock). */
const womanX = (f: number) => track(f, [[WOMAN_IN_A, DOOR_X], [WOMAN_IN_B, DOOR_X - 92, "in"]]);

const archPath = (cx: number, grow = 0) =>
  `M ${cx - 56 - grow} ${FLOOR_Y + 2} L ${cx - 56 - grow} ${FLOOR_Y - 120} Q ${cx} ${FLOOR_Y - 190 - grow * 2} ${cx + 56 + grow} ${FLOOR_Y - 120} L ${cx + 56 + grow} ${FLOOR_Y + 2} Z`;

/** `f` = weather / life clock (drips, flames, garlands, the woman's breathing), `sf` = story clock (her acting). */
const BaidikBariStorm: React.FC<{ f: number; sf: number; storm: number; flash: number }> = ({ f, sf, storm, flash }) => {
  const lamps: SceneLight[] = LAMPS.map((l) => ({ x: l.x, y: LAMP_FLAME_Y, color: "#ffb464", intensity: 0.7, radius: 260, flicker: l.seed }));
  // cornice line over the arcade (veranda edge) and the terrace cornice
  const arcadeEdge = () => 528;
  const roofEdge = () => 310;
  const thatchEdge = (x: number) => 760 - 0.85 * (118 + 11 * (1 - Math.pow((x + 20) / 146, 2)));
  return (
    <g>
      <defs>
        <filter id="ep2s1d-storm" colorInterpolationFilters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
          <feColorMatrix type="matrix" values={stormMatrix(1 + 0.9 * flash)} />
        </filter>
        <clipPath id="ep2s1d-door">
          <path d={archPath(DOOR_X, 4)} />
        </clipPath>
        <radialGradient id="ep2s1d-inner" cx="0.5" cy="0.65" r="0.6">
          <stop offset="0%" stopColor="#ffb464" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ffb464" stopOpacity={0} />
        </radialGradient>
      </defs>
      <GlowDefs />
      {/* the kitchen outhouse sits behind the compound wall, left of the house */}
      <OutHouse f={f} x={-20} y={760} s={0.85} />
      {/* water running off its thatch (behind the compound wall, so drawn before the set) */}
      <Drips f={f} x0={-160} x1={120} n={12} top={thatchEdge} bottom={760} seed={3} streams={2} o={0.8} />
      {/* the Episode 1 house, regraded to slate storm light */}
      <g filter="url(#ep2s1d-storm)">
        <BaidikBariDay f={f} />
      </g>
      {/* wet, dark ground in front of the house (runs down under the courtyard plane) */}
      <path d="M -900 785 L 2800 785 L 2800 1300 L -900 1300 Z" fill="#26282a" />
      <path d="M -900 785 L 2800 785" stroke="#4a5868" strokeWidth={3} opacity={0.6} />

      {/* the arch the woman stands in is lit from inside */}
      <path d={archPath(DOOR_X)} fill="#1a1412" />
      <path d={archPath(DOOR_X)} fill="url(#ep2s1d-inner)" opacity={0.8 + 0.2 * flicker(f, 11)} />
      <g clipPath="url(#ep2s1d-door)">
        <Puppet
          cast={SHASHURI}
          f={sf}
          lifeF={f}
          x={womanX(sf)}
          y={FLOOR_Y}
          scale={WOMAN_SCALE}
          acting={womanActing}
          light={{ keySide: -1, rim: "#ffb464", rimStrength: 0.35, brightness: lerp(0.72, 1.1, flash) }}
          lights={lamps}
          stillness={0.2}
        />
      </g>

      {/* Shashthi decorations: banana stems and a mango-leaf garland at the central gate */}
      <MangoGarland x1={846} y1={506} x2={1074} y2={506} sag={14} f={f} storm={storm} seed={1} />
      <BananaStem x={826} y={FLOOR_Y + 4} f={f} storm={storm} seed={1} />
      <BananaStem x={1094} y={FLOOR_Y + 4} f={f} storm={storm} seed={2} s={0.97} />
      {/* garland festoons from arch crest to arch crest over the decorated veranda */}
      {[3, 5, 6, 7].map((i) => (
        <MangoGarland key={i} x1={ARCH_X(i) - 84} y1={534} x2={ARCH_X(i) + 84} y2={534} sag={18} f={f} storm={storm} seed={i} s={0.9} />
      ))}
      {/* the puja, laid out and waiting */}
      <PujaSet f={f} sf={sf} storm={storm} />

      {/* water running off the terrace cornice and the arcade cornice (the veranda edge) */}
      <Drips f={f} x0={150} x1={1770} n={34} top={roofEdge} bottom={FLOOR_Y + 40} seed={7} streams={5} o={0.55} />
      <Drips f={f} x0={160} x1={1760} n={44} top={arcadeEdge} bottom={FLOOR_Y + 2} seed={11} streams={4} />
      {/* the strike lights the facade for a moment */}
      <rect x={140} y={230} width={1640} height={560} fill="#dfe9f5" opacity={flash * 0.22} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Courtyard: mud, alpana running in the rain, the spreading flood      */
/* ------------------------------------------------------------------ */

const ALPANA = { x: 1300, y: 852 };

/** White rice-paste alpana: a lotus wheel with a dotted border, and Lakshmi's footprints leading to the gate. */
const Alpana: React.FC<{ f: number; run: number }> = ({ f, run }) => {
  const petals = Array.from({ length: 12 }, (_, k) => k * 30);
  return (
    <g>
      <defs>
        <filter id="ep2s1d-alpana-run" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={`${lerp(0.5, 2.2, run)} ${lerp(0.6, 4.5, run)}`} />
        </filter>
      </defs>
      <g filter="url(#ep2s1d-alpana-run)" opacity={lerp(0.85, 0.42, run)}>
        <g transform={`translate(${ALPANA.x}, ${ALPANA.y}) scale(1, 0.3)`} fill="none" stroke="#ece8de" strokeLinecap="round">
          <circle r={34} strokeWidth={5} />
          <circle r={14} strokeWidth={4} />
          {petals.map((a) => (
            <path key={a} d="M 0 -48 Q 26 -100 0 -150 Q -26 -100 0 -48" strokeWidth={5} transform={`rotate(${a})`} />
          ))}
          {petals.map((a) => (
            <path key={`v${a}`} d="M 0 -170 q 30 -20 22 -50 q -10 16 -22 8" strokeWidth={4} transform={`rotate(${a + 15})`} />
          ))}
          {Array.from({ length: 36 }, (_, k) => (
            <circle key={k} cx={Math.cos((k / 36) * Math.PI * 2) * 250} cy={Math.sin((k / 36) * Math.PI * 2) * 250} r={6} fill="#ece8de" stroke="none" />
          ))}
          <circle r={232} strokeWidth={4} />
        </g>
        {/* Lakshmi's footprints, walking in toward the house */}
        {[0, 1, 2, 3, 4].map((k) => {
          const x = 1170 - k * 40;
          const y = 818 - k * 5 + (k % 2 ? 7 : 0);
          return (
            <g key={k} transform={`translate(${x}, ${y}) scale(1, 0.45)`} fill="#ece8de">
              <ellipse cx={0} cy={0} rx={11} ry={6} />
              {[-6, -2, 2, 6].map((tx) => (
                <circle key={tx} cx={-13} cy={tx} r={2.2} />
              ))}
            </g>
          );
        })}
      </g>
      {/* the paste runs: milky streaks bleed toward the viewer as the rain beats on it */}
      {petals.map((a, k) => {
        const r = 150 + (k % 3) * 40;
        const x = ALPANA.x + Math.sin((a * Math.PI) / 180) * r;
        const y = ALPANA.y - Math.cos((a * Math.PI) / 180) * r * 0.3;
        const len = run * (14 + 26 * hash(k * 3.7)) * (0.85 + 0.15 * Math.sin(f * 0.1 + k));
        return <line key={k} x1={x} y1={y} x2={x + len * 0.25} y2={y + len} stroke="#e4e0d6" strokeWidth={4} strokeLinecap="round" opacity={0.3 * run} />;
      })}
    </g>
  );
};

/** Courtyard pools [cx, cy, rx at start, rx flooded, ry at start, ry flooded]. */
const POOLS: [number, number, number, number, number, number][] = [
  [1010, 828, 120, 260, 14, 34], // in front of the central gate, swallowing the path and the footprints
  [1640, 836, 140, 340, 18, 46], // the approach from the compound gate on the right
  [480, 840, 110, 360, 18, 46],
  [260, 950, 140, 250, 20, 38],
  [1060, 930, 80, 260, 14, 36],
  [1540, 975, 100, 300, 18, 40],
  [1900, 1015, 200, 320, 30, 48],
  [-100, 1015, 180, 300, 26, 44],
];
const FLOOD_NARROW = "M 690 900 L 880 892 L 1060 1080 L 500 1080 Z";

const Courtyard: React.FC<{ f: number; storm: number; flash: number }> = ({ f, storm, flash }) => {
  const fl = floodAt(f);
  return (
    <g>
      <defs>
        <linearGradient id="ep2s1d-mud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3634" />
          <stop offset="100%" stopColor="#151417" />
        </linearGradient>
        <linearGradient id="ep2s1d-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d8093" />
          <stop offset="100%" stopColor="#2c3a4a" />
        </linearGradient>
      </defs>
      <path d="M -800 796 Q 300 790 960 798 T 2800 794 L 2800 1300 L -800 1300 Z" fill="url(#ep2s1d-mud)" />
      <Alpana f={f} run={alpanaRunAt(f)} />
      {/* the flood spreads: pools widen and join, reflecting the storm sky */}
      {POOLS.map(([cx, cy, rx0, rx1, ry0, ry1], i) => {
        const rx = lerp(rx0, rx1, fl);
        const ry = lerp(ry0, ry1, fl);
        const wob = noise1(f * 0.05, i) * 6;
        return (
          <g key={i}>
            <ellipse cx={cx + wob} cy={cy} rx={rx} ry={ry} fill="url(#ep2s1d-water)" opacity={0.88} />
            <ellipse cx={cx + wob} cy={cy} rx={rx} ry={ry} fill="#dfe9f5" opacity={flash * 0.35} />
            {Array.from({ length: 3 }, (_, k) => (
              <rect
                key={k}
                x={cx - rx * 0.6 + hash(i * 3 + k) * rx * 1.0 + noise1(f * 0.06, i * 3 + k) * 10}
                y={cy - ry * 0.4 + hash(i * 7 + k) * ry * 0.8}
                width={30 + hash(i + k * 5) * rx * 0.4}
                height={2}
                rx={1}
                fill="#c3d2e2"
                opacity={0.3}
              />
            ))}
          </g>
        );
      })}
      {/* the lamps' warm reflection in the pool before the veranda */}
      <ellipse cx={1200} cy={850} rx={60 * fl} ry={8} fill="#ffb464" opacity={0.18 * fl * flicker(f, 3)} />
      {/* a runnel coming down toward the viewer */}
      <path d={FLOOD_NARROW} fill="url(#ep2s1d-water)" opacity={lerp(0.45, 0.85, fl)} />
      <path d={FLOOD_NARROW} fill="#dfe9f5" opacity={flash * 0.3} />
      <BentPalm f={f} storm={storm} x={110} y={860} seed={0} />
      <BentPalm f={f} storm={storm} x={2160} y={836} s={0.9} seed={3} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Foreground: out-of-focus leaves framing the storm                   */
/* ------------------------------------------------------------------ */

const ForeLeaves: React.FC<{ f: number }> = ({ f }) => (
  <g fill="#0b0e13">
    <path d="M -260 1140 Q 180 880 620 1000 Q 320 960 -260 1190 Z" transform={`rotate(${Math.sin(f * 0.05) * 1.5} -260 1140)`} opacity={0.9} />
    <path d="M 1700 1120 Q 1420 900 1980 900 Q 1640 960 1700 1120 Z" transform={`rotate(${Math.sin(f * 0.04 + 1) * 1.2} 1700 1120)`} opacity={0.85} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export const Scene01dRain: React.FC = () => {
  // f = story clock (holds in the pauses), lifeF = real local frame (weather and breathing never stop)
  const { f, lifeF } = useStory(SCENE_ID);
  const storm = stormAt(lifeF);
  // Camera (CAM-13; keys tied to the narration cues, story clock):
  //   P1 + L1 + L2  held wide on the decorated house (cam 0/0, zoom 1.02): no crane, no drift. The
  //                 strike at story 76 lights it; the camera does not move for it.
  //   L3            ONE slow pan right, PAN_A ("আসতে") to PAN_B (end of the line), to the flooded
  //                 village path (cam x 440, y -24, zoom 1.16), landing as the villagers turn back; hold.
  //   P2            hard CUT (at the real frame where the end pause begins) to a medium of the empty
  //                 veranda and the two lamps (cam 300/104, zoom 1.62); hold to the end.
  // No handheld (CAM-03 keeps it for tense moments); the Stage's own tiny gimbal drift remains.
  // Edges: the wide at zoom 1.02 shows every plane inside its plate; the pan's end (zoom 1.16, cam 440/-24)
  // and the veranda medium (zoom 1.62, cam 300/104) are the frames verified for the earlier version: the
  // courtyard plane shows x 667..1853, y 311..977 and the house plane x 547..1853, y 256..990 in the
  // medium, inside every plate (plates span x -800..2800, down to y 1300; sky -1000..2900 / -800..1100).
  const panT = EASE.inOut(clamp((f - PAN_A) / (PAN_B - PAN_A)));
  const medium = lifeF >= END_CUT_REAL;
  const cam: Cam = medium
    ? { x: 300, y: 104, zoom: 1.62, focus: 1, dof: 1.1, shake: 0 }
    : { x: lerp(0, 440, panT), y: lerp(0, -24, panT), zoom: lerp(1.02, 1.16, panT), focus: 1, dof: 1.1, shake: 0 };

  // Rain strengthens: more streaks, more wind, more opacity (the line count grows smoothly).
  const farN = Math.round(lerp(170, 300, storm));
  const midN = Math.round(lerp(110, 230, storm) * RAIN_DENSITY);
  const nearN = Math.round(lerp(18, 44, storm) * RAIN_DENSITY);
  const wind = lerp(0.2, 0.42, storm);
  const splashN = Math.round(lerp(34, 80, storm));

  const flash = flashAt(f);

  return (
    <Stage cam={cam} background="#141a24" opacity={clamp(lifeF / 10)}>
      <Layer depth={0.15}>
        <StormSky f={lifeF} />
        {/* the sky lights up with the strike: a pale blue-white wash brightest behind the bolt */}
        {flash > 0.001 && (
          <>
            <defs>
              <radialGradient id="ep2s1d-skyflash" cx="0.5" cy="0.3" r="0.6">
                <stop offset="0%" stopColor="#eef4ff" stopOpacity={1} />
                <stop offset="100%" stopColor="#9fb4d4" stopOpacity={0.5} />
              </radialGradient>
            </defs>
            <rect x={-1000} y={-800} width={3900} height={1900} fill="url(#ep2s1d-skyflash)" opacity={flash * 0.6} style={{ mixBlendMode: "screen" }} />
          </>
        )}
        <Bolt f={f} at={STRIKE} x={1100} y0={-260} y1={480} seed={3} />
      </Layer>
      <Layer depth={0.35}>
        <RiverPlate f={lifeF} sf={f} storm={storm} />
        <MistBand f={lifeF} storm={storm} />
      </Layer>
      <Layer depth={0.45}>
        <Rain f={lifeF} n={Math.round(farN * 0.6)} seed={41} wind={wind * 0.9} o={0.5} len={22} speed={44} area={[-1000, -400, 4000, 1800]} color="#8394a8" width={1} />
      </Layer>
      <Layer depth={0.55}>
        <FieldsPath f={lifeF} sf={f} storm={storm} />
      </Layer>
      <Layer depth={0.65}>
        <Rain f={lifeF} n={Math.round(farN * 0.6)} seed={43} wind={wind * 0.9} o={0.5} len={26} speed={48} area={[-1000, -400, 4000, 1800]} color="#8394a8" width={1} />
      </Layer>
      <Layer depth={0.8}>
        <BaidikBariStorm f={lifeF} sf={f} storm={storm} flash={flash} />
      </Layer>
      <Layer depth={1}>
        <Courtyard f={lifeF} storm={storm} flash={flash} />
        <Splashes f={lifeF} n={splashN} seed={11} y0={800} y1={1060} x0={-300} x1={2400} o={0.9} />
      </Layer>
      <Layer depth={1.35}>
        <ForeLeaves f={lifeF} />
      </Layer>
      <Layer depth={1}>
        <Rain f={lifeF} n={midN} seed={5} wind={wind} o={lerp(0.7, 1, storm)} len={44} speed={60} area={RAIN_AREA} color="#b5c6d8" width={1.3} />
      </Layer>
      <Layer depth={1.35}>
        <Rain f={lifeF} n={nearN} seed={73} wind={wind * 1.1} o={lerp(0.6, 0.9, storm)} len={96} speed={84} area={RAIN_AREA} color="#d9e6f2" width={2.3} />
      </Layer>
      <Layer depth={0} blend="screen">
        <rect x={-1200} y={-800} width={4400} height={2800} fill="#cfdcec" opacity={flash * 0.45} />
      </Layer>
      {/* during the flash the slate grade lifts and a brief blue-white tint washes the whole frame */}
      <Grade
        warmth={0}
        vignette={lerp(0.62, 0.45, flash)}
        tint="#1d2a3c"
        tintAmount={lerp(0.28, 0.38, storm) * (1 - 0.6 * flash)}
        flash={flash * 0.35}
        flashColor="#dce8ff"
        grain={0.06}
      />
    </Stage>
  );
};
