#!/usr/bin/env python3
"""
Generate Instagram-format (1080x1080) cover for the home-service blog article.
Same pattern as scripts/generate_blog_covers.py — one-shot.

Usage:
  export GEMINI_API_KEY=$(grep GEMINI_API_KEY .env.local | cut -d'"' -f2)
  python3 scripts/generate_home_service_cover.py
"""

import io
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

API_KEY = os.environ.get('GEMINI_API_KEY')
if not API_KEY:
    print('Error: GEMINI_API_KEY not set.\n'
          'Run: export GEMINI_API_KEY=$(grep GEMINI_API_KEY .env.local | cut -d\\\" -f2)')
    sys.exit(1)

from google import genai
from google.genai import types

client = genai.Client(api_key=API_KEY)

OUT_DIR = Path(__file__).parent.parent / 'public' / 'blog' / 'social'
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_HEAVY = '/System/Library/Fonts/HelveticaNeue.ttc'  # index 4 = Heavy/Black


def font(size: int, weight: str = 'regular') -> ImageFont.FreeTypeFont:
    idx = {'heavy': 4, 'bold': 1, 'regular': 0}.get(weight, 0)
    return ImageFont.truetype(FONT_HEAVY, size, index=idx)


ARTICLE = {
    'filename': 'article-7-cover.png',
    'label': 'SERVICE À DOMICILE',
    'label_rgb': (75, 0, 130),  # Qarte brand violet #4b0082
    'title_lines': [
        'Pro à domicile :',
        'cale tes RDV',
        'sans courir',
    ],
    'platform_line': 'Rayon  ·  Trajets auto  ·  Vitrine privée',
    'imagen_prompt': (
        'Elegant French beauty professional kit on a clean modern living room floor, '
        'soft natural morning light through a large window, well-organized travel beauty case '
        'with nail polish bottles and brushes neatly arranged, fresh white peonies in a small vase, '
        'cozy contemporary Parisian apartment background softly blurred, '
        'no people, no text, no logos, editorial lifestyle photography, '
        'warm cream and gentle violet ambient tones, ultra sharp, cinematic 50mm f/1.8, '
        'sense of calm professional mobility'
    ),
}


def fetch_background(prompt: str) -> Image.Image:
    print('  -> Imagen 4 generating background...')
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
        t = max(0.0, (y / 1080 - 0.25) / 0.75)
        alpha = int(t ** 1.4 * 200)
        d.rectangle([(0, y), (1080, y + 1)], fill=(0, 0, 0, alpha))
    return Image.alpha_composite(base, mask)


def compose(article: dict) -> Path:
    print(f"\nArticle: {article['title_lines'][0]} ...")
    bg = fetch_background(article['imagen_prompt'])
    img = dark_overlay(bg).convert('RGB')
    draw = ImageDraw.Draw(img)

    label_rgb = article['label_rgb']
    x_left = 72

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

    f_title = font(82, 'heavy')
    title_y = pill_y + pill_h + 20
    line_h = 96
    for i, line in enumerate(article['title_lines']):
        y = title_y + i * line_h
        draw.text((x_left + 2, y + 3), line, font=f_title, fill=(0, 0, 0))
        draw.text((x_left, y), line, font=f_title, fill=(255, 255, 255))

    f_plat = font(30, 'regular')
    plat_y = title_y + len(article['title_lines']) * line_h + 14
    draw.text((x_left, plat_y), article['platform_line'], font=f_plat, fill=(200, 200, 200))

    sep_y = plat_y + 52
    draw.line([(x_left, sep_y), (1080 - x_left, sep_y)], fill=(255, 255, 255), width=1)

    bar_y = sep_y + 22
    f_brand = font(38, 'bold')
    f_url = font(28, 'regular')
    draw.text((x_left, bar_y), 'Qarte', font=f_brand, fill=(255, 255, 255))
    url_text = 'getqarte.com'
    bbox = draw.textbbox((0, 0), url_text, font=f_url)
    draw.text((1080 - x_left - (bbox[2] - bbox[0]), bar_y + 8), url_text, font=f_url, fill=(180, 180, 180))

    out_path = OUT_DIR / article['filename']
    img.save(out_path, 'PNG', optimize=True)
    print(f'  Saved {out_path.name} ({out_path.stat().st_size // 1024} KB)')
    return out_path


if __name__ == '__main__':
    compose(ARTICLE)
    print('\nDone.')
