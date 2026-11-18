# Visual & Technical Style Guide — Premium 2.5D Bengali Cinematic Animation

## 1. Global Art Style & Borderless Asset Rule
- **Master Prompt Prefix:**
  `2.5D cinematic painterly 2D animation style, lineless clean shapes, rich atmospheric depth, expressive large eyes, soft volumetric lighting, 1920s rural East Bengal (Padma basin) architecture and flora, 16:9`
- **Strict Borderless / Alpha-Clean Rule (Characters, Props, Trees, Boats):**
  - Every character, animal, boat, tree, diya, or prop generated for Plane 3 (`midground`) or Plane 4 (`character_stage`) MUST be **borderless** (no black ink outlines, no white sticker borders, no rectangular card backgrounds).
  - Export as **32-bit RGBA PNG** with clean premultiplied/straight alpha edges so assets composite naturally into 2.5D depth with soft ambient occlusion shadows.

---

## 2. 2.5D Multi-Plane Depth Architecture (5 Planes)
Every cinematic shot is composed across 5 independent depth planes with differential camera speeds:

| Plane | Layer Name | Parallax Speed | Typical Assets |
| :--- | :--- | :--- | :--- |
| **Plane 1** | `01_sky_celestial` | `0.15x` | Monsoon clouds, Kartik indigo night sky, crescent moon, sunrise/sunset gradients |
| **Plane 2** | `02_far_horizon_river` | `0.35x` | Flowing Padma river, distant steamship, opposite bank palms, *kaash* grass horizon |
| **Plane 3** | `03_midground_architecture_flora` | `0.65x` | Baidik Bari terracotta arches, thatched roofs, banyan/mango/coconut trees, Kali mandap |
| **Plane 4** | `04_character_stage_rgba` | `1.00x` | Borderless RGBA animated characters, animals, ritual props, clay diyas |
| **Plane 5** | `05_foreground_weather_particles` | `1.35x` | Out-of-focus foreground leaves, diagonal monsoon rain, river mist, fireflies, golden aura dust |

---

## 3. Smooth Camera Movement & Easing Standards
Never use harsh linear pans or sudden jumps. All camera moves use **sine-in-out** or **cubic-in-out** easing at `24 fps` (sub-pixel Lanczos resampling):
- `slow_horizontal_pan_left_to_right` / `right_to_left`: Max `2.5%`–`4%` frame width per second; gentle ease-in/out over `1.0s`.
- `slow_dolly_push_in`: `1.00x` -> `1.12x` scale over scene duration, anchored to character eye-line.
- `gentle_breathing_float`: Subtle `±0.4%` vertical sine drift for sacred/mystical floating aura moments.
- `dramatic_freeze_hold`: Smooth `0.4s` deceleration into complete stillness (used on `04_seven_uludhwani`).

---

## 4. Near-Real Lip-Sync, Facial & Gesture Animation Spec
To achieve lifelike warmth without uncanny valley stiffness:
1. **7-State Viseme Lip-Sync:** Driven automatically from normalized `Voice_WAVs/` amplitude & formant envelopes (`audio_durations.json`):
   - `REST` (closed soft smile), `A` (open vowel), `E` (wide vowel), `I` (narrow smile), `O` (rounded), `U` (puckered), `MBP` (pressed lips).
   - Smooth `2-frame` (`~83ms`) cross-blend between mouth shapes; never snap abruptly.
2. **Natural Eye & Head Life:**
   - **Blinking:** Randomized `3.0s–4.5s` interval, `120ms` close-open curve.
   - **Micro Head Tilt:** Subtle `±2°` tilt synchronized to vocal pitch peaks on stressed Bengali syllables.
3. **Near-Real Gesture & Secondary Motion:**
   - **Torso Breathing:** Continuous `0.25 Hz` subtle chest/shoulder rise-and-fall.
   - **Cloth & Hair Sway:** Secondary `1–2 frame` delayed wave on saree *anchal*, dhoti pleats, mystic's hair, and coconut fronds in Bengal breeze.
   - **Hand Gestures:** Reusable pose keyframes (*anjali/namaskar*, *pointing gently*, *holding diya*, *cradling infant*, *blessing hand*).

---

## 5. Bengali Nature, River, Sky & Weather Presets
1. **Golden Daytime Village (`golden_daytime`):** Warm late-morning sunlight, emerald banana/mango groves, terracotta paths, gentle cumulus clouds over Padma.
2. **Kartik Diwali / Puja Night (`deep_indigo_warm_diyas`):** Deep indigo-violet Bengal night sky, warm flickering clay *diya* pools, golden sparkler embers, soft courtyard smoke.
3. **Monsoon Padma Squall (`cool_slate_rain`):** Slate-blue heavy clouds, 3-layer diagonal rain streaks (far mist, mid drops, foreground splash), wet terracotta reflections, wind-bent palm fronds.
4. **Sacred Midnight Arrival (`sacred_midnight_glow`):** Deep purple-indigo room, soft luminous white-gold volumetric halo around `baby_thakur`, floating golden dust motes.
5. **Sharad Autumn & River (`sharad_river_breeze`):** Crisp azure sky, white *kaash* flowers swaying on riverbanks, shimmering Padma ripples, *shiuli* flower petals drifting.
6. **Winter Morning Mist (`winter_fog_dawn`):** Soft pearl-grey ground mist over canal and paddy fields, warm diffused amber sunrise breaking through bamboo groves.
7. **Dawn / Closing (`soft_golden_dawn`):** Soft sunrise coral, saffron, and rose reflecting on calm Padma water as night stars fade.
