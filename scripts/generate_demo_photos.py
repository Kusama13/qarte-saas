#!/usr/bin/env python3
"""
Génère les photos de galerie des pages démo Qarte (réalisations par métier).
Imagen 4 (google-genai), photos réalistes sans texte, 1200x1200 JPG.

Usage:
    python3 scripts/generate_demo_photos.py [metier]

metier ∈ barbier, institut, spa, estheticienne, autre (ou rien = tous).
Génère 6 photos par métier dans public/images/demo/<metier>/1.jpg..6.jpg

Prérequis:
    pip install google-genai pillow
    GEMINI_API_KEY dans l'env ou dans .env.local
"""

import os
import sys
from io import BytesIO

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("google-genai non installe. pip install google-genai")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Pillow non installe. pip install pillow")
    sys.exit(1)


def load_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key
    # Fallback .env.local
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GEMINI_API_KEY"):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    print("GEMINI_API_KEY manquante (env ou .env.local).")
    sys.exit(1)


client = genai.Client(api_key=load_api_key())

OUTPUT_ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "images", "demo")
SIZE = 1200

# Style commun : photo pro, lumière douce, sans texte, sans visage en gros plan,
# cohérent avec les galeries existantes (onglerie/coiffure/tatouage).
COMMON = (
    "professional photography, soft natural lighting, high-end aesthetic, "
    "magazine quality, shallow depth of field, no text, no watermark, no logo, "
    "no readable faces, realistic"
)

METIERS = {
    "barbier": [
        "close-up of a barber giving a precise fade haircut with clippers, modern barbershop",
        "traditional hot towel beard shave with straight razor, barbershop chair",
        "stylish men's haircut result, clean fade and styled top, barbershop mirror",
        "barber tools flat lay: clippers, scissors, comb, razor on dark counter",
        "interior of a modern barbershop, leather chairs, vintage industrial decor",
        "beard grooming with scissors and comb, well-groomed beard close-up",
    ],
    "institut": [
        "relaxing facial skincare treatment in a beauty institute, calm spa room",
        "esthetician applying a face mask to a client, soft pastel beauty room",
        "elegant beauty institute interior, treatment bed, plants, warm lighting",
        "skincare products and rolled white towels flat lay, natural beauty",
        "eyebrow shaping and waxing treatment close-up, beauty salon",
        "relaxing back massage in a serene beauty institute, soft towels",
    ],
    "spa": [
        "luxurious spa relaxation pool with warm ambient lighting, steam, stones",
        "hot stone massage on a spa table, candles and towels, serene mood",
        "wooden sauna interior, soft warm light, eucalyptus, wellness",
        "spa flat lay: rolled towels, candles, orchid, massage oils on stone",
        "hammam steam room with mosaic tiles, soft glow, relaxing atmosphere",
        "relaxing aromatherapy massage with essential oils, spa ambiance",
    ],
    "estheticienne": [
        "eyelash extension treatment close-up, esthetician precision work",
        "lash lift and brow tint result, beautiful natural eyes close-up",
        "smooth legs waxing treatment in a beauty studio, professional care",
        "elegant home beauty studio setup, treatment chair, soft pink decor",
        "beauty tools flat lay: tweezers, lash trays, brushes on marble",
        "facial skincare and brow grooming, serene esthetician workspace",
    ],
    "autre": [
        "calm wellness studio for sophrology session, cozy armchairs, plants",
        "foot reflexology treatment close-up, relaxing wellness room",
        "naturopathy consultation desk with herbal remedies and plants, warm light",
        "serene meditation and relaxation space, natural wood, soft daylight",
        "wellness flat lay: herbal teas, plants, candles on wooden table",
        "holistic wellness studio interior, neutral tones, calming atmosphere",
    ],
}


def generate(prompt: str) -> Image.Image:
    resp = client.models.generate_images(
        model="imagen-4.0-generate-001",
        prompt=f"{prompt}, {COMMON}",
        config=types.GenerateImagesConfig(number_of_images=1, aspect_ratio="1:1"),
    )
    img = Image.open(BytesIO(resp.generated_images[0].image.image_bytes)).convert("RGB")
    if img.size != (SIZE, SIZE):
        img = img.resize((SIZE, SIZE), Image.LANCZOS)
    return img


def run(metier: str):
    out_dir = os.path.join(OUTPUT_ROOT, metier)
    os.makedirs(out_dir, exist_ok=True)
    prompts = METIERS[metier]
    print(f"== {metier} ({len(prompts)} photos) ==")
    for i, prompt in enumerate(prompts, start=1):
        out = os.path.join(out_dir, f"{i}.jpg")
        print(f"  [{i}/6] {prompt[:60]}...")
        img = generate(prompt)
        img.save(out, "JPEG", quality=85, optimize=True)
        print(f"        -> {out}")


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None
    if target:
        if target not in METIERS:
            print(f"metier inconnu: {target}. Choix: {', '.join(METIERS)}")
            sys.exit(1)
        run(target)
    else:
        for m in METIERS:
            run(m)
    print("Termine.")


if __name__ == "__main__":
    main()
