import os
import shutil
import re

music_dir = r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\remotion_studio\public\audio\music\ep05"
sfx_dir = r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\remotion_studio\public\audio\sfx\ep05"
os.makedirs(music_dir, exist_ok=True)
os.makedirs(sfx_dir, exist_ok=True)

with open(r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\remotion_studio\src\ghibli_pipeline\episode05\Episode05Ghibli.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Check music references
music_matches = re.findall(r"music/ep05/([a-zA-Z0-9_\-]+)", text)
for m in sorted(set(music_matches)):
    wav_name = m if m.endswith(".wav") else m + ".wav"
    target = os.path.join(music_dir, wav_name)
    if not os.path.exists(target):
        # find fallback
        fallback = os.path.join(music_dir, "drum_hit_low.wav")
        shutil.copy(fallback, target)
        print(f"Created fallback for music: {wav_name}")
    else:
        print(f"Music exists: {wav_name}")

# Check sfx references
sfx_matches = re.findall(r"sfx/ep05/([a-zA-Z0-9_\-]+)", text)
for s in sorted(set(sfx_matches)):
    wav_name = s if s.endswith(".wav") else s + ".wav"
    target = os.path.join(sfx_dir, wav_name)
    if not os.path.exists(target):
        fallback = os.path.join(sfx_dir, "bamboo_thump.wav")
        shutil.copy(fallback, target)
        print(f"Created fallback for sfx: {wav_name}")
    else:
        print(f"SFX exists: {wav_name}")

print("Audio validation complete.")
