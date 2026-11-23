# Shared brief: Balak Thakur gesture polish (traced rig), 2026-11-23

You are one of THREE agents working in parallel. Each owns ONE file; never edit any other file.

- Working copy (git worktree, branch `feat/ep01-polish-and-rules`): `E:\Codes\Balak_Thakur_Production`
- Remotion project: `E:\Codes\Balak_Thakur_Production\remotion_studio`
- The rig: `src/cinematic/thakur/ThakurRefTraced.tsx` (precision-traced from the director's reference plate
  `public/images/ref_qa/01_Thakur_Age06_Child_Ujanchar.jpg`, Balak at about six, seated cross-legged, white dhoti and
  chadar). Its serene seated pose (`sitCross`, the traced lap hands) is APPROVED and must not change.
- It was just split, with pixel-identical output, into: `thakurRefPalette.ts` (colours), `ThakurRefHands.tsx`
  (gesture hands), `ThakurRefArm.tsx` (gesture arm + hand), `ThakurRefTraced.tsx` (body, head, poses).

## The problem the director saw (check sheet)
`ThakurGestureSheet` and `ThakurGestureReel` (`src/cinematic/thakur/qa/GestureQA.tsx`) show all seven seated
gestures: sitCross, bowHands (namaskar), bless (abhaya), palmRaise (teaching), pickLeaf, placeFlowerOnFoot, pour.
Current sheet: `E:\Codes\Balak_Thakur_Saisob-Kahini\03_Episodes\Episode_06_Rescuing_Brother_and_Playmates\04_Video_Assembly\Ghibli_Test_Render\Thakur_Gesture_Sheet.png`.
Everything except sitCross looks crude next to the traced body:
1. Gesture arms are a single thick quadratic "sausage" stroke: no shoulder, no elbow, no wrist taper, no anatomy.
2. They come out of the chadar's front edge with no cloth over the upper arm: the chadar should drape over the
   shoulder and upper arm and hang in a soft fold below the raised forearm (like the reference plate's draped sleeve).
3. Hands are small mitten silhouettes, unlike the finely traced lap hands (knuckles, fingers, thumb, nails).
4. Namaskar arms are long and straight like sticks; abhaya arm sprouts from mid-chest; the ghoti in `pour` floats on
   the chadar with no hand gripping it.

Goal: the gestures must look as finished as the traced sitCross pose: the same ink line (#281b13, about 3 px at
s = 1, round joins), cel shading (SKIN / SKIN_LIT / SKIN_SHADE, CLOTH / CLOTH_LIT / CLOTH_SHADE), soft and childlike
(a six-year-old: small, rounded hands and arms, not adult).

## Rules that stay (director decisions)
- BAL-01..03: no jewellery, tilak, thread, bangles; plain white dhoti and chadar; barefoot.
- BAL-22: never a cartoon grin. BAL-05..14: his halo stays as it is (do not touch the halo code).
- MOT-19: hands have NO dark line across the wrist (the forearm joins the hand seamlessly); thumbs on the correct side.
- MOT-13: eyes lead head turns; no frozen pose longer than about 20 frames (breathing and blinks keep going).
- sitCross must stay pixel-identical (it is the traced reference). Delivered episodes use this rig: keep every
  exported name, prop and pose name; only improve how gestures look and move.

## How to check your work (machine has 16 GB: render sparingly)
From `E:\Codes\Balak_Thakur_Production\remotion_studio`, bundle once into YOUR folder, then render stills:
```
npx remotion bundle src/index.ts --out-dir=../bundle_<you> --log=error
npx remotion still ../bundle_<you> ThakurGestureSheet ../check_<you>/sheet_f80.png --frame=80 --browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe" --log=error
npx remotion still ../bundle_<you> ThakurGestureReel ../check_<you>/reel_f<N>.png --frame=<N> --browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe" --log=error
```
Reel: gesture k (0-based) runs frames 72k .. 72k+71 (namaskar 72-143, bless 144-215, palmRaise 216-287, pickLeaf
288-359, placeFlower 360-431, pour 432-503); check a mid-transition frame (k*72 + 8) and a held frame (k*72 + 50).
At most ~8 stills per round; re-bundle only after a real change. Crop and LOOK at your stills (Read the PNG).
Other agents edit other files at the same time: if a bundle fails because of another file, wait a minute and retry.

## Working rules
- Keep your file compiling at every save (every bundle includes the whole project).
- Type-check when done: `NODE_OPTIONS=--max-old-space-size=4096 node node_modules/typescript/bin/tsc --noEmit`
  (ignore errors in src/param_bismoy_ep01 and src/cinematic/thakur/qa/{LightQA,PaintedPilot,StandingPaintedQA}.tsx:
  they are older and not yours).
- No git commits. Do not touch Root.tsx, GestureQA.tsx or any other file.
- Report: what you changed, the still paths that show it, anything left undone.

---

# ROUND 2 (director feedback, 2026-11-23): "all gestures except 1 are badly designed — hand length, size, shape,
# flexibility for every gesture; elbows must not look like a mechanical joint"

## Proportions: measured from the APPROVED traced lap arm of sitCross (rig coordinates, s = 1). These are binding.
| Part | Value |
|---|---|
| Forearm width (mid) | 50 |
| Wrist width (where the hand starts) | 44 |
| Upper-arm width (inside the sleeve) | 56 |
| Elbow width (outer curve) | 50 |
| Hand length, wrist to middle-finger tip | 105 |
| Palm width across the knuckles | 62 |
| Finger width (index/middle/ring/little) | 17 / 18 / 16 / 13, tapering to rounded tips |
| Thumb | 18 wide, reaches about 60 % of the index length |
| Upper-arm length, shoulder to elbow | 230 |
| Forearm length, elbow to wrist | 150 |
(today's gesture hands are ~80 long / ~45 wide and the wrist 31: far too small and thin next to the traced lap hands.)
Every gesture uses these same lengths (foreshortening is allowed only by moving the joints in depth, e.g. namaskar
forearms point partly toward the camera, so they LOOK shorter — never by drawing a smaller arm).

## No mechanical elbow
The arm is ONE continuous limb: a smooth spine through shoulder -> elbow -> wrist (a curve, not two straight
segments), sampled and offset by a smooth width profile into a single closed outline. At the bend: the outer side is
a smooth arc; the inner side compresses into a soft fold with one short crease line. No circle at the joint, no seam,
no corner where two segments meet. The limb bends a little even in "straight" poses (children's arms are soft).

## Flexible hands
Fingers are a chain (3 segments each, the thumb 2) with per-gesture curl so every gesture has its own natural hand:
relaxed (soft curl), abhaya (fingers upright, slightly bent back, thumb relaxed), teaching palm (fingers loosely
spread, slight curl), pranam (fingers together, flat), pinch (thumb + index meet, others softly curled), grip
(wrapped round the ghoti neck). Rounded fingertips, soft palm pad, gentle knuckle shading; no outline across the wrist.
