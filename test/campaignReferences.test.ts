import { describe, it, expect } from 'vitest';
import { countReferences } from '@/utils/campaignReferences';
import { CampaignData, CharacterSaveV3, Path, Talent, createEmptyCampaignData } from '@/types/campaign';

const path = (id: string, overrides: Partial<Path> = {}): Path => ({
    id,
    kind: 'heroic',
    name: 'Path ' + id,
    description: '',
    specialties: [],
    ...overrides,
});

const talent = (id: string, pathId: string): Talent => ({
    id,
    pathId,
    name: 'Talent ' + id,
    description: '',
    prerequisite: '',
    activation: '',
    isKeyTalent: false,
});

const character = (id: string, overrides: Partial<CharacterSaveV3> = {}): CharacterSaveV3 => ({
    v: 3,
    id,
    campaignId: 'campaign-1',
    playerName: 'Dev',
    characterName: 'Char ' + id,
    level: 1,
    ancestryId: null,
    pathIds: [],
    radiantIdeal: 0,
    attributes: { strength: 2, speed: 2, intellect: 2, willpower: 2, awareness: 2, presence: 2 },
    marks: 0,
    skillRanks: {},
    defenses: { physical: 10, cognitive: 10, spiritual: 10, deflect: 0 },
    health: { current: 10, max: 10 },
    focus: { current: 2, max: 2 },
    investiture: { current: 0, max: 0 },
    movement: 20,
    sensesRange: '5 ft.',
    recoveryDie: '1d4',
    liftingCapacity: '',
    carryingCapacity: '',
    expertiseIds: [],
    weaponIds: [],
    armorIds: [],
    equipmentIds: [],
    talentIds: [],
    otherTalents: [],
    purpose: [],
    obstacle: [],
    goals: [],
    notes: [],
    connections: [],
    conditions: [],
    appearance: '',
    ...overrides,
});

describe('countReferences', () => {
    it('counts a path referenced by a talent and a character', () => {
        const data: CampaignData = { ...createEmptyCampaignData(), talents: [talent('t1', 'p1')] };
        const characters = [character('c1', { pathIds: ['p1'] })];
        expect(countReferences(data, characters, 'paths', 'p1')).toBe(2);
    });

    it('counts a talent referenced by a path key talent and a character', () => {
        const data: CampaignData = { ...createEmptyCampaignData(), paths: [path('p1', { keyTalentId: 't1' })] };
        const characters = [character('c1', { talentIds: ['t1'] })];
        expect(countReferences(data, characters, 'talents', 't1')).toBe(2);
    });

    it('counts a surge referenced by a path surgeIds list', () => {
        const data: CampaignData = { ...createEmptyCampaignData(), paths: [path('p1', { surgeIds: ['s1', 's2'] })] };
        expect(countReferences(data, [], 'surges', 's1')).toBe(1);
        expect(countReferences(data, [], 'surges', 's3')).toBe(0);
    });

    it('counts expertise/weapon/armor/equipment references from characters', () => {
        const data = createEmptyCampaignData();
        const characters = [character('c1', { expertiseIds: ['e1'], weaponIds: ['w1'], armorIds: ['a1'], equipmentIds: ['eq1', 'eq1'] })];
        expect(countReferences(data, characters, 'expertises', 'e1')).toBe(1);
        expect(countReferences(data, characters, 'weapons', 'w1')).toBe(1);
        expect(countReferences(data, characters, 'armor', 'a1')).toBe(1);
        expect(countReferences(data, characters, 'equipment', 'eq1')).toBe(1);
    });

    it('counts ancestry content referenced by a character ancestryId', () => {
        const data = createEmptyCampaignData();
        const characters = [character('c1', { ancestryId: 'anc_human' }), character('c2', { ancestryId: 'anc_singer' })];
        expect(countReferences(data, characters, 'ancestryContent', 'anc_human')).toBe(1);
    });

    it('returns 0 for an entity with no references', () => {
        const data = createEmptyCampaignData();
        expect(countReferences(data, [], 'paths', 'unused')).toBe(0);
    });
});
