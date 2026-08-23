"""Prepare video assets: mocha-graded basemap tiles, Indonesia SVG path, ambient audio."""
import json
import math
import struct
import urllib.request
import wave
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image, ImageFilter

OUT_IMG = "public/img/bl-map.png"
OUT_GEO = "src/data/indonesia.json"
OUT_WAV = "public/audio/ambient.wav"

# ---------------------------------------------------------------- basemap
def fetch_tile(args):
    z, x, y = args
    for sub in ("a", "b", "c", "d"):
        url = f"https://{sub}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                return (x, y, r.read())
        except Exception:
            continue
    raise RuntimeError(f"tile {z}/{x}/{y} failed")

def build_map():
    z = 13
    cx, cy = 6491, 4218  # Bandar Lampung -5.3971, 105.2668
    cols, rows = 8, 5
    x0, y0 = cx - cols // 2, cy - rows // 2
    jobs = [(z, x0 + dx, y0 + dy) for dy in range(rows) for dx in range(cols)]
    with ThreadPoolExecutor(max_workers=8) as ex:
        tiles = list(ex.map(fetch_tile, jobs))
    grid = {}
    for x, y, data in tiles:
        grid[(x, y)] = Image.open(__import__("io").BytesIO(data)).convert("RGB")
    w, h = 256 * cols, 256 * rows
    canvas = Image.new("RGB", (w, h))
    for (x, y), im in grid.items():
        canvas.paste(im, ((x - x0) * 256, (y - y0) * 256))
    # mocha grade: map luminance onto warm brown ramp
    lum = np.asarray(canvas.convert("L"), dtype=np.float32) / 255.0
    lum = np.clip((lum - 0.03) / 0.30, 0, 1) ** 0.85  # stretch dark tile range
    shadow = np.array([16, 12, 9], dtype=np.float32)      # #100c09
    mid = np.array([64, 47, 32], dtype=np.float32)
    high = np.array([168, 128, 88], dtype=np.float32)     # warm sand
    t = lum[..., None]
    ramp = np.where(t < 0.5, shadow + (mid - shadow) * (t / 0.5),
                    mid + (high - mid) * ((t - 0.5) / 0.5))
    # copper tint on bright features (roads)
    copper = np.array([212, 149, 106], dtype=np.float32)
    ramp += copper[None, None, :] * np.clip(lum[..., None] - 0.45, 0, 1) * 0.9
    img = Image.fromarray(np.clip(ramp, 0, 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.save(OUT_IMG)
    print("map:", img.size)

# ------------------------------------------------------------- indonesia
def build_indonesia():
    url = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/IDN.geo.json"
    with urllib.request.urlopen(url, timeout=30) as r:
        geo = json.load(r)
    LON0, LON1 = 94.0, 141.5
    LAT0, LAT1 = -11.5, 7.0
    W, H = 1600, 760
    def proj(lon, lat):
        return (round((lon - LON0) / (LON1 - LON0) * W, 1),
                round((LAT1 - lat) / (LAT1 - LAT0) * H, 1))
    paths = []
    def ring_path(ring):
        pts = [proj(p[0], p[1]) for p in ring]
        if len(pts) < 3:
            return None
        d = f"M{pts[0][0]} {pts[0][1]}"
        for p in pts[1:]:
            d += f"L{p[0]} {p[1]}"
        return d + "Z"
    def walk(obj):
        if isinstance(obj, dict) and "coordinates" in obj:
            coords = obj["coordinates"]
            polys = coords if obj.get("type") == "MultiPolygon" else [coords]
            for poly in polys:
                d = ring_path(poly[0])
                if d:
                    paths.append(d)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)
    for feat in geo["features"]:
        walk(feat.get("geometry", feat))
    with open(OUT_GEO, "w") as f:
        json.dump({"w": W, "h": H, "paths": paths}, f)
    print("indonesia paths:", len(paths))

# ----------------------------------------------------------------- audio
SR = 44100
DUR = 72.0

def env(t, a, r):
    e = np.ones_like(t)
    e[t < a] = (t[t < a] / a) ** 2
    m = t > (DUR - r)
    e[m] = ((DUR - t[m]) / r) ** 2
    return e

def ping(t0, freq=660.0, dur=1.6, amp=0.16):
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.2)
    tone += np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t * 4.5) * 0.35
    return t0, amp * tone

def boom(t0, amp=0.22):
    dur = 2.2
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 90 * np.exp(-t * 2.2) + 34
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    return t0, amp * tone

def riser(t0, dur, amp=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * (180 + 420 * (t / dur) ** 2) * t) * (t / dur) ** 2.5
    return t0, amp * tone

def build_audio():
    n = int(DUR * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(7)

    # warm drone: detuned lows + slow-shifting fifth, gentle LFO breathing
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t + 1.0)
    drone = (
        np.sin(2 * np.pi * 55.0 * t) * 0.30
        + np.sin(2 * np.pi * 55.35 * t) * 0.22
        + np.sin(2 * np.pi * 82.5 * t) * 0.16 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.031 * t))
        + np.sin(2 * np.pi * 110.2 * t) * 0.10 * lfo
    )
    # airy noise pad, heavily lowpassed via cumulative smoothing
    noise = rng.standard_normal(n) * 0.012
    k = 480
    noise = np.convolve(noise, np.ones(k) / k, mode="same")
    mix = drone + noise
    mix *= env(t, 2.0, 3.0)

    # one-shots: (start_sec, samples)
    ones = [
        ping(0.6, 523.25, amp=0.10),
        ping(8.2, 587.33, amp=0.09),
        ping(16.4, 523.25, amp=0.10),
        ping(21.6, 698.46, amp=0.12),
        riser(27.0, 3.0, amp=0.10),
        boom(30.0, amp=0.26),
        ping(30.05, 1046.5, amp=0.08),
        ping(38.4, 587.33, amp=0.10),
        riser(44.5, 2.5, amp=0.09),
        boom(47.2, amp=0.20),
        ping(47.3, 880.0, amp=0.09),
        boom(54.1, amp=0.18),
        ping(60.2, 659.25, amp=0.10),
        ping(66.3, 523.25, amp=0.12),
        ping(66.9, 784.0, amp=0.08),
    ]
    for start, samples in ones:
        i = int(start * SR)
        j = min(i + len(samples), n)
        mix[i:j] += samples[: j - i]

    # soft ticks every 2s (instrument feel), skip near one-shots
    tick_t = np.arange(0, DUR, 2.0)
    for tt in tick_t:
        i = int(tt * SR)
        seg = np.sin(2 * np.pi * 1320 * np.arange(int(0.05 * SR)) / SR) * np.exp(
            -np.arange(int(0.05 * SR)) / SR * 60
        ) * 0.035
        j = min(i + len(seg), n)
        mix[i:j] += seg[: j - i]

    mix = np.tanh(mix * 1.1) * 0.75
    # gentle stereo width: delayed right channel
    d = int(0.011 * SR)
    right = np.roll(mix, d)
    stereo = np.stack([mix, right], axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(OUT_WAV, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("audio:", DUR, "s")

if __name__ == "__main__":
    build_map()
    build_indonesia()
    build_audio()
