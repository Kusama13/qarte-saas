#!/usr/bin/env python3
"""
Ask Gemini to generate the exact React/Tailwind card composition for the hero section,
using the Bookin Beautiful reference image as visual inspiration.

Usage:
  python3 scripts/gemini_hero_cards.py <path_to_reference_image>

Example:
  python3 scripts/gemini_hero_cards.py ~/Downloads/bookin.png
"""

import sys
import os
from pathlib import Path
from google import genai
from google.genai import types

API_KEY = os.environ.get('GEMINI_API_KEY')
if not API_KEY:
    print("Error: GEMINI_API_KEY env var not set. Add it to .env.local.")
    sys.exit(1)
client = genai.Client(api_key=API_KEY)

def load_image(path: str) -> types.Part:
    p = Path(path).expanduser()
    if not p.exists():
        raise FileNotFoundError(f"Image not found: {p}")
    suffix = p.suffix.lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}.get(suffix.lstrip("."), "image/png")
    return types.Part.from_bytes(data=p.read_bytes(), mime_type=mime)

PROMPT = """
You are an expert frontend designer who writes pixel-perfect React + Tailwind CSS code.

I'm building a hero section for a beauty SaaS app called Qarte (France). The hero has:
- A centered person image (transparent background PNG) that takes ~60% of the composition width
- 3 floating UI cards around the person (like in the reference image above)
- The person is in front of the cards (z-index layering)

Look at the reference image carefully. I want you to recreate a SIMILAR composition (same spatial layout, same card placement, same depth effect) but with DIFFERENT card content:

LEFT CARD content (replace the calendar):
- Title: "Rendez-vous du jour"
- Badge: "2 rdv" (emerald color)
- 2 appointment rows, each with:
  - Colored vertical bar on the left (like a time slot indicator)
  - Service name bold (e.g. "Coupe + Brushing", "Balayage complet")
  - Time + client name below (e.g. "14h30 · Sophie M.")

RIGHT CARD content (replace the revenue chart):
- Title: "Fidélité"
- Badge: "7/10" (rose color)
- Grid of 10 stamp circles (7 filled in rose/pink gradient, 3 empty gray)
- Progress bar at 70% (rose gradient)
- Text: "Encore 3 pour une récompense"

TOP CENTER CARD (keep similar to reference):
- Green checkmark circle
- "SMS de rappel envoyé" (bold)
- "Le rdv de Lisa est confirmé" (gray subtitle)
- X close icon on the right

CONSTRAINTS:
- Use only Tailwind CSS classes (no custom CSS except inline style for width/height/transform)
- The outer container: `<div className="relative" style={{ width: 580, height: 620 }}>`
- Person image: `<Image src="/images/hero-person-4-crop.png" width={648} height={1160} className="h-full w-auto object-contain object-bottom" priority />`
  - Wrapped in: `<div className="absolute bottom-0 z-20" style={{ left: '50%', transform: 'translateX(-50%)', height: '108%' }}>`
- Left card: `absolute left-0 z-10`
- Right card: `absolute right-0 z-10`
- SMS card: `absolute top-0 z-30`
- Cards z-10, person z-20, SMS z-30
- Background: white cards with border-gray-100 and shadow-2xl
- No emojis
- Import Heart and Check and X from lucide-react (already imported)

IMPORTANT: Output ONLY the complete React component function `HeroPersonMockup` with the const `RDV_LIST` above it. No imports, no explanations, no markdown fences. Start with `const RDV_LIST` and end with the closing `}` of the function.

Match the spatial proportions from the reference as closely as possible:
- How far down from the top are the side cards?
- How wide are they?
- How much do they overlap behind the person?
- What is the exact top offset of the SMS card?
"""

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/gemini_hero_cards.py <path_to_reference_image>")
        sys.exit(1)

    ref_path = sys.argv[1]
    print(f"Loading reference image: {ref_path}")
    ref_image = load_image(ref_path)

    print("Sending to Gemini gemini-2.5-pro...")
    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=[ref_image, PROMPT],
    )

    code = response.text.strip()

    # Write output
    out_path = Path(__file__).parent / "gemini_hero_output.tsx"
    out_path.write_text(code)
    print(f"\n--- OUTPUT ---\n{code}\n")
    print(f"\nSaved to: {out_path}")

if __name__ == "__main__":
    main()
