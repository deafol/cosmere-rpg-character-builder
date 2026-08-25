# Changelog

All notable changes to the Cosmere RPG Character Builder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Campaign-based re-architecture (see `consent.md` for the full design rationale, git history) — the app now ships with **no copyrighted Cosmere RPG game content bundled**. All talents, paths, surges, expertises, weapons, armor, and equipment are entered per campaign by each table and stored locally, not shipped with the app.

### Added
- Campaign as a new top-level entity: create, load, close, delete, export, and merge-on-import, persisted to `localStorage`
- Multi-route UI: campaign picker (`/`), campaign dashboard, tabbed domain-editor settings page, and a character editor nested under its campaign
- Generic CRUD editor for every campaign domain (paths, talents, surges, expertises, weapons, armor, equipment, ancestry content), including radiant-only conditional fields and delete-reference warnings
- Character save format v3 (`CharacterSaveV3`): UUID references into campaign data instead of bundled-content copies; characters now autosave into their campaign as you edit, with no separate "unsaved changes" tracking
- Standalone character export/import as a portable file with an embedded snapshot of every entity it references, mergeable into any campaign
- Delete Character action on the campaign dashboard
- One-time, unbundled converter script (`scripts/convert-legacy-character.mjs`) for migrating old compact v1/v2 character saves into a campaign file

### Changed
- Character form pickers (paths, talents, expertises, weapons, armor, equipment) now read from the active campaign instead of bundled JSON, grouped dynamically by whatever the table has actually entered
- Key-talent auto-select and surge-skill auto-add now resolve via campaign UUID links (`Path.keyTalentId`, `Path.surgeIds`) instead of bundled-data name matching
- Typing a custom expertise or equipment item now creates a real, reusable entity in the campaign store instead of a one-off object on the character
- PDF export now resolves talent/surge display text from the active campaign

### Removed
- Bundled dynamic-domain game data (`heroic_paths.json`, `radiant_paths.json`, `heroic_talents.json`, `radiant_talents.json`, `surges.json`, `weapons.json`, `armor.json`, `equipment.json`, `expertises.json`) — verified absent from the production build
- The compact v1/v2 character save format and its bundled-data-dependent serializer/deserializer

---

## [1.0.5] - 2026-02-25

### Added
- Linting check on commit

---

## [1.0.4] - 2026-02-25

### Added
- Maintenance mode toggle via environment variable
- High-aesthetic themed maintenance page (/maintenance)


---

## [1.0.3] - 2026-01-30

### Fixed
- Static rendering of analytics script

---

## [1.0.2] - 2026-01-30

### Fixed
- Analytics

---

## [1.0.1] - 2026-01-30

### Added
- basic analytics tracking via Umami
- display app version in footer

### Fixed
- refined release process

---

## [1.0.0] - 2026-01-26

### Added
- Initial release of the Cosmere RPG Character Builder
- Character creation with full attribute system (Strength, Speed, Intellect, Willpower, Awareness, Presence)
- Support for all Ancestries from the Stormlight Handbook
- Heroic Paths selection and talent management
- Radiant Paths with Order-specific abilities and Ideals
- Complete skill system with ranks and expertise
- Equipment management (Weapons, Armor, Items)
- Goals and Purpose/Obstacle character motivation system
- PDF character sheet export with official template styling
- Responsive web interface with dark theme
- Local storage for character persistence

### Infrastructure
- Docker containerization with multi-stage builds
- GitHub Actions CI/CD pipeline
- Semantic versioning and automated releases
- Production-ready deployment configuration

---

## Version Guidelines

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** (1.x.x → 2.0.0): Breaking changes, major UI overhauls, data format changes
- **MINOR** (1.0.x → 1.1.0): New features, new ancestries/paths/talents, enhancements
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, typo corrections, minor UI tweaks

### Changelog Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Features to be removed in future versions
- **Removed**: Features removed in this version
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
