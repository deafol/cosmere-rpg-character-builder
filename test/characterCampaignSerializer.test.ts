import { describe, it, expect } from 'vitest';
import {
    toCharacterSaveV3,
    fromCharacterSaveV3,
    exportCharacterFile,
    parseCharacterFile,
    isCharacterSaveFile,
    importCharacterIntoCampaign,
    previewCharacterImport,
} from '@/utils/characterCampaignSerializer';
import { createCampaign } from '@/utils/campaignSerializer';
import { CampaignData, createEmptyCampaignData } from '@/types/campaign';
import { CharacterData, initialCharacterData } from '@/types/character';

const pathAgentId = 'path-agent';
const pathWindrunnerId = 'path-windrunner';
const talentKeyAgentId = 'talent-key-agent';
const talentKeyWindrunnerId = 'talent-key-windrunner';
const talentSharpEyesId = 'talent-sharp-eyes';
const surgeAdhesionId = 'surge-adhesion';
const surgeGravitationId = 'surge-gravitation';
const expertiseId = 'expertise-alethi';
const weaponId = 'weapon-sidesword';
const armorId = 'armor-jerkin';
const equipmentId = 'equipment-rope';

function seededCampaignData(): CampaignData {
    return {
        ...createEmptyCampaignData(),
        paths: [
            { id: pathAgentId, kind: 'heroic', name: 'Agent', description: '', specialties: ['Investigator'], keyTalentId: talentKeyAgentId },
            { id: pathWindrunnerId, kind: 'radiant', name: 'Windrunner', description: '', specialties: [], keyTalentId: talentKeyWindrunnerId, surgeIds: [surgeAdhesionId, surgeGravitationId], ideals: [] },
        ],
        talents: [
            { id: talentKeyAgentId, pathId: pathAgentId, name: 'Opportunist', description: 'Reroll the plot die.', prerequisite: '', activation: '∞', isKeyTalent: true },
            { id: talentKeyWindrunnerId, pathId: pathWindrunnerId, name: "Windrunner's Spren Bond", description: 'Bonded to a Highspren.', prerequisite: '', activation: '∞', isKeyTalent: true },
            { id: talentSharpEyesId, pathId: pathAgentId, specialty: 'Investigator', name: 'Sharp Eyes', description: 'You notice things others miss.', prerequisite: 'Perception 1+', activation: '► Action', isKeyTalent: false },
        ],
        surges: [
            { id: surgeAdhesionId, name: 'Adhesion', attribute: 'Presence', activation: [], description: '' },
            { id: surgeGravitationId, name: 'Gravitation', attribute: 'Strength', activation: [], description: '' },
        ],
        expertises: [{ id: expertiseId, name: 'Alethi Culture', category: 'cultural' }],
        weapons: [{ id: weaponId, name: 'Sidesword', category: 'Light', damage: '1d6', range: 'Melee', properties: ['Deadly'], weight: '3 lb.', price: '3 Marks' }],
        armor: [{ id: armorId, name: 'Leather Jerkin', category: 'Light', deflect: '1', properties: [], price: '2 Marks', weight: '8 lb.' }],
        equipment: [{ id: equipmentId, name: 'Rope (50 ft.)', price: '1 Mark', weight: '5 lb.', description: 'Sturdy hemp rope.' }],
        ancestryContent: [{ ancestryId: 'anc_human', description: 'Standard humans.', innateAbilities: [] }],
    };
}

function characterWithSelections(): CharacterData {
    return {
        ...initialCharacterData,
        playerName: 'Dev',
        characterName: 'Robar',
        level: 3,
        ancestry: { id: 'anc_human', name: 'Human' },
        paths: [
            { id: pathAgentId, name: 'Agent', description: '', key_attributes: [], specialties: ['Investigator'] },
            { id: pathWindrunnerId, name: 'Windrunner', description: '', key_attributes: [], specialties: [] },
        ],
        radiantIdeal: 2,
        radiantPath: 'Windrunner',
        sprenName: 'Syl',
        bondRange: 30,
        skills: [
            ...initialCharacterData.skills.map(s => (s.id === 'skill_agi' ? { ...s, rank: 3 } : s)),
            { name: 'Adhesion', attribute: 'Presence', attr_abbrev: 'PRE', rank: 2 },
            { name: 'Gravitation', attribute: 'Strength', attr_abbrev: 'STR', rank: 0 },
        ],
        expertises: ['Alethi Culture'],
        weapons: [{ id: weaponId, name: 'Sidesword', category: 'Light', damage: '1d6', range: 'Melee', properties: ['Deadly'], weight: '3 lb.', price: '3 Marks' }],
        armor: [{ id: armorId, name: 'Leather Jerkin', category: 'Light', deflect: '1', properties: [], price: '2 Marks', weight: '8 lb.' }],
        equipment: [{ id: equipmentId, name: 'Rope (50 ft.)', price: '1 Mark', weight: '5 lb.', description: 'Sturdy hemp rope.' }],
        talents: [
            { id: talentKeyAgentId, name: 'Opportunist', path: 'Agent', isKeyTalent: true, description: 'Reroll the plot die.' },
            { id: talentKeyWindrunnerId, name: "Windrunner's Spren Bond", path: 'Windrunner', isKeyTalent: true, description: 'Bonded to a Highspren.' },
            { id: talentSharpEyesId, name: 'Sharp Eyes', path: 'Agent', isKeyTalent: false, description: 'You notice things others miss.' },
        ],
    };
}

describe('toCharacterSaveV3', () => {
    it('maps resolved objects to UUID refs, skipping zero-rank skills', () => {
        const campaignData = seededCampaignData();
        const save = toCharacterSaveV3(characterWithSelections(), 'campaign-1', campaignData, 'char-1');

        expect(save.v).toBe(3);
        expect(save.id).toBe('char-1');
        expect(save.campaignId).toBe('campaign-1');
        expect(save.ancestryId).toBe('anc_human');
        expect(save.pathIds.sort()).toEqual([pathAgentId, pathWindrunnerId].sort());
        expect(save.talentIds.sort()).toEqual([talentKeyAgentId, talentKeyWindrunnerId, talentSharpEyesId].sort());
        expect(save.expertiseIds).toEqual([expertiseId]);
        expect(save.weaponIds).toEqual([weaponId]);
        expect(save.armorIds).toEqual([armorId]);
        expect(save.equipmentIds).toEqual([equipmentId]);
        expect(save.skillRanks['skill_agi']).toBe(3);
        expect(save.skillRanks[surgeAdhesionId]).toBe(2);
        expect(save.skillRanks[surgeGravitationId]).toBeUndefined(); // rank 0, not stored
    });

    it('has no radiantPath or surges fields (derived at load time)', () => {
        const save = toCharacterSaveV3(characterWithSelections(), 'campaign-1', seededCampaignData(), 'char-1');
        expect(save).not.toHaveProperty('radiantPath');
        expect(save).not.toHaveProperty('surges');
    });
});

describe('fromCharacterSaveV3', () => {
    it('round-trips a character through save and load', () => {
        const campaignData = seededCampaignData();
        const original = characterWithSelections();
        const save = toCharacterSaveV3(original, 'campaign-1', campaignData, 'char-1');
        const restored = fromCharacterSaveV3(save, campaignData);

        expect(restored.playerName).toBe(original.playerName);
        expect(restored.characterName).toBe(original.characterName);
        expect(restored.ancestry).toEqual(original.ancestry);
        expect(restored.paths.map(p => p.id).sort()).toEqual(original.paths.map(p => p.id).sort());
        expect(restored.radiantPath).toBe('Windrunner');
        expect(restored.expertises).toEqual(original.expertises);
        expect(restored.weapons).toEqual(original.weapons);
        expect(restored.armor).toEqual(original.armor);
        expect(restored.equipment).toEqual(original.equipment);
        expect(restored.talents.map(t => t.id).sort()).toEqual(original.talents.map(t => t.id).sort());
    });

    it('reconstructs active surge-skill entries with persisted ranks, from campaign links alone', () => {
        const campaignData = seededCampaignData();
        const save = toCharacterSaveV3(characterWithSelections(), 'campaign-1', campaignData, 'char-1');
        const restored = fromCharacterSaveV3(save, campaignData);

        const adhesion = restored.skills.find(s => s.name === 'Adhesion');
        const gravitation = restored.skills.find(s => s.name === 'Gravitation');
        expect(adhesion?.rank).toBe(2);
        expect(gravitation?.rank).toBe(0);
    });

    it('drops refs to entities no longer in the campaign', () => {
        const campaignData = seededCampaignData();
        const save = toCharacterSaveV3(characterWithSelections(), 'campaign-1', campaignData, 'char-1');

        const prunedCampaignData: CampaignData = { ...campaignData, weapons: [] };
        const restored = fromCharacterSaveV3(save, prunedCampaignData);
        expect(restored.weapons).toEqual([]);
    });
});

describe('exportCharacterFile / parseCharacterFile', () => {
    it('embeds a snapshot of every entity the character actually references', () => {
        const campaignData = seededCampaignData();
        const save = toCharacterSaveV3(characterWithSelections(), 'campaign-1', campaignData, 'char-1');
        const json = exportCharacterFile(save, campaignData);
        const parsed = parseCharacterFile(json);

        expect(parsed.embedded?.paths?.map(p => p.id).sort()).toEqual([pathAgentId, pathWindrunnerId].sort());
        expect(parsed.embedded?.surges?.map(s => s.id).sort()).toEqual([surgeAdhesionId, surgeGravitationId].sort());
        expect(parsed.embedded?.talents).toHaveLength(3);
        expect(parsed.embedded?.expertises?.[0]?.id).toBe(expertiseId);
        expect(parsed.embedded?.weapons?.[0]?.id).toBe(weaponId);
        expect(parsed.embedded?.armor?.[0]?.id).toBe(armorId);
        expect(parsed.embedded?.equipment?.[0]?.id).toBe(equipmentId);
        expect(parsed.embedded?.ancestryContent?.[0]?.ancestryId).toBe('anc_human');
    });

    it('rejects a non-character file', () => {
        expect(() => parseCharacterFile(JSON.stringify({ foo: 'bar' }))).toThrow();
    });

    it('accepts a v3 character save via isCharacterSaveFile', () => {
        const save = toCharacterSaveV3(characterWithSelections(), 'campaign-1', seededCampaignData(), 'char-1');
        expect(isCharacterSaveFile(save)).toBe(true);
        expect(isCharacterSaveFile({ v: 2 })).toBe(false);
    });
});

describe('importCharacterIntoCampaign', () => {
    it('merges embedded entities into the target campaign and upserts the character, re-pointed at it', () => {
        const sourceCampaign = { ...createCampaign('Source'), data: seededCampaignData() };
        const save = toCharacterSaveV3(characterWithSelections(), sourceCampaign.id, sourceCampaign.data, 'char-1');
        const fileJson = exportCharacterFile(save, sourceCampaign.data);
        const incoming = parseCharacterFile(fileJson);

        const targetCampaign = createCampaign('Target'); // starts empty
        const merged = importCharacterIntoCampaign(targetCampaign, incoming);

        expect(merged.data.paths.map(p => p.id).sort()).toEqual([pathAgentId, pathWindrunnerId].sort());
        expect(merged.data.weapons.map(w => w.id)).toEqual([weaponId]);
        expect(merged.characters).toHaveLength(1);
        expect(merged.characters[0].id).toBe('char-1');
        expect(merged.characters[0].campaignId).toBe(targetCampaign.id);
        expect(merged.characters[0].embedded).toBeUndefined();
    });

    it('upserts by character id — importing the same file twice does not duplicate', () => {
        const sourceCampaign = { ...createCampaign('Source'), data: seededCampaignData() };
        const save = toCharacterSaveV3(characterWithSelections(), sourceCampaign.id, sourceCampaign.data, 'char-1');
        const incoming = parseCharacterFile(exportCharacterFile(save, sourceCampaign.data));

        let campaign = createCampaign('Target');
        campaign = importCharacterIntoCampaign(campaign, incoming);
        campaign = importCharacterIntoCampaign(campaign, incoming);

        expect(campaign.characters).toHaveLength(1);
    });
});

describe('previewCharacterImport', () => {
    it('reports every referenced entity as new when importing into an empty campaign', () => {
        const sourceCampaign = { ...createCampaign('Source'), data: seededCampaignData() };
        const save = toCharacterSaveV3(characterWithSelections(), sourceCampaign.id, sourceCampaign.data, 'char-1');
        const incoming = parseCharacterFile(exportCharacterFile(save, sourceCampaign.data));

        const targetCampaign = createCampaign('Target');
        const preview = previewCharacterImport(targetCampaign, incoming);

        expect(preview.characterName).toBe('Robar');
        expect(preview.isNewCharacter).toBe(true);
        const byLabel = Object.fromEntries(preview.entities.map(e => [e.label, e]));
        expect(byLabel.paths).toEqual({ label: 'paths', newCount: 2, updatedCount: 0 });
        expect(byLabel.talents).toEqual({ label: 'talents', newCount: 3, updatedCount: 0 });
        expect(byLabel.weapons).toEqual({ label: 'weapons', newCount: 1, updatedCount: 0 });
    });

    it('reports no *new* entities, only updates, when re-importing into the campaign the character already came from', () => {
        const sourceCampaign = { ...createCampaign('Source'), data: seededCampaignData() };
        sourceCampaign.characters.push(toCharacterSaveV3(characterWithSelections(), sourceCampaign.id, sourceCampaign.data, 'char-1'));
        const save = toCharacterSaveV3(characterWithSelections(), sourceCampaign.id, sourceCampaign.data, 'char-1');
        const incoming = parseCharacterFile(exportCharacterFile(save, sourceCampaign.data));

        const preview = previewCharacterImport(sourceCampaign, incoming);

        expect(preview.isNewCharacter).toBe(false);
        expect(preview.entities.every(e => e.newCount === 0)).toBe(true);
        expect(preview.entities.some(e => e.updatedCount > 0)).toBe(true);
    });

    it('splits new vs. updated when the target campaign already has some referenced entities', () => {
        const sourceCampaign = { ...createCampaign('Source'), data: seededCampaignData() };
        const save = toCharacterSaveV3(characterWithSelections(), sourceCampaign.id, sourceCampaign.data, 'char-1');
        const incoming = parseCharacterFile(exportCharacterFile(save, sourceCampaign.data));

        const targetCampaign = createCampaign('Target');
        targetCampaign.data.paths.push({ id: pathAgentId, kind: 'heroic', name: 'Agent (local edits)', description: '', specialties: [] });
        const preview = previewCharacterImport(targetCampaign, incoming);

        const paths = preview.entities.find(e => e.label === 'paths');
        expect(paths).toEqual({ label: 'paths', newCount: 1, updatedCount: 1 });
    });
});
