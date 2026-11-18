"""Synthesize procedural Bengali music loops, ambient nature beds, and foley SFX using NumPy & SciPy."""

import pathlib
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
MUSIC_DIR = ROOT / "02_Shared_Assets" / "Music_Loops"
AMB_DIR = ROOT / "02_Shared_Assets" / "SFX_Pack" / "Ambient_Beds"
SFX_DIR = ROOT / "02_Shared_Assets" / "SFX_Pack" / "Foley_and_Events"

SR = 48000


def save_wav(path: pathlib.Path, audio: np.ndarray, peak: float = 0.85) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    max_val = float(np.max(np.abs(audio))) or 1.0
    norm = (audio / max_val) * peak
    pcm = np.clip(norm * 32767.0, -32768, 32767).astype(np.int16)
    wavfile.write(str(path), SR, pcm)
    print(f"Synthesized {path.relative_to(ROOT)} ({len(audio)/SR:.2f}s)")


def make_crossfade_loop(audio: np.ndarray, fade_sec: float = 0.5) -> np.ndarray:
    n = int(fade_sec * SR)
    if len(audio) < 2 * n:
        return audio
    fade_out = np.linspace(1.0, 0.0, n)
    fade_in = np.linspace(0.0, 1.0, n)
    body = audio[:-n].copy()
    body[:n] = body[:n] * fade_in + audio[-n:] * fade_out
    return body


def bansuri_note(freq: float, dur: float, vib_rate: float = 4.5, vib_depth: float = 0.008) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    vib = 1.0 + vib_depth * np.sin(2 * np.pi * vib_rate * t)
    phase = 2 * np.pi * np.cumsum(freq * vib) / SR
    # Warm bamboo flute harmonics + soft breath noise
    tone = 0.72 * np.sin(phase) + 0.20 * np.sin(2 * phase) + 0.06 * np.sin(3 * phase)
    breath = np.random.normal(0, 0.025, len(t))
    b, a = signal.butter(2, [freq * 0.7 / (SR / 2), min(0.95, freq * 3.5 / (SR / 2))], btype="band")
    breath = signal.lfilter(b, a, breath)
    env = np.ones_like(t)
    att = min(len(t) // 3, int(0.08 * SR))
    rel = min(len(t) // 3, int(0.14 * SR))
    env[:att] = np.linspace(0, 1, att)
    env[-rel:] = np.linspace(1, 0, rel)
    return (tone + breath) * env


def tanpura_drone(root_hz: float, dur: float) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    fifth_hz = root_hz * 1.5
    drone = (
        0.45 * np.sin(2 * np.pi * root_hz * t)
        + 0.25 * np.sin(2 * np.pi * (root_hz * 2.0) * t)
        + 0.20 * np.sin(2 * np.pi * fifth_hz * t)
        + 0.10 * np.sin(2 * np.pi * (root_hz * 0.5) * t)
    )
    shimmer = 0.85 + 0.15 * np.sin(2 * np.pi * 0.25 * t)
    return make_crossfade_loop(drone * shimmer * 0.35, 1.0)


def mix_fit(a: np.ndarray, b: np.ndarray, wa: float = 0.65, wb: float = 0.45) -> np.ndarray:
    n = min(len(a), len(b))
    return wa * a[:n] + wb * b[:n]


def build_music_loops() -> None:
    # Raga Bhupali / Yaman inspired pentatonic frequencies (Sa=C4=261.63)
    Sa, Re, Ga, Pa, Dha, Sa2 = 261.63, 293.66, 329.63, 392.00, 440.00, 523.25

    # 1. Theme_Intro_Bansuri (16s loop)
    melody_notes = [(Sa, 1.2), (Re, 0.8), (Ga, 1.2), (Pa, 1.6), (Dha, 1.0), (Pa, 1.0), (Ga, 1.4), (Re, 0.8), (Sa, 2.0), (Pa, 1.2), (Dha, 1.2), (Sa2, 1.8), (Pa, 0.8)]
    flute = np.concatenate([bansuri_note(f, d) for f, d in melody_notes])
    drone = tanpura_drone(130.81, len(flute) / SR + 1.2)
    save_wav(MUSIC_DIR / "Theme_Intro_Bansuri.wav", make_crossfade_loop(mix_fit(flute, drone), 0.8))

    # 2. Village_Peace_Loop (16s pastoral loop)
    v_notes = [(Ga, 1.5), (Re, 1.0), (Sa, 1.5), (Pa, 2.0), (Ga, 1.2), (Re, 1.2), (Sa, 2.2), (Dha * 0.5, 1.4), (Sa, 2.0), (Re, 1.0), (Ga, 1.0)]
    v_flute = np.concatenate([bansuri_note(f, d, vib_rate=3.8) for f, d in v_notes])
    v_drone = tanpura_drone(130.81, len(v_flute) / SR + 1.2)
    save_wav(MUSIC_DIR / "Village_Peace_Loop.wav", make_crossfade_loop(mix_fit(v_flute, v_drone, 0.55, 0.45), 0.8))

    # 3. Festival_Folk_Loop (12s lively dhak + flute)
    dur = 12.0
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    dhak = np.zeros_like(t)
    beat_times = np.arange(0, dur, 0.375)  # 160 BPM folk pulse
    for i, bt in enumerate(beat_times):
        idx = int(bt * SR)
        n = min(int(0.22 * SR), len(t) - idx)
        tt = np.linspace(0, n / SR, n, endpoint=False)
        f0 = 115.0 if i % 4 == 0 else 155.0
        hit = np.sin(2 * np.pi * f0 * np.exp(-8 * tt) * tt) * np.exp(-14 * tt)
        dhak[idx : idx + n] += hit * (0.9 if i % 4 == 0 else 0.55)
    f_notes = [(Pa, 0.75), (Dha, 0.75), (Sa2, 1.0), (Dha, 0.5), (Pa, 1.0), (Ga, 0.75), (Re, 0.75), (Ga, 1.0), (Pa, 1.5)] * 2
    f_flute = np.concatenate([bansuri_note(f, d) for f, d in f_notes])[: len(t)]
    save_wav(MUSIC_DIR / "Festival_Folk_Loop.wav", make_crossfade_loop(mix_fit(dhak, f_flute, 0.55, 0.50), 0.6))

    # 4. Sacred_Night_Ambient (16s meditative drone + harmonic bells)
    dur = 16.0
    s_drone = tanpura_drone(130.81, dur)
    chimes = np.zeros(len(s_drone))
    for ct, cf in [(1.0, 523.25), (4.5, 659.25), (8.2, 783.99), (12.0, 523.25)]:
        idx = int(ct * SR)
        n = min(int(2.5 * SR), len(chimes) - idx)
        tt = np.linspace(0, n / SR, n, endpoint=False)
        chimes[idx : idx + n] += (np.sin(2 * np.pi * cf * tt) + 0.3 * np.sin(2 * np.pi * cf * 2 * tt)) * np.exp(-2.2 * tt) * 0.28
    save_wav(MUSIC_DIR / "Sacred_Night_Ambient.wav", make_crossfade_loop(s_drone + chimes, 1.0))

    # 5. Warm_Family_Flute (14s tender slow flute)
    w_notes = [(Ga, 1.8), (Pa, 1.8), (Dha, 1.4), (Pa, 1.6), (Ga, 1.6), (Re, 1.4), (Sa, 2.4), (Re, 1.0), (Ga, 1.0)]
    w_flute = np.concatenate([bansuri_note(f, d, vib_rate=3.5) for f, d in w_notes])
    w_drone = tanpura_drone(130.81, len(w_flute) / SR + 1.2)
    save_wav(MUSIC_DIR / "Warm_Family_Flute.wav", make_crossfade_loop(mix_fit(w_flute, w_drone, 0.60, 0.40), 0.8))


def build_ambient_beds() -> None:
    dur = 16.0
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)

    # 1. padma_river_day.wav: gentle water laps + breeze
    noise = np.random.normal(0, 1, n)
    b, a = signal.butter(3, [180 / (SR / 2), 1400 / (SR / 2)], btype="band")
    river = signal.lfilter(b, a, noise) * (0.65 + 0.35 * np.sin(2 * np.pi * 0.22 * t))
    save_wav(AMB_DIR / "padma_river_day.wav", make_crossfade_loop(river, 1.0), peak=0.55)

    # 2. bengal_night_crickets.wav: soft night air + rhythmic cricket chirps
    b_air, a_air = signal.butter(2, 500 / (SR / 2), btype="low")
    night_air = signal.lfilter(b_air, a_air, np.random.normal(0, 0.3, n))
    crickets = np.zeros(n)
    for ct in np.arange(0.3, dur - 0.5, 1.4):
        idx = int(ct * SR)
        clen = int(0.35 * SR)
        tt = np.linspace(0, 0.35, clen, endpoint=False)
        pulse = (0.5 + 0.5 * np.sin(2 * np.pi * 24 * tt)) * np.sin(2 * np.pi * 4350 * tt) * np.hanning(clen)
        crickets[idx : idx + clen] += pulse * 0.18
    save_wav(AMB_DIR / "bengal_night_crickets.wav", make_crossfade_loop(night_air + crickets, 0.8), peak=0.50)

    # 3. monsoon_rain_courtyard.wav: steady rain + soft distant thunder swell
    b_rain, a_rain = signal.butter(2, [450 / (SR / 2), 6500 / (SR / 2)], btype="band")
    rain = signal.lfilter(b_rain, a_rain, np.random.normal(0, 0.7, n))
    b_th, a_th = signal.butter(2, 120 / (SR / 2), btype="low")
    thunder = signal.lfilter(b_th, a_th, np.random.normal(0, 1.0, n)) * np.exp(-0.5 * (t - 7.0) ** 2) * 1.4
    save_wav(AMB_DIR / "monsoon_rain_courtyard.wav", make_crossfade_loop(rain + thunder, 1.0), peak=0.65)

    # 4. dawn_birds_temple.wav: soft morning breeze + gentle bird chirps
    birds = signal.lfilter(b_air, a_air, np.random.normal(0, 0.25, n))
    for bt, bf in [(1.2, 2600), (3.8, 3100), (6.5, 2400), (9.4, 2900), (12.8, 3200)]:
        idx = int(bt * SR)
        blen = int(0.22 * SR)
        tt = np.linspace(0, 0.22, blen, endpoint=False)
        chirp = np.sin(2 * np.pi * (bf + 600 * np.sin(2 * np.pi * 12 * tt)) * tt) * np.hanning(blen)
        birds[idx : idx + blen] += chirp * 0.25
    save_wav(AMB_DIR / "dawn_birds_temple.wav", make_crossfade_loop(birds, 0.8), peak=0.50)


def build_sfx() -> None:
    # 1. chime_pop.wav
    t = np.linspace(0, 1.2, int(SR * 1.2), endpoint=False)
    chime = (np.sin(2 * np.pi * 880 * t) + 0.5 * np.sin(2 * np.pi * 1318.5 * t)) * np.exp(-4.5 * t)
    save_wav(SFX_DIR / "chime_pop.wav", chime)

    # 2. soft_magical_shimmer.wav
    t2 = np.linspace(0, 2.5, int(SR * 2.5), endpoint=False)
    shimmer = sum(np.sin(2 * np.pi * f * t2) for f in (523.25, 659.25, 783.99, 1046.5, 1318.5)) * np.hanning(len(t2))
    save_wav(SFX_DIR / "soft_magical_shimmer.wav", shimmer)

    # 3. temple_bell_drop.wav
    t3 = np.linspace(0, 2.2, int(SR * 2.2), endpoint=False)
    bell = (np.sin(2 * np.pi * 620 * t3) + 0.6 * np.sin(2 * np.pi * 1245 * t3) + 0.3 * np.sin(2 * np.pi * 1870 * t3)) * np.exp(-2.8 * t3)
    save_wav(SFX_DIR / "temple_bell_drop.wav", bell)

    # 4. sparkler_crackle.wav
    t4 = np.linspace(0, 3.0, int(SR * 3.0), endpoint=False)
    crackle = np.random.normal(0, 1, len(t4)) * (np.random.rand(len(t4)) > 0.985)
    b_sp, a_sp = signal.butter(2, 2200 / (SR / 2), btype="high")
    save_wav(SFX_DIR / "sparkler_crackle.wav", signal.lfilter(b_sp, a_sp, crackle) * np.hanning(len(t4)))

    # 5. distant_ship_horn.wav
    t5 = np.linspace(0, 2.4, int(SR * 2.4), endpoint=False)
    horn = (np.sin(2 * np.pi * 145 * t5) + 0.6 * np.sin(2 * np.pi * 218 * t5)) * np.hanning(len(t5))
    save_wav(SFX_DIR / "distant_ship_horn.wav", horn)

    # 6. river_water.wav
    b_rv, a_rv = signal.butter(2, [220 / (SR / 2), 1600 / (SR / 2)], btype="band")
    save_wav(SFX_DIR / "river_water.wav", signal.lfilter(b_rv, a_rv, np.random.normal(0, 1, int(SR * 4.0))))

    # 7. monsoon_rain.wav
    b_rn, a_rn = signal.butter(2, [500 / (SR / 2), 6000 / (SR / 2)], btype="band")
    save_wav(SFX_DIR / "monsoon_rain.wav", signal.lfilter(b_rn, a_rn, np.random.normal(0, 1, int(SR * 4.0))))

    # 8. uludhwani.wav (traditional auspicious high-pitched warble shimmer)
    t8 = np.linspace(0, 2.5, int(SR * 2.5), endpoint=False)
    warble = 980.0 + 180.0 * np.sin(2 * np.pi * 11.5 * t8)
    ulu = np.sin(2 * np.pi * np.cumsum(warble) / SR) * np.hanning(len(t8))
    save_wav(SFX_DIR / "uludhwani.wav", ulu)

    # 9. goat_bleat_happy.wav
    t9 = np.linspace(0, 0.9, int(SR * 0.9), endpoint=False)
    bleat_f = 410.0 + 45.0 * np.sin(2 * np.pi * 16.0 * t9)
    bleat = (np.sin(2 * np.pi * np.cumsum(bleat_f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(bleat_f) / SR)) * np.hanning(len(t9))
    save_wav(SFX_DIR / "goat_bleat_happy.wav", bleat)


if __name__ == "__main__":
    build_music_loops()
    build_ambient_beds()
    build_sfx()
    print("All procedural music, ambient beds, and SFX synthesized successfully.")
