import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile, watchStaticFile } from "remotion";

/** World-space marks for Scene 01 veranda (plate coords on PLATE_RECT). */
export type S01VerandaMarks = {
  porch: number;
  charu: { x: number; y: number };
  suren: { x: number; y: number };
  balak: { x: number; y: number };
  mat: { x: number; y: number; h: number };
  porchExit: number;
  nextDoor: { x: number; y: number };
};

/** World-space marks for Scene 03 yard / same veranda plate. */
export type S03YardMarks = {
  porch: number;
  balakSeat: { x: number; y: number };
  balakStand: { x: number; y: number };
  suren: { x: number; y: number };
  charu: { x: number; y: number };
  thali: { x: number; y: number };
  doorX: number;
};

export const S01_VERANDA_MARKS_FILE = "ep05r_layout/s01_veranda.json";
export const S03_YARD_MARKS_FILE = "ep05r_layout/s03_yard.json";

export const S01_VERANDA_DEFAULTS: S01VerandaMarks = {
  porch: 898,
  charu: { x: 560, y: 898 },
  suren: { x: 720, y: 898 },
  balak: { x: 420, y: 898 },
  mat: { x: 600, y: 892, h: 100 },
  porchExit: 300,
  nextDoor: { x: 180, y: 698 },
};

export const S03_YARD_DEFAULTS: S03YardMarks = {
  porch: 905,
  balakSeat: { x: 1200, y: 905 },
  balakStand: { x: 1200, y: 905 },
  suren: { x: 700, y: 1000 },
  charu: { x: 1100, y: 905 },
  thali: { x: 1168, y: 912 },
  doorX: 900,
};

const mergeS01 = (raw: Partial<S01VerandaMarks> | null | undefined): S01VerandaMarks => ({
  ...S01_VERANDA_DEFAULTS,
  ...raw,
  charu: { ...S01_VERANDA_DEFAULTS.charu, ...(raw?.charu ?? {}) },
  suren: { ...S01_VERANDA_DEFAULTS.suren, ...(raw?.suren ?? {}) },
  balak: { ...S01_VERANDA_DEFAULTS.balak, ...(raw?.balak ?? {}) },
  mat: { ...S01_VERANDA_DEFAULTS.mat, ...(raw?.mat ?? {}) },
  nextDoor: { ...S01_VERANDA_DEFAULTS.nextDoor, ...(raw?.nextDoor ?? {}) },
});

const mergeS03 = (raw: Partial<S03YardMarks> | null | undefined): S03YardMarks => ({
  ...S03_YARD_DEFAULTS,
  ...raw,
  balakSeat: { ...S03_YARD_DEFAULTS.balakSeat, ...(raw?.balakSeat ?? {}) },
  balakStand: { ...S03_YARD_DEFAULTS.balakStand, ...(raw?.balakStand ?? {}) },
  suren: { ...S03_YARD_DEFAULTS.suren, ...(raw?.suren ?? {}) },
  charu: { ...S03_YARD_DEFAULTS.charu, ...(raw?.charu ?? {}) },
  thali: { ...S03_YARD_DEFAULTS.thali, ...(raw?.thali ?? {}) },
});

async function fetchJsonMarks<T>(file: string, merge: (raw: Partial<T> | null | undefined) => T, fallback: T): Promise<T> {
  try {
    const res = await fetch(staticFile(file));
    if (!res.ok) return fallback;
    return merge(await res.json());
  } catch {
    return fallback;
  }
}

export async function fetchS01VerandaMarks(): Promise<S01VerandaMarks> {
  return fetchJsonMarks(S01_VERANDA_MARKS_FILE, mergeS01, S01_VERANDA_DEFAULTS);
}

export async function fetchS03YardMarks(): Promise<S03YardMarks> {
  return fetchJsonMarks(S03_YARD_MARKS_FILE, mergeS03, S03_YARD_DEFAULTS);
}

function useWatchedMarks<T>(file: string, fetchMarks: () => Promise<T>, fallback: T, label: string): T {
  const [marks, setMarks] = useState<T>(fallback);

  useEffect(() => {
    const handle = delayRender(label);
    let alive = true;
    fetchMarks()
      .then((m) => {
        if (alive) setMarks(m);
      })
      .finally(() => continueRender(handle));
    const { cancel } = watchStaticFile(file, () => {
      fetchMarks().then((m) => {
        if (alive) setMarks(m);
      });
    });
    return () => {
      alive = false;
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- static file + module fetch
  }, [file]);

  return marks;
}

/** Live marks for Scene 01: loads public JSON (editable in Ep05RLayoutEditor). */
export function useS01VerandaMarks(): S01VerandaMarks {
  return useWatchedMarks(S01_VERANDA_MARKS_FILE, fetchS01VerandaMarks, S01_VERANDA_DEFAULTS, "s01-veranda-marks");
}

/** Live marks for Scene 03 yard: loads public JSON (editable in Ep05RLayoutEditor). */
export function useS03YardMarks(): S03YardMarks {
  return useWatchedMarks(S03_YARD_MARKS_FILE, fetchS03YardMarks, S03_YARD_DEFAULTS, "s03-yard-marks");
}
