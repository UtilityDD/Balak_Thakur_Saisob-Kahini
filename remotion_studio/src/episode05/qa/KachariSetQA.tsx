import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam, Layer, Stage } from "../../cinematic/core/Stage";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { KACHARI, KACHARI_BG, KrishnanagarKachari, kachariKeepInSet, type KachariView, type KPoint } from "../../cinematic/sets/KrishnanagarKachari";
import { UjancharCowLayer } from "../../cinematic/sets/UjancharHouse";

/**
 * KachariSetQA (Episode 5, 240 frames): the Krishnanagar kachari set (src/cinematic/sets/KrishnanagarKachari.tsx).
 *   0-79     view 1, the compound wide (late morning); placement points marked from frame 50.
 *   80-159   view 2, the neighbour's courtyard corner; placement points marked from frame 130.
 *   160-239  view 3, behind the kachari (afternoon), the Ujanchar cow standing at cowHide behind the screen clump
 *            (only her ear and tail should show). From 190: the trellis tears (0 -> 1 over 192-232) and three insets:
 *            the trellis whole (0), torn (1), and the cow-hiding split (screen clump at 40 % with the cow's placeholder
 *            silhouette in red). Placement points marked from 226.
 */

const SEG = 80;

const Label: React.FC<{ x: number; y: number; text: string; size?: number; bg?: string }> = ({ x, y, text, size = 30, bg = "rgba(20,14,8,0.62)" }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "4px 14px", background: bg, color: "#fff4dc", fontFamily: BN_FONT, fontSize: size, fontWeight: 600, borderRadius: 6, whiteSpace: "nowrap" }}>{text}</div>
);

/** A placement marker drawn on its point's plane. */
const Mark: React.FC<{ p: KPoint; name: string; col?: string }> = ({ p, name, col = "#ff3b6b" }) => (
  <Layer depth={p.depth}>
    <g>
      <circle cx={p.x} cy={p.y} r={7} fill="none" stroke={col} strokeWidth={3} />
      <line x1={p.x - 12} y1={p.y} x2={p.x + 12} y2={p.y} stroke={col} strokeWidth={2} />
      <line x1={p.x} y1={p.y - 12} x2={p.x} y2={p.y + 12} stroke={col} strokeWidth={2} />
      <text x={p.x + 10} y={p.y - 12} fill="#fff" stroke="#000" strokeWidth={3} paintOrder="stroke" fontSize={18} fontFamily="sans-serif" fontWeight={700}>
        {name}
      </text>
    </g>
  </Layer>
);

const marksFor = (view: KachariView) => {
  const V = KACHARI[view] as unknown as Record<string, unknown>;
  const out: Array<{ p: KPoint; name: string }> = [];
  for (const [k, v] of Object.entries(V)) {
    if (k === "cam" || k === "adultS") continue;
    if (Array.isArray(v)) v.forEach((q, i) => out.push({ p: q as KPoint, name: `${k}${i}` }));
    else if (v && typeof v === "object" && "depth" in (v as object)) out.push({ p: v as KPoint, name: k });
  }
  return out;
};

/** Placeholder cow silhouette (the Ujanchar cow's outline, facing +x, feet on y 0). */
const CowSilhouette: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={0.55}>
    <ellipse cx={-8} cy={-120} rx={116} ry={62} fill="#ff2a4a" />
    <path d="M 60 -186 C 110 -200 150 -214 178 -216 L 190 -172 C 170 -160 150 -140 128 -110 L 80 -120 Z" fill="#ff2a4a" />
    <path d="M 164 -218 C 182 -226 204 -222 214 -210 C 228 -194 238 -170 244 -150 C 248 -136 244 -122 232 -118 C 218 -114 204 -122 190 -140 C 180 -152 170 -180 164 -218 Z" fill="#ff2a4a" />
    <path d="M 170 -206 C 152 -216 132 -214 120 -204 C 134 -196 154 -194 170 -200 Z" fill="#ffd400" />
    {[42, -62, 66, -84].map((lx) => (
      <rect key={lx} x={lx - 9} y={-90} width={18} height={90} rx={6} fill="#ff2a4a" />
    ))}
    <path d="M -118 -160 C -134 -128 -137 -92 -131 -40" stroke="#ffd400" strokeWidth={8} fill="none" />
  </g>
);

const HIDE = KACHARI.grove.cowHide;
const cowAt = { x: HIDE.x, y: HIDE.y, s: HIDE.s ?? 1, flip: false };

const GroveView: React.FC<{ f: number; cam: Cam; torn: number; split?: boolean; marks?: boolean }> = ({ f, cam, torn, split = false, marks = false }) => {
  const c = kachariKeepInSet("grove", cam);
  return (
    <Stage cam={c} background={KACHARI_BG.grove}>
      <KrishnanagarKachari view="grove" f={f} cam={c} trellisTorn={torn} cowScreenOpacity={split ? 0.4 : 1} cow={<UjancharCowLayer f={f} cam={c} cow={cowAt} />} />
      {split && (
        <>
          <Layer depth={0.85}>
            <CowSilhouette x={HIDE.x} y={HIDE.y} s={HIDE.s ?? 1} />
          </Layer>
        </>
      )}
      {marks && marksFor("grove").map((m) => <Mark key={m.name} p={m.p} name={m.name} />)}
    </Stage>
  );
};

/** A small picture-in-picture of a full 1920 x 1080 stage. */
const Inset: React.FC<{ x: number; y: number; w: number; label: string; children: React.ReactNode }> = ({ x, y, w, label, children }) => {
  const k = w / 1920;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: 1080 * k, overflow: "hidden", border: "3px solid #fff4dc", borderRadius: 6, boxShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${k})` }}>{children}</div>
      <div style={{ position: "absolute", left: 6, bottom: 4, color: "#fff4dc", fontFamily: BN_FONT, fontSize: 20, fontWeight: 700, textShadow: "0 1px 3px #000" }}>{label}</div>
    </div>
  );
};

export const KachariSetQA: React.FC = () => {
  ensureBanglaFont();
  const frame = useCurrentFrame();
  const seg = Math.min(2, Math.floor(frame / SEG));
  const local = frame - seg * SEG;

  if (seg < 2) {
    const view: KachariView = seg === 0 ? "compound" : "corner";
    const cam = kachariKeepInSet(view, KACHARI[view].cam);
    const marks = local >= 50;
    return (
      <AbsoluteFill>
        <Stage cam={cam} background={KACHARI_BG[view]}>
          <KrishnanagarKachari view={view} f={frame} cam={cam} />
          {marks && marksFor(view).map((m) => <Mark key={m.name} p={m.p} name={m.name} />)}
        </Stage>
        <Label x={24} y={20} text={view === "compound" ? "1  Compound wide, late morning (scene 01 shot 1)" : "2  Neighbour's courtyard corner (scene 01 shots 2-6)"} />
        {marks && <Label x={24} y={74} size={22} text="placement points (KACHARI[view].*)" />}
      </AbsoluteFill>
    );
  }

  const torn = Math.max(0, Math.min(1, (local - 32) / 40));
  const insets = local >= 30;
  return (
    <AbsoluteFill>
      <GroveView f={frame} cam={KACHARI.grove.cam} torn={torn} marks={local >= 66} />
      <Label x={24} y={1000} text={`3  Behind the kachari, afternoon (scene 02): trellisTorn ${torn.toFixed(2)}; cow hidden at cowHide`} size={26} />
      {insets && (
        <>
          <Inset x={20} y={20} w={600} label="trellis whole (0)">
            <GroveView f={frame} cam={{ x: -630, y: 260, zoom: 1.9 }} torn={0} />
          </Inset>
          <Inset x={660} y={20} w={600} label="trellis torn (1)">
            <GroveView f={frame} cam={{ x: -630, y: 260, zoom: 1.9 }} torn={1} />
          </Inset>
          <Inset x={1300} y={20} w={600} label="cow split: red = cow behind the screen clump">
            <GroveView f={frame} cam={{ x: 812, y: 250, zoom: 1.7 }} torn={0} split />
          </Inset>
        </>
      )}
    </AbsoluteFill>
  );
};
