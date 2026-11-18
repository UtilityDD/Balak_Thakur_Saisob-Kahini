import React from "react";
import { lerp } from "../core/anim";

export type HandShape = "relaxed" | "open" | "point" | "fist" | "hold" | "pranam" | "abhaya" | "cup";

interface HandPreset {
  curls: [number, number, number, number]; // index..pinky, 0 straight .. 1 fully curled
  spread: number; // radians between fingers
  thumb: number; // thumb angle out from palm (rad)
  thumbCurl: number;
  view: "back" | "palm" | "side";
  grip?: boolean; // fingers wrap around the grip centre (object held at the hand's centre)
}

const PRESETS: Record<HandShape, HandPreset> = {
  relaxed: { curls: [0.28, 0.34, 0.4, 0.46], spread: 0.05, thumb: 0.35, thumbCurl: 0.3, view: "back" },
  open: { curls: [0, 0, 0.02, 0.05], spread: 0.17, thumb: 0.85, thumbCurl: 0, view: "palm" },
  point: { curls: [0, 0.95, 1, 1], spread: 0.02, thumb: 0.2, thumbCurl: 0.8, view: "back" },
  fist: { curls: [1, 1, 1, 1], spread: 0, thumb: 0.15, thumbCurl: 0.9, view: "back" },
  hold: { curls: [0.85, 0.88, 0.9, 0.92], spread: 0, thumb: 0.5, thumbCurl: 0.5, view: "side", grip: true },
  pranam: { curls: [0, 0, 0, 0], spread: 0, thumb: 0.1, thumbCurl: 0, view: "side" },
  abhaya: { curls: [0, 0, 0, 0.04], spread: 0.05, thumb: 0.45, thumbCurl: 0.1, view: "palm" },
  cup: { curls: [0.4, 0.42, 0.45, 0.48], spread: 0.03, thumb: 0.55, thumbCurl: 0.2, view: "palm", grip: true },
};

/** Tapered, rounded finger segment along +y (w1 at the base, w2 at the end). */
const seg = (len: number, w1: number, w2: number) =>
  `M ${-w1} 0 C ${-w1 * 1.04} ${len * 0.45} ${-w2 * 1.05} ${len * 0.8} ${-w2} ${len} A ${w2} ${w2} 0 0 0 ${w2} ${len} C ${w2 * 1.05} ${len * 0.8} ${w1 * 1.04} ${len * 0.45} ${w1} 0 Z`;

/**
 * A hand drawn in wrist-local space: wrist at (0,0), fingers point down +y (along the forearm).
 * `L` = hand length (wrist → middle fingertip). `side` = +1 right hand (thumb toward −x), −1 left.
 */
export const Hand: React.FC<{ shape: HandShape; L: number; skin: string; shade: string; palm?: string; side: 1 | -1; flex?: number }> = ({
  shape,
  L,
  skin,
  shade,
  palm: palmIn,
  side,
  flex = 0,
}) => {
  const p = PRESETS[shape];
  const ink = "#5a2e1e";
  // palm / pads / nails derived from THIS character's skin (no pale "bandage" hands on darker skin)
  const mixHex = (a: string, b: string, t: number) => {
    const pa = parseInt(a.slice(1, 7), 16), pb = parseInt(b.slice(1, 7), 16);
    const ch = (sh: number) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
    return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
  };
  const palm = palmIn ?? mixHex(skin, "#ffd9c4", 0.22);
  const pad = mixHex(skin, "#ffe4d6", 0.3);
  const nail = mixHex(skin, "#fff0ea", 0.4);
  const pw = L * 0.52; // palm width (slightly thicker)
  const pl = L * 0.47; // palm length
  const fw = pw / 5.2; // finger width (thinner than before so gaps read)
  const lens = [0.47, 0.53, 0.5, 0.4].map((k) => k * L);
  const tx = -side; // thumb side
  // wrapped fingers follow a circle around the hand's centre, where the held object sits
  const Rg = L * 0.12 + fw * 0.5; // centre-line radius of the wrapped fingers
  const G = { x: 0, y: pl + L * 0.1 };
  const wrapPath = (t0: number, sweep: number) => {
    let d = "";
    for (let k = 0; k <= 10; k++) {
      const t = t0 + (sweep * k) / 10;
      d += `${k ? "L" : "M"} ${(G.x + side * Rg * Math.sin(t)).toFixed(2)} ${(G.y - Rg * Math.cos(t)).toFixed(2)} `;
    }
    return d;
  };
  const gripFingers = (
    <g>
      {[3, 2, 1, 0].map((i) => {
        const curl = Math.min(1, p.curls[i] + flex * (0.08 + i * 0.03));
        const d = wrapPath(-0.3 + i * 0.2, 0.6 + curl * 1.8);
        return (
          <g key={`g${i}`}>
            <path d={d} fill="none" stroke={shade} strokeWidth={fw * 1.3} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} transform={`translate(${fw * 0.1}, ${fw * 0.12})`} />
            <path d={d} fill="none" stroke={skin} strokeWidth={fw * 1.05} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
  // filled finger segment: a shade copy offset to the lower right gives a soft shade edge
  const fSeg = (d: string, ty: number) => (
    <g>
      <path d={d} transform={`translate(${fw * 0.2}, ${ty + 0.4})`} fill={shade} opacity={0.5} />
      <path d={d} transform={`translate(0, ${ty})`} fill={skin} stroke={ink} strokeWidth={0.5} strokeOpacity={0.35} />
    </g>
  );

  if (p.view === "side") {
    // seen from the thumb side: thin palm wedge, fingers together
    const curl = (p.curls[0] + p.curls[1]) / 2;
    const fingerLen = L * 0.5 * (1 - curl * 0.55);
    return (
      <g>
        <path d={`M ${-pw * 0.22} 0 L ${pw * 0.22} 0 L ${pw * 0.2} ${pl} L ${-pw * 0.25} ${pl} Z`} fill={skin} />
        {p.grip ? gripFingers : curl < 0.4 ? (
          <path
            d={`M ${-pw * 0.25} ${pl - 2} L ${-pw * 0.2} ${pl + fingerLen} Q ${0} ${pl + fingerLen + fw} ${pw * 0.18} ${pl + fingerLen - 1} L ${pw * 0.2} ${pl - 2} Z`}
            fill={skin}
          />
        ) : (
          // wrapped fingers (gripping): a C-shape around the held object
          <path
            d={`M ${-pw * 0.25} ${pl - 2} Q ${-pw * 0.55} ${pl + L * 0.28} ${pw * 0.05} ${pl + L * 0.3} Q ${pw * 0.42} ${pl + L * 0.24} ${pw * 0.22} ${pl + L * 0.05} L ${pw * 0.2} ${pl - 2} Z`}
            fill={skin}
          />
        )}
        <path d={`M ${-pw * 0.2} ${pl * 0.55} L ${-pw * 0.18} ${pl + fingerLen * 0.9}`} stroke={shade} strokeWidth={0.8} opacity={0.25} />
        {/* thumb */}
        <path
          d={`M ${tx * pw * 0.1} ${pl * 0.3} Q ${tx * pw * 0.45} ${pl * 0.5} ${tx * pw * (0.35 + p.thumb * 0.2)} ${pl * 0.95} L ${tx * pw * 0.15} ${pl * 0.9} Z`}
          fill={skin}
          stroke={shade}
          strokeWidth={0.8}
        />
      </g>
    );
  }

  const palmFill = p.view === "palm" ? palm : skin;
  const fingers = [0, 1, 2, 3].map((i) => {
    const curl = Math.min(1, p.curls[i] + flex * (0.08 + i * 0.03));
    const bx = lerp(-pw / 2 + fw * 0.6, pw / 2 - fw * 0.6, i / 3) * -side; // index nearest the thumb
    const ang = (i - 1.5) * p.spread * -side;
    const seg1 = lens[i] * 0.55 * (1 - curl * 0.65);
    const seg2 = lens[i] * 0.45 * (1 - curl * 0.95);
    const bend = curl * 0.6 * side;
    return { bx, ang, seg1, seg2, bend, curl };
  });

  return (
    <g>
      {/* palm: narrow at the wrist → wide at the knuckles, fleshy thumb mound */}
      <path
        d={`M ${-pw * 0.3} 0 C ${-pw * 0.42} ${pl * 0.25} ${-pw * 0.56} ${pl * 0.6} ${-pw * 0.52} ${pl} Q 0 ${pl + pw * 0.12} ${pw * 0.52} ${pl} C ${pw * 0.56} ${pl * 0.6} ${pw * 0.42} ${pl * 0.25} ${pw * 0.3} 0 Z`}
        fill={palmFill}
        stroke={ink}
        strokeWidth={0.7}
        strokeOpacity={0.45}
      />
      <ellipse cx={tx * pw * 0.3} cy={pl * 0.45} rx={pw * 0.22} ry={pl * 0.32} fill={p.view === "palm" ? pad : skin} opacity={0.7} />
      {p.view === "palm" && (
        <g stroke={shade} strokeWidth={0.7} fill="none" opacity={0.25}>
          <path d={`M ${-pw * 0.4} ${pl * 0.45} Q 0 ${pl * 0.35} ${pw * 0.42} ${pl * 0.55}`} />
          <path d={`M ${tx * pw * 0.2} ${pl * 0.15} Q ${tx * pw * 0.05} ${pl * 0.55} ${-tx * pw * 0.1} ${pl * 0.95}`} />
        </g>
      )}
      {/* fingers */}
      {p.grip ? gripFingers : fingers.map((fg, i) => (
        <g key={i} transform={`translate(${fg.bx}, ${pl - 1}) rotate(${(fg.ang * 180) / Math.PI})`}>
          {fSeg(seg(fg.seg1 + 1.5, fw * 0.53, fw * 0.47), -1)}
          <g transform={`translate(0, ${fg.seg1}) rotate(${(fg.bend * 180) / Math.PI})`}>
            {fSeg(seg(fg.seg2 + fw * 0.2, fw * 0.47, fw * 0.38), -1)}
            {fg.curl < 0.4 &&
              (p.view === "back" ? (
                <ellipse cx={0} cy={fg.seg2 - fw * 0.1} rx={fw * 0.26} ry={fw * 0.34} fill={nail} opacity={0.75} />
              ) : (
                <ellipse cx={0} cy={fg.seg2 - fw * 0.05} rx={fw * 0.28} ry={fw * 0.22} fill={pad} opacity={0.6} />
              ))}
          </g>
          {fg.curl > 0.6 && <ellipse cx={0} cy={fg.seg1 - 1} rx={fw * 0.45} ry={fw * 0.35} fill={shade} opacity={0.35} />}
        </g>
      ))}
      {/* knuckles: soft highlights, not lines */}
      {p.view === "back" && fingers.map((fg, i) => <ellipse key={`k${i}`} cx={fg.bx} cy={pl - fw * 0.2} rx={fw * 0.32} ry={fw * 0.22} fill="#ffffff" opacity={0.12} />)}
      {/* thumb (two segments) */}
      <g transform={`translate(${tx * pw * 0.42}, ${pl * 0.28}) rotate(${(tx * p.thumb * 180) / Math.PI})`}>
        {fSeg(seg(L * 0.22, fw * 0.66, fw * 0.56), 0)}
        <g transform={`translate(0, ${L * 0.2}) rotate(${(-tx * p.thumbCurl * 1.1 * 180) / Math.PI})`}>
          {fSeg(seg(L * 0.17, fw * 0.56, fw * 0.44), -1)}
        </g>
      </g>
    </g>
  );
};
