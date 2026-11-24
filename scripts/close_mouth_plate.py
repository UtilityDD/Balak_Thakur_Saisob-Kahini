#!/usr/bin/env python3
"""Make a closed-mouth "rest" version of a painted plate, for lip-sync.

JoyVASA only adds motion on top of the source face, so a plate painted mouth-open (shock, laughter) keeps the
mouth open the whole clip. This uses LivePortrait's lip retargeting to close the mouth on the plate itself and
pastes the result back at full resolution; animate from the closed plate and the mouth rests shut, opening only
on the words.

  <JoyVASA venv python> scripts/close_mouth_plate.py <plate.jpg> <strength> <out.jpg> [--preview strengths...]

strength: how hard to close (1.0 = LivePortrait's own "closed"; painted grins may need 1.2-1.6;
          too high smears the mouth area). Use --preview 1 1.25 1.5 to compare before choosing.
"""
import argparse, os, pathlib, sys
pathlib.PosixPath = pathlib.WindowsPath if os.name == "nt" else pathlib.PosixPath  # JoyVASA pickles on Windows
import cv2, numpy as np

J = os.environ.get("JOYVASA_DIR", "D:/AI_Tools/JoyVASA")
sys.path.insert(0, J); os.chdir(J)
os.environ.setdefault("HF_HOME", os.path.join(J, "_work", "hf"))
from src.config.argument_config import ArgumentConfig          # noqa: E402
from src.config.inference_config import InferenceConfig        # noqa: E402
from src.config.crop_config import CropConfig                  # noqa: E402
from src.live_portrait_wmg_pipeline import LivePortraitPipeline  # noqa: E402
from src.utils.io import load_image_rgb                         # noqa: E402
from src.utils.crop import prepare_paste_back, paste_back       # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("plate"); ap.add_argument("strength", type=float); ap.add_argument("out")
ap.add_argument("--preview", type=float, nargs="*", help="also write a side-by-side of these strengths")
a = ap.parse_args()

pf = lambda cls, d: cls(**{k: v for k, v in d.items() if hasattr(cls, k)})  # noqa: E731
args = ArgumentConfig(); args.flag_do_crop = True; args.flag_stitching = True; args.flag_pasteback = True
pipe = LivePortraitPipeline(pf(InferenceConfig, args.__dict__), pf(CropConfig, args.__dict__))
w, c = pipe.live_portrait_wrapper, pipe.cropper

img = load_image_rgb(a.plate)  # full resolution, no resize: the result replaces the plate 1:1
ci = c.crop_source_image(img, c.crop_cfg)
I_s = w.prepare_source(ci["img_crop_256x256"]); info = w.get_kp_info(I_s)
f_s = w.extract_feature_3d(I_s); x_s = w.transform_keypoint(info)
ratio = w.calc_combined_lip_ratio([0.0], ci["lmk_crop"])
delta = w.retarget_lip(x_s, ratio)
mask = prepare_paste_back(w.inference_cfg.mask_crop, ci["M_c2o"], dsize=(img.shape[1], img.shape[0]))
print(f"lip-open ratio of source: {float(ratio[0][0]):.3f}")

def render(k):
    out = w.parse_output(w.warp_decode(f_s, x_s, w.stitching(x_s, x_s + k * delta))["out"])[0]
    return paste_back(out, ci["M_c2o"], img, mask)

res = render(a.strength)
cv2.imwrite(a.out, cv2.cvtColor(res, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 95])
print("wrote", a.out)
if a.preview:
    x0, y0 = ci["lmk_crop"].min(0)  # crop-space; use the face box in the original instead
    tiles = []
    for k in a.preview:
        r = cv2.cvtColor(render(k), cv2.COLOR_RGB2BGR)
        M = ci["M_c2o"]; s = c.crop_cfg.dsize; cx, cy = (M @ np.array([s * 0.5, s * 0.62, 1]))[:2].astype(int)
        t = r[max(0, cy - 200):cy + 200, max(0, cx - 200):cx + 200].copy()
        cv2.putText(t, f"x{k}", (8, 32), 0, 1.0, (0, 255, 255), 2); tiles.append(cv2.resize(t, (400, 400)))
    cv2.imwrite(os.path.splitext(a.out)[0] + "_preview.jpg", np.hstack(tiles))
