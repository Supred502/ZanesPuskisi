# Zanes Maģija — design

Brand chosen by the owner (2026-11): **navy + gold with a dandelion** (a wish → "maģija"), **Pinyon Script** + **Google Sans**.
Day-to-day UI work follows this file; don't re-pick the style. It is *not* the owner's son's dark OLED style.

**Feel:** a calm, slightly magical handmade gift shop. Cream page so colourful product photos stay true; navy header and footer carry the brand.

## Colour (tokens in `app/globals.css`)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FBF8F2` | page (cream) |
| `--surface` | `#FFFFFF` | cards, inputs |
| `--soft` | `#F3EFE6` | quiet sections, chips, image placeholders |
| `--line` | `#E5DFD2` | borders |
| `--ink` | `#1B2236` | text |
| `--ink-soft` | `#5E6577` | secondary text (5.5:1 on cream) |
| `--brand` | `#13254F` | navy: header/footer, primary buttons, prices |
| `--gold` | `#7A5C14` | gold **text** on light backgrounds (5.9:1): eyebrows, highlight word |
| `--gold-bright` | `#D4B062` | gold **on navy only**: logo heart, order button, footer headings (7:1) |
| `--ok` | `#2F6B3F` | "Pieejams" |

Bright gold is never used for text on cream (too low contrast).

## Type

- **Pinyon Script** (owner's pick): the name/logo and big headings only (≥ 30px). Never for product cards, buttons, small headings or anything over a photo.
- **Google Sans**: everything else. Body 16px / 1.6.
- Both via `next/font` with `latin-ext` (ā č ē ģ ī ķ ļ ņ š ū ž).

## Logo

`components/Logo.tsx`: **gold** wordmark in Pinyon Script + SVG dandelion modelled on the owner's concept: gold stalks from a glowing gold heart, a ring of cream feathery tufts, a gold swoosh stem, seeds flying off to the upper right. Tab icon `app/icon.svg`: the same, simplified (navy square, gold stalks, cream seed tips, gold stem).
The owner's logo picture is an AI concept (raster, on a background); replace the hand-drawn dandelion with a proper vector when one exists.

## Shape & components

- Buttons, inputs, tabs, chips, toggles: **rounded squares, 6px corners, thin 1px border — never pills.**
- Cards and photos: 12px corners, 1px `--line` border.
- Product photos 4:5 portrait, `object-cover`, soft placeholder while loading (no layout shift).
- Icons: lucide-react (no emoji). Icon-only buttons have `aria-label`.
- Motion: subtle (150–250 ms), off under `prefers-reduced-motion`.

## Layout

- Max width 1200px, 16px side gutter on phones, no horizontal scroll.
- Home: hero (photos first on phones) → available now → how to order (3 steps) → past works by category → about teaser.
- Product page: gallery left, details + WhatsApp order button right (stacked on phones, sticky order bar at the bottom).
