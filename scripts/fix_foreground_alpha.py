from PIL import Image
import numpy as np

src_path = r"C:\Users\dipnk\Downloads\Gemini_Generated_Image_j9ok4oj9ok4oj9ok.png"
with Image.open(src_path) as im:
    im = im.convert("RGBA")
    # Resize to 1920x1080
    im = im.resize((1920, 1080), Image.Resampling.LANCZOS)
    arr = np.array(im)
    
    # Paper background color in warm watercolor is around [238, 234, 222]
    # Calculate distance from paper background
    r, g, b = arr[:,:,0].astype(float), arr[:,:,1].astype(float), arr[:,:,2].astype(float)
    paper_r, paper_g, paper_b = 238.0, 234.0, 222.0
    
    dist = np.sqrt((r - paper_r)**2 + (g - paper_g)**2 + (b - paper_b)**2)
    
    # Foliage elements have dist > 40
    # Paper texture has dist < 22
    # Smooth feather between 24 and 44
    alpha = np.zeros_like(r, dtype=np.uint8)
    
    # Solid foliage
    solid_mask = dist >= 44
    alpha[solid_mask] = 255
    
    # Feathered edge
    feather_mask = (dist > 24) & (dist < 44)
    alpha[feather_mask] = np.clip(255 * (dist[feather_mask] - 24) / 20.0, 0, 255).astype(np.uint8)
    
    # Ensure center window (x: 250 to 1550, y: 150 to 880) is completely clear unless strong foliage
    h, w = arr.shape[:2]
    for y in range(int(h * 0.15), int(h * 0.82)):
        for x in range(int(w * 0.28), int(w * 0.68)):
            # If dist is not strongly distinct, force zero
            if dist[y, x] < 55:
                alpha[y, x] = 0

    arr[:,:,3] = alpha
    result = Image.fromarray(arr)
    
    out_path = r"remotion_studio/public/visuals/ep05/ep05_fg_kash_reeds_leaves.png"
    raw_path = r"03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/03_Visuals/raw/ep05_fg_kash_reeds_leaves.png"
    result.save(out_path, format="PNG")
    result.save(raw_path, format="PNG")
    
    # Verify center alpha
    center_alpha = alpha[int(h*0.2):int(h*0.8), int(w*0.3):int(w*0.7)]
    print(f"Fixed ep05_fg_kash_reeds_leaves.png:")
    print(f"  Center alpha mean: {np.mean(center_alpha):.3f} (was 81.57)")
    print(f"  Center non-zero pixels: {np.sum(center_alpha > 0)} out of {center_alpha.size}")
    print(f"  Total solid foliage pixels: {np.sum(alpha == 255):,}")
