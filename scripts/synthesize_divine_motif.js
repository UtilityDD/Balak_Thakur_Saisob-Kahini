#!/usr/bin/env node
/**
 * Balak Thakur's divine motif (see 01_Series_Bible/divine_visual_language.md §2).
 * Pure Node, no dependencies. Writes 48 kHz / 16-bit stereo WAV:
 *   tanpura drone (Pa-Sa-Sa-Sa) + distant conch (shankha) + bansuri phrase in Raga Bhupali
 *   + a soft temple chime at CHIME_AT seconds, through a Schroeder hall reverb.
 *
 * Usage: node scripts/synthesize_divine_motif.js [out.wav]
 */
const fs = require("fs");
const path = require("path");

const SR = 48000;
const DUR = 36;
const N = SR * DUR;
const SA = 138.59; // C#3
const CHIME_AT = 11.1; // aligns with the birth flash when the motif starts at scene frame 404
const out = process.argv[2] || path.join(__dirname, "../remotion_studio/public/audio/music/Divine_Motif.wav");

const L = new Float32Array(N);
const R = new Float32Array(N);
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
const add = (i, v, pan = 0) => {
  if (i < 0 || i >= N) return;
  // equal-power pan
  L[i] += v * Math.sqrt((1 - pan) / 2);
  R[i] += v * Math.sqrt((1 + pan) / 2);
};

/* ---- tanpura ---- */
const pattern = [SA * 0.75, SA * 2, SA * 2, SA];
for (let k = 0, t0 = 0; t0 < DUR - 1; k++, t0 += 1.25) {
  const f0 = pattern[k % 4] * (1 + (rnd() * 0.0008));
  const start = Math.floor(t0 * SR);
  const len = Math.floor(5.5 * SR);
  const pan = k % 2 ? 0.25 : -0.25;
  for (let n = 1; n <= 16; n++) {
    const jawari = n >= 3 && n <= 9 ? 1.7 : 1;
    const amp = (0.055 / Math.pow(n, 0.9)) * jawari;
    const tau = 4.2 / (1 + 0.12 * n);
    const fn = f0 * n * (1 + 0.0004 * n);
    const ph = rnd() * Math.PI;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.008) * Math.exp(-t / tau) * (1 + 0.25 * Math.sin(2 * Math.PI * 0.6 * t + n));
      add(start + i, amp * env * Math.sin(2 * Math.PI * fn * t + ph), pan);
    }
  }
}

/* ---- conch (shankha) swells ---- */
const conch = (t0, dur, f0, gain) => {
  const start = Math.floor(t0 * SR);
  let lp = 0;
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 1.4);
    const rel = Math.min(1, (dur - t) / 1.6);
    const env = Math.pow(att * rel, 1.5);
    const glide = 1 - 0.06 * Math.exp(-t * 3);
    const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 4.6 * t);
    const ff = f0 * glide * vib;
    let v = 0;
    for (let n = 1; n <= 9; n++) v += (n % 2 ? 1 : 0.45) * Math.sin(2 * Math.PI * ff * n * t) / n;
    lp += 0.04 * (rnd() - lp);
    add(start + i, gain * env * (v * 0.6 + lp * 0.9), -0.1);
  }
};
conch(0.2, 6.0, SA * 2.5, 0.07);
conch(19.0, 6.5, SA * 2.5, 0.06);

/* ---- bansuri: Raga Bhupali (Sa Re Ga Pa Dha) ---- */
const S = SA * 2;
const sw = { S: 1, R: 9 / 8, G: 5 / 4, P: 3 / 2, D: 5 / 3, "S'": 2, "-": 0 };
const phrase = [
  ["G", 1.4], ["P", 1.0], ["D", 1.7], ["P", 0.8], ["G", 1.2], ["R", 0.8], ["S", 2.6], ["-", 0.9],
  ["P", 1.2], ["D", 1.0], ["S'", 2.6], ["D", 0.8], ["P", 1.0], ["G", 1.6], ["R", 0.9], ["S", 3.8],
];
{
  let t = 3.4;
  let prevF = 0;
  let lp = 0;
  for (const [note, d] of phrase) {
    const ratio = sw[note];
    const start = Math.floor(t * SR);
    const len = Math.floor(d * SR);
    if (ratio > 0) {
      const target = S * ratio;
      let phase = 0;
      for (let i = 0; i < len; i++) {
        const tt = i / SR;
        const glideK = prevF > 0 ? Math.min(1, tt / 0.12) : 1;
        const base = prevF > 0 ? prevF + (target - prevF) * (1 - Math.pow(1 - glideK, 2)) : target;
        const vibDepth = 0.0065 * Math.min(1, tt / 0.6);
        const ff = base * (1 + vibDepth * Math.sin(2 * Math.PI * 5.2 * tt));
        phase += (2 * Math.PI * ff) / SR;
        const env = Math.min(1, tt / 0.14) * Math.min(1, (d - tt) / 0.18);
        lp += 0.12 * (rnd() - lp);
        const tone = Math.sin(phase) + 0.16 * Math.sin(2 * phase) + 0.05 * Math.sin(3 * phase);
        add(start + i, 0.11 * env * (tone + lp * 0.35), 0.05);
      }
      prevF = target;
    }
    t += d;
  }
}

/* ---- soft temple chime at the birth moment ---- */
{
  const start = Math.floor(CHIME_AT * SR);
  const partials = [[1, 1], [2.0, 0.5], [2.76, 0.35], [5.4, 0.2], [8.93, 0.1]];
  for (const [ratio, a] of partials) {
    const fn = 830 * ratio;
    for (let i = 0; i < 7 * SR; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.004) * Math.exp(-t / (3.2 / ratio));
      add(start + i, 0.06 * a * env * Math.sin(2 * Math.PI * fn * t), 0.15);
    }
  }
}

/* ---- Schroeder hall reverb ---- */
const reverb = (x, off) => {
  const combs = [1687, 1601, 2053, 2251].map((d) => ({ buf: new Float32Array(d + off), i: 0, fb: 0.86 }));
  const aps = [347, 113].map((d) => ({ buf: new Float32Array(d), i: 0 }));
  const y = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    let s = 0;
    for (const c of combs) {
      const o = c.buf[c.i];
      c.buf[c.i] = x[n] + o * c.fb;
      c.i = (c.i + 1) % c.buf.length;
      s += o;
    }
    s *= 0.25;
    for (const a of aps) {
      const o = a.buf[a.i];
      const v = s + o * -0.5;
      a.buf[a.i] = v;
      a.i = (a.i + 1) % a.buf.length;
      s = o + v * 0.5;
    }
    y[n] = s;
  }
  return y;
};
const wl = reverb(L, 0);
const wr = reverb(R, 23);

/* ---- mix, fade, normalise, write ---- */
let peak = 0;
const mix = new Float32Array(N * 2);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 1.5) * Math.min(1, (DUR - t) / 3);
  mix[2 * i] = (L[i] * 0.72 + wl[i] * 0.42) * fade;
  mix[2 * i + 1] = (R[i] * 0.72 + wr[i] * 0.42) * fade;
  peak = Math.max(peak, Math.abs(mix[2 * i]), Math.abs(mix[2 * i + 1]));
}
const g = 0.6 / peak;
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N * 2; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix[i] * g)) * 32767), i * 2);
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
fs.writeFileSync(out, Buffer.concat([hdr, data]));
console.log(`wrote ${out} (${DUR}s, peak-normalised to -4.4 dBFS)`);
