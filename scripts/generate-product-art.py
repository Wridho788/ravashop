"""Generate RavaShop's original product illustrations into assets/products/.

Each image is drawn at 2x and downscaled for smooth edges. Run with:
    python scripts/generate-product-art.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "products"
SIZE = 600
S = 2  # supersampling factor
W = SIZE * S

BACKGROUNDS = {
    "cat-bag": "#F3E3D3",
    "cat-drink": "#DCEBEA",
    "cat-accessory": "#ECE3F1",
    "cat-shoes": "#E6ECDA",
    "cat-audio": "#E2E5F0",
}


def p(*values):
    """Scale coordinates from a 600px design grid to the canvas."""
    return [v * S for v in values]


def canvas(category):
    image = Image.new("RGBA", (W, W), BACKGROUNDS[category])
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).ellipse(p(90, 90, 510, 510), fill=120)
    white = Image.new("RGBA", (W, W), (255, 255, 255, 255))
    image.paste(white, (0, 0), mask.filter(ImageFilter.GaussianBlur(40 * S)))
    return image


def shadow(image, box):
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).ellipse(p(*box), fill=70)
    dark = Image.new("RGBA", (W, W), (40, 30, 20, 255))
    image.paste(dark, (0, 0), mask.filter(ImageFilter.GaussianBlur(12 * S)))


def bag(d):
    d.rounded_rectangle(p(205, 120, 395, 200), radius=60 * S, outline="#7A4A2A", width=18 * S)
    d.rounded_rectangle(p(170, 170, 430, 490), radius=70 * S, fill="#C8794A")
    d.rounded_rectangle(p(205, 320, 395, 460), radius=36 * S, fill="#B0623A")
    d.rounded_rectangle(p(235, 300, 365, 330), radius=14 * S, fill="#7A4A2A")
    d.rectangle(p(190, 230, 410, 246), fill="#B0623A")


def bottle(d):
    d.rounded_rectangle(p(262, 90, 338, 150), radius=14 * S, fill="#2D4A57")
    d.rounded_rectangle(p(250, 140, 350, 175), radius=12 * S, fill="#9FB7BD")
    d.rounded_rectangle(p(225, 165, 375, 500), radius=48 * S, fill="#3E7C88")
    d.rounded_rectangle(p(245, 200, 268, 460), radius=11 * S, fill="#5FA0AB")
    d.rounded_rectangle(p(225, 300, 375, 360), radius=0, fill="#2F6772")


def hat(d):
    d.ellipse(p(110, 330, 490, 450), fill="#6E5A8C")
    d.polygon(p(195, 380, 225, 200, 375, 200, 405, 380), fill="#8D78AD")
    d.ellipse(p(222, 175, 378, 235), fill="#8D78AD")
    d.rectangle(p(206, 320, 394, 352), fill="#5A4874")


def tote(d):
    d.arc(p(215, 110, 315, 280), 180, 360, fill="#5E7B4F", width=16 * S)
    d.arc(p(285, 110, 385, 280), 180, 360, fill="#5E7B4F", width=16 * S)
    d.polygon(p(165, 200, 435, 200, 460, 495, 140, 495), fill="#E8D3A8")
    d.polygon(p(165, 200, 435, 200, 440, 250, 160, 250), fill="#D9BF8C")
    d.ellipse(p(255, 320, 345, 410), outline="#5E7B4F", width=12 * S)


def sneakers(d):
    d.polygon(p(110, 400, 150, 270, 250, 250, 330, 320, 470, 350, 495, 420, 110, 420), fill="#E06A3B")
    d.rounded_rectangle(p(100, 410, 505, 455), radius=22 * S, fill="#F7F3EC")
    d.polygon(p(150, 270, 250, 250, 280, 280, 175, 300), fill="#B9502A")
    for x in (230, 262, 294):
        d.line(p(x, 300, x + 28, 330), fill="#F7F3EC", width=8 * S)
    d.rounded_rectangle(p(100, 438, 505, 455), radius=8 * S, fill="#D8D1C4")


def sandal(d):
    d.rounded_rectangle(p(215, 100, 385, 500), radius=85 * S, fill="#4F6B3A")
    d.rounded_rectangle(p(230, 115, 370, 485), radius=70 * S, fill="#C9D7A8")
    d.rounded_rectangle(p(200, 190, 400, 240), radius=24 * S, fill="#2F4F3A")
    d.rounded_rectangle(p(200, 280, 400, 330), radius=24 * S, fill="#2F4F3A")


def headphone(d):
    d.arc(p(150, 110, 450, 410), 180, 360, fill="#2E3350", width=30 * S)
    d.line(p(150, 260, 150, 330), fill="#2E3350", width=30 * S)
    d.line(p(450, 260, 450, 330), fill="#2E3350", width=30 * S)
    d.rounded_rectangle(p(110, 290, 200, 460), radius=40 * S, fill="#4B5487")
    d.rounded_rectangle(p(400, 290, 490, 460), radius=40 * S, fill="#4B5487")
    d.rounded_rectangle(p(170, 305, 210, 445), radius=18 * S, fill="#2E3350")
    d.rounded_rectangle(p(390, 305, 430, 445), radius=18 * S, fill="#2E3350")


def earbuds(d):
    d.rounded_rectangle(p(170, 270, 430, 470), radius=80 * S, fill="#FAFAFA")
    d.line(p(175, 340, 425, 340), fill="#D5D8E5", width=6 * S)
    d.ellipse(p(285, 395, 315, 405), fill="#7DC383")
    for x in (215, 335):
        d.ellipse(p(x, 130, x + 70, 200), fill="#FAFAFA")
        d.rounded_rectangle(p(x + 22, 170, x + 48, 270), radius=13 * S, fill="#FAFAFA")
        d.ellipse(p(x + 18, 145, x + 52, 180), fill="#5A6185")


def tumbler(d):
    d.rounded_rectangle(p(205, 115, 395, 165), radius=18 * S, fill="#2D4A57")
    d.rounded_rectangle(p(250, 100, 350, 125), radius=10 * S, fill="#1E333C")
    d.polygon(p(215, 165, 385, 165, 360, 495, 240, 495), fill="#E2A65C")
    d.polygon(p(222, 260, 378, 260, 371, 350, 229, 350), fill="#F3E3C6")
    d.polygon(p(235, 180, 255, 180, 262, 480, 248, 480), fill="#EDBE80")


def watch(d):
    d.rounded_rectangle(p(250, 80, 350, 220), radius=20 * S, fill="#3B2F2A")
    d.rounded_rectangle(p(250, 380, 350, 520), radius=20 * S, fill="#3B2F2A")
    d.ellipse(p(180, 180, 420, 420), fill="#C9A86A")
    d.ellipse(p(200, 200, 400, 400), fill="#FBF8F1")
    d.line(p(300, 300, 300, 230), fill="#3B2F2A", width=8 * S)
    d.line(p(300, 300, 350, 320), fill="#3B2F2A", width=8 * S)
    d.ellipse(p(290, 290, 310, 310), fill="#D9572B")
    d.rounded_rectangle(p(415, 285, 435, 315), radius=6 * S, fill="#C9A86A")


PRODUCTS = [
    ("product-bag", "cat-bag", bag, (160, 470, 440, 510)),
    ("product-bottle", "cat-drink", bottle, (205, 480, 395, 515)),
    ("product-sold-out", "cat-accessory", hat, (120, 420, 480, 470)),
    ("product-tote", "cat-bag", tote, (140, 475, 460, 515)),
    ("product-sneakers", "cat-shoes", sneakers, (100, 440, 505, 480)),
    ("product-sandal", "cat-shoes", sandal, (215, 480, 385, 515)),
    ("product-headphone", "cat-audio", headphone, (110, 445, 490, 485)),
    ("product-earbuds", "cat-audio", earbuds, (170, 450, 430, 490)),
    ("product-tumbler", "cat-drink", tumbler, (225, 478, 375, 512)),
    ("product-watch", "cat-accessory", watch, (240, 500, 360, 530)),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for product_id, category, draw_fn, shadow_box in PRODUCTS:
        image = canvas(category)
        shadow(image, shadow_box)
        draw_fn(ImageDraw.Draw(image))
        final = image.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        final.save(OUT / f"{product_id}.png", optimize=True)
        print(f"wrote {product_id}.png")


if __name__ == "__main__":
    main()
