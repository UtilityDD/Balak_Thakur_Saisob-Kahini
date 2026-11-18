#!/usr/bin/env node
/**
 * Procedural sound effects for Episode 1. Pure Node, no dependencies, deterministic.
 * Writes 48 kHz / 16-bit stereo WAVs into remotion_studio/public/audio/sfx/,
 * each peak-normalised to -6 dBFS:
 *   padma_river_day.wav    ~20 s  river-flow bed: filtered pink/brown noise, slow swells,
 *                                 low rumble, occasional soft water lapping
 *   cracker_burst.wav       ~3 s  firecracker: sharp transients, quick crackles, decay
 *   sparkler_crackle.wav    ~4 s  fine high-frequency sizzle
 *   distant_ship_horn.wav   ~6 s  low, soft steamship horn, slow fade-in and fade-out
 *
 * Usage: node scripts/synthesize_sfx.js
 */
const fs = require("fs");
const path = require("path");

const SR = 48000;
const PEAK_DBFS = -6;
const OUT_DIR = path.join(__dirname, "../remotion_studio/public/audio/sfx");

/* ---------- helpers ---------- */
const rngFrom = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // [0,1)
  };
};
const bi = (rnd) => rnd() * 2 - 1; // [-1,1)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smooth = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x, 0, 1)); // raised cosine 0..1
const rms = (x) => {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length) || 1;
};
const unitRms = (x) => {
  const g = 1 / rms(x);
  for (let i = 0; i < x.length; i++) x[i] *= g;
  return x;
};
const addAt = (buf, x, t0, gain = 1) => {
  const s = Math.round(t0 * SR);
  for (let i = 0; i < x.length; i++) {
    const j = s + i;
    if (j >= 0 && j < buf.length) buf[j] += gain * x[i];
  }
};
const fadeEdges = (x, fin, fout) => {
  const n = x.length;
  for (let i = 0; i < n; i++) x[i] *= smooth(i / SR / fin) * smooth((n - i) / SR / fout);
  return x;
};

/* ---------- noise sources ---------- */
const white = (n, rnd) => {
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) y[i] = bi(rnd);
  return y;
};
const pink = (n, rnd) => {
  // Paul Kellet's pink filter
  const y = new Float64Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = bi(rnd);
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    y[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
  }
  return unitRms(y);
};
const brown = (n, rnd) => {
  // leaky integrator of white noise
  const y = new Float64Array(n);
  let s = 0;
  for (let i = 0; i < n; i++) {
    s = 0.998 * s + 0.05 * bi(rnd);
    y[i] = s;
  }
  return unitRms(y);
};

/* ---------- filters ---------- */
// RBJ biquad, direct form I. type: "lp" | "hp" | "bp" (0 dB peak)
const biquad = (x, type, f0, q = 0.707) => {
  const w0 = (2 * Math.PI * f0) / SR;
  const cw = Math.cos(w0);
  const al = Math.sin(w0) / (2 * q);
  let b0, b1, b2;
  if (type === "lp") {
    b0 = (1 - cw) / 2;
    b1 = 1 - cw;
    b2 = b0;
  } else if (type === "hp") {
    b0 = (1 + cw) / 2;
    b1 = -(1 + cw);
    b2 = b0;
  } else {
    b0 = al;
    b1 = 0;
    b2 = -al;
  }
  const a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    y[i] = v;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
  }
  return y;
};

// feedback comb with a one-pole damped loop (a soft, dark tail)
const comb = (x, dSec, fb, dampHz) => {
  const d = Math.round(dSec * SR);
  const y = new Float64Array(x.length);
  const buf = new Float64Array(d);
  const a = Math.exp((-2 * Math.PI * dampHz) / SR);
  let z = 0, idx = 0;
  for (let i = 0; i < x.length; i++) {
    const o = buf[idx];
    z = o * (1 - a) + z * a;
    buf[idx] = x[i] + z * fb;
    y[i] = o;
    idx = (idx + 1) % d;
  }
  return y;
};

// short exponentially decaying noise burst, filtered, added into buf at t0
const burst = (buf, rnd, t0, len, tau, amp, filt = (x) => x) => {
  const n = Math.round(len * SR);
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = bi(rnd) * Math.exp(-i / (tau * SR));
  addAt(buf, filt(x), t0, amp);
};

/* ---------- sound effects: each returns [L, R] ---------- */

function padmaRiverDay() {
  const DUR = 20, N = Math.round(DUR * SR);
  return [0, 1].map((ch) => {
    const rnd = rngFrom(1001 + ch * 77);
    const water = unitRms(biquad(biquad(pink(N, rnd), "hp", 180), "lp", 2800));
    const body = unitRms(biquad(biquad(brown(N, rnd), "lp", 260), "lp", 260));
    const lapBed = unitRms(biquad(pink(N, rnd), "bp", 1000, 0.9));

    // soft wave-lapping events scattered through the stretch
    const lap = new Float64Array(N);
    for (let te = 1.2 + 1.5 * rnd(); te < DUR - 1.5; te += 2.2 + 2.6 * rnd()) {
      const amp = 0.5 + 0.5 * rnd();
      const s0 = Math.round(te * SR);
      const n = Math.round((0.7 + 0.5 * rnd()) * SR);
      for (let k = 0; k < n && s0 + k < N; k++) {
        const u = k / n;
        lap[s0 + k] += amp * smooth(u / 0.3) * Math.pow(1 - u, 1.8) * lapBed[s0 + k];
      }
    }

    const ph = ch * 1.3;
    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      // slow, always-positive swells from two incommensurate LFOs
      const swell = 0.55 + 0.28 * Math.sin(2 * Math.PI * 0.083 * t + ph) + 0.17 * Math.sin(2 * Math.PI * 0.031 * t + 2.1 + ph);
      const bodySwell = 0.6 + 0.25 * Math.sin(2 * Math.PI * 0.047 * t + 0.7 + ph);
      const rumble =
        0.08 * Math.sin(2 * Math.PI * 46 * t + ph) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.05 * t)) +
        0.04 * Math.sin(2 * Math.PI * 69 * t + 1.0 + ph);
      out[i] = 0.35 * water[i] * swell + 0.3 * body[i] * bodySwell + rumble + 0.25 * lap[i];
    }
    return fadeEdges(out, 2.0, 2.5);
  });
}

function crackerBurst() {
  const DUR = 3, N = Math.round(DUR * SR);
  const rnd = rngFrom(3001);
  const snap = new Float64Array(N);

  // 1. initial snap: very short broadband transient
  burst(snap, rnd, 0, 0.006, 0.0015, 0.9, (x) => biquad(x, "hp", 2500));

  // 2. low body thump with a quick downward pitch
  {
    const n = Math.round(0.35 * SR);
    const x = new Float64Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (45 + 80 * Math.exp(-t / 0.02))) / SR;
      x[i] = Math.sin(ph) * Math.exp(-t / 0.07);
    }
    addAt(snap, x, 0, 0.45);
  }

  // 3. a few quick crackles in the first ~0.7 s, each quieter and differently tuned
  let tc = 0.015;
  for (let k = 0; k < 8 && tc < 0.7; k++) {
    const f = 1800 + 4500 * rnd();
    burst(snap, rnd, tc, 0.04, 0.006, (0.55 + 0.35 * rnd()) * Math.pow(0.9, k), (x) => biquad(x, "bp", f, 1.2));
    tc += 0.03 + 0.09 * rnd();
  }

  // 4. decay: high-passed noise tail dying away over about 2 s
  {
    const n = Math.round(2.6 * SR);
    const x = new Float64Array(n);
    for (let i = 0; i < n; i++) x[i] = bi(rnd) * Math.exp(-(i / SR) / 0.45);
    addAt(snap, biquad(biquad(x, "hp", 1400), "lp", 7000), 0.04, 0.22);
  }

  // 5. a few sparse late pops in the tail
  for (let k = 0; k < 5; k++) {
    const t0 = 0.8 + 1.6 * rnd();
    const f = 3000 + 3000 * rnd();
    burst(snap, rnd, t0, 0.02, 0.004, 0.12 + 0.1 * rnd(), (x) => biquad(x, "bp", f, 1));
  }

  const mono = fadeEdges(biquad(biquad(snap, "lp", 9000), "lp", 9000), 0.005, 0.4);
  // right channel: 1.2 ms Haas offset for a little width
  const d = Math.round(0.0012 * SR);
  const R = new Float64Array(N);
  for (let i = d; i < N; i++) R[i] = 0.85 * mono[i - d];
  return [mono, R];
}

function sparklerCrackle() {
  const DUR = 4, N = Math.round(DUR * SR);
  return [2101, 2202].map((seed) => {
    const rnd = rngFrom(seed);

    // dense micro-crackles: ~260 per second, each 0.8-3 ms of broadband noise
    const pops = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      if (rnd() < 260 / SR) {
        const amp = 0.15 + 0.35 * rnd() * rnd();
        const n = Math.round((0.0008 + 0.0022 * rnd()) * SR);
        for (let k = 0; k < n && i + k < N; k++) pops[i + k] += amp * bi(rnd) * Math.exp(-k / (0.0006 * SR));
      }
    }
    // occasional brighter spits
    for (let i = 0; i < N; i++) {
      if (rnd() < 5 / SR) {
        const amp = 0.4 + 0.3 * rnd();
        const n = Math.round(0.006 * SR);
        for (let k = 0; k < n && i + k < N; k++) pops[i + k] += amp * bi(rnd) * Math.exp(-k / (0.0012 * SR));
      }
    }
    const shaped = biquad(biquad(pops, "hp", 3500), "lp", 11000);

    // continuous fine sizzle bed with a gentle wobble
    const bed = unitRms(biquad(biquad(white(N, rnd), "hp", 4500), "lp", 11000));
    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      out[i] = 0.07 * bed[i] * (0.75 + 0.25 * Math.sin(2 * Math.PI * 1.3 * t + seed)) + shaped[i];
    }
    return fadeEdges(out, 0.2, 1.0);
  });
}

function distantShipHorn() {
  const DUR = 6, N = Math.round(DUR * SR);
  const F0 = 92; // low fundamental, roughly F#2
  const chan = (ch) => {
    const rnd = rngFrom(4001 + ch * 31);
    const dry = new Float64Array(N);

    // two slightly detuned chamber sets give the warm beating of a real horn
    const voices = [
      [F0 * (ch ? 1.002 : 0.998), 1.0],
      [F0 * (ch ? 1.006 : 0.994), 0.6],
    ];
    for (const [f0, g] of voices) {
      const ph = new Float64Array(8);
      for (let i = 0; i < N; i++) {
        const drift = 1 - 0.012 * (i / N); // pitch sags slightly over the blast
        let s = 0;
        for (let n = 1; n <= 7; n++) {
          ph[n] += (2 * Math.PI * f0 * n * drift) / SR;
          s += Math.sin(ph[n]) / Math.pow(n, 1.4);
        }
        dry[i] += g * 0.4 * s;
      }
    }

    // breath noise under the tone
    const breath = unitRms(biquad(biquad(pink(N, rnd), "bp", 320, 0.9), "lp", 900));

    // slow fade-in (1.4 s), hold, slow fade-out (2 s)
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      const env = t < 1.4 ? smooth(t / 1.4) : t < 4.0 ? 1 : smooth((DUR - t) / 2.0);
      dry[i] = (dry[i] + 0.05 * breath[i]) * env;
    }

    // soften, then add a dark, distant-sounding tail
    const soft = biquad(biquad(dry, "lp", 1100), "lp", 1100);
    const wet = new Float64Array(N);
    for (const d of [0.071, 0.097, 0.131]) {
      const c = comb(soft, d, 0.55, 1100);
      for (let i = 0; i < N; i++) wet[i] += c[i] / 3;
    }
    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) out[i] = soft[i] + 0.4 * wet[i];
    return fadeEdges(out, 0.02, 0.2);
  };
  return [chan(0), chan(1)];
}

/* ---------- WAV writer (48 kHz / 16-bit stereo, peak-normalised) ---------- */
const toI16 = (v) => Math.round(clamp(v, -1, 1) * 32767);

const writeWav = (file, [L, R]) => {
  const n = L.length;
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = Math.pow(10, PEAK_DBFS / 20) / peak;

  const data = Buffer.alloc(n * 4);
  let peakInt = 0;
  for (let i = 0; i < n; i++) {
    const l = toI16(L[i] * g), r = toI16(R[i] * g);
    data.writeInt16LE(l, i * 4);
    data.writeInt16LE(r, i * 4 + 2);
    peakInt = Math.max(peakInt, Math.abs(l), Math.abs(r));
  }

  const hdr = Buffer.alloc(44);
  hdr.write("RIFF", 0);
  hdr.writeUInt32LE(36 + data.length, 4);
  hdr.write("WAVE", 8);
  hdr.write("fmt ", 12);
  hdr.writeUInt32LE(16, 16);
  hdr.writeUInt16LE(1, 20);
  hdr.writeUInt16LE(2, 22);
  hdr.writeUInt32LE(SR, 24);
  hdr.writeUInt32LE(SR * 4, 28);
  hdr.writeUInt16LE(4, 32);
  hdr.writeUInt16LE(16, 34);
  hdr.write("data", 36);
  hdr.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([hdr, data]));

  return { dur: n / SR, peakDbfs: 20 * Math.log10(peakInt / 32767) };
};

/* ---------- main ---------- */
const JOBS = [
  ["padma_river_day.wav", padmaRiverDay],
  ["cracker_burst.wav", crackerBurst],
  ["sparkler_crackle.wav", sparklerCrackle],
  ["distant_ship_horn.wav", distantShipHorn],
];

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, make] of JOBS) {
  const file = path.join(OUT_DIR, name);
  const r = writeWav(file, make());
  console.log(`${name.padEnd(24)} ${r.dur.toFixed(2)} s  peak ${r.peakDbfs.toFixed(2)} dBFS  -> ${file}`);
}
