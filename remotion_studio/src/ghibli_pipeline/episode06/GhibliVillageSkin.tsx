import React from "react";
import { staticFile } from "remotion";
import { Layer } from "../../cinematic/core/Stage";
import { ujancharBgBlur, ujancharBgFilter } from "../../cinematic/sets/UjancharHouse";
import type {
  SetSkin,
  UjancharSkinBackdropArgs,
  UjancharSkinFloorArgs,
  VillageSkinBackdropArgs,
  VillageSkinPartArgs,
} from "../../cinematic/sets/SetSkin";
import { GhibliCutout } from "../GhibliStage";
import { GHIBLI_ANCHORS as EP05 } from "../episode05/plateAnchors";
import { GHIBLI_ANCHORS as EP06 } from "./plateAnchors";

/**
 * Episode 6 hand-painted skin for all three village views (`field`, `lane`, `house`) AND
 * Scene 01's `UjancharHouse` courtyard, using the Ghibli watercolour + sepia-ink plates in
 * `public/images/ghibli_ep06/` and shared Ujanchar plates in `public/images/ghibli_ep05/`.
 */

const IMG6 = (n: string) => staticFile(`images/ghibli_ep06/${n}.png`);
const IMG6_4K = (n: string) => staticFile(`images/ghibli_ep06/raw_x4/${n}.png`);
const IMG5 = (n: string) => staticFile(`images/ghibli_ep05/${n}.png`);

/**
 * Crisp Ghibli watercolor grade & optical-only DOF (replaces CAM-11 vector blur/desaturation
 * which washed out hand-drawn sepia ink lines and watercolor texture).
 */
const ghibliGrade = (time: VillageSkinBackdropArgs["time"] | "morning" | "dawn") =>
  time === "sunset"
    ? "contrast(1.07) saturate(1.16) brightness(1.01)"
    : time === "afternoon" || time === "dawn"
      ? "contrast(1.06) saturate(1.13) brightness(1.02)"
      : "contrast(1.06) saturate(1.10) brightness(1.02)";

const ghibliOpticalBlur = (depth: number, cam?: { zoom?: number }) => {
  const z = cam?.zoom ?? 1;
  const zoomBokeh = z > 1.45 ? Math.min(3.0, (z - 1.45) * 1.35 * (1 - depth)) : 0;
  // Keep focal planes (0.65, 0.8, 1.0) razor-sharp; only gentle atmospheric softness on far sky/trees
  const baseAtmos = depth <= 0.2 ? 0.8 : depth <= 0.4 ? 0.5 : 0;
  return baseAtmos + zoomBokeh;
};

// Plate geometry (measured on 2880x1620 plates)
const EDGE = { horizonFrac: 0.612, x: -240, w: 3600 };
const LANE_BACK = { horizonFrac: 0.62, x: -900, w: 4600 };
const FLOOR = { horizonFrac: 0.228 };

const F_FAR_GROUND = 724;
const F_MID_TOP = 742;
const F_FLOOR_TOP = 860;
const L_HAY = { x: 1980, y: 940 };
const F_STALL = { x: 2620, y: 930 };
const F_LOG = { x: 1300, y: 1010 };

const Plate: React.FC<{
  href: string;
  x: number;
  w: number;
  horizonFrac: number;
  horizonY: number;
  mask?: string;
  opacity?: number;
}> = ({ href, x, w, horizonFrac, horizonY, mask, opacity = 1 }) => {
  const h = w * (1620 / 2880);
  return (
    <image
      href={href}
      x={x}
      y={horizonY - horizonFrac * h}
      width={w}
      height={h}
      preserveAspectRatio="none"
      mask={mask}
      opacity={opacity}
    />
  );
};

const GroundMask: React.FC<{ id: string; fadeFrom: number; fadeTo: number }> = ({ id, fadeFrom, fadeTo }) => (
  <defs>
    <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={0} y1={fadeFrom} x2={0} y2={fadeTo}>
      <stop offset="0" stopColor="#fff" stopOpacity={0} />
      <stop offset="1" stopColor="#fff" stopOpacity={1} />
    </linearGradient>
    <mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-2000} width={12000} height={6000}>
      <rect x={-4000} y={-2000} width={12000} height={6000} fill={`url(#${id}-g)`} />
    </mask>
  </defs>
);

const timeWash = (time: VillageSkinBackdropArgs["time"]) =>
  time === "sunset"
    ? { color: "#ff9e5e", opacity: 0.26, blend: "multiply" as const }
    : time === "afternoon"
      ? { color: "#ffd29a", opacity: 0.14, blend: "multiply" as const }
      : null;

const Wash: React.FC<{ time: VillageSkinBackdropArgs["time"] }> = ({ time }) => {
  const w = timeWash(time);
  return w ? (
    <rect x={-4000} y={-2000} width={12000} height={6000} fill={w.color} opacity={w.opacity} style={{ mixBlendMode: w.blend }} />
  ) : null;
};

/* ------------------------------------------------------------------ */
/* UjancharVillageField: field, lane, house backdrops & floor parts    */
/* ------------------------------------------------------------------ */

  const VillagePaintedBackdrop: React.FC<VillageSkinBackdropArgs> = ({ view, time, cam, far, yard, mid }) => {
    const skyImg = time === "sunset" ? IMG6_4K("sky_village_sunset") : IMG6_4K("sky_village_late_morning");

    return (
          <div style={{ position: "absolute", inset: 0, filter: ghibliGrade(time) }}>
            <Layer depth={0.15} extraBlur={ghibliOpticalBlur(0.15, cam)}>
              <image href={skyImg} x={-520} y={-380} width={3160} height={1778} preserveAspectRatio="none" />
            </Layer>

            {view === "field" && (
        <>
                  <Layer depth={0.65} extraBlur={ghibliOpticalBlur(0.65, cam)}>
                    <Plate href={IMG6_4K("village_field_edge_back")} x={EDGE.x} w={EDGE.w} horizonFrac={EDGE.horizonFrac} horizonY={F_FAR_GROUND} />
                    <GhibliCutout file="images/ghibli_ep06/tree_banyan_field.png" anchor={EP06.tree_banyan_field} x={980} y={F_FAR_GROUND + 14} targetHeight={640} />
                    <GhibliCutout file="images/ghibli_ep06/bamboo_clump.png" anchor={EP06.bamboo_clump} x={1560} y={F_FAR_GROUND + 10} targetHeight={520} />
                    <GhibliCutout file="images/ghibli_ep06/haystack_b.png" anchor={EP06.haystack_b} x={2280} y={F_FAR_GROUND + 16} targetHeight={240} />
                    <Wash time={time} />
                    {far}
                    {yard}
                  </Layer>
                    <Layer depth={0.8} extraBlur={ghibliOpticalBlur(0.8, cam)}>
                      <GroundMask id="g6-mid" fadeFrom={F_MID_TOP - 8} fadeTo={F_MID_TOP + 44} />
                      <Plate href={IMG6_4K("field_floor")} x={-460} w={4200} horizonFrac={FLOOR.horizonFrac} horizonY={F_MID_TOP - 28} mask="url(#g6-mid)" />
                      <Wash time={time} />
                      {mid}
                    </Layer>
                  </>
      )}

                  {view === "lane" && (
                      <Layer depth={0.65} extraBlur={ghibliOpticalBlur(0.65, cam)}>
                        <Plate href={IMG6_4K("village_lane_back")} x={LANE_BACK.x} w={LANE_BACK.w} horizonFrac={LANE_BACK.horizonFrac} horizonY={806} />
                        <GhibliCutout file="images/ghibli_ep06/bamboo_clump.png" anchor={EP06.bamboo_clump} x={1750} y={806} targetHeight={480} />
                        <Wash time={time} />
                        {far}
                        {yard}
                      </Layer>
      )}

                      {view === "house" && (
                          <Layer depth={0.65} extraBlur={ghibliOpticalBlur(0.65, cam)}>
                            <Plate href={IMG6_4K("village_field_edge_back")} x={-420} w={3400} horizonFrac={EDGE.horizonFrac} horizonY={862} />
                            <GhibliCutout file="images/ghibli_ep06/haystack_b.png" anchor={EP06.haystack_b} x={1760} y={864} targetHeight={340} />
                            <Wash time={time} />
                            {far}
                            {yard}
                          </Layer>
      )}

                          {time === "sunset" && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background: "radial-gradient(ellipse 48% 36% at 64% 32%, rgba(255,190,105,0.75) 0%, rgba(255,140,65,0.22) 52%, rgba(0,0,0,0) 100%)",
                                mixBlendMode: "screen",
                                opacity: 0.45,
                              }}
                            />
                          )}
                        </div>
                      );
};

                      const fieldPart = ({part, time, original, seller, log, logShadows}: VillageSkinPartArgs): React.ReactNode | undefined => {
  if (part === "ground") {
    return (
                      <>
                        <GroundMask id="g6-near" fadeFrom={F_FLOOR_TOP - 40} fadeTo={F_FLOOR_TOP + 30} />
                        {/* Single wide span so there is no mirror seam on the playing field */}
                        <Plate href={IMG6_4K("field_floor")} x={-1200} w={5400} horizonFrac={FLOOR.horizonFrac} horizonY={F_MID_TOP - 36} mask="url(#g6-near)" />
                        <Wash time={time} />
                      </>
                      );
  }
                      if (part === "set") {
    return <GhibliCutout file="images/ghibli_ep05/tree_mango_sketch.png" anchor={EP05.tree_mango_sketch} x={250} y={918} targetHeight={980} />;
  }
                      if (part === "near") {
    return (
                      <g>
                        <GhibliCutout file="images/ghibli_ep05/banana_clump_sketch.png" anchor={EP05.banana_clump_sketch} x={F_STALL.x + 430} y={F_STALL.y - 24} targetHeight={470} />
                        <g transform="translate(3460, 980) scale(-1, 1)">
                          <GhibliCutout file="images/ghibli_ep05/banana_clump_sketch.png" anchor={EP05.banana_clump_sketch} x={0} y={0} targetHeight={560} />
                        </g>
                        {/* Keep seller behind the painted stall counter */}
                        <g transform={`translate(${F_STALL.x}, ${F_STALL.y})`}>{seller}</g>
                        <GhibliCutout file="images/ghibli_ep06/sweet_stall.png" anchor={EP06.sweet_stall} x={F_STALL.x} y={F_STALL.y + 8} targetHeight={590} />
                        <GhibliCutout file="images/ghibli_ep06/prop_rice_sack.png" anchor={EP06.prop_rice_sack} x={F_STALL.x - 190} y={F_STALL.y + 18} targetHeight={128} />
                        <GhibliCutout file="images/ghibli_ep06/prop_bamboo_basket.png" anchor={EP06.prop_bamboo_basket} x={F_STALL.x + 195} y={F_STALL.y + 20} targetHeight={96} />
                        {log && (
                          <g>
                            {(logShadows ?? []).map((sh, i) => (
                              <ellipse
                                key={i}
                                cx={sh.x - (time === "sunset" ? sh.h * 0.45 : 30)}
                                cy={F_LOG.y + 12}
                                rx={time === "sunset" ? sh.h * 0.45 : sh.w ?? 60}
                                ry={18}
                                fill="#24160e"
                                opacity={0.26}
                              />
                            ))}
                            <GhibliCutout file="images/ghibli_ep06/fallen_log.png" anchor={EP06.fallen_log} x={F_LOG.x} y={F_LOG.y + 42} targetHeight={460} />
                          </g>
                        )}
                        {/* Preserve vector lozenge jar or extra interactive props if needed */}
                        {!log && original && null}
                      </g>
                      );
  }
                      return undefined;
};

                      const lanePart = ({part, time, crossing}: VillageSkinPartArgs): React.ReactNode | undefined => {
  if (part === "ground") {
    return (
                      <>
                        <GroundMask id="g6-lane" fadeFrom={785} fadeTo={835} />
                        <Plate href={IMG6_4K("field_floor")} x={-1400} w={5800} horizonFrac={FLOOR.horizonFrac} horizonY={770} mask="url(#g6-lane)" />
                        <Wash time={time} />
                        {crossing}
                      </>
                      );
  }
                      if (part === "set") {
    return (
                      <g>
                        <GhibliCutout file="images/ghibli_ep05/banana_clump_sketch.png" anchor={EP05.banana_clump_sketch} x={300} y={880} targetHeight={430} />
                        <GhibliCutout file="images/ghibli_ep05/mud_house_main_sketch.png" anchor={EP05.mud_house_main_sketch} x={1160} y={915} targetHeight={480} />
                        <g transform="translate(3620, 885) scale(-1, 1)">
                          <GhibliCutout file="images/ghibli_ep05/mud_house_corner_sketch.png" anchor={EP05.mud_house_corner_sketch} x={0} y={0} targetHeight={490} />
                        </g>
                        {[-900, -320, 260, 1680, 2240, 3360, 3920].map((fx) => (
                          <GhibliCutout key={fx} file="images/ghibli_ep05/prop_bamboo_fence.png" anchor={EP05.prop_bamboo_fence} x={fx} y={904} targetHeight={175} />
                        ))}
                        <g transform="translate(2360, 890) scale(-1, 1)">
                          <GhibliCutout file="images/ghibli_ep05/banana_clump_sketch.png" anchor={EP05.banana_clump_sketch} x={0} y={0} targetHeight={440} />
                        </g>
                      </g>
                      );
  }
                      if (part === "near") {
    return <GhibliCutout file="images/ghibli_ep06/haystack_a.png" anchor={EP06.haystack_a} x={L_HAY.x} y={L_HAY.y + 8} targetHeight={380} />;
  }
                      return undefined;
};

                      const housePart = ({part, time, doorway, original}: VillageSkinPartArgs): React.ReactNode | undefined => {
  if (part === "ground") {
    return (
                      <>
                        <image href={IMG5("yard_earth_floor_sketch")} x={-1500} y={850} width={5000} height={820} preserveAspectRatio="none" />
                        <Wash time={time} />
                      </>
                      );
  }
                      if (part === "set") {
    return (
                      <g>
                        {doorway}
                        <GhibliCutout file="images/ghibli_ep06/friend_house_front.png" anchor={EP06.friend_house_front} x={860} y={874} targetHeight={760} />
                      </g>
                      );
  }
                      if (part === "near") {
    // Keep interactive ShirtOnPeg + ClothesLine with ink filter so the ten-rupee pocket pull works seamlessly
    return <g filter="url(#ghibli-char-ink)">{original}</g>;
  }
                      return undefined;
};

                      /* ------------------------------------------------------------------ */
                      /* UjancharHouse (Scene 01 courtyard)                                  */
                      /* ------------------------------------------------------------------ */

                            const UjancharPaintedBackdrop: React.FC<UjancharSkinBackdropArgs> = ({time, cam, veranda, yard}) => (
                              <div style={{ position: "absolute", inset: 0, filter: ghibliGrade(time) }}>
                                <Layer depth={0.15} extraBlur={ghibliOpticalBlur(0.15, cam)}>
                                  <image href={IMG5("sky_kachari_morning")} x={-480} y={-360} width={2960} height={1665} preserveAspectRatio="none" />
                                </Layer>
                                  <Layer depth={0.35} extraBlur={ghibliOpticalBlur(0.35, cam)}>
                                    <image href={IMG5("far_trees_sketch")} x={-520} y={360} width={3400} height={540} preserveAspectRatio="none" />
                                  </Layer>
                                    <Layer depth={0.65} extraBlur={ghibliOpticalBlur(0.65, cam)}>
                                      {/* Beaten-earth courtyard on the 0.65 plane (Scene 01 stages everyone on 0.65, so the floor must live here) */}
                                      <image href={IMG5("yard_earth_floor_sketch")} x={-1500} y={845} width={5000} height={820} preserveAspectRatio="none" />
                                      {/* Align Ujanchar mud hut plinth to UJANCHAR.HUT (y=806..852 on 0.65 plane) so both plates & slates sit on the veranda */}
                                      <GhibliCutout file="images/ghibli_ep05/mud_house_corner_sketch.png" anchor={EP05.mud_house_corner_sketch} x={-100} y={862} targetHeight={560} />
                                      <GhibliCutout file="images/ghibli_ep05/mud_house_main_sketch.png" anchor={EP05.mud_house_main_sketch} x={760} y={860} targetHeight={600} />
                                      <GhibliCutout file="images/ghibli_ep05/tree_mango_sketch.png" anchor={EP05.tree_mango_sketch} x={1720} y={856} targetHeight={760} />
                                      <GhibliCutout file="images/ghibli_ep05/banana_clump_sketch.png" anchor={EP05.banana_clump_sketch} x={1440} y={860} targetHeight={420} />
                                      <GhibliCutout file="images/ghibli_ep05/prop_bamboo_fence.png" anchor={EP05.prop_bamboo_fence} x={1520} y={862} targetHeight={165} />
                                      <GhibliCutout file="images/ghibli_ep05/prop_bamboo_fence.png" anchor={EP05.prop_bamboo_fence} x={2080} y={862} targetHeight={165} />
                                      {veranda}
                                      {yard}
                                    </Layer>
                                  </div>
                                  );

                                  const UjancharPaintedFloor: React.FC<UjancharSkinFloorArgs> = ({time, under, children}) => (
                                    <Layer depth={1}>
                                      <rect x={-1500} y={760} width={5000} height={920} fill="#c8a274" />
                                      <image href={IMG5("yard_earth_floor_sketch")} x={-1500} y={770} width={5000} height={900} preserveAspectRatio="none" />
                                      {time === "dawn" && <rect x={-1500} y={840} width={5000} height={800} fill="#ffb27a" opacity={0.14} style={{ mixBlendMode: "multiply" }} />}
                                      {under}
                                      <g filter="url(#ghibli-char-ink)">{children}</g>
                                    </Layer>
                                    );

                                    export const EP06_GHIBLI_SKIN: SetSkin = {
                                      inkCharacters: true,
  villageBackdrop: (a) => <VillagePaintedBackdrop {...a} />,
  villagePart: (a) => (a.view === "field" ? fieldPart(a) : a.view === "lane" ? lanePart(a) : housePart(a)),
  ujancharBackdrop: (a) => <UjancharPaintedBackdrop {...a} />,
  ujancharFloor: (a) => <UjancharPaintedFloor {...a} />,
};
