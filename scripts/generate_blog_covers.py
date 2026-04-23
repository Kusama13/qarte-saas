#!/usr/bin/env python3
"""
Generate Instagram-format (1080x1080) blog cover images.
Uses Imagen 3 (Gemini API) for photographic backgrounds + Pillow for text overlay.

Usage:
  python3 scripts/generate_blog_covers.py          # all 3 articles
  python3 scripts/generate_blog_covers.py 1        # article 1 only

Requires: GEMINI_API_KEY in environment (from .env.local)
"""

import io
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

API_KEY = os.environ.get('GEMINI_API_KEY')
if not API_KEY:
    print("Error: GEMINI_API_KEY not set.\n"
          "Run: export GEMINI_API_KEY=$(grep GEMINI_API_KEY .env.local | cut -d'\"' -f2)")
    sys.exit(1)

from google import genai
from google.genai import types

client = genai.Client(api_key=API_KEY)

OUT_DIR = Path(__file__).parent.parent / 'public' / 'blog' / 'social'
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_HEAVY  = '/System/Library/Fonts/HelveticaNeue.ttc'  # index 4 = Heavy/Black
FONT_BOLD   = '/System/Library/Fonts/HelveticaNeue.ttc'  # index 1 = Bold
FONT_REG    = '/System/Library/Fonts/HelveticaNeue.ttc'  # index 0 = Regular

def font(size: int, weight: str = 'regular') -> ImageFont.FreeTypeFont:
    idx = {'heavy': 4, 'bold': 1, 'regular': 0}.get(weight, 0)
    return ImageFont.truetype(FONT_HEAVY, size, index=idx)

ARTICLES = [
    {
        'id': 1,
        'filename': 'article-1-cover.png',
        'label': 'FIDÉLISATION',
        'label_rgb': (236, 64, 122),     # rose vif
        'title_lines': [
            'Ces clientes qui',
            'réservent et ne',
            'reviennent jamais',
        ],
        'platform_line': 'Planity  ·  Booksy  ·  Treatwell',
        'imagen_prompt': (
            'Luxury French beauty salon interior, warm golden hour sunlight through large windows, '
            'elegant white styling chairs reflected in a backlit mirror, fresh pink roses on the vanity, '
            'soft creamy bokeh, no people, no text, editorial fashion photography, '
            'rose and warm amber tones, ultra sharp, cinematic 50mm f/1.4'
        ),
    },
    {
        'id': 2,
        'filename': 'article-2-cover.png',
        'label': 'STRATÉGIE',
        'label_rgb': (124, 58, 237),     # violet
        'title_lines': [
            'Ce lien en bio',
            'envoie tes clientes',
            'chez la concurrente',
        ],
        'platform_line': 'Instagram  ·  Planity  ·  Booksy',
        'imagen_prompt': (
            "Close-up of a woman's manicured hand holding a sleek smartphone displaying the Instagram app, "
            'luxurious beauty salon softly blurred behind, cool violet and indigo ambient lighting, '
            'dark moody atmosphere, no text on screen, editorial photography, '
            'cinematic violet color grade, 85mm f/1.2, shallow depth of field'
        ),
    },
    {
        'id': 3,
        'filename': 'article-3-cover.png',
        'label': 'RÉPUTATION',
        'label_rgb': (217, 119, 6),      # amber
        'title_lines': [
            'Tes avis sur Planity',
            "ne t'appartiennent",
            'pas',
        ],
        'platform_line': 'Planity  ·  Booksy  ·  Treatwell',
        'imagen_prompt': (
            'Close-up of elegant manicured hands holding a sleek smartphone, '
            'screen softly glowing showing five golden stars on a dark surface, '
            'luxury Parisian beauty salon interior beautifully blurred behind, '
            'warm amber candlelight bokeh, dark rich tones, no text on screen, '
            'editorial fashion photography, 85mm f/1.2 shallow depth of field, '
            'golden hour tones, cinematic, ultra sharp'
        ),
    },
    {
        'id': 4,
        'filename': 'article-4-cover.png',
        'label': 'ACQUISITION',
        'label_rgb': (16, 185, 129),     # emerald
        'title_lines': [
            '12 stratégies pour',
            'attirer plus de',
            'clientes en salon',
        ],
        'platform_line': 'Google Business  ·  Instagram  ·  Fidélité',
        'imagen_prompt': (
            'Warm vibrant French beauty salon interior, elegant white styling chairs all occupied, '
            'cheerful hairstylists at work with tools, golden morning sunlight through large arched windows, '
            'fresh pink roses on the reception desk, welcoming and lively atmosphere, no people faces visible, '
            'no text, editorial lifestyle photography, wide 35mm, warm creamy tones, luxury modern Parisian decor'
        ),
    },
    {
        'id': 5,
        'filename': 'article-5-cover.png',
        'label': 'GESTION',
        'label_rgb': (234, 88, 12),      # orange
        'title_lines': [
            'No-show : diviser',
            'par 4 les rendez-',
            'vous manqués',
        ],
        'platform_line': 'Acompte  ·  Rappel SMS  ·  Annulation',
        'imagen_prompt': (
            'Close-up of a leather-bound appointment book lying open on a luxury beauty salon reception desk, '
            'a sleek pen crossing out a time slot, moody dramatic studio lighting, '
            'cool slate and deep shadow tones with warm amber accents, '
            'blurred salon chairs softly visible in background bokeh, no text readable, '
            'editorial photography, 50mm f/1.8, cinematic, ultra sharp foreground'
        ),
    },
    {
        'id': 6,
        'filename': 'article-6-cover.png',
        'label': 'OUTILS',
        'label_rgb': (99, 102, 241),     # indigo
        'title_lines': [
            'Planity, Treatwell,',
            'Booksy, Qarte :',
            'le comparatif 2026',
        ],
        'platform_line': 'Planity  ·  Treatwell  ·  Booksy  ·  Qarte',
        'imagen_prompt': (
            'Sleek silver MacBook laptop on a clean marble beauty salon reception desk, '
            'screen softly glowing with a clean booking interface, no readable text on screen, '
            'minimalist modern Parisian decor, blurred white styling chairs in background, '
            'cool blue-grey ambient lighting with warm gold accents, '
            'editorial photography, 50mm f/1.4, shallow depth of field, luxury clean aesthetic'
        ),
    },
]


def fetch_background(prompt: str) -> Image.Image:
    print('  → Imagen 3 generating background...')
    resp = client.models.generate_images(
        model='imagen-4.0-ultra-generate-001',
        prompt=prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio='1:1',
            safety_filter_level='BLOCK_LOW_AND_ABOVE',
            person_generation='ALLOW_ADULT',
        ),
    )
    raw = resp.generated_images[0].image.image_bytes
    return Image.open(io.BytesIO(raw)).resize((1080, 1080), Image.LANCZOS)


def dark_overlay(img: Image.Image) -> Image.Image:
    base = img.convert('RGBA')
    mask = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(mask)
    for y in range(1080):
        # Transparent at top, 78% black at bottom
        t = max(0.0, (y / 1080 - 0.25) / 0.75)
        alpha = int(t ** 1.4 * 200)
        d.rectangle([(0, y), (1080, y + 1)], fill=(0, 0, 0, alpha))
    return Image.alpha_composite(base, mask)


def pill(draw: ImageDraw.Draw, text: str, rgb: tuple, x: int, y: int):
    f = font(26, 'bold')
    bbox = draw.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 22, 12
    w, h = tw + pad_x * 2, th + pad_y * 2
    # Draw pill on a temp RGBA layer so we can round corners
    layer = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=(*rgb, 230))
    draw._image.paste(Image.alpha_composite(draw._image.convert('RGBA'), layer).convert('RGBA'), (0, 0))
    # Redraw text on top
    draw.text((x + pad_x, y + pad_y - 1), text, font=f, fill=(255, 255, 255))
    return h + 24  # vertical space consumed


def compose(article: dict) -> Path:
    print(f"\nArticle {article['id']}: {article['title_lines'][0]} ...")

    bg = fetch_background(article['imagen_prompt'])
    img = dark_overlay(bg).convert('RGB')
    draw = ImageDraw.Draw(img)

    label_rgb = article['label_rgb']
    x_left = 72

    # ── Label pill (bottom-left area, above title) ─────────────────────
    title_block_h = len(article['title_lines']) * 90
    platform_h = 48
    sep_h = 32
    brand_h = 50
    total_content_h = 50 + title_block_h + platform_h + sep_h + brand_h + 60
    content_top = 1080 - total_content_h

    pill_y = content_top
    f_pill = font(26, 'bold')
    bbox = draw.textbbox((0, 0), article['label'], font=f_pill)
    pill_w = bbox[2] - bbox[0] + 44
    pill_h = bbox[3] - bbox[1] + 24

    # Pill background (RGBA rounded)
    pill_layer = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill_layer)
    pd.rounded_rectangle(
        [x_left, pill_y, x_left + pill_w, pill_y + pill_h],
        radius=pill_h // 2,
        fill=(*label_rgb, 230),
    )
    img = Image.alpha_composite(img.convert('RGBA'), pill_layer).convert('RGB')
    draw = ImageDraw.Draw(img)
    draw.text((x_left + 22, pill_y + 12), article['label'], font=f_pill, fill=(255, 255, 255))

    # ── Title lines ────────────────────────────────────────────────────
    f_title = font(82, 'heavy')
    title_y = pill_y + pill_h + 20
    line_h = 96
    for i, line in enumerate(article['title_lines']):
        y = title_y + i * line_h
        # Subtle text shadow
        draw.text((x_left + 2, y + 3), line, font=f_title, fill=(0, 0, 0, 100))
        draw.text((x_left, y), line, font=f_title, fill=(255, 255, 255))

    # ── Platform line ──────────────────────────────────────────────────
    f_plat = font(30, 'regular')
    plat_y = title_y + len(article['title_lines']) * line_h + 14
    draw.text((x_left, plat_y), article['platform_line'], font=f_plat, fill=(200, 200, 200))

    # ── Separator ──────────────────────────────────────────────────────
    sep_y = plat_y + 52
    draw.line([(x_left, sep_y), (1080 - x_left, sep_y)], fill=(255, 255, 255, 60), width=1)

    # ── Brand bar ──────────────────────────────────────────────────────
    bar_y = sep_y + 22
    f_brand = font(38, 'bold')
    f_url = font(28, 'regular')

    # Colored dot before "Qarte"
    dot_r = 7
    draw.ellipse(
        [(x_left, bar_y + 16), (x_left + dot_r * 2, bar_y + 16 + dot_r * 2)],
        fill=label_rgb,
    )
    draw.text((x_left + dot_r * 2 + 10, bar_y + 8), 'Qarte', font=f_brand, fill=(255, 255, 255))

    url_bbox = draw.textbbox((0, 0), 'getqarte.com', font=f_url)
    url_w = url_bbox[2] - url_bbox[0]
    draw.text((1080 - x_left - url_w, bar_y + 13), 'getqarte.com', font=f_url, fill=(160, 160, 160))

    out = OUT_DIR / article['filename']
    img.save(out, 'PNG', optimize=True)
    print(f'  ✓ Saved → {out}')
    return out


def main():
    target = int(sys.argv[1]) if len(sys.argv) > 1 else None
    articles = [a for a in ARTICLES if target is None or a['id'] == target]
    print(f'Generating {len(articles)} image(s)...')
    for a in articles:
        compose(a)
    print('\nDone.')


if __name__ == '__main__':
    main()
