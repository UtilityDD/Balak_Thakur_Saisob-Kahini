import re

file_path = r"d:\Dipankar\MyCodes\AI Projects\Balak_Thakur_Saisob-Kahini\remotion_studio\src\data\episode05Data.ts"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Map missing cues to existing ones
replacements = {
    '"tanpura_meditation.wav"': '"dawn_birds_temple.wav"',
    '"Harmonium_Drone_Gentle.wav"': '"Sacred_Night_Ambient.wav"',
    '"banana_grove_breeze.wav"': '"padma_river_day.wav"',
    '"Dramatic_Moral_Crescendo.wav"': '"Warm_Family_Flute.wav"',
    '"courtyard_afternoon_birds.wav"': '"dawn_birds_temple.wav"',
    # SFX
    '"bamboo_stick_thud_soil.wav"': '"soft_magical_shimmer.wav"',
    '"cow_gentle_moo.wav"': '"soft_magical_shimmer.wav"',
    '"scroll_unfurl.wav"': '"chime_pop.wav"',
    '"water_splash_river.wav"': '"river_water.wav"',
    '"leaves_rustle_soft.wav"': '"soft_magical_shimmer.wav"',
    '"turtle_crawl_sand.wav"': '"soft_magical_shimmer.wav"',
    '"veranda_bench_creak.wav"': '"temple_bell_drop.wav"',
    '"clerk_pen_scratch.wav"': '"chime_pop.wav"'
}

for old, new in replacements.items():
    code = code.replace(old, new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated episode05Data.ts audio cues to existing files.")
