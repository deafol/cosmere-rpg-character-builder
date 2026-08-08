/**
 * Per-domain field configs for the generic EntityEditor (consent.md §6
 * phase 5) — one config per campaign entity type from src/types/campaign.ts.
 */
import { generateId } from '../../utils/uuid';
import {
    Armor,
    AncestryContent,
    EquipmentItem,
    Expertise,
    Path,
    Surge,
    Talent,
    Weapon,
} from '../../types/campaign';
import ancestriesData from '../../data/ancestries.json';
import { FieldConfig } from './entityFieldTypes';

export const FIXED_EXPERTISE_CATEGORIES = ['cultural', 'utility', 'weapon'];

const ATTRIBUTES = ['Strength', 'Speed', 'Intellect', 'Willpower', 'Awareness', 'Presence'];

export const pathFields: FieldConfig<Path>[] = [
    { key: 'kind', label: 'Kind', type: 'select', required: true, selectOptions: ['heroic', 'radiant'] },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'specialties', label: 'Specialties', type: 'stringlist' },
    {
        key: 'keyTalentId',
        label: 'Key Talent',
        type: 'entity-select',
        refOptions: data => data.talents.map(t => ({ id: t.id, label: t.name || 'Unnamed Talent' })),
    },
    {
        key: 'surgeIds',
        label: 'Surges',
        type: 'multi-entity-select',
        refOptions: data => data.surges.map(s => ({ id: s.id, label: s.name || 'Unnamed Surge' })),
        showIf: values => values.kind === 'radiant',
    },
    {
        key: 'ideals',
        label: 'Ideals',
        type: 'stringlist',
        showIf: values => values.kind === 'radiant',
    },
];

export const createDefaultPath = (): Path => ({
    id: generateId(),
    kind: 'heroic',
    name: '',
    description: '',
    specialties: [],
});

export const talentFields: FieldConfig<Talent>[] = [
    {
        key: 'pathId',
        label: 'Path',
        type: 'entity-select',
        required: true,
        refOptions: data => data.paths.map(p => ({ id: p.id, label: p.name || 'Unnamed Path' })),
    },
    { key: 'specialty', label: 'Specialty', type: 'text' },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'prerequisite', label: 'Prerequisite', type: 'text', placeholder: 'e.g. Deduction 1+' },
    { key: 'activation', label: 'Activation', type: 'text', placeholder: 'e.g. Free Action' },
    { key: 'isKeyTalent', label: 'Key Talent', type: 'checkbox' },
];

export const createDefaultTalent = (): Talent => ({
    id: generateId(),
    pathId: '',
    name: '',
    description: '',
    prerequisite: '',
    activation: '',
    isKeyTalent: false,
});

export const surgeFields: FieldConfig<Surge>[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'attribute', label: 'Attribute', type: 'select', required: true, selectOptions: ATTRIBUTES },
    { key: 'activation', label: 'Activation', type: 'stringlist' },
    { key: 'description', label: 'Description', type: 'textarea' },
];

export const createDefaultSurge = (): Surge => ({
    id: generateId(),
    name: '',
    attribute: ATTRIBUTES[0],
    activation: [],
    description: '',
});

export const expertiseFields: FieldConfig<Expertise>[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    {
        key: 'category',
        label: 'Category',
        type: 'text',
        required: true,
        suggestions: data => Array.from(new Set([...FIXED_EXPERTISE_CATEGORIES, ...data.expertiseCategories])),
    },
];

export const createDefaultExpertise = (): Expertise => ({
    id: generateId(),
    name: '',
    category: FIXED_EXPERTISE_CATEGORIES[0],
});

export const weaponFields: FieldConfig<Weapon>[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'damage', label: 'Damage', type: 'text' },
    { key: 'range', label: 'Range', type: 'text' },
    { key: 'properties', label: 'Properties', type: 'stringlist' },
    { key: 'weight', label: 'Weight', type: 'text' },
    { key: 'price', label: 'Price', type: 'text' },
];

export const createDefaultWeapon = (): Weapon => ({
    id: generateId(),
    name: '',
    category: '',
    damage: '',
    range: '',
    properties: [],
    weight: '',
    price: '',
});

export const armorFields: FieldConfig<Armor>[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'deflect', label: 'Deflect', type: 'text' },
    { key: 'properties', label: 'Properties', type: 'stringlist' },
    { key: 'price', label: 'Price', type: 'text' },
    { key: 'weight', label: 'Weight', type: 'text' },
];

export const createDefaultArmor = (): Armor => ({
    id: generateId(),
    name: '',
    category: '',
    deflect: '',
    properties: [],
    price: '',
    weight: '',
});

export const equipmentFields: FieldConfig<EquipmentItem>[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'price', label: 'Price', type: 'text' },
    { key: 'weight', label: 'Weight', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
];

export const createDefaultEquipment = (): EquipmentItem => ({
    id: generateId(),
    name: '',
    price: '',
    weight: '',
});

export const ancestryContentFields: FieldConfig<AncestryContent>[] = [
    {
        key: 'ancestryId',
        label: 'Ancestry',
        type: 'entity-select',
        required: true,
        refOptions: () => ancestriesData.map(a => ({ id: a.id, label: a.name })),
    },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'innateAbilities', label: 'Innate Abilities', type: 'stringlist' },
];

export const createDefaultAncestryContent = (): AncestryContent => ({
    ancestryId: ancestriesData[0]?.id ?? '',
    description: '',
    innateAbilities: [],
});

export const ancestryNameFor = (ancestryId: string): string =>
    ancestriesData.find(a => a.id === ancestryId)?.name ?? ancestryId;
