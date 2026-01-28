/**
 * Compact Character Save Format v2
 * 
 * This module provides functions to serialize/deserialize CharacterData
 * to a compact JSON format that:
 * - Uses IDs for all data references (future-proof against name changes)
 * - Uses arrays instead of verbose objects where possible
 * - Omits static/derivable data (attr_abbrev, surge calculations, etc.)
 * - Only stores non-default values for skills
 */

import skillsData from '../data/skills.json';
import { CharacterData, initialCharacterData, Talent, Ancestry, HeroicPath, Weapon, Armor, EquipmentItem } from '../types/character';

// Item with ID and name
interface NamedItem {
    id?: string;
    name: string;
}

// Talent lookup data structure
interface TalentLookupData {
    [pathName: string]: {
        keyTalent?: string;
        talents: Array<{
            id?: string;
            name: string;
            description?: string;
            specialty?: string;
            activation?: string;
        }>;
    };
}

// Compact format interfaces - v2 uses IDs
interface CompactSaveV2 {
    v: 2; // Version 2: uses IDs instead of names
    p: string; // playerName
    c: string; // characterName
    l: number; // level
    a: string | null; // ancestry ID
    h: string[]; // path IDs (heroic + radiant)
    ri: number; // radiantIdeal
    rp: string; // radiantPath ID
    sn: string; // sprenName
    br: number; // bondRange
    at: [number, number, number, number, number, number]; // attributes [str, spd, int, wil, awa, pre]
    m: number; // marks
    sk: [string, number][]; // skills with non-zero ranks: [id, rank]
    df: [number, number, number, number]; // defenses [phy, cog, spi, defl]
    hp: [number, number]; // health [cur, max]
    fo: [number, number]; // focus [cur, max]
    iv: [number, number]; // investiture [cur, max]
    mv: number; // movement
    sr: string; // sensesRange
    rd: string; // recoveryDie
    lc: string; // liftingCapacity
    cc: string; // carryingCapacity
    ex: string[]; // expertises (still names, no IDs)
    wp: (string | Weapon)[]; // weapon IDs or custom objects
    ar: (string | Armor)[]; // armor IDs or custom objects
    eq: (string | EquipmentItem)[]; // equipment IDs or custom objects
    ta: [string, string, boolean][]; // talents: [id, pathId, isKeyTalent]
    ot: string[]; // otherTalents (free text)
    pu: string[]; // purpose
    ob: string[]; // obstacle
    go: [string, number][]; // goals: [text, level]
    no: string[]; // notes
    cn: string[]; // connections
    co: string[]; // conditions
    ap: string; // appearance
}

// Legacy v1 format (uses names instead of IDs)
interface CompactSaveV1 {
    v: 1;
    p: string;
    c: string;
    l: number;
    a: string | null;
    h: string[];
    ri: number;
    rp: string;
    sn: string;
    br: number;
    at: [number, number, number, number, number, number];
    m: number;
    sk: [string, number][];
    df: [number, number, number, number];
    hp: [number, number];
    fo: [number, number];
    iv: [number, number];
    mv: number;
    sr: number;
    rd: string;
    lc: string;
    cc: string;
    ex: string[];
    wp: string[];
    ar: string[];
    eq: string[];
    ta: [string, string, boolean][];
    ot: string[];
    pu: string[];
    ob: string[];
    go: [string, number][];
    no: string[];
    cn: string[];
    co: string[];
    ap: string;
}

type CompactSave = CompactSaveV1 | CompactSaveV2;

// Helper to get ID or fallback to name-based ID
const getIdOrName = (item: NamedItem, prefix: string): string => {
    return item.id || `${prefix}_${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
};

/**
 * Serialize CharacterData to compact format v2 (using IDs)
 */
export function serializeCharacter(data: CharacterData, staticData?: { weapons: Weapon[], armor: Armor[], equipment: EquipmentItem[] }): CompactSaveV2 {
    // Only save skills with non-zero ranks
    const nonZeroSkills: [string, number][] = data.skills
        .filter(s => s.rank > 0)
        .map(s => [getIdOrName(s, 'skill'), s.rank]);

    // Helper to serialize items: if static, use ID; if custom, save full object
    const serializeItem = <T extends NamedItem>(item: T, staticList: T[] | undefined, prefix: string): string | T => {
        const staticItem = staticList?.find((i) => i.id === item.id || i.name === item.name);
        if (staticItem) {
            return getIdOrName(staticItem, prefix);
        }
        return item; // Save full custom object
    };

    return {
        v: 2,
        p: data.playerName,
        c: data.characterName,
        l: data.level,
        a: data.ancestry ? getIdOrName(data.ancestry, 'anc') : null,
        h: data.paths.map(p => getIdOrName(p, 'path')),
        ri: data.radiantIdeal,
        rp: data.radiantPath || "",
        sn: data.sprenName || "",
        br: data.bondRange || 30,
        at: [
            data.attributes.strength,
            data.attributes.speed,
            data.attributes.intellect,
            data.attributes.willpower,
            data.attributes.awareness,
            data.attributes.presence
        ],
        m: data.marks,
        sk: nonZeroSkills,
        df: [
            data.defenses.physical,
            data.defenses.cognitive,
            data.defenses.spiritual,
            data.defenses.deflect
        ],
        hp: [data.health.current, data.health.max],
        fo: [data.focus.current, data.focus.max],
        iv: [data.investiture.current, data.investiture.max],
        mv: data.movement,
        sr: data.sensesRange,
        rd: data.recoveryDie,
        lc: data.liftingCapacity,
        cc: data.carryingCapacity,
        ex: data.expertises,
        wp: data.weapons.map(w => serializeItem(w, staticData?.weapons, 'wpn')),
        ar: data.armor.map(a => serializeItem(a, staticData?.armor, 'arm')),
        eq: data.equipment.map(e => serializeItem(e, staticData?.equipment, 'eqp')),
        ta: data.talents.map(t => [getIdOrName(t, 'tal'), t.path, t.isKeyTalent]),
        ot: data.otherTalents,
        pu: data.purpose,
        ob: data.obstacle,
        go: data.goals.map(g => [g.text, g.level]),
        no: data.notes,
        cn: data.connections,
        co: data.conditions,
        ap: data.appearance
    };
}

// Helper to find item by ID or name
const findByIdOrName = <T extends NamedItem>(
    items: T[],
    idOrName: string
): T | undefined => {
    return items.find(item => item.id === idOrName || item.name === idOrName);
};

// Helper to find talent across all paths
const findTalent = (idOrName: string, pathName: string, talentsData: TalentLookupData): Talent | undefined => {
    // Try to find in the specific path first
    const pathData = talentsData[pathName];
    if (pathData?.talents) {
        const found = pathData.talents.find((t) => t.id === idOrName || t.name === idOrName || getIdOrName(t, 'tal') === idOrName);
        if (found) return { ...found, path: pathName, isKeyTalent: false };
    }

    // If not found (or no path specified), search all paths (expensive but necessary fallback)
    for (const [pName, pData] of Object.entries(talentsData)) {
        if (pData.talents) {
            const found = pData.talents.find((t) => t.id === idOrName || t.name === idOrName || getIdOrName(t, 'tal') === idOrName);
            if (found) return { ...found, path: pName, isKeyTalent: false };
        }
    }

    return undefined;
};

/**
 * Deserialize compact format back to CharacterData
 * Supports both v1 (name-based) and v2 (ID-based) formats
 */
export function deserializeCharacter(
    save: CompactSave,
    ancestries: Ancestry[],
    heroicPaths: HeroicPath[],
    radiantPaths: HeroicPath[],
    weapons: Weapon[],
    armor: Armor[],
    equipment: EquipmentItem[],
    talentsData?: TalentLookupData
): CharacterData {
    // Start with initial data
    const data: CharacterData = { ...initialCharacterData };

    // Core info
    data.playerName = save.p;
    data.characterName = save.c;
    data.level = save.l;
    data.ancestry = save.a ? findByIdOrName(ancestries, save.a) || null : null;

    const allPaths = [...heroicPaths, ...radiantPaths];
    data.paths = save.h.map(id => findByIdOrName(allPaths, id)).filter((p): p is HeroicPath => p !== undefined);

    data.radiantIdeal = save.ri;
    data.radiantPath = save.rp;
    data.sprenName = save.sn;
    data.bondRange = save.br;

    // Attributes
    data.attributes = {
        strength: save.at[0],
        speed: save.at[1],
        intellect: save.at[2],
        willpower: save.at[3],
        awareness: save.at[4],
        presence: save.at[5]
    };

    data.marks = save.m;

    // Skills - rebuild from base skills with saved ranks
    const skillRanks = new Map(save.sk);
    data.skills = skillsData.map(s => ({
        ...s,
        rank: skillRanks.get(s.id) || skillRanks.get(s.name) || 0
    }));

    // Defenses
    data.defenses = {
        physical: save.df[0],
        cognitive: save.df[1],
        spiritual: save.df[2],
        deflect: save.df[3]
    };

    // Resources
    data.health = { current: save.hp[0], max: save.hp[1] };
    data.focus = { current: save.fo[0], max: save.fo[1] };
    data.investiture = { current: save.iv[0], max: save.iv[1] };

    // Stats
    data.movement = save.mv;
    data.sensesRange = typeof save.sr === 'number' ? `${save.sr} ft.` : save.sr;
    data.recoveryDie = save.rd;
    data.liftingCapacity = save.lc;
    data.carryingCapacity = save.cc;

    // Lists by ID or name lookup, processing custom objects
    data.expertises = save.ex;

    const deserializeList = <T extends NamedItem>(list: (string | T)[], staticData: T[]): T[] => {
        return list.map(item => {
            if (typeof item === 'string') {
                return findByIdOrName(staticData, item);
            }
            return item; // Custom object
        }).filter((item): item is T => item !== undefined);
    };

    data.weapons = deserializeList(save.wp as (string | Weapon)[], weapons);
    data.armor = deserializeList(save.ar as (string | Armor)[], armor);
    data.equipment = deserializeList(save.eq as (string | EquipmentItem)[], equipment);

    // Talents - resolve full talent data if available
    data.talents = save.ta.map(([idOrName, path, isKeyTalent]) => {
        if (talentsData) {
            const foundTalent = findTalent(idOrName, path, talentsData);
            if (foundTalent) {
                return {
                    ...foundTalent,
                    isKeyTalent,
                    path: foundTalent.path || path // Ensure path is set
                };
            }
        }

        // Fallback for custom talents or missing matches
        return {
            id: idOrName.startsWith('tal_') ? idOrName : undefined, // Keep ID if it looks like one
            name: idOrName.startsWith('tal_') ? idOrName : idOrName, // This is imperfect but best effort
            path,
            isKeyTalent
        };
    });
    data.otherTalents = save.ot;

    // Text fields
    data.purpose = save.pu;
    data.obstacle = save.ob;
    data.goals = save.go.map(([text, level]) => ({ text, level: level as 0 | 1 | 2 | 3 }));
    data.notes = save.no;
    data.connections = save.cn;
    data.conditions = save.co;
    data.appearance = save.ap;

    // Surges will be computed by the context when paths are processed
    data.surges = [];

    return data;
}

/**
 * Check if a save object is in compact format (v1 or v2)
 */
export function isCompactFormat(obj: unknown): obj is CompactSave {
    return obj !== null && typeof obj === 'object' && 'v' in obj && typeof (obj as CompactSave).v === 'number' && ((obj as CompactSave).v === 1 || (obj as CompactSave).v === 2) && 'p' in obj && typeof (obj as CompactSave).p === 'string';
}
