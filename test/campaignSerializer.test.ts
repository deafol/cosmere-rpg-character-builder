import { describe, it, expect } from 'vitest';
import {
    createCampaign,
    exportCampaign,
    isCampaignFile,
    parseCampaignFile,
    mergeCampaignData,
    mergeCharacters,
    mergeCampaign,
} from '@/utils/campaignSerializer';
import { Campaign, CampaignData, CharacterSaveV3, CAMPAIGN_SCHEMA_VERSION, createEmptyCampaignData } from '@/types/campaign';

const path = (id: string, name: string) => ({
    id,
    kind: 'heroic' as const,
    name,
    description: '',
    specialties: [],
});

const character = (id: string, characterName: string): CharacterSaveV3 => ({
    v: 3,
    id,
    campaignId: 'campaign-1',
    playerName: 'Dev',
    characterName,
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
});

describe('createCampaign', () => {
    it('creates an empty campaign with a UUID and matching timestamps', () => {
        const campaign = createCampaign('Test Campaign', 'A description');
        expect(campaign.schemaVersion).toBe(CAMPAIGN_SCHEMA_VERSION);
        expect(campaign.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(campaign.name).toBe('Test Campaign');
        expect(campaign.description).toBe('A description');
        expect(campaign.createdAt).toBe(campaign.updatedAt);
        expect(campaign.data).toEqual(createEmptyCampaignData());
        expect(campaign.characters).toEqual([]);
    });
});

describe('exportCampaign', () => {
    it('includes characters by default', () => {
        const campaign = createCampaign('Test');
        campaign.characters.push(character('char-1', 'Robar'));
        const json = exportCampaign(campaign);
        expect(JSON.parse(json).characters).toHaveLength(1);
    });

    it('excludes characters when includeCharacters is false', () => {
        const campaign = createCampaign('Test');
        campaign.characters.push(character('char-1', 'Robar'));
        const json = exportCampaign(campaign, { includeCharacters: false });
        expect(JSON.parse(json).characters).toHaveLength(0);
    });
});

describe('isCampaignFile / parseCampaignFile', () => {
    it('accepts a well-formed campaign', () => {
        const campaign = createCampaign('Test');
        expect(isCampaignFile(campaign)).toBe(true);
        expect(parseCampaignFile(JSON.stringify(campaign))).toEqual(campaign);
    });

    it('rejects an unsupported schema version', () => {
        const campaign = { ...createCampaign('Test'), schemaVersion: 999 };
        expect(isCampaignFile(campaign)).toBe(false);
        expect(() => parseCampaignFile(JSON.stringify(campaign))).toThrow(/schema version/);
    });

    it('rejects arbitrary JSON', () => {
        expect(isCampaignFile({ foo: 'bar' })).toBe(false);
        expect(() => parseCampaignFile(JSON.stringify({ foo: 'bar' }))).toThrow();
    });
});

describe('mergeCampaignData', () => {
    const localData: CampaignData = {
        ...createEmptyCampaignData(),
        paths: [path('p1', 'Windrunner (local)'), path('p2', 'Local-only Path')],
        expertiseCategories: ['cultural', 'homebrew'],
    };
    const incomingData: CampaignData = {
        ...createEmptyCampaignData(),
        paths: [path('p1', 'Windrunner (updated by GM)'), path('p3', 'Incoming-only Path')],
        expertiseCategories: ['cultural', 'weapon'],
    };

    it('keeps local-only entities', () => {
        const merged = mergeCampaignData(localData, incomingData);
        expect(merged.paths.find(p => p.id === 'p2')).toBeDefined();
    });

    it('adds incoming-only entities', () => {
        const merged = mergeCampaignData(localData, incomingData);
        expect(merged.paths.find(p => p.id === 'p3')).toBeDefined();
    });

    it('lets incoming win on id conflicts', () => {
        const merged = mergeCampaignData(localData, incomingData);
        expect(merged.paths.find(p => p.id === 'p1')?.name).toBe('Windrunner (updated by GM)');
    });

    it('unions expertise categories without duplicates', () => {
        const merged = mergeCampaignData(localData, incomingData);
        expect(merged.expertiseCategories.sort()).toEqual(['cultural', 'homebrew', 'weapon']);
    });

    it('merges ancestryContent by ancestryId, not a UUID field', () => {
        const local: CampaignData = {
            ...createEmptyCampaignData(),
            ancestryContent: [{ ancestryId: 'anc_human', description: 'local text', innateAbilities: [] }],
        };
        const incoming: CampaignData = {
            ...createEmptyCampaignData(),
            ancestryContent: [{ ancestryId: 'anc_human', description: 'GM text', innateAbilities: ['Size: Medium'] }],
        };
        const merged = mergeCampaignData(local, incoming);
        expect(merged.ancestryContent).toEqual([
            { ancestryId: 'anc_human', description: 'GM text', innateAbilities: ['Size: Medium'] },
        ]);
    });
});

describe('mergeCharacters', () => {
    it('preserves local-only characters and upserts incoming ones by id', () => {
        const local = [character('c1', 'Local Player Character'), character('c2', 'Shared, local version')];
        const incoming = [character('c2', 'Shared, GM-updated version'), character('c3', 'New from GM')];

        const merged = mergeCharacters(local, incoming);

        expect(merged.find(c => c.id === 'c1')).toBeDefined();
        expect(merged.find(c => c.id === 'c3')).toBeDefined();
        expect(merged.find(c => c.id === 'c2')?.characterName).toBe('Shared, GM-updated version');
        expect(merged).toHaveLength(3);
    });
});

describe('mergeCampaign', () => {
    it('throws when campaign ids differ', () => {
        const a = createCampaign('A');
        const b = createCampaign('B');
        expect(() => mergeCampaign(a, b)).toThrow(/different ids/);
    });

    it('merges data and characters, keeps local createdAt, takes incoming name', () => {
        const local: Campaign = { ...createCampaign('Original Name'), createdAt: '2026-01-01T00:00:00.000Z' };
        local.characters.push(character('c1', 'Local Character'));
        local.data.paths.push(path('p1', 'Local Path'));

        const incoming: Campaign = { ...local, name: 'Renamed by GM', description: 'New description' };
        incoming.characters = [character('c2', 'GM Character')];
        incoming.data = { ...createEmptyCampaignData(), paths: [path('p2', 'Incoming Path')] };

        const merged = mergeCampaign(local, incoming);

        expect(merged.id).toBe(local.id);
        expect(merged.name).toBe('Renamed by GM');
        expect(merged.description).toBe('New description');
        expect(merged.createdAt).toBe('2026-01-01T00:00:00.000Z');
        expect(merged.characters.map(c => c.id).sort()).toEqual(['c1', 'c2']);
        expect(merged.data.paths.map(p => p.id).sort()).toEqual(['p1', 'p2']);
    });
});
