# src/cinematic: the shared toolkit

Camera, animation maths, character rigs, divine light, sets and fx used by every episode. World coordinates are
pixels on the 1920 x 1080 frame, y down. Everything is a pure function of the frame: no `Math.random()`, time or
state carried between frames (use `hash` and `noise1`). Many components take two clocks: `f` (story) and
`lifeF` (life: breathing, blinks, idle). See `src/episode/README.md` for where they come from.

## Where to look

| Path | What it is |
|---|---|
| `core/Stage.tsx` | `Stage` (multiplane camera, `Cam { x, y, zoom, shake, rot, focus, dof }`), `Layer` (`depth`, `blend`, `extraBlur`, `opacity`), `Grade` (warmth, vignette, flash, tint, grain). |
| `core/anim.ts` | `clamp`, `lerp`, `EASE`, `track`, `makeActing` + `PoseKey`, `noise1`, `hash`, `blink`, `saccade`, `windowed`, `flicker`, `safeId`, `TAU`. |
| `rig/Puppet.tsx` | Standing / walking / kneeling / seated human (`CastMember`, `Pose`, `BASE_POSE`, `SceneLights`, `puppetBreath`, `faceFor`). |
| `rig/Head.tsx`, `rig/head3d.ts` | The 3D-projected head (`Head`, `HeadLook`, `HeadState`) and its geometry (`FACE_*` presets, `headModel` ...). |
| `rig/Hand.tsx` | The one shared five-finger hand (`Hand`, `HandShape`, `HandView`), adult and `baby`. |
| `rig/cast.ts` | `CAST` (Episode 1 sheet, `CastEntry`), `FACE_LOOKS` (per-character face tuning). |
| `rig/lipsync.ts`, `rig/idle.ts` | Mouth shapes from voice envelopes; background-extra idle life. |
| `divine/Divine.tsx` | `DIVINE` palette, `DivineDefs`, `DivineAura`, `Motes`, `BabyThakur`, `SacredLight`, `LotusOfLight`, `timeWarp`, `DivineCatchlight`. |
| `sets/*.tsx` | Reusable locations (below). |
| `fx/Fx.tsx` | `GlowDefs`, `Glow`, `Flame`, `Diya`, `Smoke`, `Sparks`, `Sparkler`, `CrackerBundle`, `Fireworks`, `Bokeh`, `Garland`. |
| `fonts.ts` | `BN_FONT` (Baloo Da 2) and `ensureBanglaFont()`; importing `BN_FONT` loads the font. |
| `audio/Mix.tsx` | Ducking `Audio` wrapper (Episode 1 only). |
| `scenes/` | Episode 1 scenes 00 to 08 (`Scene00Intro` is every episode's intro). `Scene03Arrival.tsx.tmp.*` is a stray temp file, not compiled. |
| `HandQA.tsx`, `HeadQA.tsx`, `EyeQA.tsx`, `GhomtaQA.tsx`, `ToddlerQA.tsx`, `CastLineup.tsx` | Rig QA compositions registered in `src/Root.tsx`. |

## Camera gotchas (core/Stage.tsx)

- A plane at depth `d` shifts by `-x * d` and scales by `zoom ** d`. To centre world (px, py) on depth 1:
  `x = px - 960`, `y = py - 540`.
- `Layer` children go inside an `<svg>`: SVG only. `Grade` and HTML overlays are direct children of `Stage`.
- `Stage` always adds a slow gimbal drift (about 2.2 px x, 1.6 px y, 0.18 degrees roll) and a fixed colour lift
  (`brightness(1.10) saturate(1.18) contrast(1.04)`). Draw planes with overscan: no background edge may show.
- `rot` is applied once to the whole frame (no parallax). Keep `dof` modest (1 to 3): blur is a CSS filter.
- `makeActing` defaults to `ease: "backOut"` (overshoot); pass `"inOut"` for gentle moves. Gestures start 6 to 8
  frames before their cue; no pose frozen longer than about 20 frames.

## Rig

### `Puppet` (rig/Puppet.tsx)

```tsx
<Puppet cast={CAST.charu} f={f} lifeF={lifeF} x={980} y={1000} scale={1.3} acting={act} mouth={m} talk={t} />
```

Props: `cast`, `f` (story clock: acting, mouth, talk), `lifeF` (life clock: breathing, blinks, saccades, idle sway,
weight shifts; defaults to `f`), `x`, `y` (feet line), `scale`, `flip`, `acting` (`(f) => Partial<Pose>`),
`mouth` (`(f) => MouthState`), `talk` (`(f) => 0..1`; shallow breathing and catch-breaths while speaking), `light`,
`lights` (or `<SceneLights.Provider>`), `seated`, `props` (renderers for `rProp` / `lProp`), `opacity`,
`stillness` (0..1; use 1 when arms are solved onto something, such as a held baby), `breathRate` (1 calm, about
1.6 frightened; may animate), `sigh` (`(f) => 0..1`: a visible deep breath of relief).

- `puppetBreath({ t, f, seed, child, stillness, rate, sigh, talk })` returns the `{ chest, head }` lift Puppet
  uses. Scenes that mirror Puppet's shoulder for arm targets (a held baby) call it to get the same numbers
  (`Scene01cMotherLap`, `Scene01eFather`, `Scene02a0Journey`).
- `acting` is sampled around `f` (about f - 12 to f + 9): keep it pure. Adult poses are smoothed over about 9
  frames (a `bodyX`/`bodyY` jump over 120 px counts as a cut). Children (`age: "child"`) keep exact timing.
- `CastMember.tilak` and `paita` exist: **never set them on Balak**, and give him no jewellery.
- Infants are not Puppets: the newborn is `BabyThakur`, the crawling infant is inside
  `episode02/scenes/Scene03Goshaap.tsx`, the five-year-old is `episode03/rig/SeatedChild.tsx`.

### `Head` and `head3d`

`Head` props: `R`, `shape` (`FaceShape`), `look` (`HeadLook`), `st` (`HeadState`), `uid` (unique and stable per
head), `keySide`, `rim`, `rimStrength`. `HeadLook` adds per-character tuning: `lashes`, `kajal`, `browWeight`,
`lipTint`, `mustache` (weight or colour), `ageLines`, `hairGrey`, plus `divineEyes` (Balak only) and `noBlink`
(set when the caller drives blinks; Puppet does). Clip-path ids include the frame number on purpose (Chrome left
ghost eyes otherwise). Face presets: `FACE_ADULT_M`, `FACE_ADULT_F`, `FACE_CHILD`, `FACE_TODDLER`, `FACE_BABY`.

### `FACE_LOOKS` (rig/cast.ts)

`FaceLook` = the `HeadLook` tuning fields above. `FACE_LOOKS` is keyed by cast id: `charu`, `babukaka` and
`surendra` (same father look), `thakurma`, `manorama`, `womanA`, `womanB`, `listenerA`, `dhaki`, `bhagabati`,
`kedarkaka`, `listenerB`, `gopal`, `rama`, `madhu`, `listenerKid`, `duikha`. Puppet uses a cast entry's own `look`
first, else `FACE_LOOKS[cast.id]`. Episode 2's `SURENDRA` and `THAKURMA` are exported from
`episode02/scenes/Scene01eFather.tsx`; Episode 3's women `S01_*` from `episode03/scenes/Scene01SharadFlowerGathering.tsx`.

### `Hand` (rig/Hand.tsx)

Wrist at (0, 0), fingers down +y. Props: `shape` (`relaxed`, `open`, `point`, `fist`, `hold`, `pranam`, `abhaya`,
`cup`), `L`, `skin`, `shade`, `palm?`, `side` (+1 right, -1 left mirror), `flex`, `baby` (rounder palm, short
chubby fingers, dimples; used by `BabyThakur`'s hands; `SeatedChild` uses the adult model scaled down), `view` (`palm`, `back`, `side`, `edge`) or `turn`
(radians). One thumb rule, no per-pose hacks. **No outline**: plain skin fill with soft darker-skin creases, so
the hand reads as part of the arm. Check changes on the `HandQA` composition (1 frame: every shape, both sides,
forced views, baby variant).

### `lipsync` and `idle`

`MouthState { open, width, round, teeth }`, `MOUTH_REST`, `visemeFromEnvelope(env, rel, seed, text?)` (from the RMS
envelope in `audio_durations.json`; with Bengali `text` each syllable gets its vowel), `speechLevel(env, rel)`
(for `talk`), `visemeChatter(frame, seed, intensity)`, `bnSyllables(text)`. `idleLife(seed, opts)` returns
`{ acting, mouth }` for background extras.

## Divine light (divine/Divine.tsx)

The white-gold `DIVINE` palette is Balak's alone. Put `<DivineDefs />` in every `Layer` that draws divine light.

- `DivineAura({ f, x, y, level, s })`: the halo is **steady** (MOT-20 / BAL-11): no breathing or pulse, only a
  shimmer under 0.5 %. Brightening comes only from `level`. **Keep `level` at 1 or below**: above 1 it adds
  rotating rays, above 2 expanding light, both against the series rule.
- `Motes({ f, x, y, n, spread, rise?, seed?, o? })`: a few slow rising motes.
- `SacredLight`, `LotusOfLight`: strong effects, sacred moments only, if at all.

### `BabyThakur`: the newborn and the reference baby face

The comment block "NEWBORN FACE CONSTRUCTION" above `headPath` in Divine.tsx is **the reference for every Balak baby
head** (Episode 2's `BabyHeadGS`, the sitting baby, the hands miracle). Origin is the body centre; the head centre
is at (-50, -10) x `s`. Holders solve their hands onto him every frame.

Props: `f`, `lifeF` (life clock for breathing, blinks, saccades, idle limb drift, wriggles; story props stay on
`f`), `x`, `y`, `s`, `open` or `awake` (0 asleep to 1 bright open eyes; `awake` replaces `open`), `gaze` (-1..1,
eyes lead, head follows) or `lookX`/`lookY`, `turn`, `headRoll` (-48 on his back, about -15 cradled), `smile`,
`cheeks`, `coo` (extra soft coo), `wave` (0..1 happy arm waving), `kick` (0..1 leg kicks), `yawn`, `bless` (abhaya
lift), `float`, `rot`, `wiggle`, `motion` (`BabyMotion` velocity for follow-through when carried), `aura` (keep
about 1). It draws its own aura, so `DivineDefs` must be in the same Layer.

## Sets (sets/)

Reuse an established set; to change time of day, wrap it in a filter or tint, do not edit it.

- **Vedic house**: `BaidikBariDay({ f })` in `S01_DaySets.tsx` (no sky or ground; add `DaySky` behind).
- **Inner courtyard**: `CourtyardBack({ f })` + `CourtyardFloor({ f })` in `Interiors.tsx` (often with
  `TulsiMancha`).
- **Ujanchar village house**: `UjancharHouse.tsx` (STO-10, STO-17), the courtyard of Episode 2's go-saap scene as one
  shared set; every later Ujanchar scene uses it. Its header comment is the full API.
  - `UjancharHouse` (all layers; props: `f` (life clock), `time` (`"morning"` | `"dawn"`), `cam`, `calm`,
    `fenceJaba`, `cow`, `veranda`, `yard`, `tulsi`, `jaba`, `nearVeranda`, `edgeBushes`, `under`, `floor`,
    `front`, `light`, `lightLevel`, `lightMask`, `foreground`, `leaves`, `grade`).
  - Layer by layer: `UjancharBackdrop` (= `UjancharSkyLayer`, `UjancharJungleLayer`, `UjancharTreesLayer`,
    `UjancharYardLayer`, `UjancharCowLayer`), `UjancharFloorLayer` (depth 1, characters), `UjancharLightLayer`,
    `UjancharForegroundLayer`, then `<Grade {...ujancharGrade(time)} />`.
  - Pieces: `UjancharTulsiMancha` (`lamp`: `unlit` | `lit` | `none`), `JabaShrub`, `jabaFlowerAt`, `UJANCHAR_JABA`,
    `JABA_FLOWERS`. Constants: `UJANCHAR` (planes, `GROUND` 900, `FLOOR_TOP`, `HUT`, `DOOR`, `LEMON`, `COW`,
    `TULSI`), `UJANCHAR_BG[time]`.
  - **Safe camera range**: `UJANCHAR_SAFE` = zoom 1: `cam.x` -1500..1580, `cam.y` -200..400; zoom 1 to 3
    (`cam.x` -2460 + 960/z .. 2540 - 960/z). Always pass the cam through `ujancharKeepInSet(cam)`, which clamps it
    with soft corners.
- Others: `Exteriors.tsx` (Diwali night river), `S05_Sets.tsx` (birth room, rain, lightning), `S06_Room.tsx`
  (`Khat`, birth room at night), `Sacred.tsx` (`KaliMandap`: the Goddess is light only), `AerialEstablish.tsx`.
- Several sets use fixed SVG gradient ids; two copies in one frame share them, which is fine.
