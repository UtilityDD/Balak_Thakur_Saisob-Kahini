# Balak painted-look library: plan

**Status: PLAN ONLY, not started (written 2026-11-23).** Waiting for (1) Episode 6 to be delivered and (2) the
director's approval of this plan and of the open decisions at the end. No code exists for it yet.

Contents: 1 Goal · 2 Why · 3 Scope · 4 Rules that stay · 5 How it is built · 6 Work list by module · 7 Gesture
library · 8 QA sheets · 9 Pilot clip · 10 Phases and effort · 11 Agents and files · 12 Acceptance · 13 Risks ·
14 Open decisions · 15 Related documents · 16 Log

---

## 1. Goal

A reusable, hand-painted, more alive look for **Balak only** (the test character), built as a library that every
future episode can use: painted face, eyes, hair, clothes and hands, scene-matched light, varied linework, paper
finish, a painted divine glow, and a shared acting and gesture library. Judge it on a pilot clip side by side with
today's look; if approved, extend the same pattern to the rest of the cast for Season 2 (Episode 7 on).

## 2. Why

- The director asked why our characters do not have the life and detail of hand-drawn studio animation, and asked
  to test it on Balak first (2026-11-23).
- The watercolour ("Ghibli") variant of Episode 3 showed the gap: painted backgrounds with flat vector characters
  on top look pasted on; the halo washes out on pale paper; the ink outline traces the hands (main-session audit,
  2026-11-23, summarised in section 15).
- Most of "alive" is acting (eyes leading, follow-through in hair and cloth, settling, breathing), not only drawing
  detail. Both are in this plan.

## 3. Scope

- **In:** Balak at about six (reference plate 01), in both rigs: seated (`src/episode03/rig/SeatedChild.tsx`) and
  standing (`src/episode05/rig/StandingChild.tsx`), and his head (`src/cinematic/rig/ThakurHeadPlate.tsx`). Age is a
  parameter (5 to 12) so later episodes reuse it.
- **Out (for now):** every other character, the sets, baby Balak (BAL-25), the episodes already delivered.
- **Opt-in:** a new `look="painted"` option on `SeatedChild` and `StandingChild`. With it off (the default), every
  delivered episode renders byte-identically.

## 4. Rules that stay

- BAL-01 to BAL-03: no tilak, jewellery, thread, bangles or anklets; plain white dhoti and chadar; barefoot.
- BAL-05 to BAL-14: divine light is his alone and restrained; soft warm-white halo that fades out (no rings or rays),
  warm rim, faint ground glow, a few slow motes; brightens gently only on key beats; never pulses with breathing.
- BAL-22: never a cartoon grin. BAL-26: the reference-plate face and proportions, adjusted by age.
- MOT-01 to MOT-07: contact and planted feet. MOT-13: eyes lead, no frozen pose over about 20 frames.
  MOT-19: shared `Hand`, thumbs correct, **no outline on hands**. MOT-20: breathing per character and mood.
- CHR-08: his size among other children. RIG-EP06-01: the plate head draws at most a ±1.3 turn.
- In public, call it "hand-painted style", never "Ghibli" (trademark).

## 5. How it is built

- New folder `remotion_studio/src/cinematic/thakur/`, one module per file (one agent per file), plus `qa/`.
- The rigs keep their skeleton, poses, IK and timing; `look="painted"` swaps the drawing layer for the library's
  painted parts. Existing poses keep working; new gestures come from the acting library.
- One scene-light input (`ThakurLight`) feeds every painted part, so Balak matches each scene's light.
- Delivered episodes are protected by byte-identity checks before and after every change (Episode 3, 4, 5 frames
  and the existing QA sheets).

## 6. Work list by module

### 6.1 Head and face (`ThakurPaintedHead.tsx`)
- [ ] Painted skin: soft light-to-shade gradient, warm cheek blush, nose and under-chin shading, slightly deeper tone
      round the eyes.
- [ ] Lips with a soft tone and highlight; eyelid crease and brow shadow for depth.
- [ ] Age parameter (5 to 12): rounder face and bigger eyes when younger, longer face and squarer jaw when older.
- [ ] Ears and jaw line correct from front to three-quarter (within RIG-EP06-01).

### 6.2 Eyes (`ThakurEyes.tsx`)
- [ ] Iris with radial gradient and darker rim; two catchlights that follow the scene light; wet lower-lid line.
- [ ] Blink set: slow, half, double, sleepy; small eye darts while thinking; squint in strong sun.
- [ ] Eyes lead every head turn; gaze holds during gestures.

### 6.3 Expressions and mouth (`ThakurExpressions.ts`)
- [ ] Expression set: serene, joyful eye-smile, curious, thoughtful, compassionate, hurt, teary, surprised-calm,
      sleepy, focused, gently amused, devotional (half-closed eyes).
- [ ] Blends between any two, with small brow and cheek movement.
- [ ] Refined mouth shapes for lip sync (hint of teeth and tongue, softer corners), quieter breath while speaking.

### 6.4 Hair (`ThakurHair.tsx`)
- [ ] Soft clumps with a sheen band, the side parting, hair shadow on the forehead.
- [ ] Loose wisps that follow head movement and a wind setting from the scene.

### 6.5 Clothes: dhoti and chadar (`ThakurCloth.tsx`)
- [ ] Fold lines that follow the pose (sitting, bending, reaching, walking).
- [ ] Warm and cool shadow in folds, faint cotton weave, edges glowing when backlit.
- [ ] Follow-through: hem and chadar end sway after a move and flutter in the breeze.
- [ ] Fix: the chadar no longer turns into a big sleeve when an arm is raised.

### 6.6 Hands and feet (`ThakurHands.tsx`, a painted variant of the shared `Hand`)
- [ ] Knuckle and palm shading, hint of nails, no outline (MOT-19).
- [ ] Hand shapes: rest, cup, pinch, hold, offer, bless, namaskar, point, stroke, open palm.
- [ ] Feet with toes and a slight squash where the soles touch the ground.

### 6.7 Linework (`ThakurInk.tsx`)
- [ ] Varied hand-drawn line: thicker on shadow sides and turns, tapered and broken at the ends.
- [ ] Line colour per material: warm brown on skin, grey-blue on white cloth, dark brown on hair; none on hands.

### 6.8 Light and shading (`ThakurLight.ts`)
- [ ] One scene-light input: sun direction, colour, strength, bounce colour, rim.
- [ ] Presets: dawn, morning, noon, afternoon gold, dusk, diya light, moonlight.
- [ ] Shadows: head on neck, chadar on body, arm on chest, dark contact where he touches the ground.

### 6.9 Paint finish (`ThakurTexture.tsx`)
- [ ] Watercolour paper texture over his colours; slightly deeper pigment at the edges of colour areas.
- [ ] Small, steady colour variation that does not flicker (seeded).
- [ ] Optional hand-drawn rhythm (drawing every second frame) for testing.

### 6.10 Divine light (`ThakurDivine.tsx`, painted version of `BirulGlow`)
- [ ] Painted halo: soft warm-white bloom behind the head that fades out, no rings or rays, readable on pale paper.
- [ ] Warm golden rim, faint ground glow, a few slow motes.
- [ ] Key-beat curve: rises once and holds; never pulses with breathing.

### 6.11 Acting (`ThakurActing.ts`)
- [ ] Life layer: breathing (calm, quick, sigh), small idle movements, weight shifts, settling after every move.
- [ ] Overlapping action: head, then hair and cloth follow through.
- [ ] Gesture library (section 7) with one call for both rigs.

## 7. Gesture library

One call for seated and standing Balak: `gesture(name, { target, start, length, mood, hand, seed })`, with contact
to the target, a matching expression, eyes leading, breathing and settling built in, and a prop slot.

| Group | Gestures |
|---|---|
| Stillness | sit cross-legged, meditate, gaze upward, listen, think |
| Devotion | namaskar, pranam to elders, bless, offer flowers |
| Hands and objects | pick flowers, pour water, give, receive, hold out, write on a slate, eat with his hand, drink |
| Care and play | stroke an animal, play with pebbles or a ball |
| Feeling | wipe tears, hand on head, gentle laugh (no grin) |
| Moving | walk barefoot, run, stand up, sit down |

Variation settings on every gesture: speed, size, mood, left or right hand, seed. Existing Episode 3 to 6 poses
(`SeatedPose`, `StandingPose`) are mapped to these names where they match, without changing their delivered output.

## 8. QA sheets (`src/cinematic/thakur/qa/`, stills to `05_Rework/Thakur_Painted_Look_Library/qa/`)

- [ ] Turnaround (front to three-quarter, both sides), current look beside painted look.
- [ ] Expression sheet; eye and blink sheet; hand-shape sheet; gesture sheet (each gesture on both rigs).
- [ ] Light sheet: every preset.
- [ ] Detail-at-size sheet: wide, medium and close (fine detail must not turn to noise in wide shots).
- [ ] Render-time measurement: seconds per frame, current vs painted.

## 9. Pilot clip (about 10 s)

Balak seated in the Ujanchar courtyard (`UjancharHouse`) in afternoon gold light: breathes and blinks, the breeze
moves his hair and chadar, he looks up (eyes first), a gentle smile, namaskar, the halo brightens once. Rendered in
today's look and in the painted look, side by side, for the director's decision.

## 10. Phases and effort (rough)

| Phase | Modules | Effort | Ends with |
|---|---|---|---|
| 1 | Head, eyes, expressions, hair (6.1 to 6.4) | 2 to 3 days | Turnaround, expression and eye sheets for review |
| 2 | Clothes, hands and feet (6.5, 6.6) | 2 to 3 days | Cloth-in-poses and hand-shape sheets |
| 3 | Light, linework, paint finish, divine light (6.7 to 6.10) | 1 to 2 days | Light sheet, detail-at-size sheet |
| 4 | Acting and gesture library (6.11, 7) | 2 to 3 days | Gesture sheet and short gesture clips |
| 5 | QA, pilot clip, director's review (8, 9) | 1 day | Side-by-side pilot clip |

Each phase stops for the director's review; the work can stop or change direction after any phase. Run agents in
small numbers to stay inside the usage limits (two to four at a time).

## 11. Agents and files (one agent per file)

| Agent | Owns |
|---|---|
| Head | `thakur/ThakurPaintedHead.tsx`, `thakur/qa/HeadPaintedQA.tsx` |
| Eyes and expressions | `thakur/ThakurEyes.tsx`, `thakur/ThakurExpressions.ts`, `thakur/qa/ExpressionQA.tsx` |
| Hair | `thakur/ThakurHair.tsx` |
| Cloth | `thakur/ThakurCloth.tsx`, `thakur/qa/ClothQA.tsx` |
| Hands | `thakur/ThakurHands.tsx`, `thakur/qa/HandPaintedQA.tsx` |
| Light, line, finish | `thakur/ThakurLight.ts`, `thakur/ThakurInk.tsx`, `thakur/ThakurTexture.tsx`, `thakur/qa/LightQA.tsx` |
| Divine | `thakur/ThakurDivine.tsx` |
| Acting | `thakur/ThakurActing.ts`, `thakur/qa/GestureQA.tsx` |
| Rig hookup (last) | `SeatedChild.tsx`, `StandingChild.tsx`: the `look="painted"` switch only |
| Pilot | `thakur/qa/PaintedPilot.tsx` |

Every agent brief carries the rules in section 4 and the byte-identity check for delivered episodes; the main
session verifies every phase with stills and clips before it goes to the director (agent-dispatch, frame-qa).

## 12. Acceptance (what "yes" needs)

- He is recognisably the same reference-plate boy, only painted (BAL-26).
- It reads well in wide, medium and close shots.
- No delivered episode changes (byte-identity checks pass).
- Render time stays practical on this 16 GB machine (target: no more than about twice today's time per frame).
- All rules in section 4 hold, checked on the QA sheets.

## 13. Risks

- More drawing per frame means slower renders; the finish layers (texture, filters) are the costly part.
- Detail that works in close-up can become noise in wide shots: the detail-at-size sheet decides the levels.
- Cloth folds and hand shading must work in every existing pose; some poses may need small fixes.
- A painted Balak beside flat-style adults may look mismatched until the rest of the cast follows (decision 14.3).

## 14. Open decisions for the director

1. Start after Episode 6 is delivered? *Recommended:* yes.
2. Scope of the test: Balak at age 6 only? *Recommended:* yes; age stays a parameter.
3. If approved, extend to the whole cast for Season 2 (Episode 7 on), and later re-render Episodes 1 to 6 in one
   pass? *Recommended:* decide after the pilot.
4. Style references: does the director want to give reference images for the painted look (stored in
   `references/`)? *Recommended:* yes, two or three images.
5. Hand-drawn rhythm (every second frame) as an option or not at all? *Recommended:* test it in the pilot, decide
   after.

## 15. Related documents

- Rules: `01_Series_Bible/DIRECTOR_DECISIONS.md` (BAL, MOT, CHR-08), `docs/PIPELINE_DECISIONS.md` (RIG-EP05-01/02,
  RIG-EP06-01/02).
- Reference plates: `01_Series_Bible/Thakur_Reference_Plates/`.
- Current rigs: `remotion_studio/src/episode03/rig/SeatedChild.tsx`, `src/episode05/rig/StandingChild.tsx`,
  `src/cinematic/rig/ThakurHeadPlate.tsx`, `src/episode03/rig/BirulGlow.tsx`, `src/cinematic/rig/Hand.tsx` (all in
  the production worktree).
- Watercolour variant of Episode 3 (the audit's subject): `remotion_studio/src/ghibli_pipeline/episode03/`,
  `03_Episodes/Episode_03_Five_Year_Old_Wisdom/04_Video_Assembly/Ghibli_Test_Render/`. Audit summary (2026-11-23):
  same timing and sound as the delivered Episode 3; richer painted backgrounds; problems: the Vedic house became an
  ornate palace, a ruined tulsi mancha, dawn light lost, the halo washes out, the ink outline traces the hands,
  flat characters look pasted on, plates upscaled about 3.7x, no record of how the plates were generated, the
  variant is not in the decision files.

## 16. Log

- 2026-11-23: plan written at the director's request ("create a md file in an organized folder for the rework, do
  not start the work"). Not started.
