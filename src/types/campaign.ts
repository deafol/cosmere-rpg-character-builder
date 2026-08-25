/**
 * Campaign domain types — see consent.md §4 for the approved schema and
 * docs/specs/architecture.md for the domain model diagram.
 *
 * All entities below are user-entered campaign content (copyright-sensitive
 * game text lives here, never bundled in the app) and are keyed by UUIDv4
 * (see src/utils/uuid.ts) so references survive renames and schema changes.
 */

export const CAMPAIGN_SCHEMA_VERSION = 1;
export const CHARACTER_SAVE_VERSION = 3;

export type PathKind = "heroic" | "radiant";

export interface Path {
    id: string; // UUID
    kind: PathKind;
    name: string;
    description: string;
    specialties: string[];
    keyTalentId?: string; // UUID, drives key-talent auto-select
    surgeIds?: string[]; // UUID[], radiant only, drives surge-skill auto-add
    ideals?: string[]; // radiant only
}

export interface Talent {
    id: string; // UUID
    pathId: string; // UUID
    specialty?: string;
    name: string;
    description: string;
    prerequisite: string;
    activation: string;
    isKeyTalent: boolean;
}

export interface Surge {
    id: string; // UUID
    name: string;
    attribute: string;
    activation: string[];
    description: string;
}

export interface Expertise {
    id: string; // UUID
    name: string;
    category: string; // 'cultural' | 'utility' | 'weapon' | user-defined
}

export interface Weapon {
    id: string; // UUID
    name: string;
    category: string;
    damage: string;
    range: string;
    properties: string[];
    weight: string;
    price: string;
}

export interface Armor {
    id: string; // UUID
    name: string;
    category: string;
    deflect: string;
    properties: string[];
    price: string;
    weight: string;
}

export interface EquipmentItem {
    id: string; // UUID
    name: string;
    price: string;
    weight: string;
    description?: string;
}

export interface AncestryContent {
    ancestryId: string; // references the static bundled ancestry id, e.g. "anc_human"
    description: string;
    innateAbilities: string[];
}

export interface CampaignData {
    paths: Path[];
    talents: Talent[];
    surges: Surge[];
    expertises: Expertise[];
    expertiseCategories: string[]; // user-defined, in addition to the fixed trio
    weapons: Weapon[];
    armor: Armor[];
    equipment: EquipmentItem[];
    ancestryContent: AncestryContent[];
}

export function createEmptyCampaignData(): CampaignData {
    return {
        paths: [],
        talents: [],
        surges: [],
        expertises: [],
        expertiseCategories: [],
        weapons: [],
        armor: [],
        equipment: [],
        ancestryContent: [],
    };
}

export interface Campaign {
    schemaVersion: typeof CAMPAIGN_SCHEMA_VERSION;
    id: string; // UUID
    name: string;
    description?: string;
    createdAt: string; // ISO
    updatedAt: string; // ISO
    data: CampaignData;
    characters: CharacterSaveV3[];
}

/**
 * Character save v3: readable JSON, UUID refs into CampaignData.
 * `embedded` is populated only for standalone character export (outside
 * its campaign file) — see consent.md §2.6.
 */
export interface CharacterSaveV3 {
    v: typeof CHARACTER_SAVE_VERSION;
    id: string; // UUID, this character's own id (merge key)
    campaignId: string; // UUID

    playerName: string;
    characterName: string;
    level: number;

    ancestryId: string | null; // static ancestry id, e.g. "anc_human"
    pathIds: string[]; // UUID[]
    radiantIdeal: number;
    sprenName?: string;
    bondRange?: number;

    attributes: {
        strength: number;
        speed: number;
        intellect: number;
        willpower: number;
        awareness: number;
        presence: number;
    };

    marks: number;
    skillRanks: Record<string, number>; // static skill id -> rank

    defenses: {
        physical: number;
        cognitive: number;
        spiritual: number;
        deflect: number;
    };

    health: { current: number; max: number };
    focus: { current: number; max: number };
    investiture: { current: number; max: number };

    movement: number;
    sensesRange: string;
    recoveryDie: string;
    liftingCapacity: string;
    carryingCapacity: string;

    expertiseIds: string[]; // UUID[]

    weaponIds: string[]; // UUID[]
    armorIds: string[]; // UUID[]
    equipmentIds: string[]; // UUID[], duplicates allowed

    talentIds: string[]; // UUID[]
    otherTalents: string[]; // free text, unchanged

    purpose: string[];
    obstacle: string[];
    goals: { text: string; level: 0 | 1 | 2 | 3 }[];
    notes: string[];
    connections: string[];
    conditions: string[];
    appearance: string;

    // Standalone export only: snapshot of every entity referenced above.
    embedded?: Partial<CampaignData>;
}
