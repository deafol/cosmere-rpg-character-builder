
import skillsData from '../data/skills.json';
export interface Skill {
    id?: string;
    name: string;
    attribute: string;
    attr_abbrev: string;
    rank: number;
    description?: string;
}

export interface HeroicPath {
    id?: string;
    name: string;
    description: string;
    key_attributes: string[];
    associated_orders?: string[];
}

export interface Ancestry {
    id?: string;
    name: string;
    description: string;
    innate_abilities: string[];
}

export interface Weapon {
    id?: string;
    name: string;
    category: string;
    damage: string;
    range: string;
    properties: string[];
    weight: string;
    price: string;
}

export interface Talent {
    id?: string;
    name: string;
    path: string;
    isKeyTalent: boolean;
    description?: string;
}

export interface Armor {
    id?: string;
    name: string;
    category: string;
    deflect: string;
    properties: string[];
    price: string;
    weight: string;
}

export interface EquipmentItem {
    id?: string;
    name: string;
    price: string;
    weight: string;
    description?: string;
}

export interface Goal {
    text: string;
    level: 0 | 1 | 2 | 3; // 0=unchecked, 1=checked, 2=double, 3=triple? Or maybe just 3 checkboxes. Let's assume progress.
}

export interface Surge {
    name: string;
    attribute: string;
    attr_abbrev: string;
    rank: number;
    modifier: number;
    die: string;
    size: string;
}

export interface CharacterData {
    // Core Info
    playerName: string;
    characterName: string;
    level: number;
    ancestry: Ancestry | null;
    paths: HeroicPath[];
    radiantIdeal: number;
    radiantPath?: string;
    sprenName?: string;
    bondRange?: number;
    surges: Surge[];

    // Attributes
    attributes: {
        strength: number;
        speed: number;
        intellect: number;
        willpower: number;
        awareness: number;
        presence: number;
    };

    marks: number;

    // Skills (Dynamic list or fixed set with ranks)
    skills: Skill[];

    // Defenses
    defenses: {
        physical: number;
        cognitive: number;
        spiritual: number;
        deflect: number;
    };

    // Resources
    health: { current: number; max: number };
    focus: { current: number; max: number };
    investiture: { current: number; max: number };

    // Details
    movement: number;
    sensesRange: string;
    recoveryDie: string;
    liftingCapacity: string;
    carryingCapacity: string;

    // Expertises
    expertises: string[];

    // Weapons
    weapons: Weapon[];

    // Armor and Equipment
    armor: Armor[];
    equipment: EquipmentItem[];

    // Talents
    talents: Talent[];
    otherTalents: string[];

    // Text fields (Converted to lists)
    purpose: string[];
    obstacle: string[];
    goals: Goal[];
    notes: string[];
    connections: string[];
    conditions: string[];
    appearance: string;
}

export const initialCharacterData: CharacterData = {
    playerName: "",
    characterName: "",
    level: 1,
    ancestry: null,
    paths: [],
    radiantIdeal: 0,
    radiantPath: "",
    sprenName: "",
    bondRange: 30,
    surges: [],
    attributes: {
        strength: 2,
        speed: 2,
        intellect: 2,
        willpower: 2,
        awareness: 2,
        presence: 2,
    },
    marks: 0,
    skills: skillsData.map(s => ({ ...s, rank: 0 })),
    defenses: {
        physical: 10,
        cognitive: 10,
        spiritual: 10,
        deflect: 0,
    },
    health: { current: 10, max: 10 },
    focus: { current: 2, max: 2 },
    investiture: { current: 0, max: 0 },
    movement: 20,
    sensesRange: "5 ft.",
    recoveryDie: "1d4",
    liftingCapacity: "",
    carryingCapacity: "",
    expertises: [],
    weapons: [],
    armor: [],
    equipment: [],
    talents: [],
    otherTalents: [],
    purpose: [],
    obstacle: [],
    goals: [],
    notes: [],
    connections: [],
    conditions: [],
    appearance: "",
};
