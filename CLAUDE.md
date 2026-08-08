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

Pure client-side Next.js 16 / React 19 SPA. No backend, no API routes, no database. **No copyrighted Cosmere RPG game content (talents, paths, surges, expertises, weapons, armor, equipment) is bundled at build time** — it's user-entered per **Campaign** and lives in `localStorage`, exchanged as readable JSON. Only mechanical/structural data stays bundled: `skills.json` (name + attribute mapping) and `ancestries.json` (stripped to `id` + `name`, no prose). See `docs/specs/architecture.md` for full diagrams and `consent.md` for the re-architecture's design rationale (git history).

The app is strictly campaign-first: there's no character screen outside a loaded campaign.

### Routes

| Route | Component | Notes |
|---|---|---|
| `/` | `CampaignPicker` | List/create/import campaigns |
| `/campaign/[id]` | `CampaignDashboard` | Campaign meta, character roster, export/import |
| `/campaign/[id]/settings` | `CampaignSettings` | Tabbed CRUD editors for all 8 domain entity types |
| `/campaign/[id]/character/[charId]` | `CampaignCharacterPage` → `BuilderLayout` | `charId: "new"` eagerly creates + redirects, mirroring campaign creation |

### Key layers

| Layer | Path | Notes |
|---|---|---|
| Middleware | `src/proxy.ts` | Maintenance-mode redirect via env var |
| Campaign state | `src/context/CampaignContext.tsx` | Single `Campaign` object (data stores + characters); autosaves to localStorage on every change |
| Character state | `src/context/CharacterContext.tsx` | Single `CharacterData` object (resolved-object shape, unchanged since before the campaign rewrite); all derived-stat logic lives here; no campaign awareness by design |
| Types | `src/types/campaign.ts`, `src/types/character.ts` | `Campaign`/`CampaignData`/`CharacterSaveV3` (UUID-ref storage shape) vs `CharacterData` (resolved-object editing shape) |
| Domain editors | `src/components/settings/EntityEditor.tsx` | One generic CRUD component parameterized per domain via `entityFieldConfigs.ts` |
| Character form | `src/components/forms/CharacterForm.tsx` | 5 collapsible panels; all pickers read the active campaign's data via `useCampaign()` |
| Campaign ⇄ Character sync | `src/hooks/useCharacterCampaignSync.ts` | Loads/creates a character from `campaign.characters`, autosaves every edit |
| UI Primitives | `src/components/ui/` | Label, Input, Select, NumberControl, CollapsiblePanel, Modal (supports arbitrary form content) |
| PDF Export | `src/utils/pdfExport.ts` | Fetches PDF template + font, fills AcroForm fields; takes `CampaignData` to resolve talent/surge display text |
| Serialization | `src/utils/campaignSerializer.ts`, `src/utils/characterCampaignSerializer.ts` | Campaign file export/import (merge-on-import, upsert by UUID) and `CharacterData` ⇄ `CharacterSaveV3` conversion (embedded-snapshot standalone character export/import) |
| Static data | `src/data/*.json` | Only `skills.json` and `ancestries.json` (id+name) |
| Public Assets | `public/` | `character-sheet-template.pdf`, `fonts/CosmereFont.ttf`, path/attribute icons |
| Converter | `scripts/convert-legacy-character.mjs` | One-time, unbundled: migrates old compact v1/v2 saves into a Campaign file. Not run by any npm script. |

### Derived-stat rules (in CharacterContext)

- **Defenses** = 10 + attribute pair (Physical: STR+SPD, Cognitive: INT+WIL, Spiritual: AWA+PRE)
- **Movement** derived from Speed; **Senses Range** from Awareness; **Recovery Die** from Willpower; **Lifting/Carrying** from Strength
- Selecting a Radiant Path → surge skills auto-added to the skill list, sourced from the active campaign's `Path.surgeIds` (CharacterForm `useEffect`, not CharacterContext)
- Key Talents auto-selected whenever `data.paths` changes, resolved via the active campaign's `Path.keyTalentId` (CharacterForm `useEffect`)
- Surge stats (modifier, die d4–d12, size S–G) computed from skill rank + attribute value

### CharacterForm panels (in order)

1. **General Characteristics** — name, level, ancestry (static), heroic path (multi, from campaign), radiant path (single, from campaign), radiant ideal, spren, bond range
2. **Attributes, Skills & Resources** — 3-column attribute/skill grid + resource controls
3. **Expertises & Talents** — expertise picker (grouped by campaign category) + custom (auto-adds to campaign store); talent list with auto key talents
4. **Weapons, Armor & Equipment** — item dropdowns (grouped by campaign category) + custom equipment (auto-adds to campaign store) + Marks
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
