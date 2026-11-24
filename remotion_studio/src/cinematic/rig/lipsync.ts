import { clamp, hash, lerp, noise1 } from "../core/anim";

/**
 * Mouth state consumed by the puppet head.
 * open: 0..1 jaw drop, width: relative lip width, round: 0..1 lip pucker.
 */
export interface MouthState {
  open: number;
  width: number;
  round: number;
  teeth: number;
}

export const MOUTH_REST: MouthState = { open: 0, width: 1, round: 0, teeth: 0 };

/** The 7-state viseme set from the style guide (REST, A, E, I, O, U, MBP). */
const VISEMES: Record<string, MouthState> = {
  REST: { open: 0, width: 1, round: 0, teeth: 0 },
  A: { open: 1, width: 1.05, round: 0.1, teeth: 0.6 },
  E: { open: 0.55, width: 1.25, round: 0, teeth: 0.9 },
  I: { open: 0.3, width: 1.3, round: 0, teeth: 1 },
  O: { open: 0.8, width: 0.75, round: 0.85, teeth: 0.2 },
  U: { open: 0.38, width: 0.6, round: 1, teeth: 0 },
  MBP: { open: 0, width: 0.92, round: 0.15, teeth: 0 },
};
// Bengali vowel frequency is heavily weighted to /a/ /o/ /e/.
const VOWEL_BAG = ["A", "O", "E", "A", "I", "O", "A", "U", "E", "A"];

const mix = (a: MouthState, b: MouthState, t: number): MouthState => ({
  open: lerp(a.open, b.open, t),
  width: lerp(a.width, b.width, t),
  round: lerp(a.round, b.round, t),
  teeth: lerp(a.teeth, b.teeth, t),
});

interface SyllableMap {
  smooth: number[];
  sylIndex: number[];
  sylStart: number[];
}

const cache = new WeakMap<number[], SyllableMap>();

/** Pre-analyse an RMS envelope (1 value / frame) into syllable segments. */
function analyse(env: number[]): SyllableMap {
  const hit = cache.get(env);
  if (hit) return hit;
  const n = env.length;
  const smooth = env.map((_, i) => {
    const a = env[Math.max(0, i - 1)];
    const b = env[i];
    const c = env[Math.min(n - 1, i + 1)];
    return a * 0.25 + b * 0.5 + c * 0.25;
  });
  const sylIndex: number[] = new Array(n).fill(-1);
  const sylStart: number[] = [];
  let idx = -1;
  for (let i = 0; i < n; i++) {
    const rising = i > 1 && smooth[i] > smooth[i - 1] && smooth[i - 1] <= smooth[i - 2];
    const onsetFromSilence = smooth[i] > 0.09 && (i === 0 || smooth[i - 1] <= 0.09);
    if ((rising && smooth[i] > 0.12) || onsetFromSilence) {
      if (sylStart.length === 0 || i - sylStart[sylStart.length - 1] >= 3) {
        idx++;
        sylStart.push(i);
      }
    }
    sylIndex[i] = idx;
  }
  const out = { smooth, sylIndex, sylStart };
  cache.set(env, out);
  return out;
}

/* ------------------------------------------------------------------ */
/* Bangla text → syllable visemes                                      */
/* ------------------------------------------------------------------ */

interface BnSyl {
  v: keyof typeof VISEMES;
  labial: boolean; // onset is a lip consonant (প ফ ব ভ ম) → lips close first
}

const SIGN: Record<string, keyof typeof VISEMES> = {
  "া": "A", // া
  "ি": "I", // ি
  "ী": "I", // ী
  "ু": "U", // ু
  "ূ": "U", // ূ
  "ৃ": "I", // ৃ
  "ে": "E", // ে
  "ৈ": "E", // ৈ
  "ো": "O", // ো
  "ৌ": "O", // ৌ
};
const INDEP: Record<string, keyof typeof VISEMES> = {
  "অ": "O", // অ
  "আ": "A", // আ
  "ই": "I", // ই
  "ঈ": "I", // ঈ
  "উ": "U", // উ
  "ঊ": "U", // ঊ
  "এ": "E", // এ
  "ঐ": "E", // ঐ
  "ও": "O", // ও
  "ঔ": "O", // ঔ
};
const LABIAL = new Set(["প", "ফ", "ব", "ভ", "ম"]); // প ফ ব ভ ম
const isCons = (ch: string) => (ch >= "ক" && ch <= "হ") || (ch >= "ড়" && ch <= "য়") || ch === "ৎ";
const HASANTA = "্";

const sylCache = new Map<string, BnSyl[]>();

/**
 * Rough Bangla syllabification for lip-sync: vowel signs and independent vowels give
 * the mouth shape; a bare consonant carries the inherent vowel ô (rounded-open) except
 * word-finally where Bangla usually drops it; conjuncts (্) merge into one onset.
 */
export function bnSyllables(text: string): BnSyl[] {
  const hit = sylCache.get(text);
  if (hit) return hit;
  const out: BnSyl[] = [];
  const chars = [...text];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (INDEP[ch]) {
      out.push({ v: INDEP[ch], labial: false });
      i++;
      continue;
    }
    if (isCons(ch)) {
      let labial = LABIAL.has(ch);
      let j = i;
      // swallow conjunct clusters: C ্ C ্ C …
      while (chars[j + 1] === HASANTA && isCons(chars[j + 2] ?? "")) j += 2;
      const next = chars[j + 1] ?? "";
      if (next === "়") j++; // nukta
      const after = chars[j + 1] ?? "";
      if (SIGN[after]) {
        out.push({ v: SIGN[after], labial });
        i = j + 2;
        continue;
      }
      if (after === HASANTA) {
        i = j + 2;
        continue;
      }
      const wordEnd = !after || !/[ঀ-৿]/.test(after);
      if (!wordEnd) out.push({ v: "O", labial });
      else if (labial) out.push({ v: "MBP", labial: true }); // final lip consonant: brief closure
      labial = false;
      i = j + 1;
      continue;
    }
    i++;
  }
  sylCache.set(text, out);
  return out;
}

/**
 * Viseme from a real voice envelope at clip-relative frame `rel`.
 * With `text`, each detected syllable takes its vowel shape from the Bangla text
 * (aligned in order), and lip consonants close the lips at the syllable onset.
 * Without text, shapes fall back to a deterministic vowel bag. Shapes cross-blend over ~2 frames.
 */
export function visemeFromEnvelope(env: number[] | undefined, rel: number, seed = 1, text?: string): MouthState {
  if (!env || rel < 0 || rel >= env.length) return MOUTH_REST;
  const { smooth, sylIndex, sylStart } = analyse(env);
  const i = Math.floor(rel);
  const level = smooth[i];
  if (level < 0.05) return MOUTH_REST;

  const s = sylIndex[i];
  const syl = text ? bnSyllables(text) : [];
  const nDet = Math.max(1, sylStart.length);
  const textAt = (k: number) => (syl.length ? syl[Math.min(syl.length - 1, Math.floor((k * syl.length) / nDet))] : null);
  const shapeFor = (k: number) => {
    const t = textAt(k);
    return t ? VISEMES[t.v] : VISEMES[VOWEL_BAG[Math.floor(hash(k * 3.7 + seed) * VOWEL_BAG.length)]];
  };
  const cur = s >= 0 ? shapeFor(s) : VISEMES.A;
  const prev = s > 0 ? shapeFor(s - 1) : VISEMES.REST;
  const since = s >= 0 ? i - sylStart[s] : 99;
  const blendT = clamp(since / 2);
  let m = mix(prev, cur, blendT);

  // Lip closure at the onset: from the text's lip consonants, else occasional stop
  const t = s >= 0 ? textAt(s) : null;
  if (since <= 1 && (t ? t.labial : since === 0 && hash(s * 9.1 + seed) > 0.55)) m = mix(m, VISEMES.MBP, since === 0 ? 0.85 : 0.45);

  const amp = clamp(Math.pow(clamp((level - 0.05) / 0.75), 0.75));
  return {
    open: m.open * (0.25 + amp * 0.85),
    width: lerp(1, m.width, 0.4 + amp * 0.6),
    round: m.round * (0.4 + amp * 0.6),
    teeth: m.teeth * amp,
  };
}

/** Procedural silent chatter for characters miming speech under narration. */
export function visemeChatter(frame: number, seed: number, intensity = 1): MouthState {
  const phrase = noise1(frame * 0.045, seed) * 0.5 + 0.5; // phrase / pause rhythm
  if (phrase < 0.32) return MOUTH_REST;
  const syl = Math.abs(Math.sin(frame * 0.62 + seed * 2.3)) * (0.5 + 0.5 * Math.abs(noise1(frame * 0.3, seed + 4)));
  const env = [syl * intensity];
  const k = Math.floor(frame / 4.3);
  const base = VISEMES[VOWEL_BAG[Math.floor(hash(k + seed * 5.1) * VOWEL_BAG.length)]];
  return {
    open: base.open * (0.15 + env[0] * 0.8),
    width: lerp(1, base.width, 0.7),
    round: base.round * 0.7,
    teeth: base.teeth * env[0],
  };
}

/** Raw speech level (for head-bob / gesture emphasis). */
export function speechLevel(env: number[] | undefined, rel: number): number {
  if (!env || rel < 0 || rel >= env.length) return 0;
  return analyse(env).smooth[Math.floor(rel)];
}
