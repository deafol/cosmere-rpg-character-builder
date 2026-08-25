# Consent Document — Campaign-Based Re-Architecture

> **Status: DRAFT — awaiting mutual agreement. No code changes until approved.**
> This file is a working document (not to be committed). Once agreed, the flow per
> project convention is: `/to-prd` → `mermaid-spec` (update `docs/specs/architecture.md`) → implement.

## 1. Why

Most bundled game content (talents, paths, surges, expertises, weapons, armor,
equipment) is copyright-protected text. The character-sheet *structure* and
game-mechanical *calculations* are not. The app must therefore ship **structure
without content**: all protected content becomes user-entered data, owned by a
new top-level **Campaign** entity.

## 2. Decisions made (grilling session 2026-08-08)

| # | Topic | Decision |
|---|-------|----------|
| 1 | App model | **Strictly campaign-first.** No implicit default campaign; user must create/load a campaign before any character work. |
| 2 | Bundled data | **Delete the dynamic-domain JSON files from the repo entirely.** App ships with empty campaign stores. |
| 3 | Ancestries | **Hybrid:** bundled list keeps `id` + `name` only; descriptions and innate-ability text are stripped and become per-campaign editable content. |
| 4 | Automation | **Preserve via UUID links.** Path→surge and path→key-talent relations are modeled in the campaign schema so surge-skill auto-add and key-talent auto-select keep working. |
| 5 | Persistence | **localStorage (multi-campaign, picker on launch) + readable JSON file export/import.** |
| 6 | Character export | **UUID refs + embedded snapshots** of referenced entities (v3 readable format). Portable across campaigns; re-import offers to add embedded entities to the target campaign's stores. |
| 7 | Legacy saves | **Standalone one-time converter script** (run locally, not bundled) converts compact v1/v2 saves using the current data *before* deletion. The app itself only speaks the new formats. |
| 8 | UI | **Multi-route app:** `/` campaign picker · `/campaign/[id]` dashboard · `/campaign/[id]/settings` tabbed domain editors · `/campaign/[id]/character/[charId]` character form. Still fully client-side. |
| 9 | Schema | **Unified Path entity** (`kind: 'heroic' \| 'radiant'`) + **one flat Talent store** (talents reference `pathId` + optional `specialty`). |
| 10 | Sharing | **Merge-on-import:** same campaign UUID → data-store entities upserted by UUID (incoming wins), local characters preserved, incoming characters upserted by their UUID. Export can exclude characters. |
| 11 | Expertises | Entity with `category`; **fixed trio (cultural/utility/weapon) plus user-defined categories**. Sheet renders all expertises as a flat name list. |
| 12 | Custom items | **Auto-add to campaign store:** "create new…" in character pickers creates the entity (with UUID) in the campaign store and references it. No inline one-off objects in the schema. |
| 13 | Private data | Converter input (old JSON) and output (example campaign incl. copyrighted text) live **outside the repo** (`~/Downloads/Cosmere/`). |
| 14 | Git history | **Decide later.** Files deleted going forward; the full `git filter-repo` purge procedure is documented in Appendix A for a later call. |

## 3. Data classification

| Stays static (bundled / code) | Becomes campaign data (user-entered) |
|---|---|
| Skills (`skills.json`: name + attribute mapping) | Talents |
| Ancestry **names** (`ancestries.json`, stripped) | Ancestry content (description, innate abilities) |
| All derived-stat logic (defenses, movement, senses, recovery die, lifting/carrying, surge stat computation) | Surges (name, attribute, activation, description) |
| `CharacterData` structure & `CharacterContext` (unchanged shape; item lists start empty) | Paths (heroic + radiant, incl. specialties, ideals, links) |
| Character-sheet structure, panels, PDF export | Expertises (+ custom categories) |
| Fixed expertise categories (cultural/utility/weapon) | Weapons, Armor, Equipment |

## 4. Target schema (readable JSON, all IDs are UUIDv4)

```ts
interface Campaign {
    schemaVersion: 1;
    id: UUID;
    name: string;
    description?: string;
    createdAt: string;          // ISO
    updatedAt: string;          // ISO
    data: CampaignData;
    characters: CharacterSaveV3[];
}

interface CampaignData {
    paths: Path[];
    talents: Talent[];
    surges: Surge[];
    expertises: Expertise[];
    expertiseCategories: string[];   // user-defined, in addition to fixed trio
    weapons: Weapon[];               // current shape + id: UUID
    armor: Armor[];                  //   "
    equipment: EquipmentItem[];      //   "
    ancestryContent: AncestryContent[];
}

interface Path {
    id: UUID;
    kind: 'heroic' | 'radiant';
    name: string;
    description: string;
    specialties: string[];
    keyTalentId?: UUID;         // drives key-talent auto-select
    surgeIds?: UUID[];          // radiant only; drives surge-skill auto-add
    ideals?: string[];          // radiant only
}

interface Talent {
    id: UUID;
    pathId: UUID;
    specialty?: string;
    name: string;
    description: string;
    prerequisite: string;       // free text ("Deduction 1+", "First Ideal; Level 4+")
    activation: string;         // free text / symbol
    isKeyTalent: boolean;
}

interface Surge {
    id: UUID;
    name: string;
    attribute: string;          // must match a static attribute; stat calc stays in code
    activation: string[];
    description: string;
}

interface Expertise {
    id: UUID;
    name: string;
    category: string;           // 'cultural' | 'utility' | 'weapon' | any custom category
    description?: string;
}

interface AncestryContent {
    ancestryId: string;         // references static ancestries.json id (e.g. "anc_human")
    description: string;
    innateAbilities: string[];
}
```

### Character save v3 (inside campaign + standalone export)

```ts
interface CharacterSaveV3 {
    v: 3;
    id: UUID;                   // character's own UUID (merge key)
    campaignId: UUID;
    // sheet fields as readable keys (no more compact abbreviations):
    // playerName, characterName, level, attributes, skillRanks (by static skill id),
    // defenses, resources, marks, radiantIdeal, sprenName, bondRange,
    // purpose/obstacle/goals/notes/connections/conditions/appearance …
    ancestryId: string | null;
    pathIds: UUID[];
    talentIds: UUID[];
    expertiseIds: UUID[];
    weaponIds: UUID[];
    armorIds: UUID[];
    equipmentIds: UUID[];       // duplicates allowed (2× food ration)
    otherTalents: string[];     // stays free text
    // standalone export only:
    embedded?: Partial<CampaignData>;  // snapshot of every referenced entity
}
```

In-memory `CharacterData` keeps its current resolved-object shape; a
campaign-aware serializer maps refs ⇄ objects (replacing `characterSerializer.ts`
v1/v2 logic, which is removed along with the converter decision in §2.7).

## 5. Architecture diagrams

**Final diagrams now live in
[`docs/specs/architecture.md`](docs/specs/architecture.md)** (updated via
the `mermaid-spec` skill on 2026-08-08): System Architecture, Component
Hierarchy, State & Data Flow, and Domain Model, all revised for the
campaign-based structure described in this document. That file is marked
**target architecture, not yet implemented** until the phases in §6 land.

## 6. Implementation phases (each a small, reviewable step on a feature branch)

1. **Specs first**: `/to-prd` from this document; update `docs/specs/architecture.md` diagrams (`mermaid-spec`).
2. **Types & schema**: `Campaign`/`CampaignData`/entity types, UUID util, schema version constant. Strip `ancestries.json` to id+name; keep `skills.json`.
3. **CampaignContext + persistence**: localStorage index, autosave, campaign CRUD, export/import with merge-on-import. Vitest coverage for merge semantics.
4. **Routing**: restructure `src/app/` into the four routes; campaign picker UI.
5. **Domain editors**: tabbed settings page; one generic CRUD editor pattern parameterized per domain (talent editor exposes name/description/prerequisite/activation/path/specialty/isKeyTalent, etc.).
6. **Character form re-wire**: pickers read campaign stores; "create new…" auto-add; surge-skill and key-talent automation resolve via UUID links; delete old bundled-data imports.
7. **Serialization v3**: character export/import with embedded snapshots; remove v1/v2 serializer paths from the app.
8. **Converter (outside app)**: script reading old `src/data/*.json` + compact v1/v2 saves from `~/Downloads/Cosmere/`, emitting a v1-schema campaign file. Generate **example campaign incl. Robar Milán** → `~/Downloads/Cosmere/Example Campaign.json`. Run and verify **before** step 9.
9. **Purge**: delete dynamic-domain JSON from `src/data/`; verify build contains no protected strings; update CHANGELOG + CLAUDE.md.

## 7. Explicitly out of scope / unchanged

- PDF export (`pdfExport.ts`) — unchanged; still fills the same sheet fields.
- Derived-stat formulas — unchanged, stay in `CharacterContext`.
- Deployment stack, maintenance proxy, analytics — untouched.
- No backend/sync; sharing stays file-based.
- Free-text fields (purpose, obstacle, goals, notes, connections, conditions, otherTalents) — unchanged.

## 8. Open points — confirmed 2026-08-08

1. **v3 verbosity**: confirmed. v3 drops the compact abbreviations for readability; campaign files will be larger.
2. **Skill list & surges**: confirmed. Character's surge skills are *derived at render time* from linked campaign surges rather than stored in `skills[]`.
3. **Robar's cross-path talents**: confirmed. Converter creates the Champion/Officer paths in the example campaign so those talents have a valid `pathId`, even though Robar hasn't taken the paths themselves.
4. **`radiantPath` field**: confirmed. Dropped as a stored string; derived from `pathIds` (the path with `kind: 'radiant'`). `radiantIdeal` (progress counter) remains a stored field.

## 9. Status

**All decisions confirmed by user on 2026-08-08. Plan approved — ready for implementation starting at §6 Phase 1.**

## Appendix A — Git history purge (deferred decision)

When/if you decide to purge:

1. Fresh backup clone + tag current `main`.
2. `git filter-repo --invert-paths --path src/data/heroic_talents.json --path src/data/radiant_talents.json --path src/data/heroic_paths.json --path src/data/radiant_paths.json --path src/data/surges.json --path src/data/weapons.json --path src/data/armor.json --path src/data/equipment.json --path src/data/expertises.json` (plus any historical earlier paths of the same content — to be discovered with `git log --all --diff-filter=A --name-only`).
3. Force-push; re-clone all working copies; GHCR images built from old commits remain — consider deleting old image tags too.
4. Note: `ancestries.json` history also contains the prose being stripped — include it in the purge list if the goal is completeness.
