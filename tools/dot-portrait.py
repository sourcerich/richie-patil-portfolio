# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow", "numpy"]
# ///
"""Turn public/richie.jpg into the data for the About page's dot portrait.

The page draws a grid of small, equal dots; the picture comes from each
dot's shade, and the dots near the cursor show the photo's real colours.
This writes two tiny images, one pixel per dot:

  public/portrait/tone.png    greyscale: how light each dot is (local
                              contrast boosted so eyes, brows and the smile
                              survive the grid)
  public/portrait/color.png   RGBA: the photo's colour, alpha = how much of
                              the person is in that cell (the flat studio
                              background is cut away, the edge feathered)

Run with:  uv run tools/dot-portrait.py
"""
import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "richie.jpg"
OUT = ROOT / "public" / "portrait"

SAMPLE = 6         # photo pixels averaged into each dot
BG_TOLERANCE = 30  # colour distance from the backdrop still counted as backdrop


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """True where a pixel joins the border through near-backdrop colours."""
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    ref = np.median(border, axis=0)
    close = np.linalg.norm(rgb - ref, axis=2) < BG_TOLERANCE
    seen = np.zeros((h, w), bool)
    queue = deque()
    edges = [(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)]
    for y, x in edges:
        if close[y, x] and not seen[y, x]:
            seen[y, x] = True
            queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and close[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    return seen


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cols", type=int, default=110, help="dots across")
    ap.add_argument("--detail", type=float, default=2.2, help="local contrast boost")
    a = ap.parse_args()

    size = a.cols * SAMPLE
    img = Image.open(SRC).convert("RGB").resize((size, size), Image.LANCZOS)
    rgb = np.asarray(img, dtype=float)
    fg = ~background_mask(rgb)
    # Feather the cut so the outline dissolves instead of stopping hard.
    soft = np.asarray(
        Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(SAMPLE * .8)),
        dtype=float
    ) / 255

    grey = ImageOps.grayscale(img).filter(
        ImageFilter.UnsharpMask(radius=SAMPLE * 2, percent=int(a.detail * 100), threshold=0)
    )
    lum = np.asarray(grey, dtype=float) / 255
    lo, hi = np.percentile(lum[fg], 3), np.percentile(lum[fg], 97)
    lum = np.clip((lum - lo) / (hi - lo), 0, 1)

    def cells(arr: np.ndarray) -> np.ndarray:
        shape = (a.cols, SAMPLE, a.cols, SAMPLE) + arr.shape[2:]
        return arr.reshape(shape).mean(axis=(1, 3))

    tone = cells(lum)
    presence = cells(soft)
    color = cells(rgb)

    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray((tone * 255).round().astype(np.uint8), "L").save(OUT / "tone.png", optimize=True)
    rgba = np.dstack([color, presence * 255]).round().clip(0, 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(OUT / "color.png", optimize=True)
    for name in ("tone.png", "color.png"):
        print(f"portrait/{name}: {a.cols}x{a.cols}, {(OUT / name).stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
