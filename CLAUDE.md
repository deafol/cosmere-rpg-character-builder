# Cosmere RPG Character Builder

## What this is

A modern, interactive web-based character builder for the **Cosmere Roleplaying Game**. This tool allows players to easily create, manage, and export characters for their adventures in the Cosmere.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Test: `npm run test`
- Lint / typecheck: `npm run lint`
- Build: `npm run build`

## Architecture

Pure client-side Next.js 16 / React 19 SPA. No backend, no API routes, no database — all game data is bundled as JSON at build time.

### Key layers

| Layer | Path | Notes |
|---|---|---|
| Pages | `src/app/` | `page.tsx` (main), `maintenance/page.tsx` |
| Middleware | `src/proxy.ts` | Maintenance-mode redirect via env var |
| Layout | `src/components/BuilderLayout.tsx` | Header actions + form container |
| Form | `src/components/forms/CharacterForm.tsx` | 5 collapsible panels |
| UI Primitives | `src/components/ui/` | Label, Input, Select, NumberControl, CollapsiblePanel, Modal |
| State | `src/context/CharacterContext.tsx` | Single `CharacterData` object; all derived-stat logic lives here |
| Types | `src/types/character.ts` | `CharacterData` interface + `initialCharacterData` |
| PDF Export | `src/utils/pdfExport.ts` | Fetches PDF template + font, fills AcroForm fields |
| Save/Load | `src/utils/characterSerializer.ts` | Compact v2 JSON format (ID-based) |
| Game Data | `src/data/*.json` | ancestries, heroic/radiant paths & talents, skills, surges, weapons, armor, equipment, expertises |
| Public Assets | `public/` | `character-sheet-template.pdf`, `fonts/CosmereFont.ttf`, path/attribute icons |

### Derived-stat rules (in CharacterContext)

- **Defenses** = 10 + attribute pair (Physical: STR+SPD, Cognitive: INT+WIL, Spiritual: AWA+PRE)
- **Movement** derived from Speed; **Senses Range** from Awareness; **Recovery Die** from Willpower; **Lifting/Carrying** from Strength
- Selecting a Radiant Path → surge skills auto-added to the skill list (via `surges.json` `radiant_paths` mapping)
- Key Talents auto-selected whenever `data.paths` changes (CharacterForm `useEffect`)
- Surge stats (modifier, die d4–d12, size S–G) computed from skill rank + attribute value

### CharacterForm panels (in order)

1. **General Characteristics** — name, level, ancestry, heroic path (multi), radiant path (single), radiant ideal, spren, bond range
2. **Attributes, Skills & Resources** — 3-column attribute/skill grid + resource controls
3. **Expertises & Talents** — expertise picker + custom; talent list with auto key talents
4. **Weapons, Armor & Equipment** — item dropdowns + custom equipment + Marks
5. **Character Details** — purpose, obstacle, goals (progress dots), connections, notes, conditions

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **PDF Generation**: pdf-lib + @pdf-lib/fontkit
- **Testing**: Vitest
- **Linting**: ESLint + lint-staged (Husky pre-commit)

## Deployment

Docker container on Raspberry Pi 5 behind a Cloudflare Tunnel. See `server/docker-compose.yml` for the full stack (app, cloudflared, watchtower, umami analytics, netdata).

## Specs

- Diagrams: `docs/specs/architecture.md`
- Run `/grill-me` → `/to-prd` → `mermaid-spec` before implementing anything non-trivial.
