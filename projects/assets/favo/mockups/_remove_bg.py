"""
Remove the page-background tone from any PNG by sampling its corners.

Usage:
  py _remove_bg.py <filename.png>           # bare name → script's own dir
  py _remove_bg.py ../aiyu-logo.png         # relative path → from cwd
  py _remove_bg.py /abs/path/to/file.png    # absolute path
  py _remove_bg.py                          # default: devices-favo.png

Strategy: sample the four corners to identify the dominant background
tone, then walk every pixel and write alpha=0 where it's within tolerance
of that tone. Soft tolerance falloff so anti-aliased edges keep partial
transparency (no halos).

Saves the result in-place over the source PNG and writes a backup
alongside as <name>.before-bg-removal.png.
"""

from PIL import Image
from pathlib import Path
import shutil
import sys


def resolve_target(arg: str) -> Path:
    """Find the target file. Bare names resolve relative to this script's
    directory; anything containing a path separator (or absolute) resolves
    from the current working directory like a normal file path."""
    p = Path(arg)
    if p.is_absolute() or "/" in arg or "\\" in arg:
        return p.resolve()
    return (Path(__file__).parent / arg).resolve()


def main() -> int:
    target_arg = sys.argv[1] if len(sys.argv) > 1 else "devices-favo.png"
    src = resolve_target(target_arg)
    if not src.exists():
        print(f"source not found: {src}", file=sys.stderr)
        return 1

    stem = src.stem
    backup = src.with_name(f"{stem}.before-bg-removal.png")
    if not backup.exists():
        shutil.copy2(src, backup)
        print(f"backup written: {backup.name}")

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    px = img.load()

    # Sample 4 corners (8x8 patches each) and average — robust to any
    # single-pixel artefact at a literal corner.
    patch = 8
    samples = []
    for x0, y0 in [(0, 0), (w - patch, 0), (0, h - patch), (w - patch, h - patch)]:
        rs, gs, bs = 0, 0, 0
        n = 0
        for x in range(x0, x0 + patch):
            for y in range(y0, y0 + patch):
                r, g, b, a = px[x, y]
                if a > 0:
                    rs += r
                    gs += g
                    bs += b
                    n += 1
        if n > 0:
            samples.append((rs // n, gs // n, bs // n))

    if not samples:
        # Corners are fully transparent — the image is already on a
        # transparent backdrop, but the visible artwork itself may still
        # have an unwanted shape-fill (e.g., a logo on a white badge).
        # Fall back to sampling edges of the OPAQUE bounding box: scan
        # inward from each side until we hit opaque pixels, then average
        # them. Captures the perimeter of the visible artwork — usually
        # a uniform fill colour for badge-style logos.
        print("corners transparent — sampling perimeter of visible artwork instead")
        edge_samples = []
        edge_inset = 6  # step in this far from the first opaque row/col
        # Scan from each side and record perimeter pixels
        for x in range(w):
            for y in range(h):
                if px[x, y][3] > 200:
                    # First opaque pixel on this scan line — sample inward
                    target_x = min(x + edge_inset, w - 1)
                    if px[target_x, y][3] > 200:
                        edge_samples.append(px[target_x, y][:3])
                    break
        for y in range(h):
            for x in range(w):
                if px[x, y][3] > 200:
                    target_y = min(y + edge_inset, h - 1)
                    if px[x, target_y][3] > 200:
                        edge_samples.append(px[x, target_y][:3])
                    break
        if not edge_samples:
            print("could not sample any opaque pixels at all", file=sys.stderr)
            return 2
        # Find the dominant colour among edge samples (mode-like)
        rs = sum(s[0] for s in edge_samples) // len(edge_samples)
        gs = sum(s[1] for s in edge_samples) // len(edge_samples)
        bs = sum(s[2] for s in edge_samples) // len(edge_samples)
        samples.append((rs, gs, bs))

    # Average the corner samples — this is the colour we'll knock out.
    bg_r = sum(s[0] for s in samples) // len(samples)
    bg_g = sum(s[1] for s in samples) // len(samples)
    bg_b = sum(s[2] for s in samples) // len(samples)
    print(f"detected background: rgb({bg_r}, {bg_g}, {bg_b})")

    # Tolerance bands — pixels within HARD become fully transparent;
    # pixels in the SOFT band get partial transparency proportional to
    # distance, so anti-aliased edges (where the device chrome blends
    # into the bg) fade cleanly instead of leaving a hard halo.
    HARD = 18   # max channel-distance for full transparency
    SOFT = 36   # max channel-distance for partial transparency

    transparent = 0
    softened = 0
    kept = 0

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            dr = abs(r - bg_r)
            dg = abs(g - bg_g)
            db = abs(b - bg_b)
            d = max(dr, dg, db)
            if d <= HARD:
                px[x, y] = (r, g, b, 0)
                transparent += 1
            elif d <= SOFT:
                # Linear ramp from full-transparent at HARD to fully-opaque at SOFT
                ratio = (d - HARD) / (SOFT - HARD)
                new_a = int(a * ratio)
                px[x, y] = (r, g, b, new_a)
                softened += 1
            else:
                kept += 1

    img.save(src, "PNG", optimize=True)
    total = transparent + softened + kept
    print(f"pixels: {total} total | {transparent} cleared | {softened} softened | {kept} kept")
    print(f"wrote: {src.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
