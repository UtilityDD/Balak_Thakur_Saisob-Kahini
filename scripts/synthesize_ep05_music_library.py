"""Procedural stand-ins for the Episode 5 music library (public/audio/music/ep05) and sfx/ep06/plate_clink.

The original CC recordings (tanpura, swarmandal, tabla, dhol, bansuri) were lost with the machine that held them.
This script rebuilds every file the episodes still reference under the SAME names, lengths and loudness that the
episodes' MUSIC_LIB tables assume (Episode03/04/06 and the Ghibli 03/04 cuts turn each cue's LUFS target into a
volume from the file's `lufs` entry, and some cues are timed from a file's `seconds`), so the mixes stay as designed:

  file                    seconds  loop  LUFS   what
  tanpura_drone           33.714   yes   -24    Pa-Sa-Sa-Sa tanpura, Sa = C3 (130.81 Hz)
  tanpura_drone_low       33.714   yes   -28    the same an octave lower (Sa = C2), darker and slower
  tanpura_drone_cs        31.825   yes   -24    the same in C# (Sa = C#3 138.59 Hz, as under Divine_Motif)
  play_plucks              8.211   yes   -24    light swarmandal arpeggio (Bhupali on C)
  cheeky_plucks            8.0     yes   -22    sneaky muted swarmandal tiptoe phrases
  tabla_soft               9.87    yes   -24    gentle keherwa theka (two cycles), dayan tuned to Sa
  tabla_run                2.694   no    -20.1  accelerating rolling flourish into a ringing Dha
  cheeky_pluck_1           2.511   no    -20    quick upward swarmandal flurry
  cheeky_pluck_2           2.405   no    -20    5-note comic statement, last note ringing
  cheeky_pluck_3           1.382   no    -20    four whimsical tiptoe notes
  tension_rise             1.3     no    -20    tabla + low dhol roll with a rising gliss, crest at ~1.26 s
  drum_hit_low             2.6     no    -20    one soft low pakhawaj/dhol stroke
  bansuri_compassion       9.529   no    -20    tender bansuri phrase in Bhupali, settles on Sa (C)
  sfx/ep06/plate_clink     0.8     no    (-6 dBFS peak)  small brass plate clink

Loops are built on a circular timeline (note tails and the reverb wrap round), so the last sample flows into the
first with no seam; rhythmic loops start 30 ms before their first stroke, so the seam never falls on an attack. One-shots are limited to a -3 dBFS sample peak. 48 kHz, 16-bit (TPDF dither), stereo.
Deterministic: fixed random seeds.

Usage (from the worktree root):
  python scripts/synthesize_ep05_music_library.py                 # write all 14 files, print the check table
  python scripts/synthesize_ep05_music_library.py --only tabla_soft plate_clink
  python scripts/synthesize_ep05_music_library.py --verify-only   # measure the files on disk
  python scripts/synthesize_ep05_music_library.py --verify-only --spectrograms _reference/music_check
      (spectrograms need matplotlib; e.g. D:/AI_Tools/JoyVASA/.venv/Scripts/python.exe)
"""

from __future__ import annotations

import argparse
import pathlib

import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "remotion_studio" / "public" / "audio"
SR = 48000

SA_C3 = 130.81
SA_CS3 = 138.59
# Bhupali (Sa Re Ga Pa Dha) as just ratios
BHUP = {"S": 1.0, "R": 9 / 8, "G": 5 / 4, "P": 3 / 2, "D": 5 / 3}


# ----------------------------------------------------------------------------------------------------------------
# buffers and helpers
# ----------------------------------------------------------------------------------------------------------------
class Buf:
    """Stereo float buffer. `loop=True` wraps anything written past the end back to the start."""

    def __init__(self, seconds: float, loop: bool):
        self.n = int(round(seconds * SR))
        self.loop = loop
        self.x = np.zeros((2, self.n))

    def add(self, sig: np.ndarray, t0: float, pan: float = 0.0, gain: float = 1.0, taper: bool = True) -> None:
        """Add a mono (n,) or stereo (2, n) signal at time t0 (s), equal-power pan -1..1. `taper` fades the last
        30 % (at most 0.6 s) of the signal so a still-ringing note never ends in a step (a click)."""
        if taper:
            k = min(int(0.3 * sig.shape[-1]), int(0.6 * SR))
            sig = sig.copy()
            sig[..., sig.shape[-1] - k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
        if sig.ndim == 1:
            gl, gr = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
            st = np.vstack([sig * gl, sig * gr])
        else:
            st = sig
        st = st * gain
        start = int(round(t0 * SR))
        if self.loop:
            pos, src = start % self.n, 0
            while src < st.shape[1]:  # write in contiguous chunks, wrapping at the end
                k = min(self.n - pos, st.shape[1] - src)
                self.x[:, pos:pos + k] += st[:, src:src + k]
                src += k
                pos = 0
        else:
            a, b = max(0, start), min(self.n, start + st.shape[1])
            if b > a:
                self.x[:, a:b] += st[:, a - start:b - start]


def tvec(seconds: float) -> np.ndarray:
    return np.arange(int(round(seconds * SR))) / SR


def onepole_lp(x: np.ndarray, fc: float) -> np.ndarray:
    a = np.exp(-2 * np.pi * fc / SR)
    return signal.lfilter([1 - a], [1, -a], x, axis=-1)


def bandpass(x: np.ndarray, lo: float, hi: float, order: int = 2) -> np.ndarray:
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def make_ir(seconds: float, rt: float, rng: np.random.Generator, damp_hz: float = 4500.0,
            predelay: float = 0.018) -> np.ndarray:
    """Stereo room IR: decorrelated decaying noise, high band decaying faster (warm, not metallic)."""
    t = tvec(seconds)
    tau = rt / 6.91  # -60 dB at rt
    ir = np.zeros((2, len(t)))
    for ch in range(2):
        nz = rng.standard_normal(len(t))
        low = onepole_lp(nz, damp_hz) * np.exp(-t / tau)
        high = (nz - onepole_lp(nz, damp_hz)) * np.exp(-t / (tau * 0.45))
        ir[ch] = low + 0.5 * high
    pd = int(predelay * SR)
    ir = np.concatenate([np.zeros((2, pd)), ir[:, : len(t) - pd]], axis=1)
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
    return ir


def reverb(x: np.ndarray, ir: np.ndarray, wet: float, loop: bool) -> np.ndarray:
    """x (2, n). Loops use circular convolution so the tail wraps to the start."""
    n = x.shape[1]
    out = np.empty_like(x)
    for ch in range(2):
        src = x.mean(axis=0) * 0.5 + x[ch] * 0.5
        if loop:
            m = n
            irc = np.zeros(n)
            k = min(n, ir.shape[1])
            irc[:k] = ir[ch, :k]
            w = np.fft.irfft(np.fft.rfft(src) * np.fft.rfft(irc), n)
        else:
            w = signal.fftconvolve(src, ir[ch])[:n]
            m = n
        out[ch] = x[ch] * (1 - wet * 0.5) + w[:m] * wet
    return out


def dc_block(x: np.ndarray, loop: bool, hz: float = 24.0) -> np.ndarray:
    if loop:  # circular FFT high-pass keeps the loop seamless
        n = x.shape[1]
        f = np.fft.rfftfreq(n, 1 / SR)
        h = 1 / np.sqrt(1 + (hz / np.maximum(f, 1e-6)) ** 8)
        h[0] = 0.0
        return np.fft.irfft(np.fft.rfft(x, axis=1) * h, n, axis=1)
    sos = signal.butter(2, hz, btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=1)


def fade_edges(x: np.ndarray, fin: float = 0.002, fout: float = 0.05) -> np.ndarray:
    n = x.shape[1]
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:, :a] *= np.linspace(0, 1, a) ** 2
    if b:
        x[:, n - b:] *= np.cos(np.linspace(0, np.pi / 2, b)) ** 2
    return x


# ----------------------------------------------------------------------------------------------------------------
# loudness (ITU-R BS.1770-4, integrated, gated) and levelling
# ----------------------------------------------------------------------------------------------------------------
def lufs(x: np.ndarray) -> float:
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=-1), axis=-1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    n = y.shape[1]
    if n < blk:
        z = np.array([np.sum(np.mean(y ** 2, axis=1))])
    else:
        sq = np.concatenate([np.zeros((y.shape[0], 1)), np.cumsum(y ** 2, axis=1)], axis=1)
        starts = np.arange(0, n - blk + 1, hop)
        z = np.sum((sq[:, starts + blk] - sq[:, starts]) / blk, axis=0)
    with np.errstate(divide="ignore"):
        lk = -0.691 + 10 * np.log10(z)
    z1 = z[lk > -70]
    if len(z1) == 0:
        return -np.inf
    rel = -0.691 + 10 * np.log10(np.mean(z1)) - 10
    z2 = z[(lk > -70) & (lk > rel)]
    return float(-0.691 + 10 * np.log10(np.mean(z2)))


def limit(x: np.ndarray, ceiling: float) -> np.ndarray:
    """Look-ahead peak limiter: gain = ceiling / (window max), smoothed with a Hann of the same width, so every
    sample inside a peak's window is pulled down at least as far as the peak needs (no overshoot, no clicks)."""
    look = int(0.004 * SR)
    env = maximum_filter1d(np.max(np.abs(x), axis=0), size=2 * look + 1)
    g = np.minimum(1.0, ceiling / np.maximum(env, 1e-9))
    win = signal.windows.hann(2 * look + 3)[1:-1]
    g = np.convolve(np.pad(g, look, mode="edge"), win / win.sum(), mode="valid")
    return x * g


def level(x: np.ndarray, target_lufs: float, ceiling_db: float | None) -> np.ndarray:
    x = x * 10 ** ((target_lufs - lufs(x)) / 20)
    if ceiling_db is None:
        return x
    ceil = 10 ** (ceiling_db / 20) * 0.985
    for _ in range(12):
        if np.max(np.abs(x)) <= ceil:
            break
        x = limit(x, ceil)
        x = x * 10 ** ((target_lufs - lufs(x)) / 20)
    return x


def write_wav(path: pathlib.Path, x: np.ndarray, rng: np.random.Generator) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    d = (rng.random(x.shape) - rng.random(x.shape)) / 32768.0  # TPDF dither, 1 LSB
    pcm = np.clip(np.round((x + d) * 32767.0), -32768, 32767).astype(np.int16)
    wavfile.write(str(path), SR, pcm.T.copy())


# ----------------------------------------------------------------------------------------------------------------
# instruments
# ----------------------------------------------------------------------------------------------------------------
def tanpura_pluck(f0: float, seconds: float, rng: np.random.Generator, dark: bool = False) -> np.ndarray:
    """One tanpura string: rich harmonics with the jawari bloom (upper partials swell in a little after the pluck
    and fade, so the tone 'opens' like a vowel), slow beating, long decay."""
    t = tvec(seconds)
    out = np.zeros_like(t)
    fmax = 2400.0 if dark else 5200.0
    nmax = int(min(40, fmax // f0))
    for n in range(1, nmax + 1):
        fn = f0 * n * (1 + 0.00025 * n)
        a = 1.0 / n ** 0.75
        if 3 <= n <= 12:
            a *= 1.6
        a *= np.exp(-fn / (900.0 if dark else 2600.0))
        tau = (7.5 if dark else 6.0) / (1 + 0.07 * n)
        c = 0.12 + 0.07 * n ** 0.9            # bloom centre moves up with the partial number
        w = 0.35 + 0.05 * n
        bloom = 0.45 + 0.55 * np.exp(-(((t - c) / w) ** 2)) + 0.25 * (t > c) * np.exp(-(t - c) / (2.5 * w))
        beat = 1 + 0.18 * np.sin(2 * np.pi * (0.25 + 0.04 * n) * t + rng.uniform(0, 2 * np.pi))
        env = (1 - np.exp(-t / 0.006)) * np.exp(-t / tau) * bloom * beat
        out += a * env * np.sin(2 * np.pi * fn * t + rng.uniform(0, 2 * np.pi))
    # soft finger-pluck thump
    nz = onepole_lp(rng.standard_normal(len(t)), 700.0) * np.exp(-t / 0.012) * 0.25
    return out + nz


def tanpura(seconds: float, sa: float, plucks: int, rng: np.random.Generator, dark: bool = False) -> np.ndarray:
    buf = Buf(seconds, loop=True)
    pattern = [0.75, 2.0, 2.0, 1.0]           # Pa(mandra) - Sa - Sa - Sa(low), as in Divine_Motif
    step = seconds / plucks                    # whole cycles fit the loop exactly
    pans = [-0.35, 0.15, 0.3, -0.1]
    for k in range(plucks):
        f0 = sa * pattern[k % 4] * (1 + rng.normal(0, 0.0005))
        v = rng.uniform(0.85, 1.0) * (1.15 if k % 4 == 3 else 1.0)
        t0 = k * step + rng.normal(0, 0.02)
        buf.add(tanpura_pluck(f0, min(9.0, seconds), rng, dark), t0, pans[k % 4], v)
    ir = make_ir(3.2, 2.6 if not dark else 3.0, rng, damp_hz=3500 if not dark else 2200)
    x = reverb(buf.x, ir, 0.35, loop=True)
    return dc_block(x, loop=True)


def circular_lp(x: np.ndarray, fc: float) -> np.ndarray:
    n = x.shape[1]
    f = np.fft.rfftfreq(n, 1 / SR)
    h = 1 / np.sqrt(1 + (f / fc) ** 2)
    return np.fft.irfft(np.fft.rfft(x, axis=1) * h, n, axis=1)


def swar_note(f: float, seconds: float, rng: np.random.Generator, vel: float = 1.0, damp: float = 1.0,
              bright: float = 1.0) -> np.ndarray:
    """Swarmandal string: plucked metal string (slightly stiff), a detuned sympathetic twin for shimmer."""
    t = tvec(seconds)
    out = np.zeros_like(t)
    pos = 0.13
    for twin, (det, ga) in enumerate([(0.0, 1.0), (0.0012, 0.28)]):
        for n in range(1, 30):
            fn = f * (1 + det) * n * np.sqrt(1 + 0.00012 * n * n)
            if fn > 13000:
                break
            a = abs(np.sin(n * np.pi * pos)) / n ** (1.25 / bright)
            tau = 2.4 * damp / (1 + 0.5 * (n - 1)) / (1 + fn / 6000)
            env = (1 - np.exp(-t / 0.0012)) * np.exp(-t / tau)
            out += ga * a * env * np.sin(2 * np.pi * fn * t + rng.uniform(0, 2 * np.pi))
    click = bandpass(rng.standard_normal(len(t)), 2500, 7000) * np.exp(-t / 0.004) * 0.08 * bright
    return (out + click) * vel


def swar_buf_render(buf: Buf, notes, rng, damp=1.0, bright=1.0, ring=2.6) -> None:
    """notes: (time, freq, vel, pan)"""
    for t0, f, v, p in notes:
        buf.add(swar_note(f, ring, rng, v, damp, bright), t0, p)


def scale_c(name: str, octave: int, sa: float = SA_C3) -> float:
    """octave 0 = Sa at `sa` (C3), 1 = C4 ..."""
    return sa * BHUP[name] * 2 ** octave


# --- tabla ---------------------------------------------------------------------------------------------------------
DAYAN = 261.63  # dayan tuned to Sa (C4)


def _modes(t, f0, amps, decays, rng, glide=None):
    out = np.zeros_like(t)
    for k, (a, d) in enumerate(zip(amps, decays)):
        if glide is None:
            ph = 2 * np.pi * f0 * (k + 1) * t
        else:
            ph = 2 * np.pi * np.cumsum(glide * (k + 1)) / SR
        out += a * np.exp(-t / d) * np.sin(ph + rng.uniform(0, 2 * np.pi))
    return out


def tabla_stroke(kind: str, rng: np.random.Generator, vel: float = 1.0, f0: float = DAYAN) -> np.ndarray:
    t = tvec(1.4)
    att = 1 - np.exp(-t / 0.0008)
    nz = rng.standard_normal(len(t))
    s = np.zeros_like(t)
    if kind in ("na", "dha"):
        s += _modes(t, f0, [0.35, 1.0, 0.6, 0.3, 0.15], [0.45, 0.38, 0.22, 0.14, 0.09], rng)
        s += bandpass(nz, 1500, 6000) * np.exp(-t / 0.005) * 0.25
    if kind in ("tin", "dhin"):
        s += _modes(t, f0, [1.0, 0.45, 0.25, 0.1], [0.55, 0.32, 0.18, 0.1], rng) * 0.9
        s += bandpass(nz, 1200, 5000) * np.exp(-t / 0.004) * 0.15
    if kind in ("te", "ti", "ta"):
        s += bandpass(nz, 500, 3500) * np.exp(-t / 0.018) * 0.6
        s += _modes(t, f0 * 1.25, [0.4, 0.2], [0.035, 0.02], rng)
    if kind in ("ge", "dha", "dhin"):
        g = 92 + 22 * (1 - np.exp(-t / 0.09))      # the bayan's little upward gamak
        s += _modes(t, 0, [1.3, 0.35, 0.1], [0.42, 0.25, 0.12], rng, glide=g)
        s += onepole_lp(nz, 300) * np.exp(-t / 0.01) * 0.8
    if kind == "ke":
        s += onepole_lp(nz, 450) * np.exp(-t / 0.022) * 1.6
        s += np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.03) * 0.5
    return s * att * vel


def dhol_hit(rng: np.random.Generator, f0: float = 64.0, seconds: float = 2.4, vel: float = 1.0) -> np.ndarray:
    """Soft low pakhawaj/dhol stroke: pitched membrane dropping slightly, padded mallet."""
    t = tvec(seconds)
    f = f0 * (1 + 0.16 * np.exp(-t / 0.06))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = 1.0 * np.exp(-t / 0.55) * np.sin(ph)
    for r, a, d in [(1.52, 0.4, 0.32), (2.0, 0.28, 0.25), (2.46, 0.14, 0.18), (3.1, 0.08, 0.1)]:
        s += a * np.exp(-t / d) * np.sin(r * ph + rng.uniform(0, 6.28))
    s += onepole_lp(rng.standard_normal(len(t)), 900) * np.exp(-t / 0.015) * 0.9
    s *= 1 - np.exp(-t / 0.002)
    return s * vel


# --- bansuri ---------------------------------------------------------------------------------------------------------
def bansuri_phrase(notes, rng: np.random.Generator, sa: float) -> np.ndarray:
    """notes: (swara, octave, seconds, amp). Legato with meend glides, delayed vibrato, breath."""
    total = sum(n[2] for n in notes)
    t = tvec(total)
    n = len(t)
    f = np.zeros(n)
    amp = np.zeros(n)
    vib_d = np.zeros(n)
    pos = 0
    for sw, octv, dur, a in notes:
        m = int(round(dur * SR))
        seg = slice(pos, min(n, pos + m))
        L = seg.stop - seg.start
        if sw == "-":
            f[seg] = f[pos - 1] if pos else sa
            amp[seg] = 0.0
        else:
            f[seg] = sa * BHUP[sw] * 2 ** octv
            ls = np.arange(L) / SR
            # each note: a gentle dip at its start (finger change), swell, slight taper
            amp[seg] = a * (0.72 + 0.28 * (1 - np.exp(-ls / 0.12))) * (1 - 0.15 * (ls / max(dur, 1e-3)))
            vd = np.clip((ls - 0.35) / 0.6, 0, 1) * (0.006 if dur > 0.9 else 0.002)
            vib_d[seg] = vd
        pos += m
    # meend: smooth the pitch steps (glides of ~90 ms), smooth the amp (no clicks)
    f = signal.filtfilt(*signal.butter(2, 5.0, fs=SR), np.log(f))
    f = np.exp(f)
    amp = signal.filtfilt(*signal.butter(2, 9.0, fs=SR), amp)
    amp = np.clip(amp, 0, None)
    vib = 1 + vib_d * np.sin(2 * np.pi * 5.1 * t + 0.4 * np.sin(2 * np.pi * 0.3 * t))
    ff = f * vib
    ph = 2 * np.pi * np.cumsum(ff) / SR
    tone = np.sin(ph) + 0.22 * np.sin(2 * ph + 0.3) + 0.09 * np.sin(3 * ph + 1.1) + 0.03 * np.sin(4 * ph)
    # breath: noise around the tone (pitched breath) plus a little airy hiss
    nz = rng.standard_normal(n)
    pitched = bandpass(nz, 400, 3000) * (0.5 + 0.5 * np.sin(ph)) * 0.18
    hiss = bandpass(nz, 2500, 9000) * 0.035
    breath_env = amp ** 0.7
    return amp * tone + breath_env * (pitched + hiss)


# ----------------------------------------------------------------------------------------------------------------
# the library
# ----------------------------------------------------------------------------------------------------------------
def make_tanpura_drone(rng):
    return tanpura(33.714, SA_C3, 24, rng)


def make_tanpura_drone_cs(rng):
    return tanpura(31.825, SA_CS3, 24, rng)


def make_tanpura_drone_low(rng):
    x = tanpura(33.714, SA_C3 / 2, 20, rng, dark=True)
    return circular_lp(x, 1400.0)


def make_play_plucks(rng):
    dur = 8.211
    buf = Buf(dur, loop=True)
    step = dur / 24
    # two light arpeggio bars on Bhupali, gentle up-and-back, ending so it leans into the loop start
    seq = [("S", 2), ("G", 2), ("P", 2), ("D", 2), ("S", 3), ("D", 2), ("P", 2), ("G", 2),
           ("R", 2), ("G", 2), ("P", 2), ("G", 2),
           ("S", 2), ("G", 2), ("P", 2), ("S", 3), ("R", 3), ("S", 3), ("D", 2), ("P", 2),
           ("G", 2), ("P", 2), ("R", 2), ("G", 2)]
    notes = []
    for k, (sw, o) in enumerate(seq):
        accent = 1.0 if k % 4 == 0 else 0.72
        tj = 0.03 + k * step + rng.normal(0, 0.008) + (0.025 if k % 2 else 0)  # a touch of swing
        notes.append((tj, scale_c(sw, o), accent * rng.uniform(0.85, 1.0), rng.uniform(-0.45, 0.45)))
    swar_buf_render(buf, notes, rng, damp=0.8, bright=0.9, ring=2.6)
    # a soft low Sa every bar for grounding
    for k in range(0, 24, 12):
        buf.add(swar_note(scale_c("S", 1), 3.0, rng, 0.45, 1.0, 0.7), 0.03 + k * step, -0.2)
    x = reverb(buf.x, make_ir(2.2, 1.6, rng), 0.28, loop=True)
    return dc_block(x, loop=True)


def make_cheeky_plucks(rng):
    dur = 8.0
    buf = Buf(dur, loop=True)
    beat = dur / 16  # 0.5 s beats
    # tiptoe phrases, staccato (muted) plucks with rests: sneaky
    phrase = [
        (0.0, "G", 3, 1.0), (0.5, "P", 2, 0.7), (1.0, "G", 3, 0.9), (1.25, "R", 3, 0.6), (1.5, "S", 3, 0.8),
        (3.0, "D", 2, 0.8), (3.25, "S", 3, 0.6), (3.5, "D", 2, 0.7), (4.0, "P", 2, 0.9),
        (6.0, "G", 3, 1.0), (6.5, "P", 2, 0.7), (7.0, "G", 3, 0.9), (7.25, "P", 3, 0.7), (7.5, "D", 3, 0.85),
        (9.0, "P", 3, 0.75), (9.25, "G", 3, 0.6), (9.5, "R", 3, 0.6), (10.0, "S", 3, 0.9),
        (12.0, "D", 2, 0.8), (12.5, "S", 3, 0.8), (13.0, "D", 2, 0.7), (13.5, "P", 2, 0.75),
        (14.5, "G", 2, 0.6), (14.75, "P", 2, 0.65), (15.0, "S", 3, 0.95),
    ]
    notes = [(0.03 + b * beat + rng.normal(0, 0.006), scale_c(sw, o), v, rng.uniform(-0.5, 0.5)) for b, sw, o, v in phrase]
    swar_buf_render(buf, notes, rng, damp=0.13, bright=0.85, ring=1.2)
    x = reverb(buf.x, make_ir(1.6, 1.1, rng), 0.22, loop=True)
    return dc_block(x, loop=True)


def make_tabla_soft(rng):
    dur = 9.87
    buf = Buf(dur, loop=True)
    b = dur / 16  # two keherwa cycles of 8 matras
    cyc1 = [("dha", 1.0), ("ge", 0.7), ("na", 0.8), ("ti", 0.6), ("na", 0.75), ("ke", 0.6), ("dhin", 0.9), ("na", 0.7)]
    cyc2 = [("dha", 1.0), ("ge", 0.7), ("na", 0.8), ("ti", 0.6), ("na", 0.75), ("ke", 0.6), ("dhin", 0.9), ("na", 0.7)]
    events = []
    for c, cyc in enumerate([cyc1, cyc2]):
        for k, (s, v) in enumerate(cyc):
            events.append(((c * 8 + k) * b, s, v))
    # small ornaments (half-matra fillers) in the second cycle
    events += [(13.5 * b, "te", 0.35), (15.5 * b, "ti", 0.3), (5.5 * b, "ge", 0.35)]
    for t0, s, v in events:
        tj = 0.03 + t0 + rng.normal(0, 0.006)
        buf.add(tabla_stroke(s, rng, v * rng.uniform(0.9, 1.0)), tj, 0.1 if s in ("ge", "ke") else -0.1)
    x = reverb(buf.x, make_ir(1.5, 0.9, rng, damp_hz=5000), 0.18, loop=True)
    return dc_block(x, loop=True)


def make_tabla_run(rng):
    dur = 2.694
    buf = Buf(dur, loop=False)
    # accelerating tirakita roll, crescendo, into a ringing Dha at ~1.95 s
    times, t, gap = [], 0.04, 0.16
    while t < 1.78:
        times.append(t)
        t += gap
        gap = max(0.055, gap * 0.9)
    cycle = ["ti", "ra", "ki", "ta"]
    for i, t0 in enumerate(times):
        prog = t0 / 1.78
        v = 0.35 + 0.55 * prog
        kind = {"ti": "te", "ra": "ti", "ki": "ke", "ta": "na"}[cycle[i % 4]]
        buf.add(tabla_stroke(kind, rng, v * rng.uniform(0.9, 1.0)), t0, rng.uniform(-0.2, 0.2))
        if i % 4 == 0 and prog > 0.4:
            buf.add(tabla_stroke("ge", rng, 0.5 * v), t0, 0.15)
    buf.add(tabla_stroke("dha", rng, 1.15), 1.86, 0.0)
    buf.add(tabla_stroke("ge", rng, 0.6), 1.86, 0.1)
    x = reverb(buf.x, make_ir(1.6, 1.0, rng), 0.2, loop=False)
    return fade_edges(dc_block(x, loop=False), 0.001, 0.3)


def make_cheeky_pluck_1(rng):
    dur = 2.511
    buf = Buf(dur, loop=False)
    # quick upward flurry (strum across the swarmandal), with a little bounce at the top
    seq = [("S", 2), ("R", 2), ("G", 2), ("P", 2), ("D", 2), ("S", 3), ("R", 3), ("G", 3), ("P", 3)]
    t = 0.01
    for k, (sw, o) in enumerate(seq):
        buf.add(swar_note(scale_c(sw, o), 2.4, rng, 0.55 + 0.05 * k, 0.9, 1.0), t, -0.5 + k * 0.12)
        t += 0.038
    buf.add(swar_note(scale_c("G", 3), 2.4, rng, 0.7, 0.9), t + 0.11, 0.3)
    buf.add(swar_note(scale_c("S", 4), 2.4, rng, 0.85, 1.0), t + 0.22, 0.1)
    x = reverb(buf.x, make_ir(2.0, 1.4, rng), 0.25, loop=False)
    return fade_edges(dc_block(x, loop=False), 0.001, 0.35)


def make_cheeky_pluck_2(rng):
    dur = 2.405
    buf = Buf(dur, loop=False)
    # 5-note comic statement: ta-ta-ta-taa ... TING (the last one rings)
    seq = [(0.0, "G", 2, 0.8, 0.35), (0.14, "P", 2, 0.7, 0.35), (0.28, "D", 2, 0.75, 0.35),
           (0.48, "P", 2, 0.8, 0.5), (0.78, "S", 3, 1.0, 1.2)]
    for t0, sw, o, v, damp in seq:
        buf.add(swar_note(scale_c(sw, o), 2.4, rng, v, damp), t0 + 0.005, rng.uniform(-0.3, 0.3))
    buf.add(swar_note(scale_c("S", 2), 2.4, rng, 0.4, 1.2, 0.7), 0.785, -0.2)  # octave under the last note
    x = reverb(buf.x, make_ir(2.0, 1.5, rng), 0.25, loop=False)
    return fade_edges(dc_block(x, loop=False), 0.001, 0.4)


def make_cheeky_pluck_3(rng):
    dur = 1.382
    buf = Buf(dur, loop=False)
    # four whimsical tiptoe notes, skipping up and down
    seq = [(0.0, "D", 2, 0.75), (0.17, "R", 3, 0.7), (0.34, "P", 2, 0.75), (0.55, "G", 3, 0.95)]
    for t0, sw, o, v in seq:
        buf.add(swar_note(scale_c(sw, o), 1.4, rng, v, 0.45), t0 + 0.005, rng.uniform(-0.35, 0.35))
    x = reverb(buf.x, make_ir(1.6, 1.1, rng), 0.22, loop=False)
    return fade_edges(dc_block(x, loop=False), 0.001, 0.25)


def make_tension_rise(rng):
    dur = 1.3
    crest = 1.255
    buf = Buf(dur, loop=False)
    # low dhol roll + dayan roll, both accelerating and swelling into the crest
    t, gap = 0.0, 0.11
    while t < crest - 0.03:
        p = t / crest
        buf.add(dhol_hit(rng, 70, 0.6, 0.25 + 0.5 * p ** 1.5), t, -0.1)
        buf.add(tabla_stroke("te" if int(t / 0.01) % 2 else "na", rng, 0.2 + 0.6 * p ** 1.3), t + gap / 2, 0.15)
        t += gap
        gap = max(0.045, gap * 0.9)
    # a rising swarmandal gliss over the last 0.8 s
    seq = [("S", 2), ("R", 2), ("G", 2), ("P", 2), ("D", 2), ("S", 3), ("R", 3), ("G", 3), ("P", 3), ("D", 3)]
    for k, (sw, o) in enumerate(seq):
        tk = 0.45 + 0.78 * (1 - (1 - k / (len(seq) - 1)) ** 0.7) * 0.98
        buf.add(swar_note(scale_c(sw, o), 1.0, rng, 0.2 + 0.05 * k, 0.5), tk, -0.4 + 0.08 * k)
    # a soft rising tone under it (bowed-drone feel), Sa to Pa
    tt = tvec(dur)
    f = SA_C3 * (1 + 0.5 * np.clip(tt / crest, 0, 1) ** 2)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * np.clip(tt / crest, 0, 1) ** 2 * 0.18
    buf.add(tone, 0.0, 0.0, taper=False)
    # crest accent
    buf.add(tabla_stroke("dha", rng, 0.9), crest, 0.0)
    buf.add(dhol_hit(rng, 66, 0.5, 0.8), crest, 0.0)
    x = reverb(buf.x, make_ir(1.2, 0.8, rng), 0.15, loop=False)
    return fade_edges(dc_block(x, loop=False), 0.001, 0.03)


def make_drum_hit_low(rng):
    dur = 2.6
    buf = Buf(dur, loop=False)
    buf.add(dhol_hit(rng, 62, 2.6, 1.0), 0.003, 0.0)
    # the second (dayan) side touched lightly, adds body you can hear on small speakers
    buf.add(tabla_stroke("tin", rng, 0.12, f0=196.0), 0.003, 0.0)
    x = reverb(buf.x, make_ir(2.0, 1.4, rng, damp_hz=2500), 0.2, loop=False)
    return fade_edges(dc_block(x, loop=False, hz=30), 0.001, 0.6)


def make_bansuri_compassion(rng):
    dur = 9.529
    notes = [  # (swara, octave, seconds, amp) around Sa = C5
        ("P", -1, 1.0, 0.55), ("S", 0, 1.1, 0.8), ("R", 0, 0.6, 0.8), ("G", 0, 1.5, 0.95), ("R", 0, 0.55, 0.8),
        ("S", 0, 0.7, 0.75), ("D", -1, 0.8, 0.7), ("P", -1, 0.45, 0.6), ("S", 0, 2.4, 0.8),
    ]
    sa = SA_C3 * 4  # C5
    tone = bansuri_phrase(notes, rng, sa)
    # final Sa fades as a long breath
    t = tvec(len(tone) / SR)
    fall = np.clip((t - (len(tone) / SR - 1.6)) / 1.6, 0, 1)
    tone *= np.cos(fall * np.pi / 2) ** 1.5
    tone *= 1 - np.exp(-t / 0.12)
    buf = Buf(dur, loop=False)
    buf.add(tone, 0.08, 0.05, taper=False)
    x = reverb(buf.x, make_ir(3.0, 2.4, rng, damp_hz=4000), 0.32, loop=False)
    return fade_edges(dc_block(x, loop=False), 0.01, 0.45)


def make_plate_clink(rng):
    dur = 0.8
    buf = Buf(dur, loop=False)

    def clink(vel):
        t = tvec(0.8)
        s = np.zeros_like(t)
        # small brass thali: inharmonic plate modes, close pairs beat (shimmer), highs die fast
        modes = [(1180, 1.0, 0.30), (1186, 0.6, 0.28), (2047, 0.8, 0.2), (2790, 0.55, 0.16), (2797, 0.35, 0.15),
                 (3725, 0.45, 0.11), (4630, 0.35, 0.08), (5910, 0.25, 0.06), (7320, 0.15, 0.04)]
        for f, a, d in modes:
            s += a * np.exp(-t / d) * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28))
        s += bandpass(rng.standard_normal(len(t)), 3000, 10000) * np.exp(-t / 0.002) * 0.6
        return s * (1 - np.exp(-t / 0.0004)) * vel

    buf.add(clink(1.0), 0.004, -0.1)
    buf.add(clink(0.35), 0.072, 0.1)   # the little bounce as it settles
    x = reverb(buf.x, make_ir(0.8, 0.5, rng, damp_hz=7000), 0.12, loop=False)
    x = dc_block(x, loop=False, hz=200)
    return fade_edges(x, 0.0005, 0.15)


# name -> (path under public/audio, builder, loop, target LUFS or None, peak ceiling dBFS or None)
LIBRARY = {
    "tanpura_drone": ("music/ep05/tanpura_drone.wav", make_tanpura_drone, True, -24.0, -3.0),
    "tanpura_drone_low": ("music/ep05/tanpura_drone_low.wav", make_tanpura_drone_low, True, -28.0, -3.0),
    "tanpura_drone_cs": ("music/ep05/tanpura_drone_cs.wav", make_tanpura_drone_cs, True, -24.0, -3.0),
    "play_plucks": ("music/ep05/play_plucks.wav", make_play_plucks, True, -24.0, -3.0),
    "cheeky_plucks": ("music/ep05/cheeky_plucks.wav", make_cheeky_plucks, True, -22.0, -3.0),
    "tabla_soft": ("music/ep05/tabla_soft.wav", make_tabla_soft, True, -24.0, -3.0),
    "tabla_run": ("music/ep05/tabla_run.wav", make_tabla_run, False, -20.1, -3.0),
    "cheeky_pluck_1": ("music/ep05/cheeky_pluck_1.wav", make_cheeky_pluck_1, False, -20.0, -3.0),
    "cheeky_pluck_2": ("music/ep05/cheeky_pluck_2.wav", make_cheeky_pluck_2, False, -20.0, -3.0),
    "cheeky_pluck_3": ("music/ep05/cheeky_pluck_3.wav", make_cheeky_pluck_3, False, -20.0, -3.0),
    "tension_rise": ("music/ep05/tension_rise.wav", make_tension_rise, False, -20.0, -3.0),
    "drum_hit_low": ("music/ep05/drum_hit_low.wav", make_drum_hit_low, False, -20.0, -3.0),
    "bansuri_compassion": ("music/ep05/bansuri_compassion.wav", make_bansuri_compassion, False, -20.0, -3.0),
    "plate_clink": ("sfx/ep06/plate_clink.wav", make_plate_clink, False, None, -6.0),
}


def build(name: str) -> None:
    rel, fn, loop, target, ceil = LIBRARY[name]
    seed = sum(ord(c) * (i + 1) for i, c in enumerate(name))
    rng = np.random.default_rng(seed)
    x = fn(rng)
    if target is None:  # SFX: peak-normalise
        x = x * (10 ** (ceil / 20) / np.max(np.abs(x)))
    else:
        x = level(x, target, ceil)
    write_wav(PUBLIC / rel, x, rng)


# ----------------------------------------------------------------------------------------------------------------
# verification
# ----------------------------------------------------------------------------------------------------------------
def read(path: pathlib.Path) -> np.ndarray:
    sr, d = wavfile.read(str(path))
    assert sr == SR, f"{path}: {sr} Hz"
    x = d.astype(np.float64) / 32768.0
    return x.T if x.ndim == 2 else np.vstack([x, x])


def verify(names, spectro_dir: pathlib.Path | None) -> None:
    print(f"{'file':<22}{'sec':>8}{'type':>7}{'peak dBFS':>11}{'LUFS':>8}{'DC':>9}  seam (|last-first| vs median step)")
    for name in names:
        rel, _, loop, target, _ = LIBRARY[name]
        x = read(PUBLIC / rel)
        pk = 20 * np.log10(np.max(np.abs(x)) + 1e-12)
        dc = float(np.max(np.abs(np.mean(x, axis=1))))
        seam = ""
        if loop:
            jump = float(np.max(np.abs(x[:, 0] - x[:, -1])))
            step = float(np.median(np.abs(np.diff(x, axis=1))))
            p99 = float(np.percentile(np.abs(np.diff(x, axis=1)), 99.9))
            seam = f"{jump:.5f} vs {step:.5f} (99.9%: {p99:.5f}) {'OK' if jump <= p99 else 'CHECK'}"
        print(f"{name:<22}{x.shape[1] / SR:8.3f}{'loop' if loop else 'shot':>7}{pk:11.2f}{lufs(x):8.1f}{dc:9.5f}  {seam}")
    if spectro_dir is not None:
        import os
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        spectro_dir.mkdir(parents=True, exist_ok=True)
        for name in names:
            rel = LIBRARY[name][0]
            x = read(PUBLIC / rel)
            m = x.mean(axis=0)
            fig, axes = plt.subplots(2, 1, figsize=(12, 7), gridspec_kw={"height_ratios": [1, 3]})
            tt = np.arange(len(m)) / SR
            axes[0].plot(tt, x[0], lw=0.3)
            axes[0].plot(tt, x[1], lw=0.3, alpha=0.6)
            axes[0].set_ylim(-1, 1)
            axes[0].set_title(f"{rel}  (waveform L/R, full scale = 1)")
            nper = 8192 if LIBRARY[name][2] and "drone" in name else 2048
            f, ts, S = signal.spectrogram(m, SR, nperseg=nper, noverlap=nper * 3 // 4)
            axes[1].pcolormesh(ts, f, 10 * np.log10(S + 1e-14), shading="auto", vmin=-150, vmax=-40, cmap="magma")
            axes[1].set_ylim(0, 6000 if "clink" not in name else 12000)
            axes[1].set_ylabel("Hz")
            axes[1].set_xlabel("s")
            fig.tight_layout()
            out = spectro_dir / f"{name}.png"
            fig.savefig(out, dpi=80)
            plt.close(fig)
            print(f"[spectrogram] {out}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="+", choices=list(LIBRARY), help="build just these")
    ap.add_argument("--verify-only", action="store_true", help="measure the files on disk, write nothing")
    ap.add_argument("--spectrograms", type=pathlib.Path, help="also save spectrogram PNGs here (needs matplotlib)")
    a = ap.parse_args()
    names = a.only or list(LIBRARY)
    if not a.verify_only:
        for n in names:
            build(n)
            print(f"[write] {LIBRARY[n][0]}")
    sd = a.spectrograms if a.spectrograms is None or a.spectrograms.is_absolute() else ROOT / a.spectrograms
    verify(names, sd)


if __name__ == "__main__":
    main()
