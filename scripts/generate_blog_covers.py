#!/usr/bin/env python3
"""
Generate social media cover images for Qarte blog articles.
Pure Pillow — no external API needed.

Usage:
  python3 scripts/generate_blog_covers.py          # all 3 articles
  python3 scripts/generate_blog_covers.py 1        # article 1 only
"""

import sys
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT_DIR = Path(__file__).parent.parent / "public" / "blog" / "social"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SIZE = (1080, 1080)

# Brand palette
ROSE_600   = (219, 39, 119)
ROSE_500   = (236, 72, 153)
ROSE_100   = (252, 231, 243)
ROSE_50    = (255, 241, 242)
INDIGO_600 = (79, 70, 229)
VIOLET_600 = (124, 58, 237)
GRAY_900   = (17, 24, 39)
GRAY_500   = (107, 114, 128)
GRAY_300   = (209, 213, 219)
WHITE      = (255, 255, 255)
CREAM      = (255, 248, 244)

ARTICLES = [
    {
        "id": 1,
        "filename": "article-1-cover.png",
        "tag": "Fidélisation",
        "title_lines": ["Ces clientes qui réservent", "et ne reviennent jamais"],
        "subtitle": "Planity · Booksy · Treatwell",
        "bg_top": (255, 228, 236),   # blush pink
        "bg_bot": (255, 245, 235),   # warm cream
        "accent": ROSE_600,
        "deco_circles": [
            (900, 120, 260, (252, 200, 220, 60)),
            (100, 960, 200, (255, 210, 180, 50)),
            (1000, 600, 150, (219, 39, 119, 30)),
        ],
    },
    {
        "id": 2,
        "filename": "article-2-cover.png",
        "tag": "Stratégie Instagram",
        "title_lines": ["Ton lien Planity en bio", "Instagram ? Grande erreur."],
        "subtitle": "Planity · Booksy · Treatwell",
        "bg_top": (230, 235, 255),   # soft indigo
        "bg_bot": (255, 241, 250),   # rose tint
        "accent": INDIGO_600,
        "deco_circles": [
            (950, 100, 280, (180, 190, 255, 60)),
            (80, 950, 220, (255, 200, 230, 50)),
            (1000, 650, 160, (79, 70, 229, 30)),
        ],
    },
    {
        "id": 3,
        "filename": "article-3-cover.png",
        "tag": "Réputation en ligne",
        "title_lines": ["Tes avis sur Planity", "ne t'appartiennent pas"],
        "subtitle": "Planity · Booksy · Treatwell",
        "bg_top": (255, 248, 220),   # warm amber
        "bg_bot": (255, 237, 245),   # soft rose
        "accent": (202, 138, 4),     # amber-600
        "deco_circles": [
            (920, 110, 270, (255, 230, 150, 60)),
            (90, 940, 210, (255, 200, 230, 50)),
            (1010, 620, 155, (202, 138, 4, 30)),
        ],
    },
]


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def make_gradient(size, top_color, bot_color):
    img = Image.new("RGB", size)
    draw = ImageDraw.Draw(img)
    w, h = size
    for y in range(h):
        t = y / h
        color = lerp_color(top_color, bot_color, t)
        draw.line([(0, y), (w, y)], fill=color)
    return img


def draw_circle_rgba(base: Image.Image, cx, cy, r, color_rgba):
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=color_rgba)
    blurred = overlay.filter(ImageFilter.GaussianBlur(radius=r // 3))
    base_rgba = base.convert("RGBA")
    return Image.alpha_composite(base_rgba, blurred).convert("RGB")


def get_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([(x0 + radius, y0), (x1 - radius, y1)], fill=fill)
    draw.rectangle([(x0, y0 + radius), (x1, y1 - radius)], fill=fill)
    draw.ellipse([(x0, y0), (x0 + 2 * radius, y0 + 2 * radius)], fill=fill)
    draw.ellipse([(x1 - 2 * radius, y0), (x1, y0 + 2 * radius)], fill=fill)
    draw.ellipse([(x0, y1 - 2 * radius), (x0 + 2 * radius, y1)], fill=fill)
    draw.ellipse([(x1 - 2 * radius, y1 - 2 * radius), (x1, y1)], fill=fill)


def generate_cover(article: dict) -> Path:
    print(f"  Article {article['id']}: {article['title_lines'][0]}...")

    # Gradient background
    img = make_gradient(SIZE, article["bg_top"], article["bg_bot"])

    # Decorative blurred circles
    for cx, cy, r, color in article["deco_circles"]:
        img = draw_circle_rgba(img, cx, cy, r, color)

    draw = ImageDraw.Draw(img)
    accent = article["accent"]
    W, H = SIZE

    # ── Top bar (accent) ───────────────────────────────────────────────
    draw.rectangle([(0, 0), (W, 8)], fill=accent)

    # ── Qarte pill (top-left) ─────────────────────────────────────────
    pill_x, pill_y, pill_w, pill_h = 52, 48, 148, 50
    draw_rounded_rect(draw, (pill_x, pill_y, pill_x + pill_w, pill_y + pill_h), 25, accent)
    f_brand = get_font(24, bold=True)
    draw.text((pill_x + pill_w // 2, pill_y + pill_h // 2), "Qarte",
              fill=WHITE, font=f_brand, anchor="mm")

    # ── Series label (top-right) ──────────────────────────────────────
    f_series = get_font(26)
    draw.text((W - 52, 72), f"Article {article['id']} / 3",
              fill=GRAY_500, font=f_series, anchor="rm")

    # ── White card (lower 52%) ────────────────────────────────────────
    card_top = int(H * 0.46)
    card_radius = 0
    card_overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    cd = ImageDraw.Draw(card_overlay)
    cd.rectangle([(0, card_top), (W, H)], fill=(255, 255, 255, 230))
    img = Image.alpha_composite(img.convert("RGBA"), card_overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Accent bar on top of card
    draw.rectangle([(0, card_top), (W, card_top + 7)], fill=accent)

    # ── Tag label ─────────────────────────────────────────────────────
    f_tag = get_font(28)
    tag_x, tag_y = 60, card_top + 36
    # small colored dot before tag
    draw.ellipse([(tag_x, tag_y + 8), (tag_x + 12, tag_y + 20)], fill=accent)
    draw.text((tag_x + 22, tag_y), article["tag"], fill=accent, font=f_tag)

    # ── Title ─────────────────────────────────────────────────────────
    f_title = get_font(74, bold=True)
    title_y = tag_y + 58
    line_h = 88
    for i, line in enumerate(article["title_lines"]):
        draw.text((60, title_y + i * line_h), line, fill=GRAY_900, font=f_title)

    # ── Subtitle (platform names) ──────────────────────────────────────
    sub_y = title_y + len(article["title_lines"]) * line_h + 22
    f_sub = get_font(32)
    draw.text((60, sub_y), article["subtitle"], fill=GRAY_500, font=f_sub)

    # ── Decorative short line ──────────────────────────────────────────
    line_y = sub_y + 64
    draw.rectangle([(60, line_y), (180, line_y + 4)], fill=accent)
    draw.rectangle([(192, line_y), (240, line_y + 4)], fill=(*accent[:3], 80) if len(accent) == 3 else GRAY_300)

    # ── URL bottom-right ──────────────────────────────────────────────
    f_url = get_font(30)
    draw.text((W - 60, H - 56), "getqarte.com", fill=GRAY_500, font=f_url, anchor="rm")

    # ── Small rose dot decoration bottom-left ─────────────────────────
    draw.ellipse([(40, H - 76), (72, H - 44)], fill=(*accent, ) if len(accent) == 3 else accent)

    out_path = OUT_DIR / article["filename"]
    img.save(out_path, "PNG", optimize=True)
    print(f"     Saved → {out_path}")
    return out_path


def main():
    target = int(sys.argv[1]) if len(sys.argv) > 1 else None
    articles = [a for a in ARTICLES if target is None or a["id"] == target]

    print(f"Generating {len(articles)} cover(s) → {OUT_DIR}\n")
    for article in articles:
        generate_cover(article)

    print("\nDone.")


if __name__ == "__main__":
    main()
