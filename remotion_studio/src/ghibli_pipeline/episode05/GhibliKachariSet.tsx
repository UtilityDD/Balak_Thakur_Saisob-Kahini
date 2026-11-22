import React, { useId } from "react";
import { staticFile } from "remotion";
import { clamp, noise1, safeId } from "../../cinematic/core/anim";
import type { Cam } from "../../cinematic/core/Stage";
import {
  CucumberTrellis,
  KACHARI,
  KACHARI_BG,
  kachariGrade,
  kachariKeepInSet,
  type KachariView,
  trellisPoint,
} from "../../cinematic/sets/KrishnanagarKachari";
import { UjancharBush, UjancharKolshi, ujancharBgBlur } from "../../cinematic/sets/UjancharHouse";
import {
  ContactShadow,
  GhibliAtmosphericHaze,
  GhibliCharFilterDefs,
  GhibliCutout,
  GhibliForegroundBokeh,
  GhibliGrade,
  GhibliLayer,
  GhibliPreload,
} from "../GhibliStage";
import { GHIBLI_ANCHORS } from "./plateAnchors";

export { KACHARI, KACHARI_BG, kachariGrade, kachariKeepInSet, trellisPoint, type KachariView };

export const EP05_GHIBLI_PRELOAD = [
  "images/ghibli_ep05/watercolor_paper_grain.png",
  "images/ghibli_ep05/sky_kachari_morning.png",
  "images/ghibli_ep05/sky_grove_afternoon.png",
  "images/ghibli_ep05/far_trees_sketch.png",
  "images/ghibli_ep05/yard_earth_floor_sketch.png",
  "images/ghibli_ep05/grove_floor_sketch.png",
  "images/ghibli_ep05/kachari_front_sketch.png",
  "images/ghibli_ep05/mud_house_main_sketch.png",
  "images/ghibli_ep05/mud_house_corner_sketch.png",
  "images/ghibli_ep05/kachari_back_wall_sketch.png",
  "images/ghibli_ep05/tree_mango_sketch.png",
  "images/ghibli_ep05/banana_clump_sketch.png",
  "images/ghibli_ep05/prop_tipped_jhanka.png",
  "images/ghibli_ep05/prop_bamboo_fence.png",
  "images/ghibli_ep05/prop_clerk_desk.png",
  "images/ghibli_ep05/prop_khadam_sandals.png",
] as const;

const C_KACHARI = { x: -200, y: 806, s: 0.6, w: 1700 };
const C_MAIN = { x: 1220, y: 812, s: 0.55, w: 910, door: 600 };
const C_CORNER = { x: 1010, y: 826, s: 0.62, w: 470 };
const C_GAP = { x0: 1790, x1: 1870, base: 806, k: 0.6 };
const N_MAIN = { x: 300, y: 852, s: 1, w: 1080, door: 820 };
const N_CORNER = { x: -900, y: 884, s: 1.6, w: 800 };
const N_GAP = { x0: 1760, x1: 1880 };
const G_BACK = { x0: -1500, x1: 860, y: 872, s: 1.65, door: 560 };
const G_TRELLIS = { x: 330, y: 905, s: 1 };
const G_HIDE = { x: 1650, y: 892, s: 1.05 };

/** Repeated Ghibli bamboo fence run from x0 to x1 with base at `base`. */
const GhibliFenceRun: React.FC<{ x0: number; x1: number; base: number; h?: number }> = ({ x0, x1, base, h = 152 }) => {
  const id = safeId(useId());
  const a = GHIBLI_ANCHORS.prop_bamboo_fence;
  const tileW = h * (a.width / a.height);
  const step = tileW * 0.9;
  const count = Math.max(1, Math.ceil((x1 - x0) / step) + 1);
  return (
    <g>
      <defs>
        <clipPath id={`gfr-${id}`}>
          <rect x={x0} y={base - h - 20} width={Math.max(1, x1 - x0)} height={h + 40} />
        </clipPath>
      </defs>
      <g clipPath={`url(#gfr-${id})`}>
        {Array.from({ length: count }, (_, i) => (
          <GhibliCutout
            key={i}
            file="images/ghibli_ep05/prop_bamboo_fence.png"
            anchor={a}
            x={x0 + (i + 0.5) * step}
            y={base + 4}
            targetHeight={h}
          />
        ))}
      </g>
    </g>
  );
};

/** Ghibli mango tree with gentle wind sway. */
const GhibliMangoTree: React.FC<{ x: number; y: number; targetHeight: number; f: number; seed?: number }> = ({
  x,
  y,
  targetHeight,
  f,
  seed = 0,
}) => {
  const sway = 0.85 * Math.sin(f * 0.024 + seed) + 0.4 * noise1(f * 0.018, 40 + seed);
  return (
    <g transform={`rotate(${sway.toFixed(2)} ${x} ${y - targetHeight * 0.35})`}>
      <ContactShadow x={x} y={y} rx={targetHeight * 0.24} ry={targetHeight * 0.032} opacity={0.28} />
      <GhibliCutout
        file="images/ghibli_ep05/tree_mango_sketch.png"
        anchor={GHIBLI_ANCHORS.tree_mango_sketch}
        x={x}
        y={y}
        targetHeight={targetHeight}
      />
    </g>
  );
};

/** Ghibli banana clump with gentle wind sway and optional horizontal flip/opacity. */
const GhibliBananaClump: React.FC<{
  x: number;
  y: number;
  targetHeight: number;
  f: number;
  seed?: number;
  flip?: boolean;
  opacity?: number;
}> = ({ x, y, targetHeight, f, seed = 0, flip = false, opacity = 1 }) => {
  const sway = 1.1 * Math.sin(f * 0.026 + seed) + 0.5 * noise1(f * 0.02, 100 + seed);
  return (
    <g
      transform={`translate(${x}, ${y}) scale(${flip ? -1 : 1}, 1) rotate(${sway.toFixed(2)} 0 ${-targetHeight * 0.3}) translate(${-x}, ${-y})`}
      opacity={opacity}
    >
      <ContactShadow x={x} y={y} rx={targetHeight * 0.14} ry={targetHeight * 0.022} opacity={0.22} />
      <GhibliCutout
        file="images/ghibli_ep05/banana_clump_sketch.png"
        anchor={GHIBLI_ANCHORS.banana_clump_sketch}
        x={x}
        y={y}
        targetHeight={targetHeight}
      />
    </g>
  );
};

/** Tipped Ghibli woven bamboo basket (ঝাঁকা). */
export const GhibliTippedBasket: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g>
    <ContactShadow x={x - 8 * s} y={y + 2 * s} rx={88 * s} ry={12 * s} opacity={0.32} />
    <GhibliCutout
      file="images/ghibli_ep05/prop_tipped_jhanka.png"
      anchor={GHIBLI_ANCHORS.prop_tipped_jhanka}
      x={x - 18 * s}
      y={y + 4 * s}
      targetHeight={164 * s}
    />
  </g>
);

/** Sky plane (0.15) using Ghibli morning or afternoon sky plate. */
export const GhibliKachariSkyLayer: React.FC<{ view: KachariView; f: number; cam?: Cam; calm?: number }> = ({
  view,
  f,
  cam,
  calm = 1,
}) => {
  const file = view === "grove" ? "images/ghibli_ep05/sky_grove_afternoon.png" : "images/ghibli_ep05/sky_kachari_morning.png";
  const driftX = Math.sin(f * 0.004) * 18;
  return (
    <GhibliLayer depth={0.15} extraBlur={ujancharBgBlur(0.15, calm, cam) * 0.65}>
      <image
        href={staticFile(file)}
        x={-2200 + driftX}
        y={-850}
        width={6400}
        height={2200}
        preserveAspectRatio="xMidYMid slice"
      />
    </GhibliLayer>
  );
};

/** Far tree-line panorama plane (0.35). */
export const GhibliKachariJungleLayer: React.FC<{ view: KachariView; f: number; cam?: Cam; calm?: number }> = ({
  view,
  cam,
  calm = 1,
}) => (
  <GhibliLayer depth={0.35} extraBlur={ujancharBgBlur(0.35, calm, cam) * 0.7}>
    <image
      href={staticFile("images/ghibli_ep05/far_trees_sketch.png")}
      x={-1800}
      y={390}
      width={2900}
      height={470}
      preserveAspectRatio="none"
    />
    <image
      href={staticFile("images/ghibli_ep05/far_trees_sketch.png")}
      x={1060}
      y={390}
      width={2900}
      height={470}
      preserveAspectRatio="none"
    />
    {view === "grove" && <rect x={-1800} y={340} width={5600} height={800} fill="#ffd9a0" opacity={0.12} />}
  </GhibliLayer>
);

/** Mid-far trees plane (0.5): mango tree, family thatch glimpse, and far banana rows. */
export const GhibliKachariTreesLayer: React.FC<{ view: KachariView; f: number; cam?: Cam; calm?: number }> = ({
  view,
  f,
  cam,
  calm = 1,
}) => (
  <GhibliLayer depth={0.5} extraBlur={ujancharBgBlur(0.5, calm, cam) * 0.7}>
    {view === "grove" ? (
      <g>
        <rect x={-1800} y={790} width={5600} height={360} fill="#6c743c" opacity={0.65} />
        {Array.from({ length: 14 }, (_, i) => (
          <GhibliBananaClump
            key={`gb05-${i}`}
            x={-1550 + i * 380}
            y={848 + (i % 2) * 10}
            targetHeight={480 + (i % 3) * 45}
            f={f}
            seed={100 + i}
            flip={i % 2 === 1}
            opacity={0.85}
          />
        ))}
      </g>
    ) : view === "compound" ? (
      <g>
        {[-760, 140, 1420, 2340, 2900].map((bx, i) => (
          <GhibliBananaClump key={`cb-${i}`} x={bx} y={824} targetHeight={390} f={f} seed={20 + i} flip={i % 2 === 1} opacity={0.88} />
        ))}
        {/* Family house glimpse beyond the fence gap */}
        <GhibliCutout
          file="images/ghibli_ep05/mud_house_main_sketch.png"
          anchor={GHIBLI_ANCHORS.mud_house_main_sketch}
          x={2110}
          y={796}
          targetHeight={230}
          opacity={0.88}
        />
        <GhibliMangoTree x={990} y={810} targetHeight={610} f={f} seed={1} />
      </g>
    ) : (
      <g>
        {[-720, 120, 1080, 2240, 2860].map((bx, i) => (
          <GhibliBananaClump key={`nb-${i}`} x={bx} y={864} targetHeight={490} f={f} seed={40 + i} flip={i % 2 === 1} opacity={0.88} />
        ))}
        <GhibliMangoTree x={1430} y={868} targetHeight={780} f={f} seed={3} />
        {/* Family house glimpse beyond the fence gap */}
        <GhibliCutout
          file="images/ghibli_ep05/mud_house_main_sketch.png"
          anchor={GHIBLI_ANCHORS.mud_house_main_sketch}
          x={2020}
          y={858}
          targetHeight={330}
          opacity={0.9}
        />
        <UjancharKolshi x={1900} y={850} s={0.6} />
      </g>
    )}
  </GhibliLayer>
);

/** Back yard plane (0.65): buildings, bamboo fence runs, clerk on veranda, or Binoy's mother in doorway. */
export const GhibliKachariBackLayer: React.FC<{
  view: KachariView;
  f: number;
  cam?: Cam;
  calm?: number;
  veranda?: React.ReactNode;
  yard?: React.ReactNode;
  basket?: boolean;
}> = ({ view, f, cam, calm = 1, veranda, yard, basket = true }) => (
  <GhibliLayer depth={0.65} extraBlur={ujancharBgBlur(0.65, calm, cam) * 0.65}>
    <GhibliCharFilterDefs />
    {view === "compound" && (
      <g>
        {/* Distant compound beaten-earth strip */}
        <image
          href={staticFile("images/ghibli_ep05/yard_earth_floor_sketch.png")}
          x={-1500}
          y={778}
          width={5000}
          height={340}
          preserveAspectRatio="none"
        />
        <GhibliFenceRun x0={-1500} x1={-160} base={800} h={105} />
        <GhibliFenceRun x0={840} x1={1240} base={800} h={105} />
        <GhibliFenceRun x0={C_MAIN.x + C_MAIN.w * C_MAIN.s - 10} x1={C_GAP.x0} base={C_GAP.base} h={105} />
        <GhibliFenceRun x0={C_GAP.x1} x1={3500} base={C_GAP.base} h={105} />
        {[2050, 2420, 2900, -900, -500].map((x, i) => (
          <g key={x} transform={`translate(${x}, ${C_GAP.base + 6}) scale(0.6)`}>
            <UjancharBush x={0} y={0} w={200} f={f} seed={i * 3 + 2} />
          </g>
        ))}

        {/* Krishnanagar Kachari Front Building */}
        <ContactShadow x={C_KACHARI.x + 510} y={C_KACHARI.y + 4} rx={540} ry={22} opacity={0.3} />
        <GhibliCutout
          file="images/ghibli_ep05/kachari_front_sketch.png"
          anchor={GHIBLI_ANCHORS.kachari_front_sketch}
          x={C_KACHARI.x + (C_KACHARI.w * C_KACHARI.s) / 2}
          y={C_KACHARI.y + 8}
          targetHeight={330}
        />
        {/* Clerk & Ghibli sloping desk on the kachari veranda */}
        <g filter="url(#ghibli-char-ink)">{veranda}</g>
        <GhibliCutout
          file="images/ghibli_ep05/prop_clerk_desk.png"
          anchor={GHIBLI_ANCHORS.prop_clerk_desk}
          x={KACHARI.compound.desk.x + 6}
          y={KACHARI.compound.desk.y + 6}
          targetHeight={38}
        />

        {/* Neighbour's main mud house */}
        <ContactShadow x={C_MAIN.x + 250} y={C_MAIN.y + 4} rx={270} ry={16} opacity={0.26} />
        <GhibliCutout
          file="images/ghibli_ep05/mud_house_main_sketch.png"
          anchor={GHIBLI_ANCHORS.mud_house_main_sketch}
          x={C_MAIN.x + (C_MAIN.w * C_MAIN.s) / 2}
          y={C_MAIN.y + 6}
          targetHeight={270}
        />

        {/* Neighbour's corner room (কোণের ঘর) stepping forward */}
        <ContactShadow x={C_CORNER.x + 145} y={C_CORNER.y + 4} rx={165} ry={14} opacity={0.28} />
        <GhibliCutout
          file="images/ghibli_ep05/mud_house_corner_sketch.png"
          anchor={GHIBLI_ANCHORS.mud_house_corner_sketch}
          x={C_CORNER.x + (C_CORNER.w * C_CORNER.s) * 0.52}
          y={C_CORNER.y + 8}
          targetHeight={280}
        />

        {basket && <GhibliTippedBasket x={KACHARI.compound.basket.x} y={KACHARI.compound.basket.y} s={KACHARI.compound.basket.s} />}
      </g>
    )}

    {view === "corner" && (
      <g>
        <image
          href={staticFile("images/ghibli_ep05/yard_earth_floor_sketch.png")}
          x={-1500}
          y={792}
          width={5000}
          height={420}
          preserveAspectRatio="none"
        />
        <GhibliFenceRun x0={-1500} x1={N_MAIN.x + 60} base={862} h={162} />
        <GhibliFenceRun x0={N_MAIN.x + N_MAIN.w - 20} x1={N_GAP.x0} base={862} h={162} />
        <GhibliFenceRun x0={N_GAP.x1} x1={3500} base={862} h={162} />
        <path d={`M ${N_GAP.x0 + 4} 862 L ${N_GAP.x1 - 4} 862 L ${N_GAP.x1 + 60} 900 L ${N_GAP.x0 - 90} 900 Z`} fill="#b48a58" opacity={0.55} />
        {[1500, 2080, 2440, 2820].map((x, i) => (
          <UjancharBush key={x} x={x} y={872} w={170} f={f} seed={i * 3 + 1} />
        ))}

        {/* Neighbour's main mud house with Binoy's mother at the doorway (centered at x=980 so doorway aligns with MOTHER.x=1120) */}
        <ContactShadow x={980} y={N_MAIN.y + 4} rx={540} ry={22} opacity={0.28} />
        <GhibliCutout
          file="images/ghibli_ep05/mud_house_main_sketch.png"
          anchor={GHIBLI_ANCHORS.mud_house_main_sketch}
          x={980}
          y={N_MAIN.y + 10}
          targetHeight={540}
        />
        <g filter="url(#ghibli-char-ink)">{veranda}</g>
      </g>
    )}

    {view === "grove" && (
      <g>
        <image
          href={staticFile("images/ghibli_ep05/grove_floor_sketch.png")}
          x={-1600}
          y={812}
          width={5200}
          height={310}
          preserveAspectRatio="none"
        />
        <GhibliFenceRun x0={1100} x1={3600} base={862} h={155} />
        {Array.from({ length: 12 }, (_, i) => (
          <GhibliBananaClump
            key={`mb05-${i}`}
            x={-1450 + i * 420}
            y={884 + (i % 2) * 10}
            targetHeight={620 + (i % 3) * 50}
            f={f}
            seed={200 + i}
            flip={i % 2 === 0}
          />
        ))}
      </g>
    )}

    <g filter="url(#ghibli-char-ink)">{yard}</g>
  </GhibliLayer>
);

/**
 * Kachari rear brick wall plane (0.8, grove view).
 * Uses `kachari_back_wall_sketch.png` for the weathered lime-and-brick wall, while preserving the exact
 * dark doorway opening at `G_BACK.door = 560` so Haricharan (`doorway`) can stand inside the doorway and
 * the plank door leaf swings outward via `doorOpen` (`0..1`).
 */
export const GhibliKachariWallLayer: React.FC<{
  f: number;
  cam?: Cam;
  calm?: number;
  doorOpen?: number;
  doorway?: React.ReactNode;
}> = ({ cam, calm = 1, doorOpen = 1, doorway }) => {
  const y = G_BACK.y;
  const s = G_BACK.s;
  const H = (v: number) => y + v * s;
  const foot = H(-36);
  const dw = 70 * s;
  const dTop = H(-36 - 190);
  const dl = G_BACK.door - dw / 2;
  const dr = G_BACK.door + dw / 2;
  const th = (clamp(doorOpen) * 100 * Math.PI) / 180;
  const xe = dl + dw * Math.cos(th) - dw * Math.sin(th) * 0.32;
  const grow = 10 * s * Math.sin(th);

  return (
    <GhibliLayer depth={0.8} extraBlur={ujancharBgBlur(0.8, calm, cam) * 0.55}>
      <GhibliCharFilterDefs />
      <image
        href={staticFile("images/ghibli_ep05/grove_floor_sketch.png")}
        x={-1500}
        y={846}
        width={4900}
        height={260}
        preserveAspectRatio="none"
      />
      {/* Left extension & main Ghibli Kachari back wall */}
      <GhibliCutout
        file="images/ghibli_ep05/kachari_back_wall_sketch.png"
        anchor={GHIBLI_ANCHORS.kachari_back_wall_sketch}
        x={-1140}
        y={y + 18}
        targetHeight={660}
      />
      <GhibliCutout
        file="images/ghibli_ep05/kachari_back_wall_sketch.png"
        anchor={GHIBLI_ANCHORS.kachari_back_wall_sketch}
        x={70}
        y={y + 18}
        targetHeight={660}
      />

      {/* Interactive back door opening at x=560 so Haricharan bursts out cleanly */}
      <rect x={dl} y={dTop} width={dw} height={foot - dTop} fill="#1d130b" />
      <rect x={dl} y={foot - 40 * s} width={dw} height={40 * s} fill="#342012" opacity={0.65} />
      <g filter="url(#ghibli-char-ink)">{doorway}</g>
      <rect x={dl - 8 * s} y={dTop - 10 * s} width={dw + 16 * s} height={10 * s} fill="#5c3b22" stroke="#362012" strokeWidth={1.5} />
      <rect x={dl - 8 * s} y={dTop} width={8 * s} height={foot - dTop} fill="#5c3b22" stroke="#362012" strokeWidth={1.5} />
      <rect x={dr} y={dTop} width={8 * s} height={foot - dTop} fill="#5c3b22" stroke="#362012" strokeWidth={1.5} />
      {/* Swinging wooden plank door leaf */}
      <path
        d={`M ${dl} ${dTop} L ${xe.toFixed(1)} ${(dTop - grow).toFixed(1)} L ${xe.toFixed(1)} ${(foot + grow).toFixed(1)} L ${dl} ${foot} Z`}
        fill="#755032"
        stroke="#362012"
        strokeWidth={1.8}
      />
      {[0.25, 0.5, 0.75].map((q) => (
        <line
          key={q}
          x1={dl + (xe - dl) * q}
          y1={dTop - grow * q}
          x2={dl + (xe - dl) * q}
          y2={foot + grow * q}
          stroke="#462b16"
          strokeWidth={1.8}
          opacity={0.75}
        />
      ))}
      {/* Brick threshold step */}
      <rect x={dl - 12 * s} y={foot} width={dw + 24 * s} height={(y - foot) * 0.55} fill="#9c5436" stroke="#3c2012" strokeWidth={1.2} />
      <rect x={dl - 18 * s} y={foot + (y - foot) * 0.5} width={dw + 36 * s} height={(y - foot) * 0.5} fill="#8c482c" stroke="#3c2012" strokeWidth={1.2} />
    </GhibliLayer>
  );
};

/** Mid plane (0.85): in `corner` view, the large corner mud hut (কোণের ঘর); in `grove` view, behind-cow banana plants + cow + cow-screening banana clump. */
export const GhibliKachariMidLayer: React.FC<{
  view: KachariView;
  f: number;
  cam?: Cam;
  calm?: number;
  cornerBehind?: React.ReactNode;
  mid?: React.ReactNode;
  cow?: React.ReactNode;
  cowScreenOpacity?: number;
}> = ({ view, f, cam, calm = 1, cornerBehind, mid, cow, cowScreenOpacity = 1 }) => {
  if (view === "grove") {
    const { x, y } = G_HIDE;
    return (
      <>
        {/* Banana clumps BEHIND the cow's hiding spot */}
        <GhibliLayer depth={0.85} extraBlur={ujancharBgBlur(0.85, calm, cam) * 0.45}>
          {[
            [1080, 740, 1, false],
            [1320, 810, 2, true],
            [1900, 780, 3, false],
            [2260, 830, 4, true],
            [2660, 760, 5, false],
            [3100, 800, 6, true],
          ].map(([bx, th, sd, fl]) => (
            <GhibliBananaClump
              key={`nbg-${bx}`}
              x={bx as number}
              y={888}
              targetHeight={th as number}
              f={f}
              seed={300 + (sd as number)}
              flip={fl as boolean}
            />
          ))}
        </GhibliLayer>

        {/* The hidden cow slot on depth 0.85 */}
        {cow}

        {/* The cow-screening Ghibli banana clump IN FRONT of the hidden cow (leaves her ear and tail peeking out) */}
        <GhibliLayer depth={0.85} extraBlur={ujancharBgBlur(0.85, calm, cam) * 0.4} opacity={cowScreenOpacity}>
          <GhibliBananaClump x={x - 42} y={y + 12} targetHeight={810} f={f} seed={410} />
          <GhibliBananaClump x={x + 215} y={y + 10} targetHeight={760} f={f} seed={412} flip />
        </GhibliLayer>
        {mid && <GhibliLayer depth={0.85}>{mid}</GhibliLayer>}
      </>
    );
  }

  if (view !== "corner") return mid ? <GhibliLayer depth={0.85}>{mid}</GhibliLayer> : null;

  // Corner view: Binoy walks from behind the corner hut (x=250 -> 560) at y=886.
  // Draw an earth strip on the 0.85 plane beneath Binoy's feet so his feet rest on ground even in high-zoom close shots.
  return (
    <GhibliLayer depth={0.85} extraBlur={ujancharBgBlur(0.85, calm, cam) * 0.45}>
      <GhibliCharFilterDefs />
      <image
        href={staticFile("images/ghibli_ep05/yard_earth_floor_sketch.png")}
        x={-1500}
        y={868}
        width={2400}
        height={240}
        preserveAspectRatio="none"
      />
      {/* Binoy behind the corner room */}
      <g filter="url(#ghibli-char-ink)">{cornerBehind}</g>
      {/* Large Ghibli corner mud hut (কোণের ঘর) whose right wall edge sits at x ≈ 340 */}
      <ContactShadow x={-80} y={N_CORNER.y + 8} rx={480} ry={26} opacity={0.34} />
      <GhibliCutout
        file="images/ghibli_ep05/mud_house_corner_sketch.png"
        anchor={GHIBLI_ANCHORS.mud_house_corner_sketch}
        x={40}
        y={N_CORNER.y + 16}
        targetHeight={860}
      />
      <g filter="url(#ghibli-char-ink)">{mid}</g>
    </GhibliLayer>
  );
};

/** Whole Ghibli Krishnanagar Kachari backdrop (planes 0.15 .. 0.85 + atmospheric haze at 0.72). */
export const GhibliKachariBackdrop: React.FC<{
  view: KachariView;
  f: number;
  cam?: Cam;
  calm?: number;
  veranda?: React.ReactNode;
  yard?: React.ReactNode;
  cornerBehind?: React.ReactNode;
  mid?: React.ReactNode;
  doorway?: React.ReactNode;
  doorOpen?: number;
  cow?: React.ReactNode;
  cowScreenOpacity?: number;
  basket?: boolean;
}> = ({
  view,
  f,
  cam,
  calm = 1,
  veranda,
  yard,
  cornerBehind,
  mid,
  doorway,
  doorOpen = 1,
  cow,
  cowScreenOpacity = 1,
  basket = true,
}) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <GhibliPreload files={EP05_GHIBLI_PRELOAD} />
    <GhibliKachariSkyLayer view={view} f={f} cam={cam} calm={calm} />
    <GhibliKachariJungleLayer view={view} f={f} cam={cam} calm={calm} />
    <GhibliKachariTreesLayer view={view} f={f} cam={cam} calm={calm} />
    <GhibliKachariBackLayer view={view} f={f} cam={cam} calm={calm} veranda={veranda} yard={yard} basket={basket} />
    <GhibliLayer depth={0.72}>
      <GhibliAtmosphericHaze f={f} intensity={view === "grove" ? 0.92 : 0.75} seed={view === "grove" ? 67 : 53} />
    </GhibliLayer>
    {view === "grove" && <GhibliKachariWallLayer f={f} cam={cam} calm={calm} doorOpen={doorOpen} doorway={doorway} />}
    <GhibliKachariMidLayer
      view={view}
      f={f}
      cam={cam}
      calm={calm}
      cornerBehind={cornerBehind}
      mid={mid}
      cow={cow}
      cowScreenOpacity={cowScreenOpacity}
    />
  </div>
);

/** Floor layer (depth 1.0) with Ghibli beaten-earth courtyard or dappled banana-grove floor panorama, tipped basket, and interactive CucumberTrellis. */
export const GhibliKachariFloorLayer: React.FC<{
  view: KachariView;
  f: number;
  trellisTorn?: number;
  basket?: boolean;
  nearPlants?: boolean;
  under?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ view, f, trellisTorn = 0, basket = true, nearPlants = true, under, children }) => (
  <GhibliLayer depth={1}>
    <GhibliCharFilterDefs />
    {view === "grove" ? (
      <g>
        <image
          href={staticFile("images/ghibli_ep05/grove_floor_sketch.png")}
          x={-1500}
          y={852}
          width={4900}
          height={660}
          preserveAspectRatio="none"
        />
        {/* Interactive CucumberTrellis wrapped in sepia-charcoal ink harmony filter */}
        <g filter="url(#ghibli-char-ink)">
          <CucumberTrellis x={G_TRELLIS.x} y={G_TRELLIS.y} s={G_TRELLIS.s} f={f} torn={trellisTorn} />
        </g>
        {under}
        {nearPlants && (
          <g>
            <GhibliBananaClump x={2140} y={942} targetHeight={920} f={f} seed={520} />
            <GhibliBananaClump x={2620} y={968} targetHeight={960} f={f} seed={521} flip />
            <GhibliBananaClump x={-1100} y={945} targetHeight={890} f={f} seed={522} />
          </g>
        )}
      </g>
    ) : (
      <g>
        <image
          href={staticFile("images/ghibli_ep05/yard_earth_floor_sketch.png")}
          x={-1500}
          y={852}
          width={5000}
          height={658}
          preserveAspectRatio="none"
        />
        {view === "corner" && basket && (
          <GhibliTippedBasket x={KACHARI.corner.basket.x} y={KACHARI.corner.basket.y} s={KACHARI.corner.basket.s} />
        )}
        {under}
      </g>
    )}
    <g filter="url(#ghibli-char-ink)">{children}</g>
  </GhibliLayer>
);

/** Foreground bokeh & Ghibli paper-tooth grade for Episode 5. */
export const GhibliKachariForegroundAndGrade: React.FC<{
  view: KachariView;
  f: number;
  zoom?: number;
  showBokeh?: boolean;
}> = ({ view, f, zoom = 1, showBokeh = true }) => (
  <>
    {showBokeh && (
      <GhibliLayer depth={1.22} extraBlur={3.2}>
        <GhibliForegroundBokeh f={f} zoom={zoom} />
      </GhibliLayer>
    )}
    <GhibliGrade
      warmth={view === "grove" ? 0.34 : 0.26}
      vignette={0.34}
      bloomAt={view === "grove" ? [76, 22] : [68, 28]}
      paperOpacity={0.22}
    />
  </>
);
