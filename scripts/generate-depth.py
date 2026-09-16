# scripts/generate-depth.py — depth maps for the WebGL hero parallax (src/lib/hero-depth.ts).
#
#   python scripts/generate-depth.py                       # every project cover without a depth map
#   python scripts/generate-depth.py --force               # regenerate all project covers
#   python scripts/generate-depth.py --slug portfolio/hotel-lycium
#   python scripts/generate-depth.py some/image.webp ...   # arbitrary files → <name>-depth.webp beside them
#
# Project mode reads public/thumbs/large/<collection>/<slug>/<file>.webp (run generate-thumbs
# first) and writes public/thumbs/depth/<collection>/<slug>/<file>.webp — 1280px wide, 1 = near,
# 0 = far — which thumbUrl(src, 'depth') resolves. "↑ R2 all" pushes public/thumbs/ to R2, or:
#   rclone copy public/thumbs/depth r2:visiongraphics-images/thumbs/depth/ --s3-no-check-bucket
# Needs torch + transformers (CPU is fine, ~8 s per image); Depth Anything V2 Small downloads once.
import re
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageFilter
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

ROOT = Path(__file__).resolve().parent.parent
MODEL = "depth-anything/Depth-Anything-V2-Small-hf"
WIDTH = 1280

args = sys.argv[1:]
force = "--force" in args
slug = args[args.index("--slug") + 1] if "--slug" in args else None
files = [a for a in args if not a.startswith("--") and a != slug]

jobs: list[tuple[Path, Path]] = []  # (source, destination)
if files:
    for f in files:
        src = Path(f)
        jobs.append((src, src.with_name(f"{src.stem}-depth.webp")))
else:
    for mdx in sorted((ROOT / "src/content/projects").glob("*.mdx")):
        m = re.search(r"^coverImage:\s*['\"]?(/_img/[^'\"\s]+)", mdx.read_text("utf8"), re.M)
        if not m:
            continue
        rel = m.group(1)[len("/_img/"):]                    # portfolio/<slug>/01.jpg
        if slug and not rel.startswith(slug + "/"):
            continue
        rel_webp = Path(rel).with_suffix(".webp")
        src = ROOT / "public/thumbs/large" / rel_webp
        dst = ROOT / "public/thumbs/depth" / rel_webp
        if not src.exists():
            print(f"skip (no large thumb, run generate-thumbs): {rel}")
            continue
        if dst.exists() and not force:
            continue
        jobs.append((src, dst))

print(f"{len(jobs)} image(s) to process", flush=True)
if not jobs:
    sys.exit(0)

proc = AutoImageProcessor.from_pretrained(MODEL)
model = AutoModelForDepthEstimation.from_pretrained(MODEL).eval()

for src, dst in jobs:
    img = Image.open(src).convert("RGB")
    w, h = img.size
    th = round(h * WIDTH / w)
    small = img.resize((WIDTH, th), Image.LANCZOS)
    with torch.no_grad():
        out = model(**proc(images=small, return_tensors="pt"))
    d = torch.nn.functional.interpolate(out.predicted_depth.unsqueeze(1), size=(th, WIDTH), mode="bicubic", align_corners=False)[0, 0].numpy()
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)  # relative inverse depth: 1 = near, 0 = far
    dst.parent.mkdir(parents=True, exist_ok=True)
    # ponytail: a 1.2px blur softens silhouettes so the shader doesn't tear at edges; no edge-aware filtering.
    Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)).save(dst, quality=82)
    print(f"ok {dst.relative_to(ROOT) if dst.is_relative_to(ROOT) else dst}", flush=True)
