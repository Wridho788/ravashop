"""Generate RavaShop's original launcher icon into android/app/src/main/res/.

Draws a white shopping bag with a small spark on the brand accent colour, then writes:
- legacy square and round icons for every density (ic_launcher.png, ic_launcher_round.png)
- an adaptive-icon foreground (Android 8+) plus mipmap-anydpi-v26 XML and background colour
- assets/brand/ravashop-icon.png (1024 px) for docs and store listings

Run with:
    python scripts/generate-app-icon.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android" / "app" / "src" / "main" / "res"
ACCENT = "#D9572B"
ACCENT_DARK = "#B5441E"
WHITE = "#FFFFFF"
CREAM = "#F6F4EF"

DENSITIES = {"mipmap-mdpi": 1, "mipmap-hdpi": 1.5, "mipmap-xhdpi": 2, "mipmap-xxhdpi": 3, "mipmap-xxxhdpi": 4}


def draw_mark(size: int) -> Image.Image:
    """Bag mark on a transparent square; the artwork fills about 62% of the canvas."""
    s = size / 100
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    # Handle
    d.arc([36 * s, 17 * s, 64 * s, 47 * s], 180, 360, fill=WHITE, width=round(5.5 * s))
    # Bag body with a slightly wider base
    d.rounded_rectangle([24 * s, 32 * s, 76 * s, 81 * s], radius=10 * s, fill=WHITE)
    # Fold line
    d.rounded_rectangle([24 * s, 32 * s, 76 * s, 40 * s], radius=4 * s, fill=CREAM)
    # Four-point spark
    cx, cy, r, w = 50 * s, 60 * s, 10 * s, 3.2 * s
    d.polygon([(cx, cy - r), (cx + w, cy - w), (cx + r, cy), (cx + w, cy + w), (cx, cy + r),
               (cx - w, cy + w), (cx - r, cy), (cx - w, cy - w)], fill=ACCENT)
    return image


def supersample(fn, size: int) -> Image.Image:
    return fn(size * 4).resize((size, size), Image.Resampling.LANCZOS)


def legacy(size: int, round_icon: bool) -> Image.Image:
    def render(big: int) -> Image.Image:
        image = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        d = ImageDraw.Draw(image)
        if round_icon:
            d.ellipse([0, 0, big - 1, big - 1], fill=ACCENT)
        else:
            d.rounded_rectangle([0, 0, big - 1, big - 1], radius=big * 0.22, fill=ACCENT)
        mark = draw_mark(round(big * 0.86))
        offset = (big - mark.width) // 2
        image.alpha_composite(mark, (offset, offset))
        return image

    return supersample(render, size)


def adaptive_foreground(size: int) -> Image.Image:
    """108dp layer; the mark stays inside the 66dp safe zone."""

    def render(big: int) -> Image.Image:
        image = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        mark = draw_mark(round(big * 0.66))
        offset = (big - mark.width) // 2
        image.alpha_composite(mark, (offset, offset))
        return image

    return supersample(render, size)


def main():
    for folder, scale in DENSITIES.items():
        out = RES / folder
        out.mkdir(parents=True, exist_ok=True)
        legacy(round(48 * scale), False).save(out / "ic_launcher.png", optimize=True)
        legacy(round(48 * scale), True).save(out / "ic_launcher_round.png", optimize=True)
        adaptive_foreground(round(108 * scale)).save(out / "ic_launcher_foreground.png", optimize=True)

    anydpi = RES / "mipmap-anydpi-v26"
    anydpi.mkdir(parents=True, exist_ok=True)
    xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background" />\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n'
        '    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />\n'
        "</adaptive-icon>\n"
    )
    (anydpi / "ic_launcher.xml").write_text(xml, encoding="utf-8")
    (anydpi / "ic_launcher_round.xml").write_text(xml, encoding="utf-8")
    (RES / "values" / "colors.xml").write_text(
        f'<resources>\n    <color name="ic_launcher_background">{ACCENT}</color>\n</resources>\n', encoding="utf-8"
    )

    brand = ROOT / "assets" / "brand"
    brand.mkdir(parents=True, exist_ok=True)
    legacy(1024, False).save(brand / "ravashop-icon.png", optimize=True)
    print("Wrote launcher icons, adaptive icon, and assets/brand/ravashop-icon.png")


if __name__ == "__main__":
    main()
