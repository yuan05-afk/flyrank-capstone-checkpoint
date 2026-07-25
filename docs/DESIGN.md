# Design system - Checkpoint (Clear Signal)

Modern product UI for an embeddable lead-capture platform. Light, animated, and brand-consistent across marketing and the authenticated dashboard.

## Palette

| Token | Hex | Role |
|-------|-----|------|
| Canvas | `#F4F7FB` | Page shell (cool mist, not cream) |
| Surface | `#FFFFFF` | Panels / forms |
| Ink | `#0C1222` | Primary text |
| Muted | `#5B6578` | Secondary text |
| Line | `#E2E8F2` | Borders / dividers |
| Signal | `#0F766E` | Brand + primary actions (deep teal) |
| Signal bright | `#14B8A6` | Hover / highlights |
| Fog | `#E8F5F3` | Soft teal wash / chips |
| OK | `#15803D` | Accepted (functional) |
| Warn | `#B45309` | Flagged (functional) |
| Danger | `#DC2626` | Rejected / rate-limited (functional) |

No purple gradients, no brass/gold, no near-black shells, no terracotta/cream paper pairings.

## Typography

- **Brand / display:** Sora - geometric, confident headlines.
- **UI / body:** Figtree - readable modern sans.
- **Code / micro-labels only:** IBM Plex Mono for embed snippets, IDs, and uppercase section chips - never as the page voice.

Avoid Inter, Roboto, Arial, Geist, Special Elite, and all-typewriter layouts.

## Brand mark

Teal rounded square with **white embed brackets** `<>` and a **bright teal check** between them - "embeddable" + "checkpoint" in one glyph. `BrandMark.tsx` and `public/favicon.svg` must stay identical. No nested boxes, no generic lone check.

## Copy

No em dashes (`—`) or en dashes (`–`). Use hyphens, commas, or periods.

## Chrome

- Soft 12-16px radii, quiet 1px borders, soft elevation shadows.
- Section intro badges + live signal dots shared by landing and dashboard.
- Status as compact **pills** (not rotated ink stamps).

## Motion (required presence)

Landing and dashboard should both feel alive - same stack as CheckMyDevice:

0. **Lenis** smooth scrolling on marketing pages (`duration: 1.6`, respect reduced motion; brand click → `scrollTo(0)`).
1. Entrance: blur/fade or rise-in for headlines and section blocks (`whileInView`, `once: true`).
2. Stagger: cards, trust tiles, and ledger rows cascade in.
3. Continuous: signal-status pulse, hero orbs, scrolling intake trace (marketing), geo ping rings (dashboard).
4. Interaction (required on landing): every feature, step, and trust/guarantee card responds to hover **and** focus (teal wash, border tint, icon/title color shift, slight lift) like CheckMyDevice privacy items. Buttons and nav links included. Do not ship static decorative grids.
5. Always honor `prefers-reduced-motion`.

Do **not** leave sections stuck at partial opacity from scroll-linked transforms - prefer discrete enter animations that settle at full opacity.

## Hero art

Marketing heroes include a real product illustration (`public/<product>-hero-light.png`) with **visible left and right** art and a **center text safe zone**. Prefer dual radial masks plus optional L/R side panels so the composition never reads as left-only. Side opacity ~0.75-0.95; wash the center harder than the flanks. No gradient-only heroes.

## Capstones template

Shared skill: `Capstones/.cursor/skills/capstone-signal-design` (also mirrored to personal `~/.cursor/skills/capstone-signal-design`). Use it for every Capstones project and every one-shot landing prompt.

## Self-check

Would a stranger recognize this as the same Checkpoint product on the home page and inside the dashboard - light teal brand, animated, presentable - without looking like a dark customs demo or a purple glass template? If not, revise.
