# Production Rules: Balak Thakur Series

Binding rules for every machine, episode and contributor. They apply on top of `divine_visual_language.md` and `visual_style_guide.md`, and they take precedence where they differ.

## 1. Identity and likeness
- Balak Thakur is a real, revered person. Do not trace or copy a photo, portrait or artwork of a real child, and do not copy any deity artwork (for example, images titled Krishna).
- Character designs are original, built from the descriptions in `characters.json` and the style rules here.
- Final designs for each age need review by the devotee community before they are locked. Record the review in this file when it happens.

## 2. Iconography for Balak Thakur
- No tilak or tikka on the forehead at any age.
- No gold bangles or anklets.
- Newborn: plain white wrap, no gold border. Hair is a light covering of soft curls, kept natural and not in tight ringlets.
- Toddler and child (Balak at ages 3 to 5): plain white dhoti, with soft, dark, CURLY hair, as set by the series director. Keep the curls natural and gentle, not tight ringlets. Avoid a deity-style look: no ornaments, no halo ring drawn as a crown, no gold accessories.
- Age: the narration sets the age (for Episode 3, five years). The visual may read slightly younger or older than the narration, so the age need not match exactly.
- Divine presence comes from light, halo, stillness, expression and atmosphere, not from ornaments.

## 3. Divine light
- The white-gold `#FFF4D6` family is reserved for Balak Thakur.
- Other characters use warm festival, diya or day light. Do not place divine-coloured light sources on them.

## 4. Face construction
- One face model drives the outline, hair cap, ears and eye placement, so the parts always agree.
- Do not draw an ink outline around faces. Use a soft shade-coloured edge at low opacity only.
- Far-side eyes fade only where they roll behind the head. Both eyes stay equally visible on the camera side.

## 5. Hands and props
- Fingers are filled shapes with a soft shade edge and visible gaps between them.
- Holding poses wrap the fingers around the centre of the prop. Props should never float beside the hand.

## 6. Audio
- Generated audio lives in `remotion_studio/public/audio/`, which is gitignored. Regenerate it with the scripts in `scripts/` (for example, `synthesize_divine_motif.js` and `synthesize_sfx.js`). Do not commit WAV files.
- Every generated sound needs a listening check before it goes into a scene.

## 7. Rendering and review
- `Episode01` composes the cinematic scenes through `SceneRenderer`. The `_legacy` branches in `Episode01Scenes.tsx` are not used, so do not edit them to change the look.
- Long episode renders can crash Chrome. Render in chunks of about 2,000 frames, then join them with ffmpeg.
- Review in the Remotion studio (port 3100) before a full render.

## Change log
- 2026-11-19: created this document. Rules 1–6 come from the review in this session.
