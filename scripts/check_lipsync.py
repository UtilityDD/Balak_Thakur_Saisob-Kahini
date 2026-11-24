#!/usr/bin/env python3
"""Measure audio/video lip-sync of a JoyVASA clip.

  <JoyVASA venv python> scripts/check_lipsync.py <video.mp4> <voice.wav>

Method (tuned for this painted style, where an open mouth shows white teeth, so "openness" metrics fail):
  1. Find the mouth on the first frame with insightface 106-point landmarks (bundled with JoyVASA).
  2. Lip activity per frame = pixel change inside the mouth box minus half the change over the whole face
     (removes head motion).
  3. Cross-correlate lip activity with the voice loudness envelope at lags -12..+12 frames.

Report:
  lag   best-matching shift. lag < 0 = mouth moves BEFORE the sound, lag > 0 = AFTER.
        -3..+1 frames is fine (mouths naturally shape a sound slightly before it is heard; broadcast tolerance
        is roughly video up to 125 ms early / 45 ms late).
  talk  lip activity while speaking vs. in pauses. Speaking must be clearly higher, or the lips are not
        following the words (regenerate with a stronger --driving_multiplier / cfg_scale).
Exit code 1 when the clip fails either check.
Set JOYVASA_DIR if JoyVASA is not in D:/AI_Tools/JoyVASA.
"""
import argparse
import os
import sys

import cv2
import librosa
import numpy as np

J = os.environ.get("JOYVASA_DIR", "D:/AI_Tools/JoyVASA")
sys.path.insert(0, J)
from src.utils.face_analysis_diy import FaceAnalysisDIY  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("voice")
a = ap.parse_args()

cap = cv2.VideoCapture(a.video)
fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
if not frames:
    sys.exit(f"cannot read {a.video}")

fa = FaceAnalysisDIY(name="buffalo_l", root=os.path.join(J, "pretrained_weights/insightface"),
                     providers=["CPUExecutionProvider"])
fa.prepare(ctx_id=-1, det_size=(512, 512))
faces = fa.get(frames[0], flag_do_landmark_2d_106=True, direction="large-small")
if not faces:
    sys.exit("no face found on the first frame")
face = faces[0]
m = face.landmark_2d_106[52:72]
x0, y0 = m.min(0).astype(int)
x1, y1 = m.max(0).astype(int)
w, h = x1 - x0, y1 - y0
MX0, MX1, MY0, MY1 = x0 - w // 2, x1 + w // 2, y0 - h, y1 + 2 * h  # room below for the jaw
FX0, FY0, FX1, FY1 = face.bbox.astype(int)

g = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) for f in frames]
lip = np.array([0.0] + [np.mean(np.abs(g[i][MY0:MY1, MX0:MX1] - g[i - 1][MY0:MY1, MX0:MX1])) for i in range(1, len(g))])
head = np.array([0.0] + [np.mean(np.abs(g[i][FY0:FY1, FX0:FX1] - g[i - 1][FY0:FY1, FX0:FX1])) for i in range(1, len(g))])
act = lip - 0.5 * head

y, sr = librosa.load(a.voice, sr=48000, mono=True)
hop = int(round(sr / fps))
env = np.convolve(librosa.feature.rms(y=y, frame_length=2 * hop, hop_length=hop)[0], np.ones(3) / 3, "same")
n = min(len(act), len(env))
z = lambda v: (v - v.mean()) / (v.std() + 1e-9)  # noqa: E731
d, r = z(act[:n]), z(env[:n])
cc = {L: float(np.mean(d[max(0, L):n + min(0, L)] * r[max(0, -L):n - max(0, L)])) for L in range(-12, 13)}
lag = max(cc, key=cc.get)
voiced = env[:n] > np.percentile(env[:n], 55)
talk, quiet = float(act[:n][voiced].mean()), float(act[:n][~voiced].mean())

lag_ok = -3 <= lag <= 1
talk_ok = talk > quiet * 1.1
verdict = "PASS" if lag_ok and talk_ok else "FAIL"
why = [] if verdict == "PASS" else (["lag out of range"] if not lag_ok else []) + (["lips not following words"] if not talk_ok else [])
print(f"[lipsync] {os.path.basename(a.video):32} lag {lag:+d} fr ({lag * 1000 / fps:+.0f} ms) corr {cc[lag]:.2f} | "
      f"talk {talk:.2f} vs pause {quiet:.2f} -> {verdict}{' (' + ', '.join(why) + ')' if why else ''}")
sys.exit(0 if verdict == "PASS" else 1)
