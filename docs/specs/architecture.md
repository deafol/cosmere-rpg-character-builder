# Cosmere RPG Character Builder — Architecture Diagrams

Source: codebase scan (2026-07-25). No PRD exists yet; these diagrams
describe the *as-built* system.

---

## 1. System Architecture

*How the browser, app, static assets, and deployment infrastructure relate.*

```mermaid
flowchart TB
    subgraph Browser["Browser (Client)"]
        UI["Next.js React App\n(fully client-side after hydration)"]
    end

    subgraph Deployment["Raspberry Pi 5 — Docker Compose"]
        CF["cloudflared\n(Cloudflare Tunnel)"]
        APP["character-builder\n(Next.js :3000)"]
        UMAMI["umami\n(analytics :3001)"]
        DB["umami-db\n(PostgreSQL 15)"]
        WT["watchtower\n(auto-updates)"]
        ND["netdata\n(monitoring :19999)"]
    end

    subgraph Static["Bundled at Build Time"]
        JSON["src/data/*.json\n(ancestries, paths, talents,\nskills, surges, items)"]
        TMPL["public/character-sheet-template.pdf"]
        FONT["public/fonts/CosmereFont.ttf"]
    end

    GHCR["GHCR\n(Container Registry)"]
    CFCloud["Cloudflare\n(Edge / DNS)"]

    User((Player)) -->|HTTPS| CFCloud
    CFCloud --> CF
    CF --> APP
    APP --> UI
    UI -->|reads bundled data| JSON
    UI -->|fetches at PDF export| TMPL
    UI -->|fetches at PDF export| FONT
    WT -->|polls every 5 min| GHCR
    WT -->|restarts updated| APP
    UI -->|page-view events| UMAMI
    UMAMI --> DB
```

---

## 2. Component Hierarchy

*React component tree showing ownership and data flow.*

```mermaid
flowchart TD
    Layout["app/layout.tsx\n(fonts + Umami script)"]
    Page["app/page.tsx"]
    Provider["CharacterProvider\n(CharacterContext)"]
    BL["BuilderLayout"]
    Header["Header\n(New · Load · Save · Export PDF)"]
    CF["CharacterForm"]
    P1["Panel 1\nGeneral Characteristics"]
    P2["Panel 2\nAttributes, Skills & Resources"]
    P3["Panel 3\nExpertises & Talents"]
    P4["Panel 4\nWeapons, Armor & Equipment"]
    P5["Panel 5\nCharacter Details"]
    UI["UI Primitives\n(Label · Input · Select\nNumberControl · CollapsiblePanel)"]
    Modal["Modal / NotificationModal"]
    PDFUtil["pdfExport.ts"]
    Serializer["characterSerializer.ts"]

    Layout --> Page
    Page --> Provider
    Provider --> BL
    BL --> Header
    BL --> CF
    Header -->|"save/load/new events"| Serializer
    Header -->|"export event"| PDFUtil
    Header --> Modal
    CF --> P1
    CF --> P2
    CF --> P3
    CF --> P4
    CF --> P5
    P1 & P2 & P3 & P4 & P5 --> UI
    Provider -->|"CharacterData + updaters"| BL
    Provider -->|"CharacterData + updaters"| CF
```

---

## 3. State & Data Flow

*How CharacterContext state changes propagate and trigger derived calculations.*

```mermaid
flowchart LR
    subgraph Context["CharacterContext (single CharacterData object)"]
        STATE["CharacterData\nstate"]
    end

    subgraph Triggers["User Actions"]
        UA["updateAttribute\n(attr, value)"]
        UD["updateData\n(partial update)"]
        USR["updateSkillRank\n(skillName, rank)"]
    end

    subgraph Derived["Auto-Derived in Context"]
        DEF["Defenses\n(10 + attr pair)"]
        MOV["Movement\n(Speed → 20–80 ft)"]
        SEN["Senses Range\n(Awareness → 5ft–Unobscured)"]
        REC["Recovery Die\n(Willpower → 1d4–1d12)"]
        CAP["Lifting / Carrying\n(Strength → 100lb–10,000lb)"]
        SURGE_SK["Surge Skills\nauto-added/removed\n(paths → surges.json)"]
    end

    subgraph Effects["CharacterForm useEffects"]
        KT["Key Talents\nauto-selected\nfrom paths"]
        SC["Surge stats computed\n(modifier, die, size)"]
    end

    subgraph IO["Save · Load · Export"]
        SAVE["serializeCharacter()\n→ compact v2 JSON\n→ browser download"]
        LOAD["FileReader\n→ isCompactFormat?\n→ deserializeCharacter()\n→ loadData()"]
        PDF["exportToPdf()\nfetch template + font\nfill AcroForm fields\n→ browser download"]
    end

    UA --> DEF & MOV & SEN & REC & CAP
    UD -->|"paths changed"| SURGE_SK
    UA & UD & USR --> STATE
    STATE -->|"paths"| KT
    STATE -->|"skills + attributes"| SC
    STATE --> SAVE
    LOAD --> STATE
    STATE --> PDF
```

---

## 4. Domain Model

*Key entities in CharacterData and their relationships.*

```mermaid
erDiagram
    CharacterData {
        string playerName
        string characterName
        int level
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

    Ancestry {
        string name
        string description
        string[] innate_abilities
    }

    HeroicPath {
        string name
        string description
        string[] key_attributes
        string[] specialties
    }

    Skill {
        string name
        string attribute
        string attr_abbrev
        int rank
    }

    Surge {
        string name
        string attribute
        int rank
        int modifier
        string die
        string size
    }

    Talent {
        string name
        string path
        bool isKeyTalent
        string description
    }

    Weapon {
        string name
        string category
        string damage
        string range
        string[] properties
    }

    Armor {
        string name
        string category
        string deflect
        string[] properties
    }

    EquipmentItem {
        string name
        string price
        string weight
        string description
    }

    Goal {
        string text
        int level
    }

    CharacterData ||--|| Attributes : has
    CharacterData ||--|| Defenses : has
    CharacterData ||--o{ Resource : "health · focus · investiture"
    CharacterData ||--o| Ancestry : "chooses one"
    CharacterData ||--o{ HeroicPath : "selects (heroic + radiant)"
    CharacterData ||--o{ Skill : "ranks 0–5"
    CharacterData ||--o{ Surge : "auto-derived from paths"
    CharacterData ||--o{ Talent : "key + chosen"
    CharacterData ||--o{ Weapon : equips
    CharacterData ||--o{ Armor : equips
    CharacterData ||--o{ EquipmentItem : carries
    CharacterData ||--o{ Goal : tracks
```

---

*Changelog*
- 2026-07-25: initial diagrams created from codebase scan
