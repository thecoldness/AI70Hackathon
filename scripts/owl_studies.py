"""Three hand-drawn-looking line studies of the owl concept sheet, each in a different 'hand'.

A: soft graphite sketch of the flying female owl (pencil dodge + construction lines)
B: clean ink contour of the standing spread-wing owl (canny + slight hand wobble)
C: loose blue-pencil gesture of the whole top pair (sparse edges, doubled wobbly passes)
Logos and printed text are excluded or painted out.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

src, out_dir = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(7)
base = Image.open(src).convert('L')


def crop(box, masks=()):
    im = base.copy()
    d = ImageDraw.Draw(im)
    for m in masks:
        d.rectangle(m, fill=255)
    return np.asarray(im.crop(box), dtype=np.float32) / 255.0


def lines(img, sigma, k=1.6, tau=0.98, eps=-0.005, phi=60.0):
    """XDoG line extraction: returns ink strength (0..1) where the image has drawable edges."""
    d = ndimage.gaussian_filter(img, sigma) - tau * ndimage.gaussian_filter(img, sigma * k)
    return 1 - np.where(d >= eps, 1.0, 1 + np.tanh(phi * (d - eps)))


def wobble(arr, amp, scale, seed):
    """Warp an image by a smooth random field so lines drift like a human hand."""
    r = np.random.default_rng(seed)
    h, w = arr.shape
    dy = ndimage.gaussian_filter(r.standard_normal((h, w)), scale) * amp * scale
    dx = ndimage.gaussian_filter(r.standard_normal((h, w)), scale) * amp * scale
    yy, xx = np.mgrid[0:h, 0:w]
    return ndimage.map_coordinates(arr, [yy + dy, xx + dx], order=1, mode='nearest')


def paper(shape, tone, grain, seed):
    h, w = shape
    r = np.random.default_rng(seed)
    n = ndimage.gaussian_filter(r.standard_normal((h, w)), 1.2)
    p = np.ones((h, w, 3), np.float32) * np.array(tone, np.float32)
    return np.clip(p + n[..., None] * grain, 0, 1)


def ink_on(paper_rgb, ink_alpha, ink_rgb):
    a = np.clip(ink_alpha, 0, 1)[..., None]
    return paper_rgb * (1 - a) + np.array(ink_rgb, np.float32) * a


def save(rgb, name):
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(f'{out_dir}/{name}', 'JPEG', quality=84, optimize=True)


# A — graphite: colour-dodge pencil effect, lightened, with faint construction ellipses.
g = crop((100, 480, 910, 940), masks=[(725, 835, 845, 878)])
inv_blur = ndimage.gaussian_filter(1 - g, 6)
dodge = np.clip(g / np.maximum(1 - inv_blur, 1e-3), 0, 1)
dodge = wobble(dodge, 0.35, 10, 1)
graphite = np.clip((1 - dodge) * 1.9, 0, 1) ** 1.25 * 0.85
h, w = graphite.shape
guide = Image.new('L', (w, h), 0)
gd = ImageDraw.Draw(guide)
for (cx, cy, rx, ry) in [(308, 190, 52, 46), (300, 300, 78, 105), (575, 185, 235, 62)]:
    for k in range(2):
        j = rng.normal(0, 4, 4)
        gd.ellipse((cx - rx + j[0], cy - ry + j[1], cx + rx + j[2], cy + ry + j[3]), outline=70, width=2)
gd.line([(30, 70), (300, 300), (430, 440)], fill=60, width=2)
graphite = np.maximum(graphite, np.asarray(guide.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255 * 0.55)
save(ink_on(paper((h, w), (0.96, 0.95, 0.92), 0.025, 2), graphite, (0.24, 0.24, 0.26)), 'kfpdev-01-study-graphite.jpg')

# B — ink contour: edges only, thickened slightly, with a gentle hand wobble. No shading.
b = crop((230, 100, 990, 420), masks=[(780, 160, 930, 205), (230, 100, 520, 250), (230, 100, 290, 420)])
edges = lines(b, 1.4, tau=0.985, eps=-0.012, phi=90)
edges = np.where(edges > 0.35, edges, 0)
edges = ndimage.gaussian_filter(wobble(edges, 0.5, 14, 3), 0.7)
ink = np.clip(edges * 1.5, 0, 1)
h, w = ink.shape
save(ink_on(paper((h, w), (0.985, 0.975, 0.95), 0.015, 4), ink, (0.08, 0.07, 0.07)), 'kfpdev-01-study-ink.jpg')

# C — loose gesture in blue pencil: few edges, two drifting passes, nothing tidy.
c = crop((30, 80, 1000, 430), masks=[(780, 160, 930, 205)])
small = ndimage.zoom(c, 0.6, order=1)
e = lines(ndimage.gaussian_filter(small, 1.0), 1.3, tau=0.985, eps=-0.015, phi=35)
e = np.where(e > 0.3, e, 0)
e = ndimage.zoom(e, 1 / 0.6, order=1)[: c.shape[0], : c.shape[1]]
e = np.pad(e, ((0, max(0, c.shape[0] - e.shape[0])), (0, max(0, c.shape[1] - e.shape[1]))))
passes = [wobble(e, 0.9, 22, s) * a for s, a in [(5, 0.9), (6, 0.4)]]
gesture = ndimage.gaussian_filter(np.maximum(*passes), 0.9)
h, w = gesture.shape
save(ink_on(paper((h, w), (0.97, 0.965, 0.94), 0.02, 6), np.clip(gesture * 1.6, 0, 0.9), (0.2, 0.33, 0.55)), 'kfpdev-01-study-gesture.jpg')
print('ok')
