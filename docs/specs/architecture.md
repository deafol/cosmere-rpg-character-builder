# Cosmere RPG Character Builder — Architecture Diagrams

> **Status: TARGET ARCHITECTURE — not yet implemented.**
> These diagrams describe the campaign-based re-architecture approved in
> [`../../consent.md`](../../consent.md) (2026-08-08), which serves as the
> PRD for this change. They replace the as-built diagrams from the
> 2026-07-25 scan (see changelog at the bottom for what changed and why).
> Until the phases in `consent.md` §6 are implemented, the *actual* running
> app still matches the single-character, single-page shape these diagrams
> describe as superseded.

---

## 1. System Architecture

*How the browser, app, static assets, and deployment infrastructure relate.*

No copyrighted game content (talents, paths, surges, expertises, weapons,
armor, equipment) is bundled at build time anymore — it lives in
user-created **Campaign** files, held in `localStorage` and exchanged as
readable JSON. Only mechanical/structural data (`skills.json`, and
`ancestries.json` stripped to `id` + `name`) stays bundled.

```mermaid
flowchart TB
    subgraph Browser["Browser (Client)"]
        UI["Next.js React App\n(fully client-side after hydration)"]
        LS[("localStorage\ncampaign index + per-campaign data")]
    end

    subgraph Deployment["Raspberry Pi 5 — Docker Compose"]
        CF["cloudflared\n(Cloudflare Tunnel)"]
        APP["character-builder\n(Next.js :3000)"]
        UMAMI["umami\n(analytics :3001)"]
        DB["umami-db\n(PostgreSQL 15)"]
        WT["watchtower\n(auto-updates)"]
        ND["netdata\n(monitoring :19999)"]
    end

    subgraph Static["Bundled at Build Time (no copyrighted content)"]
        JSON["src/data/*.json\n(skills; ancestry id+name only)"]
        TMPL["public/character-sheet-template.pdf"]
        FONT["public/fonts/CosmereFont.ttf"]
    end

    GHCR["GHCR\n(Container Registry)"]
    CFCloud["Cloudflare\n(Edge / DNS)"]

    User((Player / GM)) -->|HTTPS| CFCloud
    CFCloud --> CF
    CF --> APP
    APP --> UI
    UI -->|reads bundled data| JSON
    UI <-->|"autosave / load campaign"| LS
    UI -->|"export / import campaign or character"| FILE[/"Readable JSON files\n(user's disk)"/]
    UI -->|fetches at PDF export| TMPL
    UI -->|fetches at PDF export| FONT
    WT -->|polls every 5 min| GHCR
    WT -->|restarts updated| APP
    UI -->|page-view events| UMAMI
    UMAMI --> DB
```

---

## 2. Component Hierarchy

*React component tree showing ownership and data flow. The app is now
strictly campaign-first and multi-route (`consent.md` §8 UI decision);
no character screen exists outside a loaded campaign.*

```mermaid
flowchart TD
    Layout["app/layout.tsx\n(fonts + Umami script)"]
    R1["/ \n(Campaign Picker)"]
    R2["/campaign/[id]\n(Campaign Dashboard)"]
    R3["/campaign/[id]/settings\n(Domain Editors, tabbed)"]
    R4["/campaign/[id]/character/[charId]\n(Character Form)"]
    CProvider["CampaignProvider\n(CampaignContext)"]
    ChProvider["CharacterProvider\n(CharacterContext, unchanged shape)"]
    Editors["Domain Editors\n(Path · Talent · Surge · Expertise\nWeapon · Armor · Equipment · AncestryContent)"]
    CharApp["BuilderLayout + CharacterForm\n(5 panels, unchanged internally)"]
    PDFUtil["pdfExport.ts"]
    Serializer["campaignSerializer.ts\n+ characterSerializer.ts (v3)"]

    Layout --> R1 & R2 & R3 & R4
    R1 & R2 & R3 --> CProvider
    R4 --> CProvider
    R4 --> ChProvider
    R3 --> Editors
    ChProvider --> CharApp
    CProvider -->|"CampaignData + CRUD"| Editors
    CProvider -->|"resolves UUID refs → CharacterData"| ChProvider
    CharApp -->|"save/load/export"| Serializer
    CharApp -->|"export event"| PDFUtil
    Editors -->|"save/load/export/merge-import"| Serializer
```

---

## 3. State & Data Flow

*How Campaign and Character state relate, how UUID-linked automation still
works once paths/talents/surges become campaign data, and how persistence
(localStorage + file export/import with merge-on-import) fits in.*

```mermaid
flowchart LR
    subgraph CampaignState["CampaignContext"]
        CDATA["CampaignData\n(paths, talents, surges, expertises,\nweapons, armor, equipment, ancestryContent)"]
        CHARS["characters: CharacterSaveV3[]"]
    end

    subgraph CharState["CharacterContext (per open character)"]
        CD["CharacterData\n(resolved objects, unchanged shape)"]
    end

    subgraph Derived["Auto-Derived (calc logic unchanged)"]
        DEF["Defenses · Movement · Senses\nRecovery Die · Lifting/Carrying"]
        SURGE_SK["Surge skills\nauto-added from linked Path.surgeIds"]
        KT["Key Talents\nauto-selected from Path.keyTalentId"]
    end

    subgraph Persist["Persistence"]
        LS[("localStorage\ncampaign index + data")]
        EXPC["exportCampaign()\n→ readable JSON\n(± characters)"]
        IMPC["importCampaign()\nmerge-on-import:\nupsert entities + characters by UUID"]
        EXPCH["exportCharacter()\n→ v3: refs + embedded snapshot"]
        IMPCH["importCharacter()\nresolve refs,\noffer embedded entities to store"]
        PDF["exportToPdf()\nfill AcroForm fields\n→ browser download"]
    end

    CDATA -->|"UUID refs resolved"| CD
    CHARS -->|"open character"| CD
    CD --> DEF
    CDATA -->|"Path.surgeIds"| SURGE_SK
    CDATA -->|"Path.keyTalentId"| KT
    SURGE_SK & KT --> CD
    CampaignState <-->|"autosave / load"| LS
    CampaignState --> EXPC
    IMPC --> CampaignState
    CD --> EXPCH
    IMPCH --> CD
    IMPCH -.->|"new entities"| CDATA
    CD --> PDF
```

---

## 4. Domain Model

*Key entities and their relationships. `Campaign` is the new top-level
owner of all copyright-sensitive content (`consent.md` §3–4); everything
under it is user-entered and UUID-keyed. `Attributes`, `Defenses`,
`Resource`, and `Goal` stay embedded value objects on the character, just
as before — only their container is renamed `CharacterSaveV3`. `Ancestry`
(bundled `id`+`name` list, e.g. `anc_human`) and `Skill` (bundled, id-keyed)
remain static/code-level and are referenced by plain string id rather than
modeled as campaign entities — they carry no copyrighted prose.*

```mermaid
erDiagram
    Campaign {
        string id "UUID"
        string name
        string description
        string createdAt
        string updatedAt
    }

    CharacterSaveV3 {
        string id "UUID"
        string campaignId "UUID"
        string playerName
        string characterName
        int level
        string ancestryId "static id, nullable"
        int radiantIdeal
        string sprenName
        int bondRange
        int marks
        string appearance
    }

    Attributes {
        int strength
        int speed
        int intellect
        int willpower
        int awareness
        int presence
    }

    Defenses {
        int physical
        int cognitive
        int spiritual
        int deflect
    }

    Resource {
        int current
        int max
    }

    Goal {
        string text
        int level
    }

    Path {
        string id "UUID"
        string kind "heroic | radiant"
        string name
        string description
        string[] specialties
        string keyTalentId "UUID, optional"
        string[] surgeIds "UUID[], radiant only"
        string[] ideals "radiant only"
    }

    Talent {
        string id "UUID"
        string pathId "UUID"
        string specialty
        string name
        string description
        string prerequisite
        string activation
        bool isKeyTalent
    }

    Surge {
        string id "UUID"
        string name
        string attribute
        string[] activation
        string description
    }

    Expertise {
        string id "UUID"
        string name
        string category "cultural | utility | weapon | custom"
    }

    Weapon {
        string id "UUID"
        string name
        string category
        string damage
        string range
        string[] properties
    }

    Armor {
        string id "UUID"
        string name
        string category
        string deflect
        string[] properties
    }

    EquipmentItem {
        string id "UUID"
        string name
        string price
        string weight
        string description
    }

    AncestryContent {
        string ancestryId "static ancestry id, e.g. anc_human"
        string description
        string[] innateAbilities
    }

    Campaign ||--o{ CharacterSaveV3 : contains
    Campaign ||--o{ Path : owns
    Campaign ||--o{ Talent : owns
    Campaign ||--o{ Surge : owns
    Campaign ||--o{ Expertise : owns
    Campaign ||--o{ Weapon : owns
    Campaign ||--o{ Armor : owns
    Campaign ||--o{ EquipmentItem : owns
    Campaign ||--o{ AncestryContent : owns

    CharacterSaveV3 ||--|| Attributes : has
    CharacterSaveV3 ||--|| Defenses : has
    CharacterSaveV3 ||--o{ Resource : "health · focus · investiture"
    CharacterSaveV3 ||--o{ Goal : tracks
    CharacterSaveV3 }o--o{ Path : "pathIds"
    CharacterSaveV3 }o--o{ Talent : "talentIds"
    CharacterSaveV3 }o--o{ Expertise : "expertiseIds"
    CharacterSaveV3 }o--o{ Weapon : "weaponIds"
    CharacterSaveV3 }o--o{ Armor : "armorIds"
    CharacterSaveV3 }o--o{ EquipmentItem : "equipmentIds"

    Path ||--o{ Talent : "pathId"
    Path }o--o{ Surge : "surgeIds (radiant)"
    Path |o--o| Talent : "keyTalentId (auto-select)"
```

---

*Changelog*
- 2026-07-25: initial diagrams created from codebase scan (as-built, single-character app)
- 2026-08-08: replaced all four diagrams for the campaign-based re-architecture
  (see `../../consent.md`) — introduced `Campaign`/`CampaignData` as the owner
  of all copyright-sensitive content, multi-route UI, `CampaignContext`,
  localStorage + merge-on-import persistence, and unified `Path`/`Talent`
  entities. Marked file status as **target architecture, not yet implemented**.
  Superseded diagrams are recoverable from git history prior to this commit.
