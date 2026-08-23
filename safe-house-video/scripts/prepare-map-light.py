"""Fetch CARTO Positron light basemap tiles and warm-grade them for the appdemo scene."""
import io
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image, ImageFilter

OUT_IMG = "public/img/bl-map-light.png"

Z = 13
X0, X1 = 6487, 6494
Y0, Y1 = 4216, 4220
COLS = X1 - X0 + 1
ROWS = Y1 - Y0 + 1


def fetch_tile(args):
    z, x, y = args
    last_err = None
    for pattern in ("light_all", "rastertiles/voyager"):
        for sub in ("a", "b", "c", "d"):
            url = f"https://{sub}.basemaps.cartocdn.com/{pattern}/{z}/{x}/{y}.png"
            try:
                with urllib.request.urlopen(url, timeout=20) as r:
                    return (x, y, r.read())
            except Exception as e:
                last_err = e
                continue
    raise RuntimeError(f"tile {z}/{x}/{y} failed: {last_err}")


def build_map():
    jobs = [(Z, X0 + dx, Y0 + dy) for dy in range(ROWS) for dx in range(COLS)]
    failed = []
    grid = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = ex.map(fetch_ok, jobs)
        for job, ok in zip(jobs, results):
            if ok is None:
                failed.append(job)
            else:
                x, y, data = ok
                grid[(x, y)] = Image.open(io.BytesIO(data)).convert("RGB")

    w, h = 256 * COLS, 256 * ROWS
    canvas = Image.new("RGB", (w, h), (96, 76, 54))
    for (x, y), im in grid.items():
        canvas.paste(im, ((x - X0) * 256, (y - Y0) * 256))

    t = np.asarray(canvas.convert("L"), dtype=np.float32) / 255.0
    dark = np.array([52, 41, 29], dtype=np.float32)
    mid = np.array([96, 76, 54], dtype=np.float32)
    high = np.array([226, 196, 152], dtype=np.float32)
    tt = t[..., None]
    ramp = np.where(
        tt < 0.5,
        dark + (mid - dark) * (tt / 0.5),
        mid + (high - mid) * ((tt - 0.5) / 0.5),
    )
    copper = np.array([212, 149, 106], dtype=np.float32)
    ramp += copper[None, None, :] * np.clip(t[..., None] - 0.75, 0, 1) * 0.8
    img = Image.fromarray(np.clip(ramp, 0, 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.save(OUT_IMG)

    print("map:", img.size, "tiles fetched:", len(grid), "/", len(jobs))
    if failed:
        print("FAILED TILES:")
        for z, x, y in failed:
            print(f"  {z}/{x}/{y}")


def fetch_ok(args):
    try:
        return fetch_tile(args)
    except Exception:
        return None


if __name__ == "__main__":
    build_map()
