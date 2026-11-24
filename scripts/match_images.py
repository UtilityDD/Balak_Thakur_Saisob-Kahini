import os, glob, time

d_path = r'C:\Users\dipnk\Downloads'
files = glob.glob(os.path.join(d_path, 'Gemini_Generated_Image_*.png'))
files.sort(key=os.path.getmtime)

print(f"Total Gemini images in chron order:")
for i, f in enumerate(files):
    t_str = time.strftime('%H:%M:%S', time.localtime(os.path.getmtime(f)))
    sz = os.path.getsize(f)
    print(f"[{i+1}] {t_str} | {sz:>10,} B | {os.path.basename(f)}")
