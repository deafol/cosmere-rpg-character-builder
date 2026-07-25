# Cosmere RPG Character Builder

A modern, interactive web-based character builder for the **Cosmere Roleplaying Game**. This tool allows players to easily create, manage, and export characters for their adventures in the Cosmere.

## Features

- **Interactive Character Sheet**: Real-time updates for attributes, defenses, and resources (Health, Focus, Investiture).
- **Path Support**: Full support for **Heroic Paths** (Agent, Leader, Hunter, etc.) and **Radiant Paths** (Windrunner, Skybreaker, etc.).
- **Automatic Calculations**:
  - Derived stats (Defenses, Movement, Senses, Recovery Die, Lifting/Carrying capacity) calculated automatically from attributes.
  - **Surge Skills**: Auto-added/removed based on the selected Radiant Path.
  - **Surge Stats**: Modifier, die size (d4–d12), and area size computed from skill rank + attribute.
- **Talent Management**: Automatic Key Talent selection from chosen paths; prerequisite display; Heroic and Radiant talent databases.
- **Equipment & Inventory**: Weapons, armor, general equipment, and custom items.
- **Save & Load**: Compact v2 JSON format (ID-based) for small file sizes; backward-compatible with legacy full-format saves.
- **PDF Export**: Generates a print-ready character sheet using a custom PDF template and CosmereFont for activation icons. Includes a Surge sheet for Radiants.

## Tech Stack

| Concern | Library / Tool |
|---|---|
| Framework | Next.js 16 (React 19) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| PDF Generation | pdf-lib + @pdf-lib/fontkit |
| Testing | Vitest |
| Linting | ESLint + Husky (lint-staged) |

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd web-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, Umami analytics)
│   ├── page.tsx                # Entry point — wraps CharacterProvider + BuilderLayout
│   └── maintenance/page.tsx    # Maintenance mode page
├── components/
│   ├── BuilderLayout.tsx       # Header (New/Load/Save/Export) + CharacterForm
│   ├── forms/CharacterForm.tsx # 5 collapsible panels (see Architecture)
│   └── ui/                     # Shared primitives: Input, Select, NumberControl, Modal…
├── context/
│   └── CharacterContext.tsx    # Global CharacterData state + all derived-stat logic
├── data/                       # Game data (JSON, bundled at build time)
│   ├── ancestries.json
│   ├── heroic_paths.json / radiant_paths.json
│   ├── heroic_talents.json / radiant_talents.json
│   ├── skills.json / surges.json
│   └── weapons.json / armor.json / equipment.json / expertises.json
├── proxy.ts                    # Next.js middleware — maintenance-mode redirect
├── types/character.ts          # CharacterData interface + initialCharacterData
└── utils/
    ├── pdfExport.ts            # PDF generation (fetch template + embed font + fill fields)
    └── characterSerializer.ts  # Compact v2 save/load format

public/
├── character-sheet-template.pdf
├── fonts/CosmereFont.ttf
└── icons/                      # Ancestry, attribute, and path icons

server/
└── docker-compose.yml          # Production stack (app, cloudflared, umami, netdata, watchtower)

docs/specs/
└── architecture.md             # System, component, state, and domain diagrams
```

## Architecture

The app is a fully client-side SPA — no API routes, no database. All game data is bundled as JSON at build time. State is managed by a single React Context (`CharacterContext`) that holds `CharacterData` and exposes typed updater functions. Derived stats (defenses, movement, surge skills, etc.) are recalculated synchronously inside the context on every relevant update.

See **[docs/specs/architecture.md](docs/specs/architecture.md)** for Mermaid diagrams covering the system architecture, component hierarchy, state/data flow, and domain model.

## Deployment

Production runs as a Docker container on a Raspberry Pi 5, exposed via Cloudflare Tunnel. Watchtower auto-pulls updated images from GHCR. Analytics are provided by a self-hosted Umami instance.

See `server/docker-compose.yml` for the full stack definition.

## License & Disclaimer

**Software License**: The source code is licensed under the [MIT License](LICENSE).

**Fan Content Policy Disclaimer**:
> This is unofficial fan content, created and shared for non-commercial use. It has not been reviewed by Dragonsteel Entertainment, LLC or Brotherwise Games, LLC.

This project is a fan-made tool designed for use with the **Cosmere Roleplaying Game**. It is not affiliated with, endorsed by, or sponsored by Brotherwise Games or Dragonsteel Entertainment. The Cosmere concepts, terms, and setting are copyright of their respective owners.
