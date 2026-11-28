import React, { useCallback, useEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { writeStaticFile } from "@remotion/studio";
import { PLATE_RECT } from "./scenes/RewriteKit";
import {
  fetchS01VerandaMarks,
  fetchS03YardMarks,
  S01_VERANDA_DEFAULTS,
  S01_VERANDA_MARKS_FILE,
  S03_YARD_DEFAULTS,
  S03_YARD_MARKS_FILE,
  type S01VerandaMarks,
  type S03YardMarks,
} from "./layoutMarks";

/**
 * Studio-only layout board for Episode 5 rewrite veranda / yard marks.
 *
 * Open composition `Ep05RLayoutEditor`. Pick Scene 01 or 03, drag marks on the plate.
 * On release JSON is written under `public/ep05r_layout/` and the matching scene picks it
 * up via watchStaticFile. No audio required.
 */

type SceneTab = "s01" | "s03";
type S01MarkId = "charu" | "suren" | "balak" | "mat" | "nextDoor" | "porchExit";
type S03MarkId = "balakSeat" | "balakStand" | "charu" | "suren" | "thali" | "doorX";

const PLATE = "images/ghibli_ep06/ujanchar_veranda_back.png";

const S01_META: Record<S01MarkId, { label: string; color: string }> = {
  balak: { label: "Biru", color: "#2a9d8f" },
  charu: { label: "Ma", color: "#e76f51" },
  suren: { label: "Baba", color: "#457b9d" },
  mat: { label: "Mat", color: "#9b5de5" },
  nextDoor: { label: "Next door", color: "#f4a261" },
  porchExit: { label: "Exit X", color: "#ffe66d" },
};

const S03_META: Record<S03MarkId, { label: string; color: string }> = {
  balakSeat: { label: "Biru sit", color: "#2a9d8f" },
  balakStand: { label: "Biru stand", color: "#1b6b63" },
  charu: { label: "Ma", color: "#e76f51" },
  suren: { label: "Baba (yard)", color: "#457b9d" },
  thali: { label: "Thali", color: "#9b5de5" },
  doorX: { label: "Door X", color: "#ffe66d" },
};

const clientToWorld = (svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } => {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: Math.round(p.x), y: Math.round(p.y) };
};

export const Ep05RLayoutEditor: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tab, setTab] = useState<SceneTab>("s01");
  const [s01, setS01] = useState<S01VerandaMarks>(S01_VERANDA_DEFAULTS);
  const [s03, setS03] = useState<S03YardMarks>(S03_YARD_DEFAULTS);
  const [s01Sel, setS01Sel] = useState<S01MarkId>("charu");
  const [s03Sel, setS03Sel] = useState<S03MarkId>("balakSeat");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("Loading…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handle = delayRender("ep05r-layout-load");
    Promise.all([fetchS01VerandaMarks(), fetchS03YardMarks()])
      .then(([a, b]) => {
        setS01(a);
        setS03(b);
        setStatus("Drag a mark · release to save");
        setReady(true);
      })
      .finally(() => continueRender(handle));
  }, []);

  const saveS01 = useCallback(async (next: S01VerandaMarks) => {
    setStatus("Saving…");
    try {
      await writeStaticFile({
        filePath: S01_VERANDA_MARKS_FILE,
        contents: `${JSON.stringify(next, null, 2)}\n`,
      });
      setStatus(`Saved ${S01_VERANDA_MARKS_FILE}`);
    } catch (err) {
      setStatus(`Save failed (Studio only): ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const saveS03 = useCallback(async (next: S03YardMarks) => {
    setStatus("Saving…");
    try {
      await writeStaticFile({
        filePath: S03_YARD_MARKS_FILE,
        contents: `${JSON.stringify(next, null, 2)}\n`,
      });
      setStatus(`Saved ${S03_YARD_MARKS_FILE}`);
    } catch (err) {
      setStatus(`Save failed (Studio only): ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const moveS01 = useCallback(
    (x: number, y: number, commit: boolean) => {
      setS01((prev) => {
        const next: S01VerandaMarks = { ...prev };
        if (s01Sel === "mat") next.mat = { ...prev.mat, x, y };
        else if (s01Sel === "charu" || s01Sel === "suren" || s01Sel === "balak") {
          const dy = y - prev.porch;
          if (s01Sel === "charu") next.charu = { x, y };
          if (s01Sel === "suren") next.suren = { x, y };
          if (s01Sel === "balak") next.balak = { x, y };
          // keep the whole family + mat on the same brick line when any sit mark moves in Y
          if (Math.abs(dy) > 0) {
            next.porch = y;
            next.charu = { ...next.charu, y };
            next.suren = { ...next.suren, y };
            next.balak = { ...next.balak, y };
            next.mat = { ...next.mat, y: y - 6 };
            next.nextDoor = { ...next.nextDoor, y: y - 200 };
          }
        } else if (s01Sel === "porchExit") next.porchExit = x;
        else next.nextDoor = { x, y };
        if (commit) void saveS01(next);
        return next;
      });
    },
    [s01Sel, saveS01],
  );

  const moveS03 = useCallback(
    (x: number, y: number, commit: boolean) => {
      setS03((prev) => {
        const next: S03YardMarks = { ...prev };
        if (s03Sel === "balakSeat" || s03Sel === "balakStand" || s03Sel === "charu") {
          if (s03Sel === "balakSeat") next.balakSeat = { x, y };
          if (s03Sel === "balakStand") next.balakStand = { x, y };
          if (s03Sel === "charu") next.charu = { x, y };
          next.porch = y;
          next.balakSeat = { ...next.balakSeat, y };
          next.balakStand = { ...next.balakStand, y };
          next.charu = { ...next.charu, y };
          next.thali = { ...next.thali, y: y + 7 };
        } else if (s03Sel === "suren") next.suren = { x, y };
        else if (s03Sel === "thali") next.thali = { x, y };
        else next.doorX = x;
        if (commit) void saveS03(next);
        return next;
      });
    },
    [s03Sel, saveS03],
  );

  const onPointerDown = (id: S01MarkId | S03MarkId) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tab === "s01") setS01Sel(id as S01MarkId);
    else setS03Sel(id as S03MarkId);
    setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return;
    const { x, y } = clientToWorld(svgRef.current, e.clientX, e.clientY);
    if (tab === "s01") moveS01(x, y, false);
    else moveS03(x, y, false);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return;
    setDragging(false);
    const { x, y } = clientToWorld(svgRef.current, e.clientX, e.clientY);
    if (tab === "s01") moveS01(x, y, true);
    else moveS03(x, y, true);
  };

  const resetDefaults = async () => {
    if (tab === "s01") {
      setS01(S01_VERANDA_DEFAULTS);
      await saveS01(S01_VERANDA_DEFAULTS);
    } else {
      setS03(S03_YARD_DEFAULTS);
      await saveS03(S03_YARD_DEFAULTS);
    }
  };

  const porchY = tab === "s01" ? s01.porch : s03.porch;
  const fileHint = tab === "s01" ? S01_VERANDA_MARKS_FILE : S03_YARD_MARKS_FILE;

  const s01Pts: Array<{ id: S01MarkId; x: number; y: number }> = [
    { id: "balak", x: s01.balak.x, y: s01.balak.y },
    { id: "charu", x: s01.charu.x, y: s01.charu.y },
    { id: "suren", x: s01.suren.x, y: s01.suren.y },
    { id: "mat", x: s01.mat.x, y: s01.mat.y },
    { id: "nextDoor", x: s01.nextDoor.x, y: s01.nextDoor.y },
    { id: "porchExit", x: s01.porchExit, y: s01.porch },
  ];

  const s03Pts: Array<{ id: S03MarkId; x: number; y: number }> = [
    { id: "balakSeat", x: s03.balakSeat.x, y: s03.balakSeat.y },
    { id: "balakStand", x: s03.balakStand.x, y: s03.balakStand.y },
    { id: "charu", x: s03.charu.x, y: s03.charu.y },
    { id: "suren", x: s03.suren.x, y: s03.suren.y },
    { id: "thali", x: s03.thali.x, y: s03.thali.y },
    { id: "doorX", x: s03.doorX, y: s03.porch },
  ];

  const pts = tab === "s01" ? s01Pts : s03Pts;
  const selected = tab === "s01" ? s01Sel : s03Sel;
  const meta = tab === "s01" ? S01_META : S03_META;

  return (
    <AbsoluteFill style={{ background: "#1a1a1a", color: "#f5f5f5", fontFamily: "Segoe UI, sans-serif" }}>
      <AbsoluteFill style={{ opacity: ready ? 1 : 0.4 }}>
        <svg
          ref={svgRef}
          width={1920}
          height={1080}
          viewBox={`${PLATE_RECT.x} ${PLATE_RECT.y} ${PLATE_RECT.w} ${PLATE_RECT.h}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none" }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <image
            href={staticFile(PLATE)}
            x={PLATE_RECT.x}
            y={PLATE_RECT.y}
            width={PLATE_RECT.w}
            height={PLATE_RECT.h}
            preserveAspectRatio="xMidYMid slice"
          />
          <line x1={PLATE_RECT.x} y1={porchY} x2={PLATE_RECT.x + PLATE_RECT.w} y2={porchY} stroke="#ffe66d" strokeWidth={3} strokeDasharray="12 10" opacity={0.85} />
          <text x={PLATE_RECT.x + 24} y={porchY - 12} fill="#ffe66d" fontSize={28} fontWeight={700}>
            porch y={porchY}
          </text>
          {tab === "s01" && (
            <line x1={s01.porchExit} y1={PLATE_RECT.y} x2={s01.porchExit} y2={PLATE_RECT.y + PLATE_RECT.h} stroke="#ffe66d" strokeWidth={2} strokeDasharray="8 8" opacity={0.55} />
          )}
          {tab === "s03" && (
            <line x1={s03.doorX} y1={PLATE_RECT.y} x2={s03.doorX} y2={PLATE_RECT.y + PLATE_RECT.h} stroke="#ffe66d" strokeWidth={2} strokeDasharray="8 8" opacity={0.55} />
          )}
          {pts.map(({ id, x, y }) => {
            const m = meta[id as keyof typeof meta] as { label: string; color: string };
            const on = selected === id;
            return (
              <g key={id} style={{ cursor: "grab" }} onPointerDown={onPointerDown(id)}>
                <circle cx={x} cy={y} r={on ? 34 : 28} fill={m.color} stroke="#fff" strokeWidth={on ? 5 : 3} opacity={0.92} />
                <text x={x} y={y + 8} textAnchor="middle" fill="#111" fontSize={20} fontWeight={800} style={{ pointerEvents: "none" }}>
                  {m.label.slice(0, 1)}
                </text>
                <text x={x + 40} y={y - 28} fill="#fff" fontSize={24} fontWeight={700} style={{ pointerEvents: "none", paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}>
                  {m.label} ({x},{y})
                </text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: 24,
          top: 24,
          padding: "14px 18px",
          background: "rgba(0,0,0,0.72)",
          borderRadius: 12,
          maxWidth: 560,
          lineHeight: 1.45,
          fontSize: 18,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Ep05R veranda layout</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {(
            [
              ["s01", "Scene 01 chat"],
              ["s03", "Scene 03 yard"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                border: tab === id ? "2px solid #fff" : "1px solid #666",
                background: tab === id ? "#2a9d8f" : "#333",
                color: "#fff",
                fontWeight: 700,
                borderRadius: 999,
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ opacity: 0.9, marginBottom: 10 }}>
          Drag marks on the plate; release saves to <code style={{ color: "#ffe66d" }}>{fileHint}</code>. Open Episode05GhibliRewrite to preview.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {tab === "s01"
            ? (Object.keys(S01_META) as S01MarkId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setS01Sel(id)}
                  style={{
                    border: s01Sel === id ? "2px solid #fff" : "1px solid #666",
                    background: S01_META[id].color,
                    color: "#111",
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  {S01_META[id].label}
                </button>
              ))
            : (Object.keys(S03_META) as S03MarkId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setS03Sel(id)}
                  style={{
                    border: s03Sel === id ? "2px solid #fff" : "1px solid #666",
                    background: S03_META[id].color,
                    color: "#111",
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  {S03_META[id].label}
                </button>
              ))}
          <button
            type="button"
            onClick={() => void resetDefaults()}
            style={{ border: "1px solid #888", background: "#333", color: "#eee", borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}
          >
            Reset defaults
          </button>
        </div>
        <div style={{ fontSize: 15, opacity: 0.85 }}>{status}</div>
      </div>
    </AbsoluteFill>
  );
};
