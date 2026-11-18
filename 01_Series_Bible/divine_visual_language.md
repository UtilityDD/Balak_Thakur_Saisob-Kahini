# Divine Visual Language — Balak Thakur Across the Series

This document governs how Balak Thakur's divinity is shown in all 19 episodes.
It applies to every scene, rig, colour grade and sound cue that involves him.

## 1. Guiding principle: restraint

He looks like a real village child of 1920s East Bengal. His divinity is shown
through **stillness, light, the response of nature, and the reactions of people**,
not through a constant glow. If he shines in every shot, the light stops meaning
anything by Episode 3. Rarity is what makes it sacred.

## 2. His signature (constant across all ages)

| Element | Rule | Implementation |
|---|---|---|
| **Signature light** | One colour used only for him: soft white-gold `#FFF4D6` core → `#FFD98A` falloff. No other character, prop or FX may use it. Festival light stays orange; puja light stays red-gold. | `DIVINE` palette in `src/cinematic/divine/Divine.tsx` |
| **Stillness** | Slower breathing, slow unhurried blinks, almost no eye darts. In a busy scene he is the calm centre. | `stillness` prop on `Puppet` (0–1) |
| **Eyes** | A distinctive soft star catchlight plus a faint ring, white-gold. No other character has it. | `divineEyes` on his rigs |
| **Nature responds** | Lamps steady near him, wind settles, animals grow calm (go-saap Ep 2, tortoise and cow Ep 5, peacock Ep 11). | Scene-level direction |
| **Camera** | Eye level or slightly below, never looking down on him. Sacred moments: centred, symmetrical, slow push or locked-off hold. | Shot design |
| **Sound motif** | A short bansuri phrase over a tanpura drone with a distant conch (শঙ্খ). Used only for his sacred moments. | `public/audio/music/Divine_Motif.wav` |

## 3. Intensity levels

| Level | Look | Use for |
|---|---|---|
| **0 — Ordinary** | No aura. Only stillness and the eye catchlight. | Play, daily life, most screen time |
| **1 — Hint** | Faint halo, a few golden motes rising. | A wise word, an act of compassion, nature responding |
| **2 — Revelation** | Visible aura, slow rotating rays, god-rays from above, sacred grade, motif plays | Key revelations, dream sequences |
| **3 — Theophany** | Full radiance, lotus of light, world slows and hushes, white-gold bloom | Only a handful of times in the whole series |

Level 3 is reserved. Planned uses: the birth (Ep 1), the healing / vision arc (Ep 13–14), the vibhuti and prophecy (Ep 18). Any other use needs a deliberate decision.

## 4. Progression by age

| Stage | Episodes | Baseline | Divinity shows through |
|---|---|---|---|
| Newborn | 1–2 | Level 1, steady | Never cries; luminous calm eyes; the birth itself is the first Level 3 |
| Toddler (3–5) | 2–5 | Level 0 | Animals calm near him (go-saap, tortoise, cow); wisdom beyond his years; brief Level 1 |
| Young (6–9) | 6–12 | Level 0–1 | Compassion (rescues, pathshala); dream episodes (peacock boat, the same mantra) get a dream grade at Level 2 |
| Adolescent (10–12+) | 13–19 | Level 0–1, quiet authority | Level 2–3 peaks: Shodashi's healing dream, Barada's vision, vibhuti, prophecy. Finale "Truth Against Falsehood" resolves in stillness and light, not spectacle |

## 5. The sacred grade

Festival scenes are warm orange. Sacred moments switch to a distinct look:

- Lifted shadows, soft white-gold bloom, slightly reduced saturation around him so he reads as the light source
- God-rays from above, slow-rising golden motes
- Time slows (world animation drops to ~12% speed) and ambient sound hushes at Level 3
- Transitions in and out over 1–2 seconds, never a hard cut into a miracle

## 6. Respectful depiction

- Deities (Ma Kali, Durga and others) appear only as glowing presence, light or symbol (lotus, conch, lamp), never as drawn figures.
- The birth is shown symbolically (light, lotus, the child appearing serene on white cloth), never physically.
- Balak Thakur is a revered real person. His final character designs at every age should be reviewed by someone from the devotee community before being locked.

## 7. Implementation reference

| Need | Component |
|---|---|
| Aura at any level 0–3 | `<DivineAura level={…} />` |
| God-rays / sacred light | `<SacredLight intensity={…} />` |
| Lotus of light | `<LotusOfLight bloom={…} />` |
| World slow-motion for Level 3 | `timeWarp()` |
| Newborn rig | `<BabyThakur />` |
| Stillness on any rig | `<Puppet stillness={…} />` |
| Motif audio | `scripts/synthesize_divine_motif.js` → `Divine_Motif.wav` |

First full implementation: Episode 1, Scene 03 "The Quiet Arrival" (`Scene03Demo` composition).
