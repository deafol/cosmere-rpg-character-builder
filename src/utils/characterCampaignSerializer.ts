/**
 * Bridges the two character representations from consent.md §4:
 *  - CharacterData (types/character.ts): resolved objects, used for editing
 *    in CharacterContext — shape unchanged since before the campaign
 *    rewrite.
 *  - CharacterSaveV3 (types/campaign.ts): UUID refs into a campaign's data
 *    stores, used for storage in Campaign.characters and for standalone
 *    file export/import.
 *
 * Surge-skill entries in CharacterData.skills have no static id (they're
 * sourced from campaign Surges, not skills.json) — their rank is persisted
 * under the surge's own UUID in skillRanks, and the entries themselves are
 * reconstructed from the campaign's Path -> Surge links on load, per the
 * "derived at render time" decision in consent.md §8.2.
 */
import skillsData from '../data/skills.json';
import ancestriesData from '../data/ancestries.json';
import { CharacterData, HeroicPath, Skill, Talent, Weapon, Armor, EquipmentItem } from '../types/character';
import {
    Campaign,
    CampaignData,
    CharacterSaveV3,
    CHARACTER_SAVE_VERSION,
} from '../types/campaign';
import { upsertByKey, upsertById } from './campaignSerializer';
import { FIXED_EXPERTISE_CATEGORIES } from '../components/settings/entityFieldConfigs';

// A plain type predicate here would need to name the exact element type,
// which collides with the two similarly-shaped Weapon/Armor/etc. imports
// from character.ts and campaign.ts — a generic keeps it unambiguous.
const definedOnly = <T,>(items: (T | undefined)[]): T[] => items.filter((item): item is T => item !== undefined);

function activeSurgesFor(pathIds: string[], campaignData: CampaignData) {
    const radiantPathIds = new Set(campaignData.paths.filter(p => p.kind === 'radiant').map(p => p.id));
    const surgeIds = new Set<string>();
    for (const pathId of pathIds) {
        if (!radiantPathIds.has(pathId)) continue;
        const path = campaignData.paths.find(p => p.id === pathId);
        (path?.surgeIds ?? []).forEach(id => surgeIds.add(id));
    }
    return campaignData.surges.filter(s => surgeIds.has(s.id));
}

/** Converts the in-memory (editing) shape into the UUID-ref campaign save format. */
export function toCharacterSaveV3(
    data: CharacterData,
    campaignId: string,
    campaignData: CampaignData,
    id: string,
): CharacterSaveV3 {
    const skillRanks: Record<string, number> = {};
    for (const skill of data.skills) {
        if (skill.rank <= 0) continue;
        if (skill.id) {
            skillRanks[skill.id] = skill.rank;
            continue;
        }
        const surge = campaignData.surges.find(s => s.name === skill.name);
        if (surge) skillRanks[surge.id] = skill.rank;
    }

    const idsOf = (items: { id?: string }[]): string[] =>
        items.map(item => item.id).filter((itemId): itemId is string => Boolean(itemId));

    return {
        v: CHARACTER_SAVE_VERSION,
        id,
        campaignId,
        playerName: data.playerName,
        characterName: data.characterName,
        level: data.level,
        ancestryId: data.ancestry?.id ?? null,
        pathIds: idsOf(data.paths),
        radiantIdeal: data.radiantIdeal,
        sprenName: data.sprenName,
        bondRange: data.bondRange,
        attributes: { ...data.attributes },
        marks: data.marks,
        skillRanks,
        defenses: { ...data.defenses },
        health: { ...data.health },
        focus: { ...data.focus },
        investiture: { ...data.investiture },
        movement: data.movement,
        sensesRange: data.sensesRange,
        recoveryDie: data.recoveryDie,
        liftingCapacity: data.liftingCapacity,
        carryingCapacity: data.carryingCapacity,
        expertiseIds: data.expertises
            .map(name => campaignData.expertises.find(e => e.name === name)?.id)
            .filter((expId): expId is string => Boolean(expId)),
        weaponIds: idsOf(data.weapons),
        armorIds: idsOf(data.armor),
        equipmentIds: idsOf(data.equipment),
        talentIds: idsOf(data.talents),
        otherTalents: data.otherTalents,
        purpose: data.purpose,
        obstacle: data.obstacle,
        goals: data.goals,
        notes: data.notes,
        connections: data.connections,
        conditions: data.conditions,
        appearance: data.appearance,
    };
}

/** Resolves a campaign save's UUID refs back into the editable in-memory shape. */
export function fromCharacterSaveV3(save: CharacterSaveV3, campaignData: CampaignData): CharacterData {
    const ancestry = save.ancestryId ? ancestriesData.find(a => a.id === save.ancestryId) ?? null : null;

    const paths: HeroicPath[] = save.pathIds
        .map(pathId => campaignData.paths.find(p => p.id === pathId))
        .filter((p): p is CampaignData['paths'][number] => Boolean(p))
        .map(p => ({ id: p.id, name: p.name, description: p.description, key_attributes: [], specialties: p.specialties }));

    const radiantPathIds = new Set(campaignData.paths.filter(p => p.kind === 'radiant').map(p => p.id));
    const radiantPath = paths.find(p => p.id && radiantPathIds.has(p.id));

    const activeSurges = activeSurgesFor(save.pathIds, campaignData);
    const skills: Skill[] = [
        ...skillsData.map(s => ({ ...s, rank: save.skillRanks[s.id] ?? 0 })),
        ...activeSurges.map(surge => ({
            name: surge.name,
            attribute: surge.attribute,
            attr_abbrev: surge.attribute === 'Speed' ? 'SPD' : surge.attribute.slice(0, 3).toUpperCase(),
            rank: save.skillRanks[surge.id] ?? 0,
        })),
    ];

    const talents: Talent[] = definedOnly(save.talentIds.map(talentId => {
        const talent = campaignData.talents.find(t => t.id === talentId);
        if (!talent) return undefined;
        const path = campaignData.paths.find(p => p.id === talent.pathId);
        return {
            id: talent.id,
            name: talent.name,
            path: path?.name ?? '',
            isKeyTalent: talent.isKeyTalent,
            description: talent.description,
        };
    }));

    const expertises = definedOnly(save.expertiseIds.map(expId => campaignData.expertises.find(e => e.id === expId)?.name));

    const weapons: Weapon[] = definedOnly(save.weaponIds.map(wId => campaignData.weapons.find(w => w.id === wId)));

    const armor: Armor[] = definedOnly(save.armorIds.map(aId => campaignData.armor.find(a => a.id === aId)));

    const equipment: EquipmentItem[] = definedOnly(save.equipmentIds.map(eId => campaignData.equipment.find(e => e.id === eId)));

    return {
        playerName: save.playerName,
        characterName: save.characterName,
        level: save.level,
        ancestry,
        paths,
        radiantIdeal: save.radiantIdeal,
        radiantPath: radiantPath?.name ?? '',
        sprenName: save.sprenName ?? '',
        bondRange: save.bondRange ?? 30,
        surges: [],
        attributes: { ...save.attributes },
        marks: save.marks,
        skills,
        defenses: { ...save.defenses },
        health: { ...save.health },
        focus: { ...save.focus },
        investiture: { ...save.investiture },
        movement: save.movement,
        sensesRange: save.sensesRange,
        recoveryDie: save.recoveryDie,
        liftingCapacity: save.liftingCapacity,
        carryingCapacity: save.carryingCapacity,
        expertises,
        weapons,
        armor,
        equipment,
        talents,
        otherTalents: save.otherTalents,
        purpose: save.purpose,
        obstacle: save.obstacle,
        goals: save.goals,
        notes: save.notes,
        connections: save.connections,
        conditions: save.conditions,
        appearance: save.appearance,
    };
}

function buildEmbeddedSnapshot(save: CharacterSaveV3, campaignData: CampaignData): Partial<CampaignData> {
    const paths = campaignData.paths.filter(p => save.pathIds.includes(p.id));
    const surges = activeSurgesFor(save.pathIds, campaignData);
    const talents = campaignData.talents.filter(t => save.talentIds.includes(t.id));
    const expertises = campaignData.expertises.filter(e => save.expertiseIds.includes(e.id));
    const expertiseCategories = Array.from(new Set(expertises.map(e => e.category)))
        .filter(category => !FIXED_EXPERTISE_CATEGORIES.includes(category));
    const weapons = campaignData.weapons.filter(w => save.weaponIds.includes(w.id));
    const armor = campaignData.armor.filter(a => save.armorIds.includes(a.id));
    const equipment = campaignData.equipment.filter(e => save.equipmentIds.includes(e.id));
    const ancestryContent = save.ancestryId
        ? campaignData.ancestryContent.filter(a => a.ancestryId === save.ancestryId)
        : [];

    return { paths, surges, talents, expertises, expertiseCategories, weapons, armor, equipment, ancestryContent };
}

/** Standalone character export (outside its campaign file) — embeds a snapshot of every referenced entity so the file is portable. */
export function exportCharacterFile(save: CharacterSaveV3, campaignData: CampaignData): string {
    const payload: CharacterSaveV3 = { ...save, embedded: buildEmbeddedSnapshot(save, campaignData) };
    return JSON.stringify(payload, null, 2);
}

export function isCharacterSaveFile(value: unknown): value is CharacterSaveV3 {
    if (value === null || typeof value !== 'object') return false;
    const c = value as Partial<CharacterSaveV3>;
    return (
        c.v === CHARACTER_SAVE_VERSION &&
        typeof c.id === 'string' &&
        typeof c.campaignId === 'string' &&
        typeof c.characterName === 'string'
    );
}

export function parseCharacterFile(json: string): CharacterSaveV3 {
    const parsed = JSON.parse(json);
    if (!isCharacterSaveFile(parsed)) {
        throw new Error('File is not a valid character (missing or unsupported schema version).');
    }
    return parsed;
}

/**
 * Merges a standalone character file into a campaign: its embedded entity
 * snapshot is upserted into the campaign's data stores (incoming wins, by
 * UUID — same semantics as campaign-file merge), then the character itself
 * is upserted into the campaign's character list, re-pointed at this
 * campaign's id. The embedded snapshot is dropped once merged — it only
 * exists for portability between campaigns, not as stored state.
 */
export function importCharacterIntoCampaign(campaign: Campaign, incoming: CharacterSaveV3): Campaign {
    const embedded = incoming.embedded ?? {};

    const data: CampaignData = {
        paths: upsertById(campaign.data.paths, embedded.paths ?? []),
        talents: upsertById(campaign.data.talents, embedded.talents ?? []),
        surges: upsertById(campaign.data.surges, embedded.surges ?? []),
        expertises: upsertById(campaign.data.expertises, embedded.expertises ?? []),
        expertiseCategories: Array.from(new Set([...campaign.data.expertiseCategories, ...(embedded.expertiseCategories ?? [])])),
        weapons: upsertById(campaign.data.weapons, embedded.weapons ?? []),
        armor: upsertById(campaign.data.armor, embedded.armor ?? []),
        equipment: upsertById(campaign.data.equipment, embedded.equipment ?? []),
        ancestryContent: upsertByKey(campaign.data.ancestryContent, embedded.ancestryContent ?? [], a => a.ancestryId),
    };

    const character: CharacterSaveV3 = { ...incoming, campaignId: campaign.id };
    delete character.embedded;

    return {
        ...campaign,
        updatedAt: new Date().toISOString(),
        data,
        characters: upsertByKey(campaign.characters, [character], c => c.id),
    };
}
