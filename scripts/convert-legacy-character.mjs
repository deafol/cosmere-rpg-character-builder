#!/usr/bin/env node
/**
 * One-time converter (consent.md §6 phase 8): reads compact v1/v2 character
 * saves plus the bundled dynamic-domain JSON (still in src/data/ until the
 * phase-9 purge) and emits a v1-schema Campaign file containing every path,
 * talent, surge, expertise, weapon, armor, and equipment entity those
 * characters actually reference — not the whole bundled catalog.
 *
 * Standalone: not imported by the app, not run by any npm script, reads
 * plain JSON directly (no TS types) so it needs no new devDependencies.
 * Run it, then verify the output by importing it into the running app
 * before deleting the bundled JSON in phase 9 (consent.md §2.13, §2.7).
 *
 * Usage: node scripts/convert-legacy-character.mjs
 * Input:  every *.json in ~/Downloads/Cosmere/ except the output file itself
 * Output: ~/Downloads/Cosmere/Example Campaign.json
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data');
const INPUT_DIR = path.join(os.homedir(), 'Downloads', 'Cosmere');
const OUTPUT_BASENAME = 'Example Campaign.json';
const OUTPUT_FILE = path.join(INPUT_DIR, OUTPUT_BASENAME);

const CAMPAIGN_SCHEMA_VERSION = 1;
const CHARACTER_SAVE_VERSION = 3;
const FIXED_EXPERTISE_CATEGORIES = ['cultural', 'utility', 'weapon'];

const loadJson = file => JSON.parse(readFileSync(file, 'utf8'));

const ancestries = loadJson(path.join(DATA_DIR, 'ancestries.json'));
const heroicPaths = loadJson(path.join(DATA_DIR, 'heroic_paths.json')).map(p => ({ ...p, kind: 'heroic' }));
const radiantPaths = loadJson(path.join(DATA_DIR, 'radiant_paths.json')).map(p => ({ ...p, kind: 'radiant' }));
const allBundledPaths = [...heroicPaths, ...radiantPaths];
const allTalentGroups = {
    ...loadJson(path.join(DATA_DIR, 'heroic_talents.json')),
    ...loadJson(path.join(DATA_DIR, 'radiant_talents.json')),
};
const surgesData = loadJson(path.join(DATA_DIR, 'surges.json')).surges;
const weaponsData = loadJson(path.join(DATA_DIR, 'weapons.json'));
const armorData = loadJson(path.join(DATA_DIR, 'armor.json'));
const equipmentData = loadJson(path.join(DATA_DIR, 'equipment.json'));
const expertisesData = loadJson(path.join(DATA_DIR, 'expertises.json'));
const skillsData = loadJson(path.join(DATA_DIR, 'skills.json'));

const findByIdOrName = (list, idOrName) => list.find(i => i.id === idOrName || i.name === idOrName);

// Every entity gets a fresh UUID (consent.md §4: "all IDs are UUIDv4") — the
// bundled data's stable string ids (e.g. "wpn_shortspear") are only used to
// look things up and to dedupe within a single run of this script.
const pathIdMap = new Map();       // bundled path id -> { uuid, bundled }
const talentIdMap = new Map();     // bundled talent id -> { uuid, bundled, pathUuid, specialty }
const surgeNameMap = new Map();    // surge name -> { uuid, bundled }
const expertiseNameMap = new Map(); // expertise name -> { uuid, category }
const weaponEntityMap = new Map();    // dedupe key -> { uuid, entity }
const armorEntityMap = new Map();     // dedupe key -> { uuid, entity }
const equipmentEntityMap = new Map(); // dedupe key -> { uuid, entity }
const customCategories = new Set();

function resolvePathStub(idOrName) {
    const bundled = findByIdOrName(allBundledPaths, idOrName);
    if (!bundled) return undefined;
    if (!pathIdMap.has(bundled.id)) {
        pathIdMap.set(bundled.id, { uuid: randomUUID(), bundled });
    }
    return pathIdMap.get(bundled.id);
}

function findParentPathForSpecialty(specialty) {
    return allBundledPaths.find(p => (p.specialties || []).includes(specialty));
}

/** Finds a talent's bundled record, searching the hinted group first (cheap), then every group. */
function findTalentRecord(idOrName, groupNameHint) {
    const hinted = groupNameHint && allTalentGroups[groupNameHint];
    if (hinted) {
        const found = hinted.talents.find(t => t.id === idOrName || t.name === idOrName);
        if (found) return { talentObj: found, groupName: groupNameHint };
    }
    for (const [groupName, group] of Object.entries(allTalentGroups)) {
        const found = group.talents.find(t => t.id === idOrName || t.name === idOrName);
        if (found) return { talentObj: found, groupName };
    }
    return undefined;
}

function resolveTalent(talentObj, groupName) {
    if (talentIdMap.has(talentObj.id)) return talentIdMap.get(talentObj.id);
    // A talent's own `specialty` field (e.g. "Champion") means it belongs to
    // whichever path lists that specialty (e.g. Leader), not a path named
    // "Champion" — Champion/Officer aren't separate paths, they're Leader
    // specialties (consent.md's open point #3 about Robar's cross-path
    // talents resolves to this, once you look at the actual bundled data).
    const specialty = talentObj.specialty;
    const parentPath = specialty ? findParentPathForSpecialty(specialty) : allBundledPaths.find(p => p.name === groupName);
    if (!parentPath) {
        throw new Error(`Cannot resolve parent path for talent "${talentObj.name}" (group "${groupName}")`);
    }
    const pathEntry = resolvePathStub(parentPath.id);
    const entry = { uuid: randomUUID(), bundled: talentObj, pathUuid: pathEntry.uuid, specialty };
    talentIdMap.set(talentObj.id, entry);
    return entry;
}

function resolveSurge(surgeObj) {
    if (!surgeNameMap.has(surgeObj.name)) {
        surgeNameMap.set(surgeObj.name, { uuid: randomUUID(), bundled: surgeObj });
    }
    return surgeNameMap.get(surgeObj.name).uuid;
}

function expertiseCategoryFor(name) {
    for (const category of Object.keys(expertisesData)) {
        if (expertisesData[category].includes(name)) return category;
    }
    return 'utility'; // unmatched (player-typed custom expertise) — same default the app itself uses
}

function resolveExpertise(name) {
    if (!expertiseNameMap.has(name)) {
        const category = expertiseCategoryFor(name);
        if (!FIXED_EXPERTISE_CATEGORIES.includes(category)) customCategories.add(category);
        expertiseNameMap.set(name, { uuid: randomUUID(), category });
    }
    return expertiseNameMap.get(name).uuid;
}

/**
 * wp/ar/eq entries are either a bundled id/name (string) or a fully custom
 * object — v2 compact format. Deduped globally (across all characters in
 * this run, not just within one) by bundled id, or by name+price+weight for
 * inline custom objects, so e.g. two "food ration" refs become one campaign
 * entity with two ids in the character's own list (consent.md: "duplicates
 * allowed"), not two duplicate entities.
 */
function resolveItem(entry, bundledList, entityMap, buildEntity) {
    let dedupeKey;
    let source;
    if (typeof entry === 'string') {
        const bundled = findByIdOrName(bundledList, entry);
        if (!bundled) return undefined;
        dedupeKey = `bundled:${bundled.id}`;
        source = bundled;
    } else {
        dedupeKey = `custom:${entry.name}|${entry.price}|${entry.weight}`;
        source = entry;
    }
    if (!entityMap.has(dedupeKey)) {
        const uuid = randomUUID();
        entityMap.set(dedupeKey, { uuid, entity: buildEntity(uuid, source) });
    }
    return entityMap.get(dedupeKey);
}

function convertCharacter(save, campaignId) {
    // v1 stored sensesRange as a bare number of feet; v2 already stores "N ft.".
    const sensesRange = typeof save.sr === 'number' ? `${save.sr} ft.` : save.sr;

    const ancestry = save.a ? findByIdOrName(ancestries, save.a) : undefined;

    const pathIds = (save.h || [])
        .map(idOrName => resolvePathStub(idOrName))
        .filter(Boolean)
        .map(entry => entry.uuid);

    const talentIds = (save.ta || [])
        .map(([idOrName, groupName]) => {
            const found = findTalentRecord(idOrName, groupName);
            if (!found) {
                console.warn(`  ! talent "${idOrName}" (group "${groupName}") not found in bundled data — skipped`);
                return undefined;
            }
            return resolveTalent(found.talentObj, found.groupName).uuid;
        })
        .filter(Boolean);

    const expertiseIds = (save.ex || []).map(resolveExpertise);

    const weaponIds = (save.wp || [])
        .map(entry => resolveItem(entry, weaponsData, weaponEntityMap, (uuid, w) => ({
            id: uuid, name: w.name, category: w.category, damage: w.damage, range: w.range,
            properties: w.properties || [], weight: w.weight, price: w.price,
        })))
        .filter(Boolean)
        .map(r => r.uuid);

    const armorIds = (save.ar || [])
        .map(entry => resolveItem(entry, armorData, armorEntityMap, (uuid, a) => ({
            id: uuid, name: a.name, category: a.category, deflect: a.deflect,
            properties: a.properties || [], price: a.price, weight: a.weight,
        })))
        .filter(Boolean)
        .map(r => r.uuid);

    const equipmentIds = (save.eq || [])
        .map(entry => resolveItem(entry, equipmentData, equipmentEntityMap, (uuid, e) => ({
            id: uuid, name: e.name, price: e.price, weight: e.weight, description: e.description,
        })))
        .filter(Boolean)
        .map(r => r.uuid);

    const skillRanks = {};
    for (const [idOrName, rank] of save.sk || []) {
        const skill = findByIdOrName(skillsData, idOrName);
        if (skill) skillRanks[skill.id] = rank;
    }

    const character = {
        v: CHARACTER_SAVE_VERSION,
        id: randomUUID(),
        campaignId,
        playerName: save.p || '',
        characterName: save.c || '',
        level: save.l ?? 1,
        ancestryId: ancestry?.id ?? null,
        pathIds,
        radiantIdeal: save.ri ?? 0,
        sprenName: save.sn || undefined,
        bondRange: save.br ?? 30,
        attributes: {
            strength: save.at[0], speed: save.at[1], intellect: save.at[2],
            willpower: save.at[3], awareness: save.at[4], presence: save.at[5],
        },
        marks: save.m ?? 0,
        skillRanks,
        defenses: { physical: save.df[0], cognitive: save.df[1], spiritual: save.df[2], deflect: save.df[3] },
        health: { current: save.hp[0], max: save.hp[1] },
        focus: { current: save.fo[0], max: save.fo[1] },
        investiture: { current: save.iv[0], max: save.iv[1] },
        movement: save.mv,
        sensesRange,
        recoveryDie: save.rd,
        liftingCapacity: save.lc,
        carryingCapacity: save.cc,
        expertiseIds,
        weaponIds,
        armorIds,
        equipmentIds,
        talentIds,
        otherTalents: save.ot || [],
        purpose: save.pu || [],
        obstacle: save.ob || [],
        goals: (save.go || []).map(([text, level]) => ({ text, level })),
        notes: save.no || [],
        connections: save.cn || [],
        conditions: save.co || [],
        appearance: save.ap || '',
    };

    return { character };
}

function buildCampaignData() {
    // Every path discovered while converting characters now needs its
    // keyTalentId and (for radiant paths) surgeIds resolved — done as a
    // separate pass since a path can be discovered mid-talent-resolution
    // (Champion/Officer talents pull in Leader) after its stub was created.
    for (const entry of pathIdMap.values()) {
        const group = allTalentGroups[entry.bundled.name];
        if (group?.keyTalent) {
            const keyTalentObj = group.talents.find(t => t.name === group.keyTalent);
            if (keyTalentObj) entry.keyTalentUuid = resolveTalent(keyTalentObj, entry.bundled.name).uuid;
        }
        if (entry.bundled.kind === 'radiant') {
            entry.surgeUuids = surgesData
                .filter(s => (s.radiant_paths || []).includes(entry.bundled.name))
                .map(resolveSurge);
        }
    }

    const paths = Array.from(pathIdMap.values()).map(entry => ({
        id: entry.uuid,
        kind: entry.bundled.kind,
        name: entry.bundled.name,
        description: entry.bundled.description || '',
        specialties: entry.bundled.specialties || [],
        ...(entry.keyTalentUuid ? { keyTalentId: entry.keyTalentUuid } : {}),
        ...(entry.bundled.kind === 'radiant' ? { surgeIds: entry.surgeUuids || [], ideals: [] } : {}),
    }));

    const talents = Array.from(talentIdMap.values()).map(entry => ({
        id: entry.uuid,
        pathId: entry.pathUuid,
        ...(entry.specialty ? { specialty: entry.specialty } : {}),
        name: entry.bundled.name,
        description: entry.bundled.description || '',
        prerequisite: entry.bundled.prerequisites || '',
        activation: entry.bundled.activation || '',
        isKeyTalent: entry.bundled.isKeyTalent === true,
    }));

    const surges = Array.from(surgeNameMap.values()).map(entry => ({
        id: entry.uuid,
        name: entry.bundled.name,
        attribute: entry.bundled.attribute,
        activation: entry.bundled.activation || [],
        description: entry.bundled.description || '',
    }));

    const expertises = Array.from(expertiseNameMap.entries()).map(([name, entry]) => ({
        id: entry.uuid,
        name,
        category: entry.category,
    }));

    return { paths, talents, surges, expertises, expertiseCategories: Array.from(customCategories) };
}

function main() {
    let inputFiles;
    try {
        inputFiles = readdirSync(INPUT_DIR)
            .filter(f => f.endsWith('.json') && f !== OUTPUT_BASENAME)
            .map(f => path.join(INPUT_DIR, f));
    } catch {
        console.error(`Input directory not found: ${INPUT_DIR}`);
        console.error('Put legacy compact character saves (*.json) there and re-run.');
        process.exit(1);
    }

    if (inputFiles.length === 0) {
        console.error(`No legacy character files found in ${INPUT_DIR}`);
        process.exit(1);
    }

    const campaignId = randomUUID();
    const now = new Date().toISOString();
    const characters = [];

    for (const file of inputFiles) {
        console.log(`Converting ${path.basename(file)}...`);
        const save = loadJson(file);
        if (typeof save.v !== 'number' || (save.v !== 1 && save.v !== 2)) {
            console.warn(`  ! not a v1/v2 compact save (v=${save.v}) — skipped`);
            continue;
        }
        const result = convertCharacter(save, campaignId);
        characters.push(result.character);
        console.log(`  -> ${result.character.characterName || '(unnamed)'} (${result.character.id})`);
    }

    const sharedData = buildCampaignData();
    // weapon/armor/equipment entities are deduped globally (across every
    // character processed above) in their entity maps — build the final
    // lists from those now that all characters have been converted.
    const weapons = Array.from(weaponEntityMap.values()).map(e => e.entity);
    const armor = Array.from(armorEntityMap.values()).map(e => e.entity);
    const equipment = Array.from(equipmentEntityMap.values()).map(e => e.entity);

    const campaign = {
        schemaVersion: CAMPAIGN_SCHEMA_VERSION,
        id: campaignId,
        name: 'Example Campaign',
        description: 'Generated by scripts/convert-legacy-character.mjs from legacy character saves. Contains copyrighted Cosmere RPG text for local reference only — do not distribute.',
        createdAt: now,
        updatedAt: now,
        data: {
            ...sharedData,
            weapons,
            armor,
            equipment,
            ancestryContent: [], // original prose already stripped from the repo; add per-table in Campaign Settings
        },
        characters,
    };

    writeFileSync(OUTPUT_FILE, JSON.stringify(campaign, null, 2));

    console.log('');
    console.log(`Wrote ${OUTPUT_FILE}`);
    console.log(`  characters: ${characters.length}`);
    console.log(`  paths: ${sharedData.paths.length}, talents: ${sharedData.talents.length}, surges: ${sharedData.surges.length}`);
    console.log(`  expertises: ${sharedData.expertises.length}, weapons: ${weapons.length}, armor: ${armor.length}, equipment: ${equipment.length}`);
    console.log('');
    console.log('Verify by importing this file via the campaign picker before running the phase 9 purge.');
}

main();
